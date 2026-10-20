import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma so these tests exercise reserveAction's own capacity/cleanup
// logic, never a real DB or real Stripe.
const eventFindUnique = vi.fn();
const ticketGroupBy = vi.fn();
const paymentGroupBy = vi.fn();
const paymentCreate = vi.fn();
const paymentUpdate = vi.fn();
const paymentDelete = vi.fn();
const ticketCreate = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    event: { findUnique: (...a: unknown[]) => eventFindUnique(...a) },
    ticket: {
      groupBy: (...a: unknown[]) => ticketGroupBy(...a),
      create: (...a: unknown[]) => ticketCreate(...a),
    },
    payment: {
      groupBy: (...a: unknown[]) => paymentGroupBy(...a),
      create: (...a: unknown[]) => paymentCreate(...a),
      update: (...a: unknown[]) => paymentUpdate(...a),
      delete: (...a: unknown[]) => paymentDelete(...a),
    },
  },
}));

const sendTicketEmail = vi.fn(async (..._args: unknown[]) => undefined);
vi.mock("@/lib/bilheteira/ticket-email", () => ({
  sendTicketEmail: (...a: unknown[]) => sendTicketEmail(...a),
  ticketEmailData: (x: unknown) => x,
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
  kind: "single",
  seatsPerUnit: 1,
  stateOverride: "auto",
  archivedAt: null,
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
  ticketGroupBy.mockReset();
  paymentGroupBy.mockReset();
  paymentCreate.mockReset();
  paymentUpdate.mockReset();
  paymentDelete.mockReset();
  ticketCreate.mockReset();
  sendTicketEmail.mockClear();
  sessionsCreate.mockReset();

  eventFindUnique.mockResolvedValue({ ...baseEvent });
  ticketGroupBy.mockResolvedValue([]);
  paymentGroupBy.mockResolvedValue([]);
  paymentCreate.mockResolvedValue({ id: "pay-1" });
  paymentUpdate.mockResolvedValue({});
  paymentDelete.mockResolvedValue({});
});

describe("capacity check ignores stale pending payments (anti phantom sold-out)", () => {
  it("scopes pending payments to the checkout expiry window", async () => {
    sessionsCreate.mockResolvedValue({ id: "cs_1", url: "https://checkout.stripe.com/cs_1" });

    await expect(reserveAction(formData())).rejects.toBeInstanceOf(RedirectSignal);

    expect(paymentGroupBy).toHaveBeenCalledTimes(1);
    const where = paymentGroupBy.mock.calls[0][0].where;
    expect(where.status).toBe("pending");
    expect(where.createdAt.gte).toBeInstanceOf(Date);
    // window should be ~30 minutes, not unbounded
    const ageMs = Date.now() - where.createdAt.gte.getTime();
    expect(ageMs).toBeGreaterThanOrEqual(30 * 60 * 1000 - 5000);
    expect(ageMs).toBeLessThanOrEqual(30 * 60 * 1000 + 5000);
  });

  it("refuses when pending holds plus sold seats exhaust the tier", async () => {
    ticketGroupBy.mockResolvedValue([{ tierId: "tier-1", _sum: { seats: 95 } }]);
    paymentGroupBy.mockResolvedValue([{ tierId: "tier-1", _sum: { seats: 4 } }]);

    const err = await reserveAction(formData({ seats: "2" })).catch((e) => e);

    expect((err as RedirectSignal).url).toMatch(/^\/bilheteira\/concerto\?error=/);
    expect(paymentCreate).not.toHaveBeenCalled();
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

describe("eventSlug cannot shape the redirect before the DB lookup", () => {
  it("falls back to the event list, not the raw slug, when a pre-lookup validation fails", async () => {
    // Missing buyerEmail trips validation before prisma.event.findUnique is
    // ever called — a hostile eventSlug must not reach redirect() here.
    const err = await reserveAction(
      formData({
        eventSlug: "https://evil.example.com/phish",
        buyerEmail: "",
      })
    ).catch((e) => e);

    expect(eventFindUnique).not.toHaveBeenCalled();
    expect(err).toBeInstanceOf(RedirectSignal);
    expect((err as RedirectSignal).url).toMatch(/^\/bilheteira\?error=/);
  });

  it("uses the DB event.slug, not the raw input, for later redirects and the Stripe cancel_url", async () => {
    // The DB row's slug differs from the raw, attacker-shaped input the
    // lookup was keyed on (e.g. a traversal/encoded variant that still
    // resolves to a row) — the redirect must reflect the trusted value.
    eventFindUnique.mockResolvedValue({
      ...baseEvent,
      slug: "concerto",
    });
    sessionsCreate.mockResolvedValue({ id: "cs_3", url: "https://checkout.stripe.com/cs_3" });

    await expect(
      reserveAction(formData({ eventSlug: "concerto/../../admin" }))
    ).rejects.toBeInstanceOf(RedirectSignal);

    expect(sessionsCreate).toHaveBeenCalledTimes(1);
    const call = sessionsCreate.mock.calls[0][0];
    expect(call.cancel_url).toBe(
      "https://wepac.pt/bilheteira/concerto?cancelled=1"
    );
  });

  it("falls back to the event list when the event is not found", async () => {
    eventFindUnique.mockResolvedValue(null);

    const err = await reserveAction(formData()).catch((e) => e);

    expect(err).toBeInstanceOf(RedirectSignal);
    expect((err as RedirectSignal).url).toMatch(/^\/bilheteira\?error=/);
  });
});

describe("seats validation rejects instead of silently clamping", () => {
  it("rejects an out-of-range seat count instead of silently capping it", async () => {
    const err = await reserveAction(formData({ seats: "50" })).catch((e) => e);

    expect(err).toBeInstanceOf(RedirectSignal);
    expect((err as RedirectSignal).url).toMatch(/^\/bilheteira\/concerto\?error=/);
    expect(paymentCreate).not.toHaveBeenCalled();
  });

  it("rejects a non-numeric seat count instead of silently defaulting it", async () => {
    const err = await reserveAction(formData({ seats: "abc" })).catch((e) => e);

    expect(err).toBeInstanceOf(RedirectSignal);
    expect((err as RedirectSignal).url).toMatch(/^\/bilheteira\/concerto\?error=/);
    expect(paymentCreate).not.toHaveBeenCalled();
  });

  it("accepts a seat count within the 1-10 range advertised by the form", async () => {
    sessionsCreate.mockResolvedValue({ id: "cs_4", url: "https://checkout.stripe.com/cs_4" });

    await expect(
      reserveAction(formData({ seats: "10" }))
    ).rejects.toBeInstanceOf(RedirectSignal);

    expect(paymentCreate).toHaveBeenCalledTimes(1);
  });
});

describe("archived tiers refuse new reservations", () => {
  it("redirects back with an error and never creates a Payment", async () => {
    eventFindUnique.mockResolvedValue({
      ...baseEvent,
      tiers: [{ ...paidTier, archivedAt: new Date("2026-09-07T09:00:00Z") }],
    });

    const err = await reserveAction(formData()).catch((e) => e);

    expect(err).toBeInstanceOf(RedirectSignal);
    expect((err as RedirectSignal).url).toMatch(/^\/bilheteira\/concerto\?error=/);
    expect(paymentCreate).not.toHaveBeenCalled();
    expect(sessionsCreate).not.toHaveBeenCalled();
  });

  it("an explicitly active tier (archivedAt null) still reserves", async () => {
    eventFindUnique.mockResolvedValue({
      ...baseEvent,
      tiers: [{ ...paidTier, archivedAt: null }],
    });
    sessionsCreate.mockResolvedValue({ id: "cs_arch", url: "https://checkout.stripe.com/cs_arch" });

    await expect(reserveAction(formData())).rejects.toBeInstanceOf(RedirectSignal);

    expect(paymentCreate).toHaveBeenCalledTimes(1);
  });
});

describe("tier kinds", () => {
  it("charges a bundle per unit and grants its seats", async () => {
    eventFindUnique.mockResolvedValue({
      ...baseEvent,
      tiers: [{ ...paidTier, kind: "bundle", seatsPerUnit: 2, priceCents: 1500 }],
    });
    sessionsCreate.mockResolvedValue({ id: "cs_b", url: "https://checkout.stripe.com/cs_b" });

    await expect(reserveAction(formData({ seats: "", units: "1" }))).rejects.toBeInstanceOf(
      RedirectSignal,
    );

    expect(paymentCreate.mock.calls[0][0].data).toMatchObject({ seats: 2, amountCents: 1500 });
    const lineItem = sessionsCreate.mock.calls[0][0].line_items[0];
    expect(lineItem.quantity).toBe(1);
    expect(lineItem.price_data.unit_amount).toBe(1500);
  });

  it("refuses a group below its minimum", async () => {
    eventFindUnique.mockResolvedValue({
      ...baseEvent,
      tiers: [{ ...paidTier, kind: "group", minSeats: 10, priceCents: 1500 }],
    });

    const err = await reserveAction(formData({ units: "9" })).catch((e) => e);

    expect((err as RedirectSignal).url).toMatch(/error=/);
    expect(paymentCreate).not.toHaveBeenCalled();
  });

  it("accepts a group above ten seats", async () => {
    eventFindUnique.mockResolvedValue({
      ...baseEvent,
      tiers: [{ ...paidTier, kind: "group", minSeats: 10, priceCents: 1500 }],
    });
    sessionsCreate.mockResolvedValue({ id: "cs_g", url: "https://checkout.stripe.com/cs_g" });

    await expect(reserveAction(formData({ units: "14" }))).rejects.toBeInstanceOf(RedirectSignal);

    expect(paymentCreate.mock.calls[0][0].data).toMatchObject({ seats: 14, amountCents: 21000 });
  });

  it("refuses a locked phase even with a crafted POST", async () => {
    const early = { ...paidTier, id: "eb", kind: "phase", phaseGroup: "artista", phaseOrder: 1, quantity: 10 };
    const second = { ...paidTier, id: "sw", kind: "phase", phaseGroup: "artista", phaseOrder: 2, quantity: 10 };
    eventFindUnique.mockResolvedValue({ ...baseEvent, tiers: [early, second] });

    const err = await reserveAction(formData({ tierId: "sw", seats: "1" })).catch((e) => e);

    expect((err as RedirectSignal).url).toMatch(/error=/);
    expect(paymentCreate).not.toHaveBeenCalled();
  });

  it("never sells a request tier", async () => {
    eventFindUnique.mockResolvedValue({
      ...baseEvent,
      tiers: [{ ...paidTier, kind: "request", priceCents: 0 }],
    });

    const err = await reserveAction(formData({ seats: "1" })).catch((e) => e);

    expect((err as RedirectSignal).url).toMatch(/error=/);
    expect(ticketCreate).not.toHaveBeenCalled();
    expect(paymentCreate).not.toHaveBeenCalled();
  });

  it("refuses after the sales window closed", async () => {
    eventFindUnique.mockResolvedValue({
      ...baseEvent,
      tiers: [{ ...paidTier, salesEndAt: new Date(Date.now() - 1000) }],
    });

    const err = await reserveAction(formData()).catch((e) => e);

    expect((err as RedirectSignal).url).toMatch(/error=/);
    expect(paymentCreate).not.toHaveBeenCalled();
  });

  it("enables promotion codes and forwards UTM attribution to Stripe", async () => {
    sessionsCreate.mockResolvedValue({ id: "cs_u", url: "https://checkout.stripe.com/cs_u" });

    await expect(
      reserveAction(formData({ utm_source: "instagram", utm_campaign: "festival" })),
    ).rejects.toBeInstanceOf(RedirectSignal);

    const call = sessionsCreate.mock.calls[0][0];
    expect(call.allow_promotion_codes).toBe(true);
    expect(call.metadata).toMatchObject({ utm_source: "instagram", utm_campaign: "festival" });
  });
});
