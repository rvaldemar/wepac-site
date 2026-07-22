import Link from "next/link";
import { prisma } from "@/lib/db";
import { reserveAction } from "@/lib/bilheteira/reserve-action";
import { formatPriceCents } from "@/app/bilheteira/ui";
import {
  manifesto,
  pullQuote,
  stats,
  fallbackProgramme,
  fallbackEvent,
  programmeEventSlug,
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
  slug: string | null;
  tierId: string | null;
  title: string;
  artist: string;
  artistCaption: string;
  dateShort: string;
  dateFull: string;
  venue: string;
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
    include: { tiers: true },
  });

  const cheapestTier = dbEvent
    ? [...dbEvent.tiers].sort((a, b) => a.priceCents - b.priceCents)[0]
    : undefined;

  // No dedicated "artist"/"instrument" columns on Event — subtitle carries
  // both, "Name · instrument". A real event must never borrow the fallback
  // placeholder's artist/caption/price — those belong only to the no-event
  // state below.
  const dbArtist = dbEvent
    ? dbEvent.subtitle
      ? splitArtistSubtitle(dbEvent.subtitle)
      : { artist: dbEvent.title, caption: "" }
    : { artist: "", caption: "" };

  const event: EventView = dbEvent
    ? {
        slug: dbEvent.slug,
        tierId: cheapestTier?.id ?? null,
        title: dbEvent.title,
        artist: dbArtist.artist,
        artistCaption: dbArtist.caption,
        dateShort: formatDateShort(dbEvent.startsAt),
        dateFull: formatDateFull(dbEvent.startsAt),
        venue: dbEvent.venue,
        priceLabel: cheapestTier ? formatPriceCents(cheapestTier.priceCents) : "—",
      }
    : {
        slug: null,
        tierId: null,
        title: fallbackEvent.title,
        artist: fallbackEvent.artist,
        artistCaption: fallbackEvent.artistCaption,
        dateShort: fallbackEvent.dateShort,
        dateFull: fallbackEvent.dateFull,
        venue: fallbackEvent.venue,
        priceLabel: fallbackEvent.priceLabel,
      };

  const canReserve = Boolean(dbEvent && cheapestTier);

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
      <section className="relative w-full min-h-[640px] sm:min-h-[760px] lg:min-h-screen overflow-hidden flex items-center">
        <div className="absolute inset-0">
          <img
            src="/images/arte-a-capela/hero.jpg"
            alt=""
            className="absolute w-full h-full object-cover object-center"
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(100deg, rgba(11,10,9,0.94) 20%, rgba(11,10,9,0.55) 62%, rgba(11,10,9,0.75) 100%)",
            }}
          />
          <div className="absolute inset-0 bg-black/25" />
        </div>

        <div className="relative z-10 w-full max-w-[1600px] mx-auto px-6 md:px-10 lg:px-16 xl:px-24 pt-[110px] lg:pt-[130px] pb-16 grid lg:grid-cols-[1fr_420px] gap-10 lg:gap-16 items-end lg:items-center">
          <h1
            className={`${serif} font-normal text-[44px] sm:text-[60px] md:text-[76px] lg:text-[92px] leading-[1.05] lg:leading-[1.1]`}
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

          <div className="space-y-6 lg:space-y-8">
            <p className="text-[15px] sm:text-[17px] leading-[1.6] text-white/70">
              Concertos intimistas e experiências imersivas em capelas,
              igrejas e espaços históricos de Portugal.
            </p>
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 sm:gap-4">
              <a
                href="#bilheteira"
                className="inline-flex items-center justify-center bg-capela-red text-white text-[11px] font-medium uppercase tracking-[0.18em] px-8 h-[52px] hover:bg-capela-red/85 transition"
              >
                Comprar bilhete
              </a>
              <a
                href="#evento"
                className="inline-flex items-center justify-center border border-white/25 text-white text-[11px] font-medium uppercase tracking-[0.18em] px-8 h-[52px] hover:border-white/50 transition"
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
      <section className="grid grid-cols-1 lg:grid-cols-[2fr_1.2fr_1fr]">
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
      <section className="py-20 lg:py-28">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-16 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <p
            className={`${serif} italic text-[19px] sm:text-[22px] leading-[1.5] text-white/70 max-w-[520px]`}
          >
            &ldquo;{pullQuote}&rdquo;
          </p>
          <div className="space-y-8 lg:justify-self-end">
            {stats.map((stat) => (
              <div key={stat.title}>
                <p className={`${serif} text-[30px] sm:text-[36px] leading-[1.1]`}>
                  {stat.title}
                </p>
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/40 mt-1">
                  {stat.caption}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* IMAGE DUO */}
      <section className="grid grid-cols-1 lg:grid-cols-2">
        <div className="flex justify-center bg-capela-bg lg:py-10">
          <div className="relative w-full max-w-[560px] aspect-square">
            <img
              src="/images/arte-a-capela/azulejos.jpg"
              alt="Painel de azulejos portugueses"
              className="absolute inset-0 w-full h-full object-cover object-center"
              loading="lazy"
            />
          </div>
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
          <p className="text-[11px] uppercase tracking-[0.18em] text-capela-red mb-4">
            Próximo evento
          </p>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 lg:gap-10">
            <h2
              className={`${serif} text-[40px] sm:text-[48px] lg:text-[56px] leading-[1.15] max-w-[720px]`}
            >
              {event.title}
            </h2>

            <div className="flex flex-wrap lg:flex-nowrap items-center gap-6 lg:gap-10 lg:text-right">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">
                  Data
                </p>
                <p className="mt-1 text-[15px]">{event.dateShort}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">
                  Entrada
                </p>
                <p className="mt-1 text-[15px]">{event.priceLabel}</p>
              </div>
              <a
                href={canReserve ? "#bilheteira" : "/bilheteira"}
                className="inline-flex items-center justify-center bg-capela-red text-white text-[11px] font-medium uppercase tracking-[0.18em] px-7 h-[48px] hover:bg-capela-red/85 transition whitespace-nowrap"
              >
                Garantir bilhete
              </a>
            </div>
          </div>

          <div className="border-t border-white/10 mt-12 lg:mt-16 pt-12 lg:pt-16 grid sm:grid-cols-2 gap-10 sm:gap-16">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/40 mb-3">
                Artista
              </p>
              <p className={`${serif} text-[26px] sm:text-[28px]`}>{event.artist}</p>
              <p className="text-[13px] text-white/45 mt-1">{event.artistCaption}</p>
            </div>
            {/* The schema has no column for a concert programme, so this
                list is static copy pinned to one specific Event (see
                src/data/arte-a-capela.ts). Only show it when there is no
                real dbEvent, or when the published event actually is that
                one — otherwise a different published concert would get
                sold under this Bach/Duport/Popper programme. */}
            {(!dbEvent || dbEvent.slug === programmeEventSlug) && (
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/40 mb-3">
                  Programa
                </p>
                <ul className="divide-y divide-white/10">
                  {fallbackProgramme.map((row) => (
                    <li
                      key={row.work}
                      className="flex items-baseline justify-between gap-4 py-2.5 text-[14px] sm:text-[15px]"
                    >
                      <span>{row.work}</span>
                      <span className="text-white/35 whitespace-nowrap">
                        {row.composer}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* IMAGE BAND */}
      <section className="relative w-full aspect-[4/5] sm:aspect-[16/9] lg:aspect-[21/9]">
        <img
          src="/images/arte-a-capela/tumulo-vitral.jpg"
          alt="Túmulo sob um vitral histórico"
          className="absolute inset-0 w-full h-full object-cover object-center"
          loading="lazy"
        />
      </section>

      {/* TICKETING */}
      <section id="bilheteira" className="bg-capela-cream text-black">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-16 py-20 lg:py-28 grid lg:grid-cols-2 gap-14 lg:gap-0">
          {/* Left column */}
          <div className="lg:pr-16 lg:border-r border-black/10">
            <p className="text-[11px] uppercase tracking-[0.18em] text-capela-red mb-4">
              Bilheteira
            </p>
            <h2 className={`${serif} text-[32px] sm:text-[40px] leading-[1.15] mb-8`}>
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
                { label: "Data", value: event.dateFull },
                { label: "Local", value: event.venue },
                { label: "Preço por bilhete", value: event.priceLabel },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-baseline justify-between gap-4 border-b border-black/10 pb-3"
                >
                  <dt className="text-[11px] uppercase tracking-[0.18em] text-black/50">
                    {row.label}
                  </dt>
                  <dd className="text-[15px] font-medium text-right">{row.value}</dd>
                </div>
              ))}
            </dl>

            <p className="mt-8 text-[12px] text-black/45 leading-[1.6]">
              Lugares limitados. Bilhete enviado por e-mail após confirmação
              do pagamento.
            </p>
          </div>

          {/* Right column */}
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

            {canReserve && event.slug && event.tierId ? (
              <form action={reserveAction} className="space-y-8">
                <input type="hidden" name="eventSlug" value={event.slug} />
                <input type="hidden" name="tierId" value={event.tierId} />
                <input type="hidden" name="returnPath" value="/arte-a-capela" />

                <div>
                  <label
                    htmlFor="capela-seats"
                    className="text-[11px] uppercase tracking-[0.18em] text-black/50"
                  >
                    Quantidade
                  </label>
                  <input
                    id="capela-seats"
                    type="number"
                    name="seats"
                    defaultValue={1}
                    min={1}
                    max={10}
                    required
                    className="mt-2 w-24 border-0 border-b border-black/25 bg-transparent text-[16px] py-2 focus:outline-none focus:border-capela-red"
                  />
                  <p className="text-[11px] uppercase tracking-[0.18em] text-black/40 mt-1">
                    bilhete
                  </p>
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-black/50 mb-4">
                    Dados do participante
                  </p>
                  <div className="space-y-5">
                    <div>
                      <label htmlFor="capela-name" className="sr-only">
                        Nome completo
                      </label>
                      <input
                        id="capela-name"
                        type="text"
                        name="buyerName"
                        placeholder="Nome completo"
                        required
                        className="w-full border-0 border-b border-black/25 bg-transparent text-[16px] py-2 placeholder:text-black/40 focus:outline-none focus:border-capela-red"
                      />
                    </div>
                    <div>
                      <label htmlFor="capela-email" className="sr-only">
                        E-mail
                      </label>
                      <input
                        id="capela-email"
                        type="email"
                        name="buyerEmail"
                        placeholder="E-mail"
                        required
                        className="w-full border-0 border-b border-black/25 bg-transparent text-[16px] py-2 placeholder:text-black/40 focus:outline-none focus:border-capela-red"
                      />
                    </div>
                    <div>
                      <label htmlFor="capela-phone" className="sr-only">
                        Telefone
                      </label>
                      <input
                        id="capela-phone"
                        type="tel"
                        name="buyerPhone"
                        placeholder="Telefone"
                        className="w-full border-0 border-b border-black/25 bg-transparent text-[16px] py-2 placeholder:text-black/40 focus:outline-none focus:border-capela-red"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-black/50 mb-2">
                    Pagamento
                  </p>
                  {/* Stripe session only enables card + Multibanco (see
                      reserveAction) — no MB Way chip is rendered here. */}
                  <p className="text-[15px]">Cartão · Multibanco</p>
                </div>

                <div className="flex items-baseline justify-between border-t border-black/10 pt-5">
                  <span className="text-[11px] uppercase tracking-[0.18em] text-black/50">
                    Total
                  </span>
                  <span className="text-[20px] font-medium">{event.priceLabel}</span>
                </div>

                <button
                  type="submit"
                  className="w-full bg-capela-red text-white text-[11px] font-medium uppercase tracking-[0.18em] h-[54px] hover:bg-capela-red/85 transition"
                >
                  Comprar
                </button>
              </form>
            ) : (
              <div className="space-y-6">
                <p className="text-[15px] text-black/70 leading-[1.6]">
                  Ainda não há bilhetes disponíveis para este evento aqui.
                  Consulta a bilheteira para todos os eventos publicados.
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
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/40 mb-4">
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
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/40 mb-4">
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
