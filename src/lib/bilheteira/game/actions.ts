"use server";

import { randomInt } from "node:crypto";
import { headers } from "next/headers";
import type { PrizeKind } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logSafeError } from "@/lib/wepacker/log-safe-error";
import { getVisitorIpFromHeaders } from "@/lib/wessex/rate-limit";
import { EMAIL_RE, canonicalizeEmail, maskEmail, normalizeEmail } from "./email-mask";
import { kioskAccess } from "./kiosk-access";
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
// A kiosk device (signed cookie) serves a whole audience from one IP; the
// ungated/open path keeps a strict per-IP ceiling.
const PLAY_LIMIT_PER_DEVICE = 600;
const PLAY_LIMIT_PER_IP = 60;
const LOOKUP_LIMIT_PER_DEVICE = 3000;
const LOOKUP_LIMIT_PER_IP = 300;
const WINDOW_MS = 60 * 60 * 1000;

class TicketExhausted extends Error {}

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

export type PersonDetails = { name: string; email: string; phone?: string };

type ValidatedPerson =
  | { ok: true; name: string; email: string; phone: string | null }
  | { ok: false; error: GameErrorCode };

function validatePerson(raw: PersonDetails | undefined): ValidatedPerson {
  const name = String(raw?.name || "").trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 120) return { ok: false, error: "invalid_name" };
  const email = normalizeEmail(String(raw?.email || ""));
  if (!EMAIL_RE.test(email) || email.length > 254) return { ok: false, error: "invalid_email" };
  const phoneRaw = String(raw?.phone || "").trim();
  if (phoneRaw && !PHONE_RE.test(phoneRaw)) return { ok: false, error: "invalid_phone" };
  return { ok: true, name, email: canonicalizeEmail(email), phone: phoneRaw || null };
}

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
      /**
       * Null when the code is delivered by email only (typed email, no
       * ticket): a code on screen would let anyone farm prizes with made-up
       * addresses. Ticket holders (buyer or capped companions) see it.
       */
      code: string | null;
      validUntil: string;
      maskedEmail: string;
      emailSent: boolean;
    }
  | {
      ok: false;
      error: "already_played";
      kind: PrizeKind;
      /** Only for the ticket buyer (QR proves possession); null otherwise. */
      code: string | null;
      maskedEmail: string;
      /** True when the existing code was re-sent to the inbox. */
      resent: boolean;
    }
  | { ok: false; error: Exclude<GameErrorCode, never> };

type Access = { device: string; ip: string };

async function gate(kind: "play" | "lookup"): Promise<Access | "locked" | "rate_limited"> {
  const access = await kioskAccess();
  if (!access) return "locked";
  const ip = getVisitorIpFromHeaders(await headers());
  const gated = access.device !== "open";
  const key = gated ? `game:${kind}:device:${access.device}` : `game:${kind}:ip:${ip}`;
  const limit = gated
    ? kind === "play" ? PLAY_LIMIT_PER_DEVICE : LOOKUP_LIMIT_PER_DEVICE
    : kind === "play" ? PLAY_LIMIT_PER_IP : LOOKUP_LIMIT_PER_IP;
  if (!checkRateLimit(key, limit, WINDOW_MS)) return "rate_limited";
  return { device: access.device, ip };
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
  const access = await gate("lookup");
  if (access === "locked" || access === "rate_limited") return { ok: false, error: access };
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
  const buyerEmail = canonicalizeEmail(ticket.buyerEmail);
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

async function sendBestEffort(args: {
  participantId: string;
  code: string;
  email: string;
  name: string | null;
  kind: PrizeKind;
  validUntil: Date;
  locale: string;
}): Promise<boolean> {
  try {
    await sendVoucherEmail({
      to: args.email,
      name: args.name,
      kind: args.kind,
      code: args.code,
      validUntil: args.validUntil,
      locale: args.locale,
      participantId: args.participantId,
    });
  } catch (err) {
    // The prize is already persisted; callers decide what the screen shows.
    console.error("[bilheteira] game_voucher_email_failed", logSafeError(err));
    return false;
  }
  try {
    await prisma.prizeVoucher.update({ where: { code: args.code }, data: { emailSentAt: new Date() } });
  } catch (err) {
    console.error("[bilheteira] game_voucher_email_sent_mark_failed", logSafeError(err));
  }
  return true;
}

export async function playAction(input: PlayInput): Promise<PlayResult> {
  const access = await gate("play");
  if (access === "locked" || access === "rate_limited") return { ok: false, error: access };
  if (input?.termsAccepted !== true) return { ok: false, error: "terms_required" };
  const marketingConsent = input.marketingConsent === true;
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
  const typedEmail = input.identity.mode === "email" || !!input.identity.companion;
  const isBuyer = input.identity.mode === "ticket" && !input.identity.companion;
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
      email = canonicalizeEmail(ticket.buyerEmail);
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

  // One entry per email per campaign. A typed email proves nothing, so the
  // existing code is never shown for it: it is re-sent to the inbox instead.
  // The ticket buyer (QR in hand) may see it again on screen.
  const existing = await prisma.gameParticipant.findUnique({
    where: { campaign_email: { campaign: GAME_CAMPAIGN, email } },
    include: { vouchers: { orderBy: { createdAt: "asc" }, take: 1 } },
  });
  const alreadyPlayed = async (v: { kind: PrizeKind; code: string; validUntil: Date }, participantId: string): Promise<PlayResult> => {
    if (isBuyer) return { ok: false, error: "already_played", kind: v.kind, code: v.code, maskedEmail: masked, resent: false };
    const resent = await sendBestEffort({ participantId, code: v.code, email, name, kind: v.kind, validUntil: v.validUntil, locale });
    return { ok: false, error: "already_played", kind: v.kind, code: null, maskedEmail: masked, resent };
  };
  if (existing?.vouchers[0]) return alreadyPlayed(existing.vouchers[0], existing.id);

  const now = new Date();
  const kind = pickPrize(cryptoRng, parsePrizeWeights(process.env.GAME_PRIZE_WEIGHTS));
  const { validFrom, validUntil } = prizeValidity(kind, now);

  let code = "";
  let participantId = "";
  let created = false;
  for (let attempt = 0; attempt < CODE_INSERT_ATTEMPTS && !created; attempt++) {
    code = generateVoucherCode();
    try {
      await prisma.$transaction(async (tx) => {
        if (ticketId && seatCap !== null) {
          // Serialise concurrent registrations on the same ticket: Prisma
          // transactions run at READ COMMITTED, where count-then-insert is
          // write-skew prone. The row lock makes the cap check exact.
          await tx.$queryRaw`SELECT id FROM tickets WHERE id = ${ticketId} FOR UPDATE`;
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
                marketingConsentAt: marketingConsent ? now : null,
                consentVersion: GAME_CONSENT_VERSION,
              },
            });
        participantId = participant.id;
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
        // Two kiosks raced on the same email: surface the winner's prize.
        const winner = await prisma.gameParticipant.findUnique({
          where: { campaign_email: { campaign: GAME_CAMPAIGN, email } },
          include: { vouchers: { orderBy: { createdAt: "asc" }, take: 1 } },
        });
        const v = winner?.vouchers[0];
        if (v && winner) return alreadyPlayed(v, winner.id);
        return { ok: false, error: "generic" };
      }
      // Otherwise a code collision — loop and regenerate.
    }
  }
  if (!created) return { ok: false, error: "generic" };

  const emailSent = await sendBestEffort({ participantId, code, email, name, kind, validUntil, locale });

  // No ticket: the code lives in the inbox only, unless delivery failed, in
  // which case the screen is the only channel left.
  const showCode = !(typedEmail && !ticketId) || !emailSent;
  return {
    ok: true,
    kind,
    code: showCode ? code : null,
    validUntil: validUntil.toISOString(),
    maskedEmail: masked,
    emailSent,
  };
}
