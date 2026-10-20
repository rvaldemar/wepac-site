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

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string; tierId: string }>;
  searchParams: Promise<{ error?: string; sent?: string }>;
};

async function load(slug: string, tierId: string) {
  const event = await prisma.event.findUnique({
    where: { slug },
    include: { tiers: true, brand: true, department: true },
  });
  if (!event || event.status !== "published") return null;
  const tier = event.tiers.find((t) => t.id === tierId && t.kind === "request" && !t.archivedAt);
  if (!tier) return null;
  return { event, tier };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, tierId } = await params;
  const found = await load(slug, tierId);
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
  const found = await load(slug, tierId);
  if (!found) notFound();
  const { event, tier } = found;

  const state = computeTierState(tier, {
    tiers: event.tiers,
    usage: await loadTierUsage(event.id),
    capacity: event.capacity,
    now: new Date(),
  });
  const open = state.state === "request";

  return (
    <Shell
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
      <section className="bg-black text-white">
        <div className="mx-auto max-w-[1100px] px-5 pb-12 pt-16 sm:px-8 sm:pt-24">
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/65">
            {event.title} · {formatEventDate(event.startsAt, locale)} · {formatEventTime(event.startsAt, locale)}
          </p>
          <h1 className="mt-3 max-w-[860px] font-barlow text-[36px] font-black leading-[1.04] tracking-[-0.02em] sm:text-[56px]">
            {tier.name}
          </h1>
          <p className="mt-4 text-[13px] uppercase tracking-[0.2em] text-white/70">
            {copy.tier.free} · {copy.tier.subjectToValidation}
          </p>
        </div>
      </section>

      <main className="mx-auto grid max-w-[1100px] gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div>
          {tier.description && <Markdown className="text-[17px] text-black/80">{tier.description}</Markdown>}
          <p className="mt-8 text-[14px] text-black/60">
            {event.venue}
            {event.address ? ` · ${event.address}` : ""}
          </p>
        </div>

        <div className="self-start border border-black bg-white p-6">
          {sent ? (
            <div role="status">
              <h2 className="font-barlow text-[24px] font-black">{copy.request.sentTitle}</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-black/75">{copy.request.sentBody}</p>
              <Link
                href={`/bilheteira/${event.slug}`}
                className="mt-6 inline-flex h-11 items-center border border-black px-5 text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-black hover:text-white"
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
                <span className="text-[11px] uppercase tracking-[0.18em] text-black/55">{copy.request.message}</span>
                <textarea
                  name="message"
                  rows={4}
                  maxLength={2000}
                  className="mt-1.5 w-full border border-black/25 px-3 py-2 text-[15px] outline-none focus:border-black"
                />
              </label>
              <label className="flex gap-3 text-[13px] leading-snug text-black/70">
                <input type="checkbox" name="marketingConsent" className="mt-0.5 h-4 w-4 accent-black" />
                <span>{copy.request.marketing}</span>
              </label>
              <button
                type="submit"
                className="h-[52px] w-full bg-black text-[12px] font-bold uppercase tracking-[0.2em] text-white hover:bg-black/85"
              >
                {tier.ctaLabel || copy.request.submit}
              </button>
              <p className="text-[12px] leading-relaxed text-black/55">
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
      <span className="text-[11px] uppercase tracking-[0.18em] text-black/55">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        className="mt-1.5 h-12 w-full border border-black/25 bg-white px-3 text-[15px] outline-none focus:border-black"
      />
    </label>
  );
}
