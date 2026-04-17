"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { sendTicketEmail } from "@/lib/bilheteira/ticket-email";

function back(path: string, error: string): never {
  redirect(`${path}?error=${encodeURIComponent(error)}`);
}

export async function reserveAction(formData: FormData): Promise<void> {
  const eventSlug = String(formData.get("eventSlug") || "");
  const tierId = String(formData.get("tierId") || "");
  const buyerName = String(formData.get("buyerName") || "").trim();
  const buyerEmail = String(formData.get("buyerEmail") || "")
    .trim()
    .toLowerCase();
  const buyerPhone = String(formData.get("buyerPhone") || "").trim() || null;
  const seatsRaw = String(formData.get("seats") || "1");

  const backPath = `/bilheteira/${eventSlug}`;

  if (!eventSlug || !tierId || !buyerName || !buyerEmail) {
    back(backPath, "Preenche nome, email e escolhe uma tier.");
  }
  if (!/.+@.+\..+/.test(buyerEmail)) {
    back(backPath, "Email inválido.");
  }

  const event = await prisma.event.findUnique({
    where: { slug: eventSlug },
    include: { tiers: true, brand: true, department: true },
  });
  if (!event) back("/bilheteira", "Evento não encontrado.");
  if (event.status !== "published") {
    back(backPath, "Este evento não está disponível para reserva.");
  }

  const tier = event.tiers.find((t) => t.id === tierId);
  if (!tier) back(backPath, "Tier inválida.");

  const seats = Math.max(1, Math.min(20, Number(seatsRaw) || 1));

  if (tier.quantity != null) {
    const used = await prisma.ticket.aggregate({
      where: { tierId: tier.id, status: { not: "cancelled" } },
      _sum: { seats: true },
    });
    const already = used._sum.seats || 0;
    if (already + seats > tier.quantity) {
      back(backPath, "Esta tier está esgotada ou com lugares insuficientes.");
    }
  }

  if (event.capacity != null) {
    const used = await prisma.ticket.aggregate({
      where: { eventId: event.id, status: { not: "cancelled" } },
      _sum: { seats: true },
    });
    const already = used._sum.seats || 0;
    if (already + seats > event.capacity) {
      back(backPath, "Evento esgotado.");
    }
  }

  const ticket = await prisma.ticket.create({
    data: {
      eventId: event.id,
      tierId: tier.id,
      buyerName,
      buyerEmail,
      buyerPhone,
      seats,
      priceCents: tier.priceCents,
    },
  });

  try {
    await sendTicketEmail({
      to: buyerEmail,
      buyerName,
      eventTitle: event.title,
      eventSubtitle: event.subtitle,
      startsAt: event.startsAt,
      venue: event.venue,
      tierName: tier.name,
      priceCents: tier.priceCents,
      seats,
      ticketId: ticket.id,
    });
  } catch (err) {
    console.error("[bilheteira] email send failed", err);
  }

  redirect(`/bilheteira/ticket/${ticket.id}?welcome=1`);
}
