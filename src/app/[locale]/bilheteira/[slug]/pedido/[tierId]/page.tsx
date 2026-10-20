import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { getBilheteiraCopy } from "@/i18n/copy/institutional-bilheteira";
import { prisma } from "@/lib/db";
import { computeTierState, loadTierUsage } from "@/lib/bilheteira/tier-state";
import { submitTierRequestAction } from "@/lib/bilheteira/request-actions";
import { Shell, formatEventDate, formatEventTime } from "../../../ui";
import { Markdown } from "../../../_components/markdown";
import { BilheteiraTracking } from "../../../_components/tracking";
import { parseEventTheme, themeVars } from "@/lib/bilheteira/event-theme";
import { localizeEvent, localizeTier } from "@/lib/bilheteira/localize";
import { barlowCondensed, CONDENSED } from "../../../_components/fonts";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string; tierId: string }>;
  searchParams: Promise<{ error?: string; sent?: string }>;
};

async function load(slug: string, tierId: string, locale: string) {
  const raw = await prisma.event.findUnique({
    where: { slug },
    include: { tiers: true, brand: true, department: true },
  });
  if (!raw || raw.status !== "published") return null;
  const event = localizeEvent(raw, locale);
  const rawTier = raw.tiers.find((t) => t.id === tierId && t.kind === "request" && !t.archivedAt);
  if (!rawTier) return null;
  return { event, tier: localizeTier(rawTier, locale) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, tierId } = await params;
  const found = await load(slug, tierId, await getLocale());
  if (!found) return { title: "WEPAC" };
  const image = found.event.ogImage || found.event.coverImage;
  return {
    title: `${found.tier.name} · ${found.event.title} — WEPAC`,
    description: found.event.seoDescription || found.event.subtitle || undefined,
    ...(image ? { openGraph: { images: [{ url: image }] } } : {}),
  };
}

export default async function TierRequestPage({ params, searchParams }: Props) {
  const locale = await getLocale();
  const copy = getBilheteiraCopy(locale);
  const { slug, tierId } = await params;
  const { error, sent } = await searchParams;
  const found = await load(slug, tierId, locale);
  if (!found) notFound();
  const { event, tier } = found;

  const state = computeTierState(tier, {
    tiers: event.tiers,
    usage: await loadTierUsage(event.id),
    capacity: event.capacity,
    now: new Date(),
  });
  const open = state.state === "request";
  const theme = parseEventTheme(event.theme);
  const condensed = theme.titleStyle === "condensed";

  return (
    <Shell
      withFooter
      rightSlot={
        <Link
          href={`/bilheteira/${event.slug}`}
          className="text-[11px] font-bold uppercase tracking-[0.18em] text-black/70 hover:text-black"
        >
          {copy.request.backToEvent}
        </Link>
      }
    >
      <BilheteiraTracking />
      <div style={themeVars(theme)} className={`${barlowCondensed.variable} bg-[var(--ev-bg)] text-[var(--ev-ink)]`}>
      <section className="relative isolate overflow-hidden bg-[#0A0A0A] text-white">
        {theme.heroImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={theme.heroImage} alt="" className="absolute right-0 top-0 -z-10 h-full w-1/2 object-cover object-top opacity-50 [mask-image:linear-gradient(90deg,transparent,black_40%)]" />
        )}
        <div className="mx-auto max-w-[1100px] px-5 pb-12 pt-10 sm:px-8 sm:pt-14">
          <Link
            href={`/bilheteira/${event.slug}`}
            className="mb-8 inline-block text-[11px] font-bold uppercase tracking-[0.18em] text-white/70 hover:text-white"
          >
            ← {copy.request.backToEvent}
          </Link>
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/65">
            {event.title} · {formatEventDate(event.startsAt, locale)} · {formatEventTime(event.startsAt, locale)}
          </p>
          <h1
            className={
              condensed
                ? `mt-3 max-w-[860px] ${CONDENSED} text-[44px] font-bold uppercase leading-[0.95] sm:text-[72px]`
                : "mt-3 max-w-[860px] font-barlow text-[36px] font-black leading-[1.04] tracking-[-0.02em] sm:text-[56px]"
            }
          >
            {tier.name}
          </h1>
          <p className="mt-4 text-[13px] uppercase tracking-[0.2em] text-white/70">
            <span style={theme.accent ? { color: theme.accent } : undefined}>{copy.tier.free}</span> ·{" "}
            {copy.tier.subjectToValidation}
          </p>
        </div>
      </section>

      <main className="mx-auto grid max-w-[1100px] gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div>
          {tier.description && <Markdown className="text-[17px] text-[var(--ev-muted)]">{tier.description}</Markdown>}
          <p className="mt-8 text-[14px] text-[var(--ev-faint)]">
            {event.venue}
            {event.address ? ` · ${event.address}` : ""}
          </p>
        </div>

        <div className="self-start border border-[var(--ev-ink)] bg-[var(--ev-card)] p-6">
          {sent ? (
            <div role="status">
              <h2 className="font-barlow text-[24px] font-black">{copy.request.sentTitle}</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-[var(--ev-muted)]">{copy.request.sentBody}</p>
              <Link
                href={`/bilheteira/${event.slug}`}
                className="mt-6 inline-flex h-11 items-center border border-[var(--ev-ink)] px-5 text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-[var(--ev-ink)] hover:text-[var(--ev-bg)]"
              >
                {copy.request.backToEvent}
              </Link>
            </div>
          ) : !open ? (
            <p className="text-[15px]">{copy.request.closed}</p>
          ) : (
            <form action={submitTierRequestAction} className="space-y-4">
              <h2 className="font-barlow text-[24px] font-black">{copy.request.formTitle}</h2>
              {error && (
                <p role="alert" className="border border-[#c00] bg-[#fee] px-3 py-2 text-[14px] text-[#900]">
                  {error}
                </p>
              )}
              <input type="hidden" name="eventSlug" value={event.slug} />
              <input type="hidden" name="tierId" value={tier.id} />
              <input type="text" name="website_confirm" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
              <Field label={copy.request.name} name="name" autoComplete="name" required />
              <Field label={copy.request.email} name="email" type="email" autoComplete="email" required />
              <Field label={copy.request.organization} name="organization" autoComplete="organization" required />
              <Field label={copy.request.role} name="role" autoComplete="organization-title" required />
              <Field label={copy.request.website} name="website" autoComplete="url" />
              <Field label={copy.request.phone} name="phone" type="tel" autoComplete="tel" />
              <label className="block">
                <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--ev-faint)]">{copy.request.message}</span>
                <textarea
                  name="message"
                  rows={4}
                  maxLength={2000}
                  className="mt-1.5 w-full border border-[var(--ev-line)] px-3 py-2 text-[15px] outline-none focus:border-[var(--ev-ink)]"
                />
              </label>
              <label className="flex gap-3 text-[13px] leading-snug text-[var(--ev-muted)]">
                <input type="checkbox" name="marketingConsent" className="mt-0.5 h-4 w-4 accent-[var(--ev-accent)]" />
                <span>{copy.request.marketing}</span>
              </label>
              <button
                type="submit"
                className="h-[52px] w-full bg-[var(--ev-cta)] text-[12px] font-bold uppercase tracking-[0.2em] text-[var(--ev-cta-ink)] hover:opacity-90"
              >
                {tier.ctaLabel || copy.request.submit}
              </button>
              <p className="text-[12px] leading-relaxed text-[var(--ev-faint)]">
                {copy.request.privacyLead}{" "}
                <Link href="/privacidade" className="underline">
                  {copy.checkout.privacyLink}
                </Link>
                .
              </p>
            </form>
          )}
        </div>
      </main>
      </div>
    </Shell>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--ev-faint)]">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        className="mt-1.5 h-12 w-full border border-[var(--ev-line)] bg-[var(--ev-card)] px-3 text-[15px] outline-none focus:border-[var(--ev-ink)]"
      />
    </label>
  );
}
