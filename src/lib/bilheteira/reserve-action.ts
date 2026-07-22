"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { sendTicketEmail } from "@/lib/bilheteira/ticket-email";
import { getStripe, isStripeConfigured } from "@/lib/bilheteira/stripe";

function back(path: string, error: string): never {
  redirect(`${path}?error=${encodeURIComponent(error)}`);
}

// `returnPath` comes straight from a hidden form field, i.e. user-controlled
// input, and feeds both a server redirect and the Stripe cancel_url. Any
// pattern check (startsWith("/"), a regex) can be defeated by scheme-relative
// URLs, backslash tricks or traversal segments, and would let this action be
// used as an open redirect. A closed allowlist of known in-app paths is the
// only shape that can't be tricked: unknown input has one well-defined
// outcome — silently fall back to the existing per-event page.
const RETURN_PATH_ALLOWLIST = new Set<string>(["/arte-a-capela"]);

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
  const returnPathRaw = String(formData.get("returnPath") || "");

  const eventPath = `/bilheteira/${eventSlug}`;
  const backPath = RETURN_PATH_ALLOWLIST.has(returnPathRaw)
    ? returnPathRaw
    : eventPath;

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
    console.error("[bilheteira] stripe session creation failed", err);
    await prisma.payment.delete({ where: { id: payment.id } }).catch((deleteErr) => {
      console.error(
        "[bilheteira] failed to clean up orphaned payment",
        payment.id,
        deleteErr
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
