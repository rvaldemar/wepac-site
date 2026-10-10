"use server";

import { randomInt } from "node:crypto";
import { headers } from "next/headers";
import type { PrizeKind } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logSafeError } from "@/lib/wepacker/log-safe-error";
import { EMAIL_RE, maskEmail, normalizeEmail } from "./email-mask";
import { hasKioskAccess } from "./kiosk-access";
import {
  GAME_CAMPAIGN,
  GAME_CONSENT_VERSION,
  parsePrizeWeights,
  pickPrize,
  prizeValidity,
} from "./prizes";
import { checkRateLimit } from "./rate-limit";
import { generateVoucherCode } from "./voucher-code";
import { sendVoucherEmail } from "./voucher-email";

const CODE_INSERT_ATTEMPTS = 5;

class TicketExhausted extends Error {}
const PLAY_LIMIT_PER_IP = 60;
const LOOKUP_LIMIT_PER_IP = 300;
const WINDOW_MS = 60 * 60 * 1000;

export type GameErrorCode =
  | "locked"
  | "rate_limited"
  | "ticket_not_found"
  | "ticket_exhausted"
  | "invalid_email"
  | "invalid_name"
  | "invalid_phone"
  | "terms_required"
  | "generic";

const PHONE_RE = /^\+?[0-9 ()-]{6,20}$/;

type ValidatedPerson = { ok: true; name: string; email: string; phone: string | null } | { ok: false; error: GameErrorCode };

function validatePerson(raw: PersonDetails | undefined): ValidatedPerson {
  const name = String(raw?.name || "").trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 120) return { ok: false, error: "invalid_name" };
  const email = normalizeEmail(String(raw?.email || ""));
  if (!EMAIL_RE.test(email) || email.length > 254) return { ok: false, error: "invalid_email" };
  const phoneRaw = String(raw?.phone || "").trim();
  if (phoneRaw && !PHONE_RE.test(phoneRaw)) return { ok: false, error: "invalid_phone" };
  return { ok: true, name, email, phone: phoneRaw || null };
}

export type PersonDetails = { name: string; email: string; phone?: string };

export type TicketLookupResult =
  | {
      ok: true;
      ticketId: string;
      buyerName: string;
      maskedEmail: string;
      eventTitle: string;
      /** Seats on the ticket = total spins the ticket grants. */
      seats: number;
      /** People already registered against this ticket. */
      spinsUsed: number;
      /** Whether the buyer's own email has already entered the campaign. */
      buyerPlayed: boolean;
    }
  | { ok: false; error: GameErrorCode };

/**
 * Identity of the person spinning.
 * - `ticket` without `companion`: the buyer; name/email come from the DB.
 * - `ticket` with `companion`: an extra seat holder registered at the kiosk.
 * - `email`: no ticket; reasonable minimum details typed at the kiosk.
 */
export type PlayIdentity =
  | { mode: "ticket"; ticketId: string; companion?: PersonDetails }
  | { mode: "email"; person: PersonDetails };

export type PlayInput = {
  identity: PlayIdentity;
  termsAccepted: boolean;
  marketingConsent: boolean;
  locale: string;
};

export type PlayResult =
  | {
      ok: true;
      kind: PrizeKind;
      code: string;
      validUntil: string;
      maskedEmail: string;
      emailSent: boolean;
    }
  | {
      ok: false;
      error: "already_played";
      kind: PrizeKind;
      code: string;
      maskedEmail: string;
    }
  | { ok: false; error: Exclude<GameErrorCode, never> };

async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  return (fwd?.split(",")[0] || h.get("x-real-ip") || "unknown").trim();
}

function extractTicketId(raw: string): string {
  // QR codes encode "https://wepac.pt[/en]/bilheteira/ticket/<id>".
  try {
    const url = new URL(raw);
    const parts = url.pathname.split("/");
    const idx = parts.indexOf("ticket");
    if (idx !== -1 && parts[idx + 1]) return parts[idx + 1];
  } catch {
    // not a URL — fall through
  }
  return raw.trim();
}

/** Resolves a scanned QR to a ticket. Returns only a masked email so the
 *  kiosk screen never shows a stranger's full address. */
export async function lookupTicketForGame(raw: string): Promise<TicketLookupResult> {
  if (!(await hasKioskAccess())) return { ok: false, error: "locked" };
  if (!checkRateLimit(`game:lookup:${await clientIp()}`, LOOKUP_LIMIT_PER_IP, WINDOW_MS)) {
    return { ok: false, error: "rate_limited" };
  }
  const id = extractTicketId(String(raw || ""));
  if (!id || id.length > 64) return { ok: false, error: "ticket_not_found" };

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    select: {
      id: true,
      buyerName: true,
      buyerEmail: true,
      seats: true,
      status: true,
      event: { select: { title: true } },
    },
  });
  if (!ticket || ticket.status === "cancelled") {
    return { ok: false, error: "ticket_not_found" };
  }
  const buyerEmail = normalizeEmail(ticket.buyerEmail);
  const [spinsUsed, buyer] = await Promise.all([
    prisma.gameParticipant.count({ where: { campaign: GAME_CAMPAIGN, ticketId: ticket.id } }),
    prisma.gameParticipant.findUnique({
      where: { campaign_email: { campaign: GAME_CAMPAIGN, email: buyerEmail } },
      select: { id: true },
    }),
  ]);
  return {
    ok: true,
    ticketId: ticket.id,
    buyerName: ticket.buyerName.split(/\s+/)[0] || ticket.buyerName,
    maskedEmail: maskEmail(buyerEmail),
    eventTitle: ticket.event.title,
    seats: Math.max(1, ticket.seats),
    spinsUsed,
    buyerPlayed: buyer !== null,
  };
}

function cryptoRng(): number {
  // randomInt's range is capped at 2^48 - 1; 2^47 keeps the float exact
  // enough for weighted draws.
  return randomInt(0, 2 ** 47) / 2 ** 47;
}

export async function playAction(input: PlayInput): Promise<PlayResult> {
  if (!(await hasKioskAccess())) return { ok: false, error: "locked" };
  if (!checkRateLimit(`game:play:${await clientIp()}`, PLAY_LIMIT_PER_IP, WINDOW_MS)) {
    return { ok: false, error: "rate_limited" };
  }
  if (!input?.termsAccepted) return { ok: false, error: "terms_required" };
  const locale = input.locale === "en-US" ? "en-US" : "pt-PT";

  // Resolve identity. In buyer mode the email comes from the DB, never from
  // the client, so a kiosk user cannot type an arbitrary address and claim it
  // belongs to a scanned ticket. Companions are extra seat holders typed at
  // the kiosk; the ticket's seat count caps how many people it can register.
  let email: string;
  let name: string | null = null;
  let phone: string | null = null;
  let ticketId: string | null = null;
  let seatCap: number | null = null;
  if (input.identity.mode === "ticket") {
    const ticket = await prisma.ticket.findUnique({
      where: { id: String(input.identity.ticketId || "") },
      select: { id: true, buyerEmail: true, buyerName: true, seats: true, status: true },
    });
    if (!ticket || ticket.status === "cancelled") {
      return { ok: false, error: "ticket_not_found" };
    }
    ticketId = ticket.id;
    seatCap = Math.max(1, ticket.seats);
    if (input.identity.companion) {
      const person = validatePerson(input.identity.companion);
      if (!person.ok) return { ok: false, error: person.error };
      email = person.email;
      name = person.name;
      phone = person.phone;
    } else {
      email = normalizeEmail(ticket.buyerEmail);
      name = ticket.buyerName;
    }
  } else {
    const person = validatePerson(input.identity.person);
    if (!person.ok) return { ok: false, error: person.error };
    email = person.email;
    name = person.name;
    phone = person.phone;
  }
  const masked = maskEmail(email);

  // One entry per email per campaign. If this email already played, surface
  // the existing prize instead of a bare error — the person may just want to
  // see their code again.
  const existing = await prisma.gameParticipant.findUnique({
    where: { campaign_email: { campaign: GAME_CAMPAIGN, email } },
    include: { vouchers: { orderBy: { createdAt: "asc" }, take: 1 } },
  });
  if (existing?.vouchers[0]) {
    const v = existing.vouchers[0];
    return { ok: false, error: "already_played", kind: v.kind, code: v.code, maskedEmail: masked };
  }

  const now = new Date();
  const kind = pickPrize(cryptoRng, parsePrizeWeights(process.env.GAME_PRIZE_WEIGHTS));
  const { validFrom, validUntil } = prizeValidity(kind, now);

  let code = "";
  let created = false;
  for (let attempt = 0; attempt < CODE_INSERT_ATTEMPTS && !created; attempt++) {
    code = generateVoucherCode();
    try {
      await prisma.$transaction(async (tx) => {
        if (ticketId && seatCap !== null && !existing) {
          const used = await tx.gameParticipant.count({
            where: { campaign: GAME_CAMPAIGN, ticketId },
          });
          if (used >= seatCap) throw new TicketExhausted();
        }
        const participant = existing
          ? existing
          : await tx.gameParticipant.create({
              data: {
                campaign: GAME_CAMPAIGN,
                email,
                name,
                phone,
                ticketId,
                locale,
                termsAcceptedAt: now,
                marketingConsentAt: input.marketingConsent ? now : null,
                consentVersion: GAME_CONSENT_VERSION,
              },
            });
        await tx.prizeVoucher.create({
          data: {
            code,
            campaign: GAME_CAMPAIGN,
            participantId: participant.id,
            kind,
            validFrom,
            validUntil,
          },
        });
      });
      created = true;
    } catch (err) {
      if (err instanceof TicketExhausted) return { ok: false, error: "ticket_exhausted" };
      const unique =
        err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
      if (!unique) {
        console.error("[bilheteira] game_play_transaction_failed", logSafeError(err));
        return { ok: false, error: "generic" };
      }
      const target = (err.meta?.target as string[] | string | undefined) ?? "";
      const onEmail = String(target).includes("email");
      if (onEmail) {
        // Two kiosks raced on the same email: return the winner's prize.
        const winner = await prisma.gameParticipant.findUnique({
          where: { campaign_email: { campaign: GAME_CAMPAIGN, email } },
          include: { vouchers: { orderBy: { createdAt: "asc" }, take: 1 } },
        });
        const v = winner?.vouchers[0];
        if (v) return { ok: false, error: "already_played", kind: v.kind, code: v.code, maskedEmail: masked };
        return { ok: false, error: "generic" };
      }
      // Otherwise a code collision — loop and regenerate.
    }
  }
  if (!created) return { ok: false, error: "generic" };

  let emailSent = false;
  try {
    await sendVoucherEmail({ to: email, name, kind, code, validUntil, locale });
    emailSent = true;
    await prisma.prizeVoucher.update({ where: { code }, data: { emailSentAt: new Date() } });
  } catch (err) {
    // The prize is already persisted; the screen shows the code regardless.
    console.error("[bilheteira] game_voucher_email_failed", logSafeError(err));
  }

  return { ok: true, kind, code, validUntil: validUntil.toISOString(), maskedEmail: masked, emailSent };
}
