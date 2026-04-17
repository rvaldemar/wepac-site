"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { sendTicketEmail } from "@/lib/bilheteira/ticket-email";
import { getStripe, isStripeConfigured } from "@/lib/bilheteira/stripe";

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
    const alreadyTickets = used._sum.seats || 0;
    const pendingPayments = await prisma.payment.aggregate({
      where: { tierId: tier.id, status: "pending" },
      _sum: { seats: true },
    });
    const pending = pendingPayments._sum.seats || 0;
    if (alreadyTickets + pending + seats > tier.quantity) {
      back(backPath, "Esta tier está esgotada ou com lugares insuficientes.");
    }
  }

  if (event.capacity != null) {
    const usedTickets = await prisma.ticket.aggregate({
      where: { eventId: event.id, status: { not: "cancelled" } },
      _sum: { seats: true },
    });
    const pendingPayments = await prisma.payment.aggregate({
      where: { eventId: event.id, status: "pending" },
      _sum: { seats: true },
    });
    const already =
      (usedTickets._sum.seats || 0) + (pendingPayments._sum.seats || 0);
    if (already + seats > event.capacity) {
      back(backPath, "Evento esgotado.");
    }
  }

  // FREE TIER: create ticket immediately (no payment flow).
  if (tier.priceCents === 0) {
    const ticket = await prisma.ticket.create({
      data: {
        eventId: event.id,
        tierId: tier.id,
        buyerName,
        buyerEmail,
        buyerPhone,
        seats,
        priceCents: 0,
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
        priceCents: 0,
        seats,
        ticketId: ticket.id,
      });
    } catch (err) {
      console.error("[bilheteira] email send failed", err);
    }
    redirect(`/bilheteira/ticket/${ticket.id}?welcome=1`);
  }

  // PAID TIER: Stripe Checkout
  if (!isStripeConfigured()) {
    back(
      backPath,
      "Pagamento online ainda não está configurado. Contacta info@wepac.pt."
    );
  }

  const base = process.env.APP_URL || "https://wepac.pt";
  const totalCents = tier.priceCents * seats;
  const stripe = getStripe();

  // Create Payment row first so webhook can idempotently locate it.
  const payment = await prisma.payment.create({
    data: {
      provider: "stripe",
      providerRef: `pending_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      amountCents: totalCents,
      currency: "eur",
      eventId: event.id,
      tierId: tier.id,
      seats,
      buyerName,
      buyerEmail,
      buyerPhone,
    },
  });

  const lineItem = tier.stripePriceId
    ? { price: tier.stripePriceId, quantity: seats }
    : {
        price_data: {
          currency: "eur",
          product_data: {
            name: `${event.title} — ${tier.name}`,
            description: tier.description || undefined,
            metadata: {
              eventId: event.id,
              tierId: tier.id,
            },
          },
          unit_amount: tier.priceCents,
          tax_behavior: "inclusive" as const,
        },
        quantity: seats,
      };

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card", "multibanco"],
    customer_email: buyerEmail,
    line_items: [lineItem],
    metadata: {
      paymentId: payment.id,
      eventId: event.id,
      tierId: tier.id,
      seats: String(seats),
      buyerName,
      buyerEmail,
    },
    success_url: `${base}/bilheteira/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/bilheteira/${eventSlug}?cancelled=1`,
    locale: "pt",
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
  });

  await prisma.payment.update({
    where: { id: payment.id },
    data: { providerRef: session.id },
  });

  if (!session.url) {
    back(backPath, "Não foi possível iniciar o pagamento. Tenta novamente.");
  }
  redirect(session.url);
}
