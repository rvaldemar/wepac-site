import type { Event, TicketTier } from "@prisma/client";

// Public copy is written in Portuguese; other locales override field by
// field from the `translations` JSON ({"en-US": {...}}). Anything missing
// falls back to the Portuguese original, so a partial translation never
// leaves a blank on the page.
export const TRANSLATABLE_LOCALES = ["en-US"] as const;

export type EventTranslation = {
  title?: string;
  subtitle?: string;
  description?: string;
  seoDescription?: string;
  directions?: string;
  program?: unknown;
  faq?: unknown;
  heroTitle?: string;
  eyebrow?: string;
  tagline?: string;
  schedule?: unknown;
};

export type TierTranslation = {
  name?: string;
  description?: string;
  lockedNote?: string;
  ctaLabel?: string;
};

function pick<T extends object>(translations: unknown, locale: string): Partial<T> {
  if (!translations || typeof translations !== "object" || Array.isArray(translations)) return {};
  const entry = (translations as Record<string, unknown>)[locale];
  return entry && typeof entry === "object" && !Array.isArray(entry) ? (entry as Partial<T>) : {};
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function list(value: unknown): unknown[] | undefined {
  return Array.isArray(value) && value.length > 0 ? value : undefined;
}

export function eventTranslation(event: { translations: unknown }, locale: string): Partial<EventTranslation> {
  return pick<EventTranslation>(event.translations, locale);
}

export function tierTranslation(tier: { translations: unknown }, locale: string): Partial<TierTranslation> {
  return pick<TierTranslation>(tier.translations, locale);
}

export function localizeEvent<E extends Pick<Event, "title" | "subtitle" | "description" | "seoDescription" | "directions" | "program" | "faq" | "theme" | "translations">>(
  event: E,
  locale: string,
): E {
  const t = eventTranslation(event, locale);
  if (Object.keys(t).length === 0) return event;
  const theme =
    event.theme && typeof event.theme === "object" && !Array.isArray(event.theme)
      ? { ...(event.theme as Record<string, unknown>) }
      : {};
  if (text(t.heroTitle)) theme.heroTitle = t.heroTitle;
  if (text(t.eyebrow)) theme.eyebrow = t.eyebrow;
  if (text(t.tagline)) theme.tagline = t.tagline;
  if (list(t.schedule)) theme.schedule = t.schedule;
  return {
    ...event,
    title: text(t.title) ?? event.title,
    subtitle: text(t.subtitle) ?? event.subtitle,
    description: text(t.description) ?? event.description,
    seoDescription: text(t.seoDescription) ?? event.seoDescription,
    directions: text(t.directions) ?? event.directions,
    program: (list(t.program) ?? event.program) as E["program"],
    faq: (list(t.faq) ?? event.faq) as E["faq"],
    theme: theme as E["theme"],
  };
}

export function localizeTier<T extends Pick<TicketTier, "name" | "description" | "lockedNote" | "ctaLabel" | "translations">>(
  tier: T,
  locale: string,
): T {
  const t = tierTranslation(tier, locale);
  if (Object.keys(t).length === 0) return tier;
  return {
    ...tier,
    name: text(t.name) ?? tier.name,
    description: text(t.description) ?? tier.description,
    lockedNote: text(t.lockedNote) ?? tier.lockedNote,
    ctaLabel: text(t.ctaLabel) ?? tier.ctaLabel,
  };
}
