import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma so these tests exercise reserveAction's own capacity/cleanup
// logic, never a real DB or real Stripe.
const eventFindUnique = vi.fn();
const ticketAggregate = vi.fn();
const paymentAggregate = vi.fn();
const paymentCreate = vi.fn();
const paymentUpdate = vi.fn();
const paymentDelete = vi.fn();
const ticketCreate = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    event: { findUnique: (...a: unknown[]) => eventFindUnique(...a) },
    ticket: {
      aggregate: (...a: unknown[]) => ticketAggregate(...a),
      create: (...a: unknown[]) => ticketCreate(...a),
    },
    payment: {
      aggregate: (...a: unknown[]) => paymentAggregate(...a),
      create: (...a: unknown[]) => paymentCreate(...a),
      update: (...a: unknown[]) => paymentUpdate(...a),
      delete: (...a: unknown[]) => paymentDelete(...a),
    },
  },
}));

const sendTicketEmail = vi.fn(async (..._args: unknown[]) => undefined);
vi.mock("@/lib/bilheteira/ticket-email", () => ({
  sendTicketEmail: (...a: unknown[]) => sendTicketEmail(...a),
}));

const sessionsCreate = vi.fn();
vi.mock("@/lib/bilheteira/stripe", () => ({
  isStripeConfigured: () => true,
  getStripe: () => ({ checkout: { sessions: { create: (...a: unknown[]) => sessionsCreate(...a) } } }),
}));

class RedirectSignal extends Error {
  constructor(public url: string) {
    super(`NEXT_REDIRECT:${url}`);
  }
}
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new RedirectSignal(url);
  },
}));

import { reserveAction } from "@/lib/bilheteira/reserve-action";

const paidTier = {
  id: "tier-1",
  priceCents: 1000,
  quantity: 100,
  stripePriceId: null,
  description: null,
  name: "Geral",
};

const baseEvent = {
  id: "evt-1",
  slug: "concerto",
  status: "published",
  capacity: 200,
  title: "Concerto",
  tiers: [paidTier],
};

function formData(overrides: Record<string, string> = {}) {
  const fd = new FormData();
  fd.set("eventSlug", "concerto");
  fd.set("tierId", "tier-1");
  fd.set("buyerName", "Ana Silva");
  fd.set("buyerEmail", "ana@example.com");
  fd.set("seats", "2");
  for (const [k, v] of Object.entries(overrides)) fd.set(k, v);
  return fd;
}

beforeEach(() => {
  eventFindUnique.mockReset();
  ticketAggregate.mockReset();
  paymentAggregate.mockReset();
  paymentCreate.mockReset();
  paymentUpdate.mockReset();
  paymentDelete.mockReset();
  ticketCreate.mockReset();
  sendTicketEmail.mockClear();
  sessionsCreate.mockReset();

  eventFindUnique.mockResolvedValue({ ...baseEvent });
  ticketAggregate.mockResolvedValue({ _sum: { seats: 0 } });
  paymentAggregate.mockResolvedValue({ _sum: { seats: 0 } });
  paymentCreate.mockResolvedValue({ id: "pay-1" });
  paymentUpdate.mockResolvedValue({});
  paymentDelete.mockResolvedValue({});
});

describe("capacity check ignores stale pending payments (anti phantom sold-out)", () => {
  it("scopes the pending-payment aggregate to the checkout expiry window for both tier and event", async () => {
    sessionsCreate.mockResolvedValue({ id: "cs_1", url: "https://checkout.stripe.com/cs_1" });

    await expect(reserveAction(formData())).rejects.toBeInstanceOf(RedirectSignal);

    expect(paymentAggregate).toHaveBeenCalledTimes(2);
    for (const call of paymentAggregate.mock.calls) {
      const where = call[0].where;
      expect(where.status).toBe("pending");
      expect(where.createdAt).toBeDefined();
      expect(where.createdAt.gte).toBeInstanceOf(Date);
      // window should be ~30 minutes, not unbounded
      const ageMs = Date.now() - where.createdAt.gte.getTime();
      expect(ageMs).toBeGreaterThanOrEqual(30 * 60 * 1000 - 5000);
      expect(ageMs).toBeLessThanOrEqual(30 * 60 * 1000 + 5000);
    }
  });
});

describe("orphaned Payment cleanup when Stripe session creation fails", () => {
  it("deletes the just-created Payment and redirects back with an error, without ever updating providerRef", async () => {
    sessionsCreate.mockRejectedValue(new Error("stripe down"));

    let caught: unknown;
    try {
      await reserveAction(formData());
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(RedirectSignal);
    expect((caught as RedirectSignal).url).toContain("/bilheteira/concerto");
    expect(paymentCreate).toHaveBeenCalledTimes(1);
    expect(paymentDelete).toHaveBeenCalledWith({ where: { id: "pay-1" } });
    expect(paymentUpdate).not.toHaveBeenCalled();
  });

  it("still redirects back even if the cleanup delete itself fails", async () => {
    sessionsCreate.mockRejectedValue(new Error("stripe down"));
    paymentDelete.mockRejectedValue(new Error("db down"));

    await expect(reserveAction(formData())).rejects.toBeInstanceOf(RedirectSignal);
    expect(paymentDelete).toHaveBeenCalledTimes(1);
  });
});

describe("happy path", () => {
  it("creates the Payment, starts a Stripe session and redirects to it", async () => {
    sessionsCreate.mockResolvedValue({ id: "cs_2", url: "https://checkout.stripe.com/cs_2" });

    const err = await reserveAction(formData()).catch((e) => e);

    expect(err).toBeInstanceOf(RedirectSignal);
    expect((err as RedirectSignal).url).toBe("https://checkout.stripe.com/cs_2");
    expect(paymentUpdate).toHaveBeenCalledWith({
      where: { id: "pay-1" },
      data: { providerRef: "cs_2" },
    });
  });
});
