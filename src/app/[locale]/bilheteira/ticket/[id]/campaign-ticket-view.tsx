import { getLocale } from "next-intl/server";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { getInstitutionalCopy } from "@/i18n/copy/institutional";
import { themeVars, type EventTheme } from "@/lib/bilheteira/event-theme";
import { AccentTitle } from "../../_components/event-hero";
import { barlowCondensed, CONDENSED } from "../../_components/fonts";

type Props = {
  theme: EventTheme;
  tierName: string;
  buyerName: string;
  seats: number;
  priceCents: number;
  serialCode: string;
  qrSvg: string;
  eventTitle: string;
  brandName: string;
  startsAt: Date;
  doorsAt: Date | null;
  venue: string;
  address: string | null;
  checkedInAt: Date | null;
  welcome: boolean;
  coverImage: string | null;
  ticketNote: string | null;
};

const LISBON_TZ = "Europe/Lisbon";

// «21 nov 2026» / «Nov 21, 2026»; pt-PT's short date is numeric, so the
// month name is formatted on its own.
function formatDate(d: Date, locale: string): string {
  const part = (opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, { timeZone: LISBON_TZ, ...opts }).format(d).replace(/\./g, "");
  const day = part({ day: "numeric" });
  const month = part({ month: "short" });
  const year = part({ year: "numeric" });
  return locale === "en-US" ? `${month} ${day}, ${year}` : `${day} ${month} ${year}`;
}

function formatTime(d: Date, locale: string): string {
  const t = new Intl.DateTimeFormat(locale, {
    timeZone: LISBON_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(d);
  return locale === "en-US" ? t : t.replace(":", "h");
}

function formatPrice(cents: number, locale: string, free: string): string {
  if (cents === 0) return free;
  return new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(cents / 100);
}

// Ticket for events with a campaign theme: same palette, display face and
// artwork as the event landing, so the ticket reads as part of the campaign.
export async function CampaignTicketView({
  theme,
  tierName,
  buyerName,
  seats,
  priceCents,
  serialCode,
  qrSvg,
  eventTitle,
  brandName,
  startsAt,
  doorsAt,
  venue,
  address,
  checkedInAt,
  welcome,
  coverImage,
  ticketNote,
}: Props) {
  const locale = await getLocale();
  const copy = getInstitutionalCopy(locale).ticketing;
  const image = theme.heroImage ?? coverImage;
  const price = formatPrice(priceCents, locale, copy.free);
  const total = formatPrice(priceCents * seats, locale, copy.free);

  return (
    <div
      style={themeVars(theme)}
      className={`${barlowCondensed.variable} min-h-screen bg-[var(--ev-bg)] px-4 py-10 text-[var(--ev-ink)] sm:py-16 print:bg-white`}
    >
      <div className="fixed right-4 top-4 z-[100] rounded bg-white/90 p-1 shadow print:hidden">
        <LocaleSwitcher tone="light" />
      </div>
      <main className="mx-auto max-w-[920px]">
        {welcome && (
          <div className="mb-6 border-l-4 border-[var(--ev-accent)] bg-[var(--ev-card)] px-5 py-4 text-[15px] font-semibold">
            {copy.reservationConfirmed}
          </div>
        )}

        <article className="grid overflow-hidden border border-[var(--ev-line)] bg-[var(--ev-card)] md:grid-cols-[1fr_260px]">
          <div className="relative isolate min-h-[340px] overflow-hidden p-6 sm:p-8">
            {image && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt=""
                  className="absolute inset-y-0 right-0 -z-10 h-full w-full object-cover object-[center_20%] opacity-70 sm:w-[70%]"
                />
                <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,var(--ev-card)_0%,var(--ev-card)_25%,transparent_75%)]" />
                <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,var(--ev-card)_0%,transparent_45%)]" />
              </>
            )}
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--ev-muted)]">
              {theme.eyebrow ?? brandName}
            </p>
            <h1 className={`${CONDENSED} mt-4 text-[52px] font-bold uppercase leading-[0.9] sm:text-[72px]`}>
              <AccentTitle text={theme.heroTitle ?? eventTitle} accent={theme.accent} />
            </h1>
            <p className="mt-6 max-w-[360px] text-[13px] font-bold uppercase leading-snug tracking-[0.16em] text-[var(--ev-accent)]">
              {tierName}
            </p>
            <div className="mt-6">
              <div className={`${CONDENSED} text-[28px] font-bold leading-tight`}>
                {formatDate(startsAt, locale)} · {formatTime(startsAt, locale)}
              </div>
              <div className="text-[14px] text-[var(--ev-muted)]">
                {venue}
                {address && <> · {address}</>}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 border-t-2 border-dashed border-[var(--ev-line)] p-6 text-center md:border-l-2 md:border-t-0">
            <div className="text-[10px] uppercase tracking-[0.24em] text-[var(--ev-faint)]">{copy.entryCode}</div>
            <div className="w-full max-w-[180px] bg-white p-3" dangerouslySetInnerHTML={{ __html: qrSvg }} />
            <div className={`${CONDENSED} text-[30px] font-bold leading-none`}>{serialCode}</div>
            <div className="w-full border-t border-[var(--ev-line)] pt-4">
              <div className={`${CONDENSED} text-[30px] font-bold leading-none`}>{price}</div>
              <div className="mt-1 text-[12px] text-[var(--ev-muted)]">
                {seats > 1 ? `${seats} ${copy.seatsLabel(seats)}` : copy.onePerson}
                {seats > 1 && priceCents > 0 && ` · ${copy.total} ${total}`}
              </div>
            </div>
            {checkedInAt && (
              <div className="bg-[var(--ev-accent)] px-3 py-1 text-[12px] font-bold uppercase tracking-[0.2em] text-white">
                ✓ {copy.admitted}
              </div>
            )}
          </div>
        </article>

        <section className="mt-4 border border-[var(--ev-line)] bg-[var(--ev-card)] p-6 sm:p-8">
          <div className="flex items-baseline justify-between border-b border-[var(--ev-line)] pb-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--ev-muted)]">
              {copy.ticketDetails}
            </div>
            <div className="text-[13px] font-bold">{serialCode}</div>
          </div>
          <dl className="mt-4 grid grid-cols-[110px_1fr] gap-x-6 gap-y-2 text-[15px]">
            <dt className="text-[11px] uppercase leading-6 tracking-[0.18em] text-[var(--ev-faint)]">{copy.name}</dt>
            <dd>{buyerName}</dd>
            <dt className="text-[11px] uppercase leading-6 tracking-[0.18em] text-[var(--ev-faint)]">{copy.ticketType}</dt>
            <dd>{tierName}</dd>
            <dt className="text-[11px] uppercase leading-6 tracking-[0.18em] text-[var(--ev-faint)]">{copy.seats}</dt>
            <dd>{seats}</dd>
            <dt className="text-[11px] uppercase leading-6 tracking-[0.18em] text-[var(--ev-faint)]">{copy.price}</dt>
            <dd>
              {price}
              {seats > 1 && priceCents > 0 && ` · ${copy.total} ${total}`}
            </dd>
            {doorsAt && (
              <>
                <dt className="text-[11px] uppercase leading-6 tracking-[0.18em] text-[var(--ev-faint)]">{copy.doors}</dt>
                <dd>{formatTime(doorsAt, locale)}</dd>
              </>
            )}
          </dl>
          <div className="mt-6 space-y-3 text-[14px] leading-relaxed text-[var(--ev-muted)]">
            {ticketNote?.split(/\n\s*\n/).map((p, i) => <p key={i}>{p.trim()}</p>)}
            <p>{copy.nonTransferable}</p>
          </div>
          {priceCents > 0 && (
            <p className="mt-6 text-[11px] uppercase tracking-[0.16em] text-[var(--ev-faint)]">{copy.vatExempt}</p>
          )}
        </section>
      </main>
    </div>
  );
}
