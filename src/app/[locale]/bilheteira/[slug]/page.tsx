import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { getInstitutionalCopy } from "@/i18n/copy/institutional";
import { getBilheteiraCopy } from "@/i18n/copy/institutional-bilheteira";
import { prisma } from "@/lib/db";
import { loadTierUsage } from "@/lib/bilheteira/tier-state";
import { buildTierOffers, lowestOpenPrice, parseFaq, parseProgram } from "@/lib/bilheteira/offers";
import { Shell, formatEventDate, formatEventTime } from "../ui";
import { EventTickets } from "../_components/event-tickets";
import { Markdown } from "../_components/markdown";
import { StickyCta } from "../_components/sticky-cta";
import { BilheteiraTracking } from "../_components/tracking";
import { formatEuro, formatOfferPrice } from "../_components/offer-format";
import { EventCards } from "../_components/event-cards";
import { EventHero } from "../_components/event-hero";
import { barlowCondensed, CONDENSED } from "../_components/fonts";
import { parseEventTheme, themeVars } from "@/lib/bilheteira/event-theme";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string; cancelled?: string; tier?: string; waitlist?: string }>;
};

// "Travessa da Arrochela 2, 1200-032 Lisboa" → "Lisboa", for the short
// campaign place line.
function cityFrom(address: string | null): string | null {
  if (!address) return null;
  const match = /\d{4}-\d{3}\s+(.+)$/.exec(address);
  return match ? match[1].trim() : null;
}

function plainSummary(markdown: string, max = 160): string {
  const text = markdown
    .replace(/[*_#>`]/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const copy = getInstitutionalCopy(await getLocale()).ticketing;
  const { slug } = await params;
  const event = await prisma.event.findUnique({ where: { slug } });
  if (!event || event.status !== "published") return { title: copy.eventFallbackTitle };
  const description = event.seoDescription || event.subtitle || plainSummary(event.description);
  const image = event.ogImage || event.coverImage;
  return {
    title: `${event.title} — WEPAC`,
    description,
    openGraph: {
      title: event.title,
      description,
      type: "website",
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: { card: image ? "summary_large_image" : "summary", title: event.title, description },
  };
}

export default async function EventPublicPage({ params, searchParams }: Props) {
  const locale = await getLocale();
  const copy = getBilheteiraCopy(locale);
  const { slug } = await params;
  const { error, cancelled, tier: tierParam, waitlist } = await searchParams;
  const now = new Date();

  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      department: true,
      brand: true,
      tiers: true,
      guests: {
        where: { OR: [{ revealAt: null }, { revealAt: { lte: now } }] },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
  if (!event || event.status !== "published") notFound();

  const [usage, hiddenGuests, others] = await Promise.all([
    loadTierUsage(event.id, now),
    prisma.eventGuest.count({ where: { eventId: event.id, revealAt: { gt: now } } }),
    prisma.event.findMany({
      where: { status: "published", startsAt: { gte: now }, id: { not: event.id } },
      orderBy: [{ featured: "desc" }, { startsAt: "asc" }],
      take: 3,
      include: { brand: true, department: true, tiers: true },
    }),
  ]);

  const offers = buildTierOffers(event, event.tiers, usage, now);
  const featured =
    offers.find((o) => o.featured && o.state === "on_sale") ?? offers.find((o) => o.state === "on_sale");
  const program = parseProgram(event.program);
  const faq = parseFaq(event.faq);
  const brandName = event.brand?.name || event.department.name;
  const fromPrice = lowestOpenPrice(offers);
  const base = process.env.APP_URL || "https://wepac.pt";

  const otherCards = await Promise.all(
    others.map(async (e) => ({
      event: e,
      fromPrice: lowestOpenPrice(buildTierOffers(e, e.tiers, await loadTierUsage(e.id, now), now)),
    })),
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.seoDescription || plainSummary(event.description, 300),
    startDate: event.startsAt.toISOString(),
    ...(event.durationMinutes
      ? { endDate: new Date(event.startsAt.getTime() + event.durationMinutes * 60000).toISOString() }
      : {}),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: event.venue,
      address: event.address || event.venue,
    },
    ...(event.coverImage ? { image: [new URL(event.coverImage, base).toString()] } : {}),
    organizer: { "@type": "Organization", name: "WEPAC – Companhia de Artes", url: base },
    offers: offers
      .filter((o) => o.kind !== "request")
      .map((o) => ({
        "@type": "Offer",
        name: o.name,
        price: (o.startingPriceCents / 100).toFixed(2),
        priceCurrency: "EUR",
        availability:
          o.state === "on_sale"
            ? "https://schema.org/InStock"
            : o.state === "locked"
              ? "https://schema.org/PreOrder"
              : "https://schema.org/SoldOut",
        url: `${base}/bilheteira/${event.slug}?tier=${o.id}`,
      })),
  };

  const facts = [
    {
      label: copy.event.when,
      value: `${formatEventDate(event.startsAt, locale)} · ${formatEventTime(event.startsAt, locale)}`,
    },
    { label: copy.event.where, value: event.address ? `${event.venue} · ${event.address}` : event.venue },
    ...(event.doorsAt ? [{ label: copy.event.doors, value: formatEventTime(event.doorsAt, locale) }] : []),
  ];
  const theme = parseEventTheme(event.theme);
  const h2 =
    theme.titleStyle === "condensed"
      ? `${CONDENSED} text-[40px] font-bold uppercase leading-none sm:text-[52px]`
      : "font-barlow text-[32px] font-black tracking-[-0.01em] sm:text-[40px]";

  return (
    <Shell
      rightSlot={
        <Link
          href="/bilheteira"
          className="hidden text-[11px] font-bold uppercase tracking-[0.18em] text-black/70 hover:text-black sm:inline"
        >
          {copy.event.allEvents}
        </Link>
      }
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <BilheteiraTracking
        viewContent={{
          content_name: event.title,
          content_category: brandName,
          currency: "EUR",
          value: (fromPrice ?? 0) / 100,
        }}
      />

      <div
        style={themeVars(theme)}
        className={`${barlowCondensed.variable} bg-[var(--ev-bg)] text-[var(--ev-ink)]`}
      >
      <EventHero
        theme={theme}
        title={event.title}
        subtitle={event.subtitle}
        brandName={brandName}
        coverImage={event.coverImage}
        facts={facts}
        dateLine={formatEventDate(event.startsAt, locale)}
        placeLine={`${event.venue}${cityFrom(event.address) ? ` · ${cityFrom(event.address)}` : ""}`}
        primary={
          featured
            ? {
                href: `?tier=${featured.id}#bilhetes`,
                label: featured.name,
                price: formatOfferPrice(featured, copy.tier, locale).main,
              }
            : null
        }
        seeTicketsLabel={copy.event.seeTickets}
      />

      <main className="mx-auto max-w-[1200px] px-5 sm:px-8">
        {/* DESCRIPTION */}
        <section className="py-14 sm:py-20">
          <Markdown className="max-w-[720px] text-[17px] text-[var(--ev-muted)]">{event.description}</Markdown>
        </section>

        {/* PROGRAMME */}
        {program.length > 0 && (
          <section className="border-t border-[var(--ev-line)] py-14 sm:py-20">
            <h2 className={h2}>{copy.event.programme}</h2>
            <ol className="mt-8 divide-y divide-[var(--ev-line)] border-y border-[var(--ev-line)]">
              {program.map((item, i) => (
                <li key={i} className="grid gap-1 py-4 sm:grid-cols-[140px_1fr] sm:gap-6">
                  <span className="font-barlow text-[17px] font-bold tabular-nums text-[var(--ev-faint)]">{item.time}</span>
                  <div>
                    <div className="text-[16px] font-semibold leading-snug">{item.title}</div>
                    {item.description && (
                      <p className="mt-1 text-[14px] leading-relaxed text-[var(--ev-muted)]">{item.description}</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* GUESTS — each name appears only from its reveal time */}
        {(event.guests.length > 0 || hiddenGuests > 0) && (
          <section className="border-t border-[var(--ev-line)] py-14 sm:py-20">
            <h2 className={h2}>{copy.event.guests}</h2>
            {event.guests.length > 0 && (
              <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {event.guests.map((g) => (
                  <li key={g.id}>
                    <div className="aspect-[4/5] overflow-hidden bg-[var(--ev-line)]">
                      {g.photo && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={g.photo} alt={g.name} className="h-full w-full object-cover" loading="lazy" />
                      )}
                    </div>
                    <div className="mt-3 font-barlow text-[19px] font-bold leading-tight">{g.name}</div>
                    {g.role && <div className="mt-1 text-[13px] text-[var(--ev-faint)]">{g.role}</div>}
                    {g.bio && <p className="mt-2 text-[13px] leading-relaxed text-[var(--ev-muted)]">{g.bio}</p>}
                  </li>
                ))}
              </ul>
            )}
            {hiddenGuests > 0 && <p className="mt-6 text-[14px] text-[var(--ev-faint)]">{copy.event.guestsSoon}</p>}
          </section>
        )}

        {/* TICKETS */}
        <section id="bilhetes" className="scroll-mt-4 border-t border-[var(--ev-line)] py-14 sm:py-20">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <h2 className={h2}>{copy.event.tickets}</h2>
            {fromPrice != null && (
              <span className="text-[14px] text-[var(--ev-faint)]">{copy.tier.fromPrice(formatEuro(fromPrice, locale))}</span>
            )}
          </div>
          {cancelled && (
            <p className="mb-6 border border-[var(--ev-line)] bg-[var(--ev-line)] px-4 py-3 text-[14px]">{copy.event.cancelled}</p>
          )}
          {error && (
            <p role="alert" className="mb-6 border border-[#c00] bg-[#fee] px-4 py-3 text-[14px] text-[#900]">
              {error}
            </p>
          )}
          <EventTickets
            eventSlug={event.slug}
            eventTitle={event.title}
            offers={offers}
            locale={locale}
            preselectedId={tierParam}
            waitlistJoinedId={waitlist}
          />
        </section>

        {/* FAQ */}
        {faq.length > 0 && (
          <section className="border-t border-[var(--ev-line)] py-14 sm:py-20">
            <h2 className={h2}>{copy.event.faq}</h2>
            <div className="mt-8 max-w-[820px] divide-y divide-[var(--ev-line)] border-y border-[var(--ev-line)]">
              {faq.map((f, i) => (
                <details key={i} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-[16px] font-semibold">
                    {f.question}
                    <span className="text-[var(--ev-faint)] transition-transform group-open:rotate-45" aria-hidden>
                      +
                    </span>
                  </summary>
                  <div className="mt-3 text-[15px] text-[var(--ev-muted)]">
                    <Markdown>{f.answer}</Markdown>
                  </div>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* GETTING THERE */}
        {(event.directions || event.mapUrl || event.address) && (
          <section className="border-t border-[var(--ev-line)] py-14 sm:py-20">
            <h2 className={h2}>
              {copy.event.gettingThere}
            </h2>
            <div className="mt-6 max-w-[720px] text-[16px] text-[var(--ev-muted)]">
              <p className="font-semibold">{event.venue}</p>
              {event.address && <p className="text-[var(--ev-muted)]">{event.address}</p>}
              {event.directions && <Markdown className="mt-4">{event.directions}</Markdown>}
              {event.mapUrl && (
                <a
                  href={event.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex h-11 items-center border border-[var(--ev-ink)] px-5 text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-[var(--ev-ink)] hover:text-[var(--ev-bg)]"
                >
                  {copy.event.openMap}
                </a>
              )}
            </div>
          </section>
        )}

        {/* CROSS-PROMOTION */}
        {otherCards.length > 0 && (
          <section className="border-t border-[var(--ev-line)] pb-28 pt-14 sm:pt-20 lg:pb-20">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <h2 className={h2}>{copy.event.alsoOn}</h2>
              <Link href="/bilheteira" className="text-[11px] font-bold uppercase tracking-[0.2em] underline underline-offset-4">
                {copy.event.allEvents}
              </Link>
            </div>
            <EventCards cards={otherCards} locale={locale} copy={copy} />
          </section>
        )}
      </main>
      </div>

      {featured && <StickyCta label={copy.event.buy} price={formatOfferPrice(featured, copy.tier, locale).main} accent={theme.accent} />}
    </Shell>
  );
}
