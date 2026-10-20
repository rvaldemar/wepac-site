import type { TicketTier } from "@prisma/client";
import { prisma } from "@/lib/db";

// Stripe Checkout sessions expire after 30 minutes (see reserve-action). A
// pending Payment older than that is abandoned or already resolved out of
// band, so it must stop holding seats.
export const PENDING_WINDOW_MS = 30 * 60 * 1000;

export type TierPublicState =
  | "on_sale"
  | "sold_out"
  | "locked"
  | "closed"
  | "request"
  | "archived";

export type TierStateReason =
  | "archived"
  | "override_sold_out"
  | "override_closed"
  | "sales_ended"
  | "sales_not_started"
  | "previous_phase_open"
  | "tier_quantity_reached"
  | "event_capacity_reached"
  | "request"
  | "on_sale";

export type TierStateInput = Pick<
  TicketTier,
  | "id"
  | "kind"
  | "priceCents"
  | "quantity"
  | "seatsPerUnit"
  | "minSeats"
  | "maxPerOrder"
  | "phaseGroup"
  | "phaseOrder"
  | "salesStartAt"
  | "salesEndAt"
  | "stateOverride"
  | "archivedAt"
>;

export type TierUsage = {
  // Seats held per tier: issued (non-cancelled) tickets plus pending payments
  // still inside the checkout window.
  byTier: Map<string, number>;
  total: number;
};

export type TierStateContext = {
  tiers: TierStateInput[];
  usage: TierUsage;
  capacity: number | null;
  now: Date;
};

export type TierState = {
  state: TierPublicState;
  reason: TierStateReason;
  // Seats still purchasable through this tier, bounded by the event capacity.
  // null means unlimited.
  remainingSeats: number | null;
};

export function seatsUsed(usage: TierUsage, tierId: string): number {
  return usage.byTier.get(tierId) ?? 0;
}

function tierRemaining(tier: TierStateInput, usage: TierUsage): number | null {
  if (tier.quantity == null) return null;
  return Math.max(0, tier.quantity - seatsUsed(usage, tier.id));
}

function eventRemaining(ctx: TierStateContext): number | null {
  if (ctx.capacity == null) return null;
  return Math.max(0, ctx.capacity - ctx.usage.total);
}

function minRemainder(a: number | null, b: number | null): number | null {
  if (a == null) return b;
  if (b == null) return a;
  return Math.min(a, b);
}

// Smallest number of seats a single purchase of this tier can take.
export function minimumSeatsPerPurchase(tier: TierStateInput): number {
  if (tier.kind === "bundle") return Math.max(1, tier.seatsPerUnit);
  if (tier.kind === "group") return Math.max(1, tier.minSeats ?? 1);
  return 1;
}

// A phase hands over to the next one when it sold out, or when the team
// closed it by hand (forced sold out or forced closed). Phases without a
// quantity are therefore opened and closed manually. A phase closed by date
// does not unlock the following one.
function phaseExhausted(tier: TierStateInput, ctx: TierStateContext): boolean {
  if (tier.stateOverride === "sold_out" || tier.stateOverride === "closed") return true;
  const remaining = tierRemaining(tier, ctx.usage);
  return remaining != null && remaining < minimumSeatsPerPurchase(tier);
}

export function computeTierState(
  tier: TierStateInput,
  ctx: TierStateContext,
): TierState {
  const remainingSeats = minRemainder(tierRemaining(tier, ctx.usage), eventRemaining(ctx));
  const result = (state: TierPublicState, reason: TierStateReason): TierState => ({
    state,
    reason,
    remainingSeats,
  });

  if (tier.archivedAt) return result("archived", "archived");
  if (tier.stateOverride === "sold_out") return result("sold_out", "override_sold_out");
  if (tier.stateOverride === "closed") return result("closed", "override_closed");
  if (tier.salesEndAt && ctx.now >= tier.salesEndAt) return result("closed", "sales_ended");

  if (tier.kind === "phase" && tier.phaseGroup && tier.phaseOrder != null) {
    const earlier = ctx.tiers.filter(
      (t) =>
        t.id !== tier.id &&
        !t.archivedAt &&
        t.kind === "phase" &&
        t.phaseGroup === tier.phaseGroup &&
        t.phaseOrder != null &&
        t.phaseOrder < (tier.phaseOrder as number),
    );
    if (earlier.some((t) => !phaseExhausted(t, ctx))) {
      return result("locked", "previous_phase_open");
    }
  }

  if (tier.salesStartAt && ctx.now < tier.salesStartAt) {
    return result("locked", "sales_not_started");
  }

  const ownRemaining = tierRemaining(tier, ctx.usage);
  if (ownRemaining != null && ownRemaining < minimumSeatsPerPurchase(tier)) {
    return result("sold_out", "tier_quantity_reached");
  }

  // Requests are not bounded by the event capacity at request time: a seat is
  // only taken when the team approves and issues the ticket.
  if (tier.kind === "request") return result("request", "request");

  const evRemaining = eventRemaining(ctx);
  if (evRemaining != null && evRemaining < minimumSeatsPerPurchase(tier)) {
    return result("sold_out", "event_capacity_reached");
  }

  return result("on_sale", "on_sale");
}

export function computeAllTierStates(ctx: TierStateContext): Map<string, TierState> {
  return new Map(ctx.tiers.map((t) => [t.id, computeTierState(t, ctx)]));
}

export const DEFAULT_MAX_UNITS = 10;
export const DEFAULT_MAX_GROUP_SEATS = 100;

export type PurchaseLimits = {
  // What the buyer picks: seats (single, group) or bundles (bundle).
  unit: "seat" | "bundle";
  minUnits: number;
  maxUnits: number;
  seatsPerUnit: number;
};

export function purchaseLimits(tier: TierStateInput): PurchaseLimits {
  if (tier.kind === "bundle") {
    return {
      unit: "bundle",
      minUnits: 1,
      maxUnits: tier.maxPerOrder ?? DEFAULT_MAX_UNITS,
      seatsPerUnit: Math.max(1, tier.seatsPerUnit),
    };
  }
  if (tier.kind === "group") {
    const min = Math.max(1, tier.minSeats ?? 1);
    return {
      unit: "seat",
      minUnits: min,
      maxUnits: Math.max(min, tier.maxPerOrder ?? DEFAULT_MAX_GROUP_SEATS),
      seatsPerUnit: 1,
    };
  }
  return {
    unit: "seat",
    minUnits: 1,
    maxUnits: tier.maxPerOrder ?? DEFAULT_MAX_UNITS,
    seatsPerUnit: 1,
  };
}

export type PurchaseQuote = {
  units: number;
  seats: number;
  unitAmountCents: number;
  totalCents: number;
};

// priceCents is the price of one purchasable unit: one seat for single,
// group and phase tiers, one bundle for bundle tiers.
export function quotePurchase(tier: TierStateInput, units: number): PurchaseQuote {
  const limits = purchaseLimits(tier);
  return {
    units,
    seats: units * limits.seatsPerUnit,
    unitAmountCents: tier.priceCents,
    totalCents: units * tier.priceCents,
  };
}

// Lowest total a buyer can pay for this tier ("a partir de" for groups).
export function startingPriceCents(tier: TierStateInput): number {
  const limits = purchaseLimits(tier);
  return tier.priceCents * limits.minUnits;
}

export function discountPercent(
  priceCents: number,
  referencePriceCents: number | null | undefined,
): number | null {
  if (!referencePriceCents || referencePriceCents <= priceCents) return null;
  return Math.round((1 - priceCents / referencePriceCents) * 100);
}

export async function loadTierUsage(eventId: string, now = new Date()): Promise<TierUsage> {
  const pendingWindowStart = new Date(now.getTime() - PENDING_WINDOW_MS);
  const [tickets, payments] = await Promise.all([
    prisma.ticket.groupBy({
      by: ["tierId"],
      where: { eventId, status: { not: "cancelled" } },
      _sum: { seats: true },
    }),
    prisma.payment.groupBy({
      by: ["tierId"],
      where: { eventId, status: "pending", createdAt: { gte: pendingWindowStart } },
      _sum: { seats: true },
    }),
  ]);
  const byTier = new Map<string, number>();
  let total = 0;
  for (const row of [...tickets, ...payments]) {
    const seats = row._sum.seats ?? 0;
    byTier.set(row.tierId, (byTier.get(row.tierId) ?? 0) + seats);
    total += seats;
  }
  return { byTier, total };
}
