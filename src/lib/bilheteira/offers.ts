import type { Event, TicketTier } from "@prisma/client";
import {
  computeTierState,
  discountPercent,
  purchaseLimits,
  startingPriceCents,
  type TierPublicState,
  type TierUsage,
} from "./tier-state";

// Serializable view of a tier for the public pages (server → client).
export type TierOffer = {
  id: string;
  name: string;
  description: string | null;
  kind: TicketTier["kind"];
  section: string | null;
  featured: boolean;
  state: Exclude<TierPublicState, "archived">;
  remainingSeats: number | null;
  showRemaining: boolean;
  priceCents: number;
  startingPriceCents: number;
  referencePriceCents: number | null;
  discountPct: number | null;
  hideUnitPrice: boolean;
  unit: "seat" | "bundle";
  seatsPerUnit: number;
  minUnits: number;
  maxUnits: number;
  lockedNote: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  waitlistEnabled: boolean;
};

// Scarcity is only shown when it is real and small enough to matter.
const REMAINING_THRESHOLD = 10;

export function buildTierOffers(
  event: Pick<Event, "slug" | "capacity">,
  tiers: TicketTier[],
  usage: TierUsage,
  now = new Date(),
): TierOffer[] {
  const ctx = { tiers, usage, capacity: event.capacity, now };
  const offers: TierOffer[] = [];
  for (const tier of [...tiers].sort((a, b) => a.sortOrder - b.sortOrder)) {
    const st = computeTierState(tier, ctx);
    if (st.state === "archived") continue;
    const limits = purchaseLimits(tier);
    const remaining = st.remainingSeats;
    offers.push({
      id: tier.id,
      name: tier.name,
      description: tier.description,
      kind: tier.kind,
      section: tier.section,
      featured: tier.featured,
      state: st.state,
      remainingSeats: remaining,
      showRemaining:
        st.state === "on_sale" &&
        tier.quantity != null &&
        remaining != null &&
        remaining > 0 &&
        remaining <= REMAINING_THRESHOLD,
      priceCents: tier.priceCents,
      startingPriceCents: startingPriceCents(tier),
      referencePriceCents: tier.referencePriceCents,
      discountPct: discountPercent(tier.priceCents, tier.referencePriceCents),
      hideUnitPrice: tier.hideUnitPrice,
      unit: limits.unit,
      seatsPerUnit: limits.seatsPerUnit,
      minUnits: limits.minUnits,
      maxUnits:
        remaining != null
          ? Math.max(limits.minUnits, Math.min(limits.maxUnits, Math.floor(remaining / limits.seatsPerUnit)))
          : limits.maxUnits,
      lockedNote: tier.lockedNote,
      ctaLabel: tier.ctaLabel,
      ctaHref:
        tier.kind === "request"
          ? tier.ctaUrl || `/bilheteira/${event.slug}/pedido/${tier.id}`
          : null,
      waitlistEnabled: tier.waitlistEnabled,
    });
  }
  return offers;
}

// Lowest price a visitor can actually buy now, for "a partir de" on cards.
export function lowestOpenPrice(offers: TierOffer[]): number | null {
  const open = offers.filter((o) => o.state === "on_sale");
  if (open.length === 0) return null;
  return Math.min(...open.map((o) => o.startingPriceCents));
}

export type ProgramItem = { time: string; title: string; description?: string };
export type FaqItem = { question: string; answer: string };

function asRecords(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter((v): v is Record<string, unknown> => Boolean(v) && typeof v === "object")
    : [];
}

export function parseProgram(value: unknown): ProgramItem[] {
  return asRecords(value)
    .map((r) => ({
      time: String(r.time ?? "").trim(),
      title: String(r.title ?? "").trim(),
      description: r.description ? String(r.description).trim() : undefined,
    }))
    .filter((r) => r.title);
}

export function parseFaq(value: unknown): FaqItem[] {
  return asRecords(value)
    .map((r) => ({ question: String(r.question ?? "").trim(), answer: String(r.answer ?? "").trim() }))
    .filter((r) => r.question && r.answer);
}

// Admin-friendly text formats for program and FAQ, so editors never touch
// JSON. Program: one line per item, "10h00 | Título | descrição opcional".
// FAQ: blocks separated by a blank line, first line is the question.
export function programFromText(text: string): ProgramItem[] {
  return text
    .split("\n")
    .map((line) => line.split("|").map((p) => p.trim()))
    .filter((parts) => parts.length >= 2 && parts[1])
    .map(([time, title, ...rest]) => ({
      time,
      title,
      description: rest.join(" | ") || undefined,
    }));
}

export function programToText(items: ProgramItem[]): string {
  return items
    .map((i) => [i.time, i.title, i.description].filter((p) => p !== undefined).join(" | "))
    .join("\n");
}

export function faqFromText(text: string): FaqItem[] {
  return text
    .split(/\n\s*\n/)
    .map((block) => block.trim().split("\n"))
    .filter((lines) => lines.length >= 2)
    .map(([question, ...answer]) => ({ question: question.trim(), answer: answer.join("\n").trim() }))
    .filter((f) => f.question && f.answer);
}

export function faqToText(items: FaqItem[]): string {
  return items.map((f) => `${f.question}\n${f.answer}`).join("\n\n");
}
