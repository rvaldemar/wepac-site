import "./capela-viva.css";
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
  startsAt: Date;
  doorsAt: Date | null;
  venue: string;
  address: string | null;
  checkedInAt: Date | null;
  welcome: boolean;
  coverImage?: string | null;
  eventTitle: string;
  eventSubtitle: string | null;
  ticketNote?: string | null;
};

const DEFAULT_CAPELA_VIVA_COVER =
  "/bilheteira/capela-viva/ananda-roda.jpeg";

const LISBON_TZ = "Europe/Lisbon";
const ROMAN_MONTHS = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
];
function lisbonParts(d: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: LISBON_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return {
    day: parseInt(get("day"), 10),
    month: parseInt(get("month"), 10),
    hour: get("hour"),
    minute: get("minute"),
  };
}

function formatShortDate(d: Date): string {
  const p = lisbonParts(d);
  return `${p.day}·${ROMAN_MONTHS[p.month - 1]}`;
}

function formatTime(d: Date): string {
  const p = lisbonParts(d);
  return `${p.hour}H${p.minute}`;
}

function formatDateLong(d: Date, locale: string): string {
  const p = lisbonParts(d);
  const month = new Intl.DateTimeFormat(locale, {
    timeZone: LISBON_TZ,
    month: "long",
  }).format(d);
  return locale === "en-US"
    ? `${month} ${p.day} · ${p.hour}:${p.minute}`
    : `${p.day} de ${month} · ${p.hour}h${p.minute}`;
}

function formatPrice(cents: number, locale: string, free: string): string {
  if (cents === 0) return free;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

const Ornamento = () => (
  <svg className="cv-ornamento" viewBox="0 0 140 10" xmlns="http://www.w3.org/2000/svg">
    <g stroke="#2E5944" fill="#2E5944" strokeWidth="0.4">
      <line x1="0" y1="5" x2="54" y2="5" />
      <path d="M58,1 L64,5 L58,9 L60,5 Z" />
      <circle cx="70" cy="5" r="1.3" />
      <path d="M82,1 L76,5 L82,9 L80,5 Z" />
      <line x1="86" y1="5" x2="140" y2="5" />
    </g>
  </svg>
);

export async function CapelaVivaTicketView({
  tierName,
  buyerName,
  seats,
  priceCents,
  serialCode,
  qrSvg,
  startsAt,
  doorsAt,
  venue,
  address,
  checkedInAt,
  welcome,
  coverImage,
  eventTitle,
  eventSubtitle,
  ticketNote,
}: Props) {
  const locale = await getLocale();
  const copy = getInstitutionalCopy(locale).ticketing;
  const total = priceCents * seats;
  const isAmigoTier = /amigo/i.test(tierName);
  const photoUrl = coverImage || DEFAULT_CAPELA_VIVA_COVER;

  // Split subtitle "Artista · instrumento" into two parts for the ticket layout
  const subtitleParts = eventSubtitle?.split("·").map((s) => s.trim()) ?? [];
  const artistName = subtitleParts[0] ?? "";
  const instrument = subtitleParts[1] ?? "";

  // Split title into two lines if it contains a space (last word on second line)
  const titleWords = eventTitle.split(" ");
  const titleLine1 = titleWords.slice(0, -1).join(" ");
  const titleLine2 = titleWords[titleWords.length - 1];

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Serif:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Rubik:wght@400;500;600&display=swap"
        rel="stylesheet"
      />
      <div className="fixed right-4 top-4 z-[100] rounded bg-white/90 p-1 shadow print:hidden">
        <LocaleSwitcher tone="light" />
      </div>
      <main className="cv-page">
        {welcome && (
          <div className="cv-welcome">{copy.reservationConfirmed}</div>
        )}

        <article className="cv-ticket">
          <div
            className="cv-photo"
            style={{ backgroundImage: `url(${photoUrl})` }}
          />
          <div className="cv-corpo">
            <div className="cv-corpo-top">
              <div className="cv-tipo">{tierName}</div>
              <div className="cv-titulo-italico">{titleLine1}</div>
              <div className="cv-titulo-principal">{titleLine2}</div>
              <Ornamento />
              <div className="cv-artista">
                {artistName}
                {instrument && <span className="cv-instrumento">{instrument}</span>}
              </div>
            </div>
            <div className="cv-corpo-bottom">
              <div className="cv-info">
                <div className="cv-data">
                  {formatDateLong(startsAt, locale)}
                </div>
                {venue}
                {address && (
                  <>
                    <br />
                    {address}
                  </>
                )}
              </div>
              <div className="cv-logos">
                <img
                  src="/bilheteira/capela-viva/logo-capela-viva.png"
                  alt="Capela Viva"
                />
                <img
                  src="/bilheteira/capela-viva/logo-arte-a-capela.png"
                  alt="Arte à Capela"
                  className="cv-logo-aac"
                />
                <img src="/bilheteira/capela-viva/logo-wepac.png" alt="WEPAC" />
              </div>
            </div>
          </div>
          <div className="cv-stub">
            <div className="cv-marca">
              Capela Viva
              <small>
                Arte à Capela<span className="cv-estrela">✦</span>WEPAC
              </small>
            </div>
            <div className="cv-datas">
              <div className="cv-dia">{formatShortDate(startsAt)}</div>
              <div className="cv-hora">{formatTime(startsAt)}</div>
            </div>
            <div className="cv-linha" />
            <div className="cv-qr-block">
              <div className="cv-qr" dangerouslySetInnerHTML={{ __html: qrSvg }} />
              <div className="cv-serial">{serialCode}</div>
            </div>
            <div className="cv-tier-block">
              <div className={`cv-etiqueta ${isAmigoTier ? "two-line" : ""}`}>
                {tierName}
              </div>
              <div className="cv-detalhe">
                {formatPrice(priceCents, locale, copy.free)}
                {seats > 1 && (
                  <span className="cv-sub">
                    {seats} {copy.seatsLabel(seats)}
                  </span>
                )}
                {seats === 1 && (
                  <span className="cv-sub">{copy.onePerson}</span>
                )}
              </div>
              {seats > 1 && priceCents > 0 && (
                <div className="cv-total-line">
                  {copy.total} {formatPrice(total, locale, copy.free)}
                </div>
              )}
            </div>
            {checkedInAt && (
              <div className="cv-admitido">✓ {copy.admitted}</div>
            )}
          </div>
        </article>

        <section className="cv-details">
          <div className="cv-details-head">
            <div className="cv-details-sub">{copy.ticketDetails}</div>
            <div className="cv-details-serial">{serialCode}</div>
          </div>
          <dl className="cv-details-grid">
            <dt>{copy.name}</dt>
            <dd>{buyerName}</dd>
            <dt>{copy.ticketType}</dt>
            <dd>{tierName}</dd>
            <dt>{copy.seats}</dt>
            <dd>{seats}</dd>
            <dt>{copy.price}</dt>
            <dd>
              {formatPrice(priceCents, locale, copy.free)}
              {seats > 1 &&
                priceCents > 0 &&
                ` · ${copy.total} ${formatPrice(total, locale, copy.free)}`}
            </dd>
            {doorsAt && (
              <>
                <dt>{copy.doors}</dt>
                <dd>{formatTime(doorsAt)}</dd>
              </>
            )}
          </dl>
          <div className="cv-verso-texto">
            {ticketNote
              ? ticketNote
                  .split(/\n\s*\n/)
                  .map((p, i) => <p key={i}>{p.trim()}</p>)
              : null}
            {isAmigoTier ? (
              <p className="cv-assinatura">{copy.friendsSupport}</p>
            ) : (
              <p className="cv-assinatura">{copy.nonTransferable}</p>
            )}
          </div>
          <div className="cv-iva">{copy.vatExempt}</div>
        </section>
      </main>
    </>
  );
}
