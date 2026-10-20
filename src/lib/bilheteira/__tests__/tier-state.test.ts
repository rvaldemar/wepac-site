import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/db", () => ({ prisma: {} }));

import {
  computeTierState,
  discountPercent,
  purchaseLimits,
  quotePurchase,
  startingPriceCents,
  type TierStateInput,
  type TierUsage,
} from "@/lib/bilheteira/tier-state";

const now = new Date("2026-10-27T12:00:00Z");

function tier(overrides: Partial<TierStateInput> = {}): TierStateInput {
  return {
    id: "t",
    kind: "single",
    priceCents: 1000,
    quantity: null,
    seatsPerUnit: 1,
    minSeats: null,
    maxPerOrder: null,
    phaseGroup: null,
    phaseOrder: null,
    salesStartAt: null,
    salesEndAt: null,
    stateOverride: "auto",
    archivedAt: null,
    ...overrides,
  };
}

function usage(entries: Record<string, number> = {}): TierUsage {
  const byTier = new Map(Object.entries(entries));
  let total = 0;
  for (const v of byTier.values()) total += v;
  return { byTier, total };
}

function ctx(tiers: TierStateInput[], used: Record<string, number> = {}, capacity: number | null = null) {
  return { tiers, usage: usage(used), capacity, now };
}

describe("computeTierState", () => {
  it("is on sale by default", () => {
    const t = tier();
    expect(computeTierState(t, ctx([t])).state).toBe("on_sale");
  });

  it("hides archived tiers", () => {
    const t = tier({ archivedAt: now });
    expect(computeTierState(t, ctx([t])).state).toBe("archived");
  });

  it("honours manual overrides before anything else", () => {
    const soldOut = tier({ stateOverride: "sold_out" });
    const closed = tier({ stateOverride: "closed" });
    expect(computeTierState(soldOut, ctx([soldOut])).reason).toBe("override_sold_out");
    expect(computeTierState(closed, ctx([closed])).reason).toBe("override_closed");
  });

  it("closes after salesEndAt and locks before salesStartAt", () => {
    const ended = tier({ salesEndAt: new Date("2026-10-27T11:59:59Z") });
    const future = tier({ salesStartAt: new Date("2026-10-28T00:00:00Z") });
    expect(computeTierState(ended, ctx([ended])).state).toBe("closed");
    const s = computeTierState(future, ctx([future]));
    expect(s.state).toBe("locked");
    expect(s.reason).toBe("sales_not_started");
  });

  it("sells out when the tier quantity is reached, counting pending holds", () => {
    const t = tier({ quantity: 10 });
    expect(computeTierState(t, ctx([t], { t: 10 })).state).toBe("sold_out");
    expect(computeTierState(t, ctx([t], { t: 9 })).remainingSeats).toBe(1);
  });

  it("sells out when the event capacity is reached", () => {
    const t = tier();
    const s = computeTierState(t, ctx([t], { other: 80 }, 80));
    expect(s.state).toBe("sold_out");
    expect(s.reason).toBe("event_capacity_reached");
  });

  it("treats a bundle as sold out when fewer seats than one bundle remain", () => {
    const familia = tier({ kind: "bundle", seatsPerUnit: 4 });
    expect(computeTierState(familia, ctx([familia], { x: 77 }, 80)).state).toBe("sold_out");
    expect(computeTierState(familia, ctx([familia], { x: 76 }, 80)).state).toBe("on_sale");
  });

  describe("phases", () => {
    const early = tier({ id: "eb", kind: "phase", phaseGroup: "artista", phaseOrder: 1, quantity: 10, priceCents: 3500 });
    const second = tier({ id: "sw", kind: "phase", phaseGroup: "artista", phaseOrder: 2, quantity: 10, priceCents: 5000 });
    const last = tier({ id: "lc", kind: "phase", phaseGroup: "artista", phaseOrder: 3, priceCents: 7500 });
    const all = [early, second, last];

    it("only the first phase sells while it has seats", () => {
      const c = ctx(all, { eb: 3 });
      expect(computeTierState(early, c).state).toBe("on_sale");
      expect(computeTierState(second, c).state).toBe("locked");
      expect(computeTierState(second, c).reason).toBe("previous_phase_open");
      expect(computeTierState(last, c).state).toBe("locked");
    });

    it("opens the next phase when the previous one sells out", () => {
      const c = ctx(all, { eb: 10, sw: 2 });
      expect(computeTierState(early, c).state).toBe("sold_out");
      expect(computeTierState(second, c).state).toBe("on_sale");
      expect(computeTierState(last, c).state).toBe("locked");
    });

    it("a forced sold-out phase unlocks the next one", () => {
      const forced = { ...early, stateOverride: "sold_out" as const };
      const c = ctx([forced, second, last], { eb: 1 });
      expect(computeTierState(second, c).state).toBe("on_sale");
    });

    it("a phase closed by date does not unlock the next one", () => {
      const end = new Date("2026-10-27T00:00:00Z");
      const closedEarly = { ...early, salesEndAt: end };
      const c = ctx([closedEarly, second, last], { eb: 4 });
      expect(computeTierState(closedEarly, c).state).toBe("closed");
      expect(computeTierState(second, c).state).toBe("locked");
    });

    it("ignores archived earlier phases", () => {
      const archived = { ...early, archivedAt: now };
      const c = ctx([archived, second, last]);
      expect(computeTierState(second, c).state).toBe("on_sale");
    });
  });

  it("request tiers never sell but can run out of approved places", () => {
    const req = tier({ kind: "request", priceCents: 0, quantity: 20 });
    expect(computeTierState(req, ctx([req], {}, 80)).state).toBe("request");
    expect(computeTierState(req, ctx([req], { t: 20 }, 80)).state).toBe("sold_out");
    // Event capacity does not block the request form itself.
    expect(computeTierState(req, ctx([req], { x: 80 }, 80)).state).toBe("request");
  });
});

describe("purchase helpers", () => {
  it("bundles are bought by the unit and grant N seats each", () => {
    const aDois = tier({ kind: "bundle", seatsPerUnit: 2, priceCents: 1500 });
    expect(purchaseLimits(aDois)).toMatchObject({ unit: "bundle", minUnits: 1, seatsPerUnit: 2 });
    expect(quotePurchase(aDois, 2)).toEqual({ units: 2, seats: 4, unitAmountCents: 1500, totalCents: 3000 });
  });

  it("groups enforce a minimum and start at minimum × price", () => {
    const pack = tier({ kind: "group", minSeats: 10, priceCents: 1500 });
    expect(purchaseLimits(pack)).toMatchObject({ unit: "seat", minUnits: 10, maxUnits: 100 });
    expect(startingPriceCents(pack)).toBe(15000);
    expect(quotePurchase(pack, 12).totalCents).toBe(18000);
  });

  it("single tiers default to 1–10 seats", () => {
    expect(purchaseLimits(tier())).toMatchObject({ minUnits: 1, maxUnits: 10 });
    expect(purchaseLimits(tier({ maxPerOrder: 4 })).maxUnits).toBe(4);
  });

  it("discounts are relative to the reference price", () => {
    expect(discountPercent(3500, 7500)).toBe(53);
    expect(discountPercent(5000, 7500)).toBe(33);
    expect(discountPercent(7500, 7500)).toBeNull();
    expect(discountPercent(1000, null)).toBeNull();
  });
});

import { fromLisbonInput, toLisbonInput } from "@/lib/bilheteira/lisbon-time";

describe("Lisbon admin times", () => {
  it("reads winter wall time as UTC+0 and summer as UTC+1", () => {
    expect(fromLisbonInput("2026-11-08T23:59")?.toISOString()).toBe("2026-11-08T23:59:00.000Z");
    expect(fromLisbonInput("2026-10-20T12:00")?.toISOString()).toBe("2026-10-20T11:00:00.000Z");
  });
  it("round-trips", () => {
    expect(toLisbonInput(fromLisbonInput("2026-10-26T09:30"))).toBe("2026-10-26T09:30");
  });
});
