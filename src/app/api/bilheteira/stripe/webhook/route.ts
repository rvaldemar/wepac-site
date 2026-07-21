import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/bilheteira/stripe";
import { sendTicketEmail } from "@/lib/bilheteira/ticket-email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function fulfillCheckout(session: Stripe.Checkout.Session) {
  const paymentId = session.metadata?.paymentId;
  if (!paymentId) {
    console.error("[stripe webhook] session without paymentId", session.id);
    return;
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { event: true, tier: true, ticket: true },
  });
  if (!payment) {
    console.error("[stripe webhook] payment not found", paymentId);
    return;
  }

  // Idempotency: already fulfilled
  if (payment.status === "completed" && payment.ticket) {
    return;
  }

  // Defense-in-depth: never mint a ticket for a session that has not
  // actually been paid (e.g. a Multibanco session still awaiting payment).
  // The caller is expected to have already filtered on payment_status, but
  // this guard protects against future call sites that forget to.
  if (session.payment_status !== "paid") {
    console.warn(
      "[stripe webhook] fulfillCheckout called with unpaid session, skipping",
      session.id,
      session.payment_status
    );
    return;
  }

  const ticket = await prisma.ticket.create({
    data: {
      eventId: payment.eventId,
      tierId: payment.tierId,
      paymentId: payment.id,
      buyerName: payment.buyerName,
      buyerEmail: payment.buyerEmail,
      buyerPhone: payment.buyerPhone,
      marketingConsent: payment.marketingConsent,
      seats: payment.seats,
      priceCents: payment.tier.priceCents,
    },
  });

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "completed",
      paidAt: new Date(),
      metadata: (session as unknown as { metadata?: Record<string, string> })
        .metadata as Record<string, string> | undefined,
    },
  });

  try {
    await sendTicketEmail({
      to: payment.buyerEmail,
      buyerName: payment.buyerName,
      eventTitle: payment.event.title,
      eventSubtitle: payment.event.subtitle,
      startsAt: payment.event.startsAt,
      venue: payment.event.venue,
      tierName: payment.tier.name,
      priceCents: payment.tier.priceCents,
      seats: payment.seats,
      ticketId: ticket.id,
      coverImage: payment.event.coverImage,
    });
  } catch (err) {
    console.error("[stripe webhook] email send failed", err);
  }
}

async function markExpired(session: Stripe.Checkout.Session) {
  const paymentId = session.metadata?.paymentId;
  if (!paymentId) return;
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { ticket: true },
  });
  if (!payment || payment.status === "completed") return;
  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: "expired", failedAt: new Date() },
  });
  // A ticket can already exist if checkout.session.completed fired for an
  // async (Multibanco) session before the payment actually settled. Once the
  // session expires or the async payment fails, that ticket must not remain
  // scannable — cancel it alongside the payment.
  if (payment.ticket && payment.ticket.status !== "cancelled") {
    await prisma.ticket.update({
      where: { id: payment.ticket.id },
      data: { status: "cancelled" },
    });
  }
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "webhook secret not configured" },
      { status: 500 }
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing signature" }, { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    console.error("[stripe webhook] signature failed", err);
    return NextResponse.json(
      { error: "signature verification failed" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        // For card payments this fires with payment_status === "paid" and
        // fulfillment should happen immediately. For async methods
        // (Multibanco) it fires with payment_status === "unpaid" — the
        // ticket must NOT be minted yet; wait for
        // checkout.session.async_payment_succeeded instead.
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_status === "paid") {
          await fulfillCheckout(session);
        }
        break;
      }
      case "checkout.session.async_payment_succeeded":
        await fulfillCheckout(event.data.object as Stripe.Checkout.Session);
        break;
      case "checkout.session.expired":
      case "checkout.session.async_payment_failed":
        await markExpired(event.data.object as Stripe.Checkout.Session);
        break;
      default:
        // ignore other event types
        break;
    }
  } catch (err) {
    console.error("[stripe webhook] handler error", err);
    return NextResponse.json({ error: "handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
