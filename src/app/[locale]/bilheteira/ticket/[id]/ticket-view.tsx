import "./ticket.css";
import { getLocale } from "next-intl/server";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { getInstitutionalCopy } from "@/i18n/copy/institutional";

type Props = {
  tierName: string;
  buyerName: string;
  seats: number;
  priceCents: number;
  serialCode: string;
  qrSvg: string;
  eventTitle: string;
  eventSubtitle: string | null;
  brandName: string;
  startsAt: Date;
  doorsAt: Date | null;
  venue: string;
  address: string | null;
  checkedInAt: Date | null;
  welcome: boolean;
  coverImage?: string | null;
};

const LISBON_TZ = "Europe/Lisbon";

function formatDate(d: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: LISBON_TZ,
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(d)
    .toUpperCase()
    .replace(".", "");
}

function formatTime(d: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: LISBON_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(d);
}

function formatPrice(cents: number, locale: string, free: string): string {
  if (cents === 0) return free;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export async function TicketView({
  tierName,
  buyerName,
  seats,
  priceCents,
  serialCode,
  qrSvg,
  eventTitle,
  eventSubtitle,
  brandName,
  startsAt,
  doorsAt,
  venue,
  address,
  checkedInAt,
  welcome,
  coverImage,
}: Props) {
  const locale = await getLocale();
  const copy = getInstitutionalCopy(locale).ticketing;
  const total = priceCents * seats;

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        href="https://fonts.googleapis.com/css2?family=Barlow:ital,wght@0,700;0,900;1,900&family=Inter:wght@300;400;500;700&display=swap"
        rel="stylesheet"
      />
      <div className="fixed right-4 top-4 z-[100] rounded bg-white/90 p-1 shadow print:hidden">
        <LocaleSwitcher tone="light" />
      </div>
      <main className="bt-page">
        {welcome && (
          <div className="bt-welcome">
            {copy.reservationConfirmed}
          </div>
        )}
        <div className="bt-ticket">
          {coverImage && (
            <div
              className="bt-cover"
              style={{ backgroundImage: `url(${coverImage})` }}
              aria-hidden="true"
            />
          )}
          <div className="bt-hero">
            <div className="bt-hero-top">
              <div className="bt-logo">wepac</div>
              <div className="bt-header-label">{tierName}</div>
            </div>
            <div className="bt-hero-bottom">
              <div className="bt-brand">{brandName}</div>
              <h1 className="bt-h1">{eventTitle}</h1>
              {eventSubtitle && (
                <div className="bt-subtitle">{eventSubtitle}</div>
              )}
            </div>
          </div>

          <div className="bt-container">
            <dl className="bt-metadata">
              <dt>{copy.ticketType}</dt>
              <dd className="bt-tier">{tierName}</dd>

              <dt>{copy.name}</dt>
              <dd>{buyerName}</dd>

              <dt>{copy.seats}</dt>
              <dd>{seats}</dd>

              <dt>{copy.date}</dt>
              <dd>
                {formatDate(startsAt, locale)} · {formatTime(startsAt, locale)}
              </dd>

              <dt>{copy.venue}</dt>
              <dd>
                {venue}
                {address && (
                  <>
                    <br />
                    {address}
                  </>
                )}
              </dd>

              {doorsAt && (
                <>
                  <dt>{copy.doors}</dt>
                  <dd>{formatTime(doorsAt, locale)}</dd>
                </>
              )}

              <dt>{priceCents > 0 ? copy.price : copy.entrance}</dt>
              <dd>
                {formatPrice(priceCents, locale, copy.free)}
                {seats > 1 && priceCents > 0 && (
                  <span className="bt-total">
                    {" · "}
                    {copy.total} {formatPrice(total, locale, copy.free)}
                  </span>
                )}
              </dd>

              {priceCents > 0 && (
                <>
                  <dt>{copy.payment}</dt>
                  <dd>{copy.paidOnline}</dd>
                </>
              )}
            </dl>
            {priceCents > 0 && (
              <p className="bt-iva">{copy.vatExempt}</p>
            )}

            <hr className="bt-divider" />

            <div className="bt-code-block">
              <div className="bt-code-label">{copy.entryCode}</div>
              <div
                className="bt-qr"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
              <div className="bt-code">{serialCode}</div>
              {checkedInAt && (
                <div className="bt-checked">✓ {copy.admitted}</div>
              )}
            </div>

            <hr className="bt-divider" />

            <div className="bt-instructions">
              <p>{copy.nonTransferable}</p>
              <p>{copy.noPhotosPerformance}</p>
            </div>
          </div>

          <div className="bt-footer">
            <div className="bt-logo-footer">wepac</div>
            <div className="bt-tagline">{copy.transformativeCulture}</div>
          </div>
        </div>
      </main>
    </>
  );
}
