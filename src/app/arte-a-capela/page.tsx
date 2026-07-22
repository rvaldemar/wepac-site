import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatPriceCents } from "@/app/bilheteira/ui";
import {
  manifesto,
  pullQuote,
  stats,
  noUpcomingEvent,
  footerTagline,
  footerSocialLinks,
  footerInfoLinks,
} from "@/data/arte-a-capela";

// Same posture as src/app/bilheteira/[slug]/page.tsx — this page depends on
// which Event is currently published, so it must never be statically cached.
export const dynamic = "force-dynamic";

export const metadata = {
  // `absolute` opts out of the root layout's "%s | WEPAC" template — this
  // title already ends in "| WEPAC", so the template would double it up.
  title: { absolute: "Arte à Capela | WEPAC — Concertos em espaços patrimoniais" },
  description:
    "Concertos intimistas e experiências imersivas em capelas, igrejas e espaços históricos de Portugal.",
};

const serif = "font-[family-name:var(--font-cormorant)]";

type Props = {
  searchParams: Promise<{ error?: string; cancelled?: string }>;
};

// Events happen in Portugal — always render in Europe/Lisbon regardless of
// where the rendering process (server or client) happens to be.
const LISBON_TZ = "Europe/Lisbon";

function formatDateShort(d: Date): string {
  return new Intl.DateTimeFormat("pt-PT", {
    timeZone: LISBON_TZ,
    day: "2-digit",
    month: "long",
  }).format(d);
}

function formatDateFull(d: Date): string {
  return new Intl.DateTimeFormat("pt-PT", {
    timeZone: LISBON_TZ,
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d);
}

function formatTime(d: Date): string {
  return new Intl.DateTimeFormat("pt-PT", {
    timeZone: LISBON_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(d);
}

// Event.subtitle follows the seed convention "Name · instrument" (see
// prisma/seed.ts). Split it instead of borrowing the fallback event's
// hardcoded artist/caption — those belong only to the no-event placeholder.
function splitArtistSubtitle(subtitle: string): {
  artist: string;
  caption: string;
} {
  const separatorIndex = subtitle.indexOf("·");
  if (separatorIndex === -1) {
    return { artist: subtitle.trim(), caption: "" };
  }
  return {
    artist: subtitle.slice(0, separatorIndex).trim(),
    caption: subtitle.slice(separatorIndex + 1).trim(),
  };
}

type EventView = {
  slug: string;
  title: string;
  artist: string;
  artistCaption: string;
  dateShort: string;
  dateFull: string;
  timeLabel: string | null;
  doorsLabel: string | null;
  venue: string;
  address: string | null;
  priceLabel: string;
};

export default async function ArteACapelaPage({ searchParams }: Props) {
  const { error, cancelled } = await searchParams;

  const dbEvent = await prisma.event.findFirst({
    where: {
      status: "published",
      startsAt: { gte: new Date() },
      department: { slug: "arte-a-capela" },
    },
    orderBy: { startsAt: "asc" },
    include: { tiers: { orderBy: { sortOrder: "asc" } } },
  });

  // Every tier gets shown — the defect that triggered this rework was
  // hiding all but the cheapest one. The teaser price up in NEXT EVENT is
  // the only spot that still wants a single number, so it takes the
  // cheapest independently of display order.
  const tiers = dbEvent ? dbEvent.tiers : [];
  const cheapestTierPriceCents =
    tiers.length > 0 ? Math.min(...tiers.map((t) => t.priceCents)) : null;

  // No dedicated "artist"/"instrument" columns on Event — subtitle carries
  // both, "Name · instrument".
  const dbArtist = dbEvent
    ? dbEvent.subtitle
      ? splitArtistSubtitle(dbEvent.subtitle)
      : { artist: dbEvent.title, caption: "" }
    : { artist: "", caption: "" };

  // No fallback branch: when there is no published Event, there is no real
  // title/artist/venue to show, so `event` is simply absent and every
  // rendering spot below must handle that explicitly instead of falling
  // back to invented content.
  const event: EventView | null = dbEvent
    ? {
        slug: dbEvent.slug,
        title: dbEvent.title,
        artist: dbArtist.artist,
        artistCaption: dbArtist.caption,
        dateShort: formatDateShort(dbEvent.startsAt),
        dateFull: formatDateFull(dbEvent.startsAt),
        timeLabel: formatTime(dbEvent.startsAt),
        doorsLabel: dbEvent.doorsAt ? formatTime(dbEvent.doorsAt) : null,
        venue: dbEvent.venue,
        address: dbEvent.address,
        priceLabel:
          cheapestTierPriceCents !== null
            ? formatPriceCents(cheapestTierPriceCents)
            : "—",
      }
    : null;

  return (
    <div className="bg-capela-bg text-white overflow-x-hidden">
      {/* NAV — transparent, over the hero */}
      <header className="absolute top-0 left-0 right-0 z-50 h-[80px] lg:h-[96px]">
        <div className="h-full px-6 md:px-10 xl:px-16 flex items-center justify-between max-w-[1600px] mx-auto">
          <Link href="/arte-a-capela" className="flex items-center">
            <img
              src="/images/arte-a-capela/logo.png"
              alt="Arte à Capela"
              className="h-8 sm:h-10 lg:h-[52px] w-auto"
              loading="lazy"
            />
          </Link>
          <nav className="hidden lg:flex items-center gap-10 xl:gap-14 text-[11px] uppercase tracking-[0.18em] text-white/70">
            <a href="#sobre" className="hover:text-white transition">
              Sobre
            </a>
            <a href="#evento" className="hover:text-white transition">
              Eventos
            </a>
            <a
              href="#bilheteira"
              className="text-white border-b border-capela-red pb-1 hover:text-white/80 transition"
            >
              Bilhetes
            </a>
          </nav>
          <a
            href="#bilheteira"
            className="lg:hidden text-[11px] uppercase tracking-[0.18em] text-white border-b border-capela-red pb-1"
          >
            Bilhetes
          </a>
        </div>
      </header>

      {/* HERO */}
      <section className="relative w-full min-h-[640px] sm:min-h-[760px] lg:min-h-[640px] lg:h-[46vw] lg:max-h-[880px] overflow-hidden flex items-center">
        <div className="absolute inset-0">
          <img
            src="/images/arte-a-capela/hero.jpg"
            alt=""
            className="absolute w-full h-full object-cover object-center"
          />
          <div
            className="absolute inset-0"
            style={{
              // The 52% stop let the gradient finish lightening before the
              // long headline lines' final characters (the "a" of "nova
              // vida", the "o." of "património.") clear it — those glyphs
              // sampled under ~3.9-4.2:1 against the lit nave. Pushing that
              // stop to 60% keeps the dark band under the whole headline
              // column without touching the 0%/26%/100% stops, so it holds
              // the already-verified lead paragraph and CTAs (both sit past
              // 60% and stay flat at the same 0.18 tail alpha) and leaves
              // the photo just as visible on the right. Verified by
              // compositing this gradient over the real hero.jpg pixels and
              // sampling under every headline glyph (worst case went from
              // ~4.05:1 to ~4.98:1 across 1384-1600px viewports).
              backgroundImage:
                "linear-gradient(100deg, rgba(11,10,9,0.92) 0%, rgba(11,10,9,0.72) 26%, rgba(11,10,9,0.18) 60%, rgba(11,10,9,0.18) 100%)",
            }}
          />
        </div>

        <div className="relative z-10 w-full max-w-[1600px] mx-auto px-6 md:px-10 lg:px-16 xl:px-24 pt-[110px] lg:pt-[130px] pb-16 grid lg:grid-cols-[auto_360px] gap-10 lg:gap-14 lg:justify-center items-end">
          <h1
            className={`${serif} font-normal text-[44px] sm:text-[60px] md:text-[76px] lg:text-[78px] leading-[1.05] lg:leading-[1.15]`}
          >
            A arte
            <br />
            ganha
            <br />
            nova vida
            <br />
            <em className="italic">
              dentro do
              <br />
              património.
            </em>
          </h1>

          <div className="relative space-y-6 lg:space-y-8">
            {/* The right-hand column sits over the brightened right edge of
                the photo (the linear gradient is only 18% opacity out here).
                A prior version of this scrim (0.7 peak alpha, pure two-stop
                ellipse fading from the center to 0 at the box's own edge,
                -120px inset) was checked against a wrong assumption that the
                lead paragraph wraps 2 lines — it actually wraps 3 at this
                column width, which pushes the real content box (and the
                secondary CTA sitting at its bottom) further from the
                ellipse's center than assumed. Rendering the real page with
                Playwright at 1384-1600px and sampling the actual composited
                pixels (not a hand-rolled approximation) measured the
                paragraph at ~3.6:1 and the secondary CTA's border at
                ~1.6:1 — both failing.
                Fix: a flat plateau (0% to 60% stays at full alpha, only the
                outer 40% fades to 0) so the whole content box — not just
                its center — sits inside the fully-dark zone, plus a wider
                -150px inset so that plateau's edge clears the box's actual
                corners. This only touches the right column; the main
                gradient above (and the headline sitting on it) is
                untouched. Re-measured: paragraph ~4.8-6.4:1, secondary CTA
                label ~7.9-8.8:1, both clear 4.5:1. Right-half mean
                luminance settles at ~30-31 (was ~33-34 before this scrim
                strengthening, ~18.7 for the old over-darkened photo) —
                still clearly a photo, not a silhouette. */}
            <div
              aria-hidden="true"
              className="hidden lg:block absolute -inset-x-[150px] -inset-y-[150px] pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(ellipse at center, rgba(11,10,9,0.55) 0%, rgba(11,10,9,0.55) 60%, rgba(11,10,9,0) 100%)",
              }}
            />
            <p className="relative z-10 text-[15px] sm:text-[17px] leading-[1.6] text-white/70">
              Concertos intimistas e experiências imersivas em capelas,
              igrejas e espaços históricos de Portugal.
            </p>
            <div className="relative z-10 flex flex-col sm:flex-row lg:flex-col items-start gap-3 sm:gap-4">
              <a
                href={event ? "#bilheteira" : "/bilheteira"}
                className="inline-flex items-center justify-center bg-capela-red text-white text-[11px] font-medium uppercase tracking-[0.18em] px-8 h-[44px] hover:bg-capela-red/85 transition"
              >
                {event ? "Comprar bilhete" : "Ver bilheteira"}
              </a>
              {/* This border is a non-text UI component (WCAG 1.4.11,
                  3:1), not text (1.4.3, 4.5:1) — the label above it is
                  checked against 4.5:1 separately. A 25%-alpha white border
                  has a hard mathematical ceiling: against the darkest
                  possible background it still only reaches ~2.3:1, because
                  the border color itself is 75% background at any alpha
                  that low, so no amount of scrim behind it can reach 3:1.
                  50% alpha raises that ceiling comfortably past 3:1 across
                  the range of backgrounds actually measured here. */}
              <a
                href="#evento"
                className="inline-flex items-center justify-center border border-white/50 text-white text-[11px] font-medium uppercase tracking-[0.18em] px-8 h-[44px] hover:border-white/65 transition"
              >
                Ver programação
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* MANIFESTO */}
      <section id="sobre" className="py-20 lg:py-28">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-16">
          <p
            className={`${serif} text-[26px] sm:text-[32px] lg:text-[36px] leading-[1.3] max-w-[640px]`}
          >
            {manifesto.statement}
          </p>
          <p className="mt-8 text-[13px] leading-[1.7] text-white/45 max-w-[560px]">
            {manifesto.body}
          </p>
        </div>
      </section>

      {/* GALLERY */}
      <section className="grid grid-cols-1 lg:grid-cols-[1.41fr_1fr_1.01fr]">
        {[
          { src: "claustro.jpg", alt: "Claustro de um edifício patrimonial" },
          { src: "talha.jpg", alt: "Detalhe de talha dourada" },
          { src: "vitral.jpg", alt: "Vitral de uma capela histórica" },
        ].map((img) => (
          <div key={img.src} className="relative h-[280px] sm:h-[380px] lg:h-[520px]">
            <img
              src={`/images/arte-a-capela/${img.src}`}
              alt={img.alt}
              className="absolute inset-0 w-full h-full object-cover object-center"
              loading="lazy"
            />
          </div>
        ))}
      </section>

      {/* QUOTE + STATS */}
      <section className="py-10 lg:py-14">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-16 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <p
            className={`${serif} italic text-[19px] sm:text-[22px] leading-[1.5] text-white/70 max-w-[520px]`}
          >
            &ldquo;{pullQuote}&rdquo;
          </p>
          <div className="grid grid-cols-3 gap-10 lg:justify-self-end">
            {stats.map((stat) => (
              <div key={stat.title}>
                <p className={`${serif} text-[17px] sm:text-[19px] leading-[1.1]`}>
                  {stat.title}
                </p>
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/55 mt-1">
                  {stat.caption}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* IMAGE DUO — azulejos.jpg is 450x450, the one low-res asset in this
          set. The Figma pane is landscape (~1.53:1), not square — a square
          box would upscale that source 3.06x at DPR2, whereas the landscape
          box keeps it to about 1.36x. Lisboa (much higher-res) takes the
          wider remaining column. Both panes stay full-bleed with no gap,
          same as the gallery band above. */}
      <section className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] lg:h-[400px]">
        <div className="relative h-[280px] sm:h-[380px] lg:h-full">
          <img
            src="/images/arte-a-capela/azulejos.jpg"
            alt="Painel de azulejos portugueses"
            className="absolute inset-0 w-full h-full object-cover object-center"
            loading="lazy"
          />
        </div>
        <div className="relative h-[280px] sm:h-[380px] lg:h-auto">
          <img
            src="/images/arte-a-capela/lisboa.jpg"
            alt="Vista de Lisboa a partir de um espaço patrimonial"
            className="absolute inset-0 w-full h-full object-cover object-center"
            loading="lazy"
          />
        </div>
      </section>

      {/* NEXT EVENT */}
      <section id="evento" className="py-20 lg:py-28">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-16">
          <p className="text-[11px] uppercase tracking-[0.18em] text-capela-red-on-dark mb-4">
            Próximo evento
          </p>

          {event ? (
            <>
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 lg:gap-10">
                <h2
                  className={`${serif} text-[40px] sm:text-[48px] lg:text-[60px] leading-[1.15] max-w-[720px]`}
                >
                  {event.title}
                </h2>

                <div className="flex flex-wrap lg:flex-nowrap items-center gap-6 lg:gap-10 lg:text-right">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/55">
                      Data
                    </p>
                    <p className="mt-1 text-[15px]">{event.dateShort}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/55">
                      Entrada
                    </p>
                    <p className="mt-1 text-[15px]">{event.priceLabel}</p>
                  </div>
                  <a
                    href={tiers.length > 0 ? "#bilheteira" : "/bilheteira"}
                    className="inline-flex items-center justify-center bg-capela-red text-white text-[11px] font-medium uppercase tracking-[0.18em] px-7 h-[48px] hover:bg-capela-red/85 transition whitespace-nowrap"
                  >
                    Garantir bilhete
                  </a>
                </div>
              </div>

              {/* No column for a concert programme exists on Event/TicketTier
                  (see src/data/arte-a-capela.ts) — there is no real programme
                  data to render here, for this or any other event. */}
              <div className="border-t border-white/10 mt-12 lg:mt-16 pt-12 lg:pt-16">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/55 mb-3">
                  Artista
                </p>
                <p className={`${serif} text-[26px] sm:text-[28px]`}>{event.artist}</p>
                <p className="text-[13px] text-white/45 mt-1">{event.artistCaption}</p>
              </div>
            </>
          ) : (
            <div className="max-w-[640px]">
              <h2
                className={`${serif} text-[40px] sm:text-[48px] lg:text-[60px] leading-[1.15]`}
              >
                {noUpcomingEvent.heading}
              </h2>
              <p className="mt-6 text-[15px] leading-[1.7] text-white/60 max-w-[520px]">
                {noUpcomingEvent.body}
              </p>
              <Link
                href="/bilheteira"
                className="mt-8 inline-flex items-center justify-center bg-capela-red text-white text-[11px] font-medium uppercase tracking-[0.18em] px-8 h-[52px] hover:bg-capela-red/85 transition"
              >
                Ir para a bilheteira
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* IMAGE BAND */}
      <section className="relative w-full aspect-[3/2] sm:aspect-[16/9] lg:aspect-[4/1]">
        <img
          src="/images/arte-a-capela/tumulo-vitral.jpg"
          alt="Túmulo sob um vitral histórico"
          className="absolute inset-0 w-full h-full object-cover object-center"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/25" />
      </section>

      {/* TICKETING */}
      <section id="bilheteira" className="bg-capela-cream text-black">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-16 py-20 lg:py-28 grid lg:grid-cols-2 gap-14 lg:gap-0">
          {/* Left column — event facts, no price: prices live entirely in
              the tier list on the right, where each one gets its own CTA. */}
          <div className="lg:pr-16 lg:border-r border-black/10">
            <p className="text-[11px] uppercase tracking-[0.18em] text-capela-red mb-4">
              Bilheteira
            </p>

            {event ? (
              <>
                <h2 className={`${serif} text-[32px] sm:text-[54px] leading-[1.15] mb-8`}>
                  {event.title}
                </h2>

                <dl className="space-y-4">
                  {[
                    {
                      label: "Artista",
                      value: event.artistCaption
                        ? `${event.artist} — ${event.artistCaption}`
                        : event.artist,
                    },
                    {
                      label: "Data",
                      value: event.timeLabel
                        ? `${event.dateFull} · ${event.timeLabel}`
                        : event.dateFull,
                    },
                    {
                      label: "Local",
                      value: event.address
                        ? `${event.venue} — ${event.address}`
                        : event.venue,
                    },
                    ...(event.doorsLabel
                      ? [{ label: "Portas", value: event.doorsLabel }]
                      : []),
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex items-baseline justify-between gap-4 border-b border-black/10 pb-3"
                    >
                      <dt className="text-[11px] uppercase tracking-[0.18em] text-black/60">
                        {row.label}
                      </dt>
                      <dd className="text-[15px] font-medium text-right">
                        {row.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </>
            ) : (
              <>
                <h2 className={`${serif} text-[32px] sm:text-[54px] leading-[1.15] mb-4`}>
                  {noUpcomingEvent.ticketingHeading}
                </h2>
                <p className="text-[14px] text-black/58 leading-[1.7] max-w-[420px]">
                  {noUpcomingEvent.body}
                </p>
              </>
            )}

            {event && (
              <p className="mt-8 text-[12px] text-black/58 leading-[1.6]">
                Lugares limitados. Bilhete enviado por e-mail após confirmação
                do pagamento.
              </p>
            )}
          </div>

          {/* Right column — every tier, in order, each its own way in.
              This replaces an inline checkout that duplicated the real
              ticketing product; the tier itself deep-links there. */}
          <div className="lg:pl-16 pt-14 lg:pt-0">
            {cancelled && (
              <p className="mb-6 text-[13px] text-black/70 border border-black/20 bg-black/5 px-4 py-3">
                Pagamento cancelado. Se foi engano, podes tentar novamente.
              </p>
            )}
            {error && (
              <p className="mb-6 text-[13px] text-capela-red border border-capela-red/30 bg-capela-red/5 px-4 py-3">
                {error}
              </p>
            )}

            {event && tiers.length > 0 ? (
              <div className="space-y-10">
                <p className="text-[11px] uppercase tracking-[0.18em] text-black/60">
                  Escolhe o teu lugar
                </p>

                <ul className="divide-y divide-black/10 border-t border-black/10">
                  {tiers.map((tier) => (
                    <li key={tier.id} className="py-8 first:pt-0">
                      <div className="flex items-baseline justify-between gap-6">
                        <h3 className={`${serif} text-[22px] sm:text-[26px] leading-[1.2]`}>
                          {tier.name}
                        </h3>
                        <span className="text-[20px] font-medium whitespace-nowrap">
                          {formatPriceCents(tier.priceCents)}
                        </span>
                      </div>
                      {tier.description && (
                        <p className="mt-3 text-[13px] text-black/55 leading-[1.6] max-w-[420px]">
                          {tier.description}
                        </p>
                      )}
                      <Link
                        href={`/bilheteira/${event.slug}?tier=${tier.id}`}
                        className="mt-5 inline-flex items-center justify-center bg-capela-red text-white text-[11px] font-medium uppercase tracking-[0.18em] px-7 h-[48px] hover:bg-capela-red/85 transition"
                      >
                        Garantir bilhete
                      </Link>
                    </li>
                  ))}
                </ul>

                {/* Same VAT exemption sentence the real ticketing page
                    carries for this identical price — see
                    src/app/bilheteira/[slug]/page.tsx. */}
                <p className="text-[12px] text-black/58 leading-[1.6]">
                  Preços isentos de IVA ao abrigo do art.º 9.º do CIVA.
                </p>
              </div>
            ) : (
              <div className="max-w-[420px] space-y-8">
                <p className="text-[11px] uppercase tracking-[0.18em] text-black/60">
                  Disponibilidade
                </p>
                <h3 className="text-[15px] font-medium">
                  Ainda não há bilhetes publicados para este evento.
                </h3>
                <p className="text-[14px] text-black/58 leading-[1.7]">
                  A bilheteira reúne todos os eventos da WEPAC com lugares
                  em aberto — a programação completa está sempre lá.
                </p>
                <Link
                  href="/bilheteira"
                  className="inline-flex items-center justify-center bg-capela-red text-white text-[11px] font-medium uppercase tracking-[0.18em] px-8 h-[52px] hover:bg-capela-red/85 transition"
                >
                  Ir para a bilheteira
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-capela-bg py-16 lg:py-20">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-16">
          <div className="grid lg:grid-cols-[1fr_auto_auto] gap-10 lg:gap-20">
            <div className="max-w-[360px]">
              <Link href="/arte-a-capela" className="inline-flex items-center">
                <img
                  src="/images/arte-a-capela/logo.png"
                  alt="Arte à Capela"
                  className="h-9 w-auto"
                  loading="lazy"
                />
              </Link>
              <p className="mt-5 text-[13px] leading-[1.6] text-white/45">
                {footerTagline}
              </p>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/55 mb-4">
                Redes sociais
              </p>
              <ul className="space-y-2">
                {footerSocialLinks.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[14px] text-white/70 hover:text-white transition"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/55 mb-4">
                Informações
              </p>
              <ul className="space-y-2">
                {footerInfoLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[14px] text-white/70 hover:text-white transition"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[13px] text-white/40">
            <p>© 2026 Arte à Capela</p>
            <p>Portugal · Cultura · Património</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
