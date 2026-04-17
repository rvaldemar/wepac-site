import "./ticket.css";

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
};

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(d)
    .toUpperCase()
    .replace(".", "");
}

function formatTime(d: Date): string {
  return new Intl.DateTimeFormat("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function formatPrice(cents: number): string {
  if (cents === 0) return "Grátis";
  const euros = cents / 100;
  return euros % 1 === 0
    ? `${euros.toFixed(0)} €`
    : `${euros.toFixed(2).replace(".", ",")} €`;
}

export function TicketView({
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
}: Props) {
  const total = priceCents * seats;

  return (
    <>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow:ital,wght@0,700;0,900;1,900&family=Inter:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <main className="bt-page">
        {welcome && (
          <div className="bt-welcome">
            Reserva confirmada. Enviámos o bilhete para o teu email.
          </div>
        )}
        <div className="bt-ticket">
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
              <dt>Tipo</dt>
              <dd className="bt-tier">{tierName}</dd>

              <dt>Nome</dt>
              <dd>{buyerName}</dd>

              <dt>Lugares</dt>
              <dd>{seats}</dd>

              <dt>Data</dt>
              <dd>
                {formatDate(startsAt)} · {formatTime(startsAt)}
              </dd>

              <dt>Local</dt>
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
                  <dt>Portas</dt>
                  <dd>{formatTime(doorsAt)}</dd>
                </>
              )}

              <dt>{priceCents > 0 ? "Preço" : "Entrada"}</dt>
              <dd>
                {formatPrice(priceCents)}
                {seats > 1 && priceCents > 0 && (
                  <span className="bt-total">
                    {" "}
                    · total {formatPrice(total)}
                  </span>
                )}
              </dd>

              {priceCents > 0 && (
                <>
                  <dt>Pagamento</dt>
                  <dd>À entrada</dd>
                </>
              )}
            </dl>

            <hr className="bt-divider" />

            <div className="bt-code-block">
              <div className="bt-code-label">Código de Entrada</div>
              <div
                className="bt-qr"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
              <div className="bt-code">{serialCode}</div>
              {checkedInAt && <div className="bt-checked">✓ Admitido</div>}
            </div>

            <hr className="bt-divider" />

            <div className="bt-instructions">
              <p>Intransmissível. Apresentar à entrada.</p>
              <p>Sem fotografias ou gravações durante o espectáculo.</p>
            </div>
          </div>

          <div className="bt-footer">
            <div className="bt-logo-footer">wepac</div>
            <div className="bt-tagline">Cultura que transforma</div>
          </div>
        </div>
      </main>
    </>
  );
}
