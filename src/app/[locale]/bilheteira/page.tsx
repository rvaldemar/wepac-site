import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getInstitutionalCopy } from "@/i18n/copy/institutional";
import { getBilheteiraCopy } from "@/i18n/copy/institutional-bilheteira";
import { prisma } from "@/lib/db";
import { loadTierUsage } from "@/lib/bilheteira/tier-state";
import { buildTierOffers, lowestOpenPrice } from "@/lib/bilheteira/offers";
import { Shell } from "./ui";
import { EventCards } from "./_components/event-cards";
import { BilheteiraTracking } from "./_components/tracking";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const copy = getInstitutionalCopy(locale).ticketing;
  const bcopy = getBilheteiraCopy(locale);
  return {
    title: `${copy.brand} — WEPAC`,
    description: bcopy.index.lead,
  };
}

type Props = { searchParams: Promise<{ marca?: string }> };

export default async function BilheteiraPublic({ searchParams }: Props) {
  const locale = await getLocale();
  const copy = getBilheteiraCopy(locale);
  const { marca } = await searchParams;
  const now = new Date();

  const events = await prisma.event.findMany({
    where: { status: "published", startsAt: { gte: now } },
    orderBy: { startsAt: "asc" },
    include: { department: true, brand: true, tiers: true },
  });

  const cards = await Promise.all(
    events.map(async (e) => ({
      event: e,
      fromPrice: lowestOpenPrice(buildTierOffers(e, e.tiers, await loadTierUsage(e.id, now), now)),
    })),
  );

  // Brand filter chips: only brands that currently have events.
  const brands = new Map<string, string>();
  for (const { event } of cards) {
    const key = event.brand?.slug || event.department.slug;
    brands.set(key, event.brand?.name || event.department.name);
  }
  const visible = marca
    ? cards.filter(({ event }) => (event.brand?.slug || event.department.slug) === marca)
    : cards;
  const highlight = !marca ? (visible.find((c) => c.event.featured) ?? null) : null;
  const rest = highlight ? visible.filter((c) => c !== highlight) : visible;

  return (
    <Shell
      rightSlot={
        <Link href="/bilheteira/login" className="text-[11px] font-bold uppercase tracking-[0.18em] text-black/50 hover:text-black">
          Admin
        </Link>
      }
    >
      <BilheteiraTracking />
      <main className="mx-auto max-w-[1200px] px-5 pb-20 pt-12 sm:px-8 sm:pt-16">
        <p className="text-[11px] uppercase tracking-[0.22em] text-black/55">{copy.index.eyebrow}</p>
        <h1 className="mt-3 max-w-[820px] font-barlow text-[40px] font-black leading-[1.03] tracking-[-0.02em] sm:text-[60px]">
          {copy.index.title}
        </h1>
        <p className="mt-4 max-w-[620px] text-[17px] leading-relaxed text-black/65">{copy.index.lead}</p>

        {brands.size > 1 && (
          <nav aria-label="Filtro" className="mt-8 flex flex-wrap gap-2">
            <FilterChip href="/bilheteira" active={!marca} label={copy.index.allBrands} />
            {[...brands.entries()].map(([slug, name]) => (
              <FilterChip key={slug} href={`/bilheteira?marca=${encodeURIComponent(slug)}`} active={marca === slug} label={name} />
            ))}
          </nav>
        )}

        {visible.length === 0 ? (
          <div className="mt-12 border border-black/12 bg-white p-8 text-[15px]">{copy.index.noEvents}</div>
        ) : (
          <>
            {highlight && (
              <section className="mt-12">
                <h2 className="mb-5 text-[11px] uppercase tracking-[0.2em] text-black/55">{copy.index.featured}</h2>
                <EventCards cards={[highlight]} locale={locale} copy={copy} large />
              </section>
            )}
            {rest.length > 0 && (
              <section className="mt-12">
                <h2 className="mb-5 text-[11px] uppercase tracking-[0.2em] text-black/55">{copy.index.upcoming}</h2>
                <EventCards cards={rest} locale={locale} copy={copy} />
              </section>
            )}
          </>
        )}
      </main>
    </Shell>
  );
}

function FilterChip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={[
        "inline-flex h-9 items-center border px-4 text-[11px] font-bold uppercase tracking-[0.16em] transition",
        active ? "border-black bg-black text-white" : "border-black/20 text-black/70 hover:border-black hover:text-black",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}
