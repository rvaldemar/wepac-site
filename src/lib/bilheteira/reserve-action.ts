"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { sendTicketEmail, ticketEmailData } from "@/lib/bilheteira/ticket-email";
import {
  computeTierState,
  loadTierUsage,
  purchaseLimits,
  quotePurchase,
} from "@/lib/bilheteira/tier-state";
import { getStripe, isStripeConfigured } from "@/lib/bilheteira/stripe";
import { logSafeError } from "@/lib/wepacker/log-safe-error";

function back(path: string, error: string): never {
  redirect(`${path}?error=${encodeURIComponent(error)}`);
}

// Kept as the attribution payload passed through Stripe metadata.
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

function utmMetadata(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of UTM_KEYS) {
    const value = String(formData.get(key) || "").trim().slice(0, 120);
    if (value) out[key] = value;
  }
  return out;
}

const STATE_ERRORS: Record<string, string> = {
  sold_out: "Este bilhete está esgotado.",
  locked: "Este bilhete ainda não está à venda.",
  closed: "As vendas deste bilhete estão encerradas.",
  request: "Este bilhete é atribuído por pedido, não por compra.",
  archived: "Este bilhete já não está disponível.",
};

export async function reserveAction(formData: FormData): Promise<void> {
  const eventSlug = String(formData.get("eventSlug") || "");
  const tierId = String(formData.get("tierId") || "");
  const buyerName = String(formData.get("buyerName") || "").trim();
  const buyerEmail = String(formData.get("buyerEmail") || "")
    .trim()
    .toLowerCase();
  const buyerPhone = String(formData.get("buyerPhone") || "").trim() || null;
  const marketingConsent = formData.get("marketingConsent") === "on";
  // "units" is seats for single/group/phase tiers and bundles for bundle
  // tiers. Older forms still post "seats".
  const unitsRaw = String(formData.get("units") || formData.get("seats") || "1");

  // Before the event lookup, `eventSlug` is raw user input — it must never
  // shape a redirect or the Stripe cancel_url (that's how an open redirect
  // happens). The only safe fallback pre-lookup is the static event list;
  // once we have the DB row, `event.slug` is what every later redirect uses.
  const preLookupBackPath = "/bilheteira";

  if (!eventSlug || !tierId || !buyerName || !buyerEmail) {
    back(preLookupBackPath, "Preenche nome, email e escolhe um bilhete.");
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
  if (!tier) back(backPath, "Bilhete inválido.");

  // The public page only offers purchasable tiers, but deep-links and
  // hand-crafted POSTs bypass it: every rule (archived, overrides, sales
  // window, phase order, quantities, capacity, request-only) is re-checked
  // here from the same state machine the page uses. Completion of payments
  // started earlier happens in the webhook and is intentionally unaffected.
  const usage = await loadTierUsage(event.id);
  const state = computeTierState(tier, {
    tiers: event.tiers,
    usage,
    capacity: event.capacity,
    now: new Date(),
  });
  if (state.state !== "on_sale") {
    back(backPath, STATE_ERRORS[state.state] ?? "Este bilhete não está disponível.");
  }

  // Reject out-of-range or non-numeric quantities instead of clamping, so a
  // crafted POST can never buy a different quantity than the buyer saw.
  const limits = purchaseLimits(tier);
  if (!/^\d+$/.test(unitsRaw)) {
    back(backPath, "Quantidade inválida.");
  }
  const units = Number(unitsRaw);
  if (units < limits.minUnits || units > limits.maxUnits) {
    back(
      backPath,
      limits.unit === "bundle"
        ? `Escolhe entre ${limits.minUnits} e ${limits.maxUnits}.`
        : `Escolhe entre ${limits.minUnits} e ${limits.maxUnits} lugares.`,
    );
  }
  const quote = quotePurchase(tier, units);
  const seats = quote.seats;
  if (state.remainingSeats != null && seats > state.remainingSeats) {
    back(backPath, "Não há lugares suficientes para esta quantidade.");
  }

  // FREE TIER: create ticket immediately (no payment flow).
  if (quote.totalCents === 0) {
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
      await sendTicketEmail(ticketEmailData({ ticket, event, tier }));
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
  const totalCents = quote.totalCents;
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

  // One Stripe line item per purchasable unit: a seat, or a whole bundle.
  const lineItem = tier.stripePriceId
    ? { price: tier.stripePriceId, quantity: units }
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
          unit_amount: quote.unitAmountCents,
          tax_behavior: "inclusive" as const,
        },
        quantity: units,
      };

  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card", "multibanco"],
      customer_email: buyerEmail,
      line_items: [lineItem],
      // Discount codes (e.g. WEPACker) are created in Stripe with their own
      // usage limits and expiry.
      allow_promotion_codes: true,
      metadata: {
        paymentId: payment.id,
        eventId: event.id,
        tierId: tier.id,
        seats: String(seats),
        units: String(units),
        buyerName,
        buyerEmail,
        ...utmMetadata(formData),
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
