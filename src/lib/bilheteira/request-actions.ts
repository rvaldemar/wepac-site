"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getVisitorIpFromHeaders } from "@/lib/wessex/rate-limit";
import { logSafeError } from "@/lib/wepacker/log-safe-error";
import { checkRateLimit } from "./game/rate-limit";
import { getSessionAdmin } from "./session";
import { sendRequestReceivedEmail, sendRequestTeamNotice } from "./request-email";
import { sendTicketEmail, ticketEmailData } from "./ticket-email";
import { computeTierState, loadTierUsage } from "./tier-state";

const WINDOW_MS = 10 * 60 * 1000;

function back(path: string, error: string): never {
  redirect(`${path}?error=${encodeURIComponent(error)}`);
}

function field(formData: FormData, name: string, max = 300): string {
  return String(formData.get(name) || "").trim().slice(0, max);
}

function validEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function allowed(scope: string, limit: number): Promise<boolean> {
  const ip = getVisitorIpFromHeaders(await headers());
  return checkRateLimit(`${scope}:${ip}`, limit, WINDOW_MS);
}

export async function submitTierRequestAction(formData: FormData): Promise<void> {
  const eventSlug = field(formData, "eventSlug", 120);
  const tierId = field(formData, "tierId", 60);
  // Honeypot: real people never fill a field they cannot see.
  if (field(formData, "website_confirm")) redirect("/bilheteira");

  const event = await prisma.event.findUnique({
    where: { slug: eventSlug },
    include: { tiers: true },
  });
  if (!event || event.status !== "published") back("/bilheteira", "Evento não encontrado.");
  const tier = event.tiers.find((t) => t.id === tierId && t.kind === "request");
  if (!tier) back(`/bilheteira/${event.slug}`, "Pedido inválido.");

  const formPath = `/bilheteira/${event.slug}/pedido/${tier.id}`;
  const state = computeTierState(tier, {
    tiers: event.tiers,
    usage: await loadTierUsage(event.id),
    capacity: event.capacity,
    now: new Date(),
  });
  if (state.state !== "request") back(formPath, "Os pedidos para este bilhete estão fechados.");

  const name = field(formData, "name", 120);
  const email = field(formData, "email", 200).toLowerCase();
  const phone = field(formData, "phone", 40) || null;
  const organization = field(formData, "organization", 200);
  const role = field(formData, "role", 200);
  const website = field(formData, "website", 300) || null;
  const message = field(formData, "message", 2000) || null;
  const marketingConsent = formData.get("marketingConsent") === "on";

  if (!name || !email || !organization || !role) {
    back(formPath, "Preenche nome, email, estrutura e função.");
  }
  if (!validEmail(email)) back(formPath, "Email inválido.");
  if (!(await allowed("tier-request", 5))) {
    back(formPath, "Muitos pedidos seguidos. Tenta daqui a alguns minutos.");
  }

  // One open request per person and tier: a resubmission updates it instead
  // of piling duplicates on the review queue.
  const existing = await prisma.tierRequest.findFirst({
    where: { tierId: tier.id, email, status: "pending" },
  });
  const data = { name, phone, organization, role, website, message, marketingConsent };
  if (existing) {
    await prisma.tierRequest.update({ where: { id: existing.id }, data });
  } else {
    await prisma.tierRequest.create({
      data: { ...data, email, eventId: event.id, tierId: tier.id },
    });
  }

  const base = process.env.APP_URL || "https://wepac.pt";
  try {
    await sendRequestReceivedEmail({ to: email, name, eventTitle: event.title, tierName: tier.name });
    await sendRequestTeamNotice({
      to: email,
      name,
      eventTitle: event.title,
      tierName: tier.name,
      organization,
      role,
      adminUrl: `${base}/bilheteira/admin/events/${event.id}#pedidos`,
    });
  } catch (err) {
    console.error("[bilheteira] request_email_failed", logSafeError(err));
  }

  revalidatePath(`/bilheteira/admin/events/${event.id}`);
  redirect(`${formPath}?sent=1`);
}

export async function joinWaitlistAction(formData: FormData): Promise<void> {
  const eventSlug = field(formData, "eventSlug", 120);
  const tierId = field(formData, "tierId", 60);
  if (field(formData, "website_confirm")) redirect("/bilheteira");

  const tier = await prisma.ticketTier.findFirst({
    where: { id: tierId, waitlistEnabled: true, archivedAt: null, event: { slug: eventSlug, status: "published" } },
    include: { event: true },
  });
  if (!tier) back("/bilheteira", "Bilhete não encontrado.");
  const backPath = `/bilheteira/${tier.event.slug}`;

  const email = field(formData, "email", 200).toLowerCase();
  const name = field(formData, "name", 120) || null;
  const marketingConsent = formData.get("marketingConsent") === "on";
  if (!validEmail(email)) back(backPath, "Email inválido.");
  if (!(await allowed("waitlist", 10))) {
    back(backPath, "Muitos pedidos seguidos. Tenta daqui a alguns minutos.");
  }

  await prisma.tierWaitlistEntry.upsert({
    where: { tierId_email: { tierId: tier.id, email } },
    create: { eventId: tier.eventId, tierId: tier.id, email, name, marketingConsent },
    update: { name, marketingConsent },
  });
  redirect(`${backPath}?waitlist=${encodeURIComponent(tier.id)}#bilhetes`);
}

async function requireAdmin() {
  const admin = await getSessionAdmin();
  if (!admin) redirect("/bilheteira/login");
  return admin;
}

export async function approveTierRequestAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = field(formData, "id", 60);
  const eventId = field(formData, "eventId", 60);
  const adminPath = `/bilheteira/admin/events/${eventId}`;

  const request = await prisma.tierRequest.findFirst({
    where: { id, eventId },
    include: { tier: true, event: true },
  });
  if (!request) back(adminPath, "Pedido não encontrado.");
  if (request.status !== "pending") back(adminPath, "Este pedido já foi tratado.");

  // The quantity of a request tier caps approved places; approvals also take
  // a real seat, so the event capacity applies here.
  const usage = await loadTierUsage(eventId);
  const used = usage.byTier.get(request.tierId) ?? 0;
  if (request.tier.quantity != null && used >= request.tier.quantity) {
    back(adminPath, "Já não há lugares para este bilhete.");
  }
  if (request.event.capacity != null && usage.total >= request.event.capacity) {
    back(adminPath, "O evento está esgotado.");
  }

  const ticket = await prisma.$transaction(async (tx) => {
    const claimed = await tx.tierRequest.updateMany({
      where: { id, status: "pending" },
      data: { status: "approved", reviewedById: admin.id, reviewedAt: new Date() },
    });
    if (claimed.count !== 1) return null;
    const created = await tx.ticket.create({
      data: {
        eventId,
        tierId: request.tierId,
        buyerName: request.name,
        buyerEmail: request.email,
        buyerPhone: request.phone,
        marketingConsent: request.marketingConsent,
        seats: 1,
        priceCents: 0,
        notes: `${request.role} · ${request.organization}`,
      },
    });
    await tx.tierRequest.update({ where: { id }, data: { ticketId: created.id } });
    return created;
  });
  if (!ticket) back(adminPath, "Este pedido já foi tratado.");

  try {
    await sendTicketEmail(ticketEmailData({ ticket, event: request.event, tier: request.tier }));
  } catch (err) {
    console.error("[bilheteira] request_ticket_email_failed", logSafeError(err));
  }
  revalidatePath(adminPath);
  redirect(`${adminPath}?saved=1#pedidos`);
}

export async function rejectTierRequestAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = field(formData, "id", 60);
  const eventId = field(formData, "eventId", 60);
  const adminPath = `/bilheteira/admin/events/${eventId}`;
  await prisma.tierRequest.updateMany({
    where: { id, eventId, status: "pending" },
    data: { status: "rejected", reviewedById: admin.id, reviewedAt: new Date() },
  });
  revalidatePath(adminPath);
  redirect(`${adminPath}#pedidos`);
}
