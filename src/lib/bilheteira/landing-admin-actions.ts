"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma, type TicketTierKind, type TierStateOverride } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSessionAdmin } from "./session";
import { faqFromText, programFromText } from "./offers";
import { fromLisbonInput } from "./lisbon-time";
import { sendTicketEmail } from "./ticket-email";
import { SAMPLE_MERGE_VALUES } from "./email-merge";
import { logSafeError } from "@/lib/wepacker/log-safe-error";

const KINDS: TicketTierKind[] = ["single", "bundle", "group", "phase", "request"];
const OVERRIDES: TierStateOverride[] = ["auto", "sold_out", "closed"];

async function requireAdmin() {
  const admin = await getSessionAdmin();
  if (!admin) redirect("/bilheteira/login");
  return admin;
}

function back(path: string, error: string): never {
  redirect(`${path}?error=${encodeURIComponent(error)}`);
}

function text(formData: FormData, name: string, max = 5000): string | null {
  const value = String(formData.get(name) ?? "").trim().slice(0, max);
  return value || null;
}

function priceToCents(value: string | null): number | null {
  if (!value) return null;
  const n = Number(value.replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

function int(formData: FormData, name: string): number | null {
  const raw = text(formData, name, 20);
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 ? n : null;
}

function dateTime(formData: FormData, name: string): Date | null {
  const raw = text(formData, name, 40);
  return raw ? fromLisbonInput(raw) : null;
}

function httpsUrl(value: string | null): string | null {
  if (!value) return null;
  if (value.startsWith("/")) return value;
  try {
    const url = new URL(value.replace(/\{\{\s*[a-z_]+\s*\}\}/g, "x"));
    return url.protocol === "https:" ? value : null;
  } catch {
    return null;
  }
}

export async function saveTierAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const eventId = text(formData, "eventId", 60) ?? "";
  const tierId = text(formData, "tierId", 60);
  const editPath = `/bilheteira/admin/events/${eventId}/tiers/${tierId ?? "new"}`;

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) back("/bilheteira/admin", "Evento inválido.");

  const name = text(formData, "name", 200);
  if (!name) back(editPath, "O nome do bilhete é obrigatório.");

  const kindRaw = String(formData.get("kind") || "single") as TicketTierKind;
  const kind = KINDS.includes(kindRaw) ? kindRaw : "single";
  const overrideRaw = String(formData.get("stateOverride") || "auto") as TierStateOverride;
  const stateOverride = OVERRIDES.includes(overrideRaw) ? overrideRaw : "auto";
  const priceCents = priceToCents(text(formData, "price", 20)) ?? 0;
  const seatsPerUnit = kind === "bundle" ? Math.max(2, int(formData, "seatsPerUnit") ?? 2) : 1;
  const minSeats = kind === "group" ? Math.max(2, int(formData, "minSeats") ?? 10) : null;
  const phaseGroup = kind === "phase" ? text(formData, "phaseGroup", 60) : null;
  const phaseOrder = kind === "phase" ? int(formData, "phaseOrder") : null;
  if (kind === "phase" && (!phaseGroup || phaseOrder == null)) {
    back(editPath, "Uma fase precisa de sequência e ordem.");
  }
  const stripePriceId = text(formData, "stripePriceId", 120);
  if (stripePriceId && !stripePriceId.startsWith("price_")) {
    back(editPath, "Price ID Stripe deve começar por 'price_'.");
  }
  const ctaUrlRaw = text(formData, "ctaUrl", 500);
  const ctaUrl = httpsUrl(ctaUrlRaw);
  if (ctaUrlRaw && !ctaUrl) back(editPath, "O link do botão tem de ser https:// ou um caminho do site.");
  const emailCtaUrlRaw = text(formData, "emailCtaUrl", 500);
  const emailCtaUrl = httpsUrl(emailCtaUrlRaw);
  if (emailCtaUrlRaw && (!emailCtaUrl || emailCtaUrl.startsWith("/"))) {
    back(editPath, "O link do email tem de começar por https://.");
  }
  const salesStartAt = dateTime(formData, "salesStartAt");
  const salesEndAt = dateTime(formData, "salesEndAt");
  if (salesStartAt && salesEndAt && salesEndAt <= salesStartAt) {
    back(editPath, "O fecho das vendas tem de ser depois da abertura.");
  }

  const data = {
    name,
    description: text(formData, "description", 8000),
    kind,
    priceCents: kind === "request" ? 0 : priceCents,
    quantity: int(formData, "quantity"),
    seatsPerUnit,
    minSeats,
    maxPerOrder: int(formData, "maxPerOrder"),
    hideUnitPrice: kind === "group" ? true : formData.get("hideUnitPrice") === "on",
    phaseGroup,
    phaseOrder,
    salesStartAt,
    salesEndAt,
    stateOverride,
    lockedNote: text(formData, "lockedNote", 300),
    referencePriceCents: priceToCents(text(formData, "referencePrice", 20)),
    ctaLabel: text(formData, "ctaLabel", 80),
    ctaUrl,
    waitlistEnabled: formData.get("waitlistEnabled") === "on",
    section: text(formData, "section", 80),
    featured: formData.get("featured") === "on",
    emailNote: text(formData, "emailNote", 4000),
    emailCtaLabel: text(formData, "emailCtaLabel", 80),
    emailCtaUrl,
    stripePriceId,
  };

  let savedId = tierId;
  if (tierId) {
    const updated = await prisma.ticketTier.updateMany({ where: { id: tierId, eventId }, data });
    if (updated.count !== 1) back(`/bilheteira/admin/events/${eventId}`, "Bilhete inválido.");
  } else {
    const count = await prisma.ticketTier.count({ where: { eventId } });
    const created = await prisma.ticketTier.create({ data: { ...data, eventId, sortOrder: count } });
    savedId = created.id;
  }
  // Only one featured tier per event drives the hero and the mobile bar.
  if (data.featured && savedId) {
    await prisma.ticketTier.updateMany({
      where: { eventId, id: { not: savedId }, featured: true },
      data: { featured: false },
    });
  }
  revalidatePath(`/bilheteira/admin/events/${eventId}`);
  revalidatePath(`/bilheteira/${event.slug}`);
  revalidatePath("/bilheteira");
  redirect(`/bilheteira/admin/events/${eventId}/tiers/${savedId}?saved=1`);
}

export async function moveTierAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const eventId = text(formData, "eventId", 60) ?? "";
  const tierId = text(formData, "tierId", 60) ?? "";
  const direction = formData.get("direction") === "up" ? -1 : 1;
  const tiers = await prisma.ticketTier.findMany({ where: { eventId }, orderBy: { sortOrder: "asc" } });
  const index = tiers.findIndex((t) => t.id === tierId);
  const swap = tiers[index + direction];
  if (index >= 0 && swap) {
    const ordered = [...tiers];
    [ordered[index], ordered[index + direction]] = [swap, tiers[index]];
    await prisma.$transaction(
      ordered.map((t, i) => prisma.ticketTier.update({ where: { id: t.id }, data: { sortOrder: i } })),
    );
  }
  revalidatePath(`/bilheteira/admin/events/${eventId}`);
  redirect(`/bilheteira/admin/events/${eventId}#bilhetes`);
}

export async function sendTestTicketEmailAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const eventId = text(formData, "eventId", 60) ?? "";
  const tierId = text(formData, "tierId", 60) ?? "";
  const path = `/bilheteira/admin/events/${eventId}/tiers/${tierId}`;
  const tier = await prisma.ticketTier.findFirst({ where: { id: tierId, eventId }, include: { event: true } });
  if (!tier) back(path, "Bilhete inválido.");
  try {
    await sendTicketEmail({
      to: admin.email,
      buyerName: SAMPLE_MERGE_VALUES.nome,
      eventTitle: tier.event.title,
      eventSubtitle: tier.event.subtitle,
      startsAt: tier.event.startsAt,
      venue: tier.event.venue,
      tierName: tier.name,
      priceCents: tier.priceCents,
      totalCents: tier.priceCents,
      seats: tier.seatsPerUnit,
      ticketId: "teste",
      ticketSerial: Number(SAMPLE_MERGE_VALUES.bilhete),
      coverImage: tier.event.coverImage,
      eventEmailNote: tier.event.emailNote,
      tierEmailNote: tier.emailNote,
      emailCtaLabel: tier.emailCtaLabel,
      emailCtaUrl: tier.emailCtaUrl,
    });
  } catch (err) {
    console.error("[bilheteira] test_email_failed", logSafeError(err));
    back(path, "Não foi possível enviar o email de teste.");
  }
  redirect(`${path}?sentTest=1`);
}

export async function saveEventLandingAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const eventId = text(formData, "eventId", 60) ?? "";
  const path = `/bilheteira/admin/events/${eventId}/landing`;
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) back("/bilheteira/admin", "Evento inválido.");

  const mapUrlRaw = text(formData, "mapUrl", 500);
  const mapUrl = httpsUrl(mapUrlRaw);
  if (mapUrlRaw && (!mapUrl || mapUrl.startsWith("/"))) back(path, "O link do mapa tem de começar por https://.");
  const ogImageRaw = text(formData, "ogImage", 500);
  const ogImage = httpsUrl(ogImageRaw);
  if (ogImageRaw && !ogImage) back(path, "A imagem de partilha tem de ser https:// ou um caminho do site.");

  const program = programFromText(text(formData, "program", 10000) ?? "");
  const faq = faqFromText(text(formData, "faq", 20000) ?? "");

  await prisma.event.update({
    where: { id: eventId },
    data: {
      seoDescription: text(formData, "seoDescription", 300),
      ogImage,
      mapUrl,
      directions: text(formData, "directions", 4000),
      program: program.length ? (program as unknown as Prisma.InputJsonValue) : Prisma.DbNull,
      faq: faq.length ? (faq as unknown as Prisma.InputJsonValue) : Prisma.DbNull,
      featured: formData.get("featured") === "on",
      emailNote: text(formData, "emailNote", 4000),
    },
  });
  revalidatePath(`/bilheteira/${event.slug}`);
  revalidatePath("/bilheteira");
  redirect(`${path}?saved=1`);
}

export async function saveGuestAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const eventId = text(formData, "eventId", 60) ?? "";
  const guestId = text(formData, "guestId", 60);
  const path = `/bilheteira/admin/events/${eventId}/landing`;
  const name = text(formData, "name", 200);
  if (!name) back(path, "O nome do convidado é obrigatório.");
  const photoRaw = text(formData, "photo", 500);
  const photo = httpsUrl(photoRaw);
  if (photoRaw && !photo) back(path, "A fotografia tem de ser https:// ou um caminho do site.");
  const data = {
    name,
    role: text(formData, "role", 200),
    bio: text(formData, "bio", 1000),
    photo,
    revealAt: dateTime(formData, "revealAt"),
    sortOrder: int(formData, "sortOrder") ?? 0,
  };
  if (guestId) {
    await prisma.eventGuest.updateMany({ where: { id: guestId, eventId }, data });
  } else {
    await prisma.eventGuest.create({ data: { ...data, eventId } });
  }
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (event) revalidatePath(`/bilheteira/${event.slug}`);
  redirect(`${path}?saved=1#convidados`);
}

export async function deleteGuestAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const eventId = text(formData, "eventId", 60) ?? "";
  const guestId = text(formData, "guestId", 60) ?? "";
  await prisma.eventGuest.deleteMany({ where: { id: guestId, eventId } });
  redirect(`/bilheteira/admin/events/${eventId}/landing#convidados`);
}
