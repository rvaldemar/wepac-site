import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

// Mock prisma so these tests exercise the webhook's fulfillment/expiry
// logic itself, never a real DB or real Stripe.
const paymentFindUnique = vi.fn();
const paymentUpdate = vi.fn();
const ticketCreate = vi.fn();
const ticketUpdate = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    payment: {
      findUnique: (...args: unknown[]) => paymentFindUnique(...args),
      update: (...args: unknown[]) => paymentUpdate(...args),
    },
    ticket: {
      create: (...args: unknown[]) => ticketCreate(...args),
      update: (...args: unknown[]) => ticketUpdate(...args),
    },
  },
}));

const constructEvent = vi.fn();
vi.mock("@/lib/bilheteira/stripe", () => ({
  getStripe: () => ({ webhooks: { constructEvent: (...a: unknown[]) => constructEvent(...a) } }),
}));

const sendTicketEmail = vi.fn(async (..._args: unknown[]) => undefined);
vi.mock("@/lib/bilheteira/ticket-email", () => ({
  sendTicketEmail: (...args: unknown[]) => sendTicketEmail(...args),
}));

import { POST } from "@/app/api/bilheteira/stripe/webhook/route";

function req(): NextRequest {
  return {
    headers: { get: (key: string) => (key === "stripe-signature" ? "sig_test" : null) },
    text: async () => "raw-body",
  } as unknown as NextRequest;
}

const basePayment = {
  id: "pay-1",
  status: "pending",
  eventId: "evt-1",
  tierId: "tier-1",
  seats: 2,
  buyerName: "Ana",
  buyerEmail: "ana@example.com",
  buyerPhone: null,
  marketingConsent: false,
  ticket: null,
  event: { title: "Concerto", subtitle: null, startsAt: new Date(), venue: "Sala X", coverImage: null },
  tier: { name: "Geral", priceCents: 1000 },
};

beforeEach(() => {
  paymentFindUnique.mockReset();
  paymentUpdate.mockReset();
  ticketCreate.mockReset();
  ticketUpdate.mockReset();
  constructEvent.mockReset();
  sendTicketEmail.mockClear();
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
});

describe("checkout.session.completed", () => {
  it("does NOT fulfil (mint a ticket) when payment_status is unpaid (Multibanco pending)", async () => {
    constructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_1",
          payment_status: "unpaid",
          metadata: { paymentId: "pay-1" },
        },
      },
    });

    const res = await POST(req());

    expect(res.status).toBe(200);
    expect(paymentFindUnique).not.toHaveBeenCalled();
    expect(ticketCreate).not.toHaveBeenCalled();
    expect(paymentUpdate).not.toHaveBeenCalled();
  });

  it("fulfils immediately when payment_status is paid (card payment)", async () => {
    constructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_2",
          payment_status: "paid",
          metadata: { paymentId: "pay-1" },
        },
      },
    });
    paymentFindUnique.mockResolvedValue({ ...basePayment });
    ticketCreate.mockResolvedValue({ id: "ticket-1" });

    const res = await POST(req());

    expect(res.status).toBe(200);
    expect(ticketCreate).toHaveBeenCalledTimes(1);
    expect(paymentUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "completed" }) })
    );
  });
});

describe("checkout.session.async_payment_succeeded", () => {
  it("fulfils the Multibanco payment once it actually settles", async () => {
    constructEvent.mockReturnValue({
      type: "checkout.session.async_payment_succeeded",
      data: {
        object: {
          id: "cs_3",
          payment_status: "paid",
          metadata: { paymentId: "pay-1" },
        },
      },
    });
    paymentFindUnique.mockResolvedValue({ ...basePayment });
    ticketCreate.mockResolvedValue({ id: "ticket-2" });

    await POST(req());

    expect(ticketCreate).toHaveBeenCalledTimes(1);
  });

  it("defense-in-depth: skips fulfillment if the session somehow is not paid", async () => {
    constructEvent.mockReturnValue({
      type: "checkout.session.async_payment_succeeded",
      data: {
        object: {
          id: "cs_4",
          payment_status: "unpaid",
          metadata: { paymentId: "pay-1" },
        },
      },
    });
    paymentFindUnique.mockResolvedValue({ ...basePayment });

    await POST(req());

    expect(ticketCreate).not.toHaveBeenCalled();
  });
});

describe("checkout.session.expired / async_payment_failed", () => {
  it("marks the payment expired and cancels an already-minted ticket", async () => {
    constructEvent.mockReturnValue({
      type: "checkout.session.expired",
      data: {
        object: { id: "cs_5", metadata: { paymentId: "pay-1" } },
      },
    });
    paymentFindUnique.mockResolvedValue({
      ...basePayment,
      ticket: { id: "ticket-3", status: "pending" },
    });

    await POST(req());

    expect(paymentUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "expired" }) })
    );
    expect(ticketUpdate).toHaveBeenCalledWith({
      where: { id: "ticket-3" },
      data: { status: "cancelled" },
    });
  });

  it("does nothing extra when no ticket was ever minted", async () => {
    constructEvent.mockReturnValue({
      type: "checkout.session.async_payment_failed",
      data: {
        object: { id: "cs_6", metadata: { paymentId: "pay-1" } },
      },
    });
    paymentFindUnique.mockResolvedValue({ ...basePayment, ticket: null });

    await POST(req());

    expect(paymentUpdate).toHaveBeenCalledTimes(1);
    expect(ticketUpdate).not.toHaveBeenCalled();
  });

  it("does not re-cancel a ticket that is already cancelled", async () => {
    constructEvent.mockReturnValue({
      type: "checkout.session.expired",
      data: {
        object: { id: "cs_7", metadata: { paymentId: "pay-1" } },
      },
    });
    paymentFindUnique.mockResolvedValue({
      ...basePayment,
      ticket: { id: "ticket-4", status: "cancelled" },
    });

    await POST(req());

    expect(ticketUpdate).not.toHaveBeenCalled();
  });
});
