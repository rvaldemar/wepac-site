"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { sendTicketEmail } from "@/lib/bilheteira/ticket-email";
import { getStripe, isStripeConfigured } from "@/lib/bilheteira/stripe";
import { logSafeError } from "@/lib/wepacker/log-safe-error";

function back(path: string, error: string): never {
  redirect(`${path}?error=${encodeURIComponent(error)}`);
}

const MAX_SEATS = 10;

export async function reserveAction(formData: FormData): Promise<void> {
  const eventSlug = String(formData.get("eventSlug") || "");
  const tierId = String(formData.get("tierId") || "");
  const buyerName = String(formData.get("buyerName") || "").trim();
  const buyerEmail = String(formData.get("buyerEmail") || "")
    .trim()
    .toLowerCase();
  const buyerPhone = String(formData.get("buyerPhone") || "").trim() || null;
  const marketingConsent = formData.get("marketingConsent") === "on";
  const seatsRaw = String(formData.get("seats") || "1");

  // Before the event lookup, `eventSlug` is raw user input — it must never
  // shape a redirect or the Stripe cancel_url (that's how an open redirect
  // happens). The only safe fallback pre-lookup is the static event list;
  // once we have the DB row, `event.slug` is what every later redirect uses.
  const preLookupBackPath = "/bilheteira";

  if (!eventSlug || !tierId || !buyerName || !buyerEmail) {
    back(preLookupBackPath, "Preenche nome, email e escolhe uma tier.");
  }
  if (!/.+@.+\..+/.test(buyerEmail)) {
    back(preLookupBackPath, "Email inválido.");
  }

  const event = await prisma.event.findUnique({
    where: { slug: eventSlug },
    include: { tiers: true, brand: true, department: true },
  });
  if (!event) back("/bilheteira", "Evento não encontrado.");

  const backPath = `/bilheteira/${event.slug}`;

  if (event.status !== "published") {
    back(backPath, "Este evento não está disponível para reserva.");
  }

  const tier = event.tiers.find((t) => t.id === tierId);
  if (!tier) back(backPath, "Tier inválida.");

  // Both forms that post here cap the visible input at MAX_SEATS — silently
  // clamping out-of-range or non-numeric values would let a crafted POST buy
  // a different quantity than what the buyer saw and submitted. Reject
  // instead of coercing.
  if (!/^\d+$/.test(seatsRaw)) {
    back(backPath, "Número de lugares inválido.");
  }
  const seats = Number(seatsRaw);
  if (seats < 1 || seats > MAX_SEATS) {
    back(backPath, `Escolhe entre 1 e ${MAX_SEATS} lugares.`);
  }

  // Stripe Checkout sessions we create expire after 30 minutes (see
  // `expires_at` below). A pending Payment older than that window is either
  // an abandoned checkout or one already resolved by the webhook out of
  // band — it must not keep counting against capacity, or the event/tier can
  // read as sold out ("phantom sold-out") long after those seats freed up.
  const pendingWindowStart = new Date(Date.now() - 30 * 60 * 1000);

  if (tier.quantity != null) {
    const used = await prisma.ticket.aggregate({
      where: { tierId: tier.id, status: { not: "cancelled" } },
      _sum: { seats: true },
    });
    const alreadyTickets = used._sum.seats || 0;
    const pendingPayments = await prisma.payment.aggregate({
      where: {
        tierId: tier.id,
        status: "pending",
        createdAt: { gte: pendingWindowStart },
      },
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
      where: {
        eventId: event.id,
        status: "pending",
        createdAt: { gte: pendingWindowStart },
      },
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
        marketingConsent,
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
        coverImage: event.coverImage,
      });
    } catch (err) {
      console.error("[bilheteira] ticket_email_failed", logSafeError(err));
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
      marketingConsent,
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

  let session;
  try {
    session = await stripe.checkout.sessions.create({
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
      cancel_url: `${base}${backPath}?cancelled=1`,
      locale: "pt",
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    });
  } catch (err) {
    // Stripe rejected the session after we already created the Payment row
    // (needed upfront so the webhook can locate it by id). Without cleanup
    // this Payment would sit as "pending" and keep counting against
    // capacity for the full 30-minute window despite no checkout existing.
    console.error("[bilheteira] stripe_session_creation_failed", logSafeError(err));
    await prisma.payment.delete({ where: { id: payment.id } }).catch((deleteErr) => {
      console.error(
        "[bilheteira] failed to clean up orphaned payment",
        logSafeError(deleteErr),
      );
    });
    back(backPath, "Não foi possível iniciar o pagamento. Tenta novamente.");
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { providerRef: session.id },
  });

  if (!session.url) {
    back(backPath, "Não foi possível iniciar o pagamento. Tenta novamente.");
  }
  redirect(session.url);
}
