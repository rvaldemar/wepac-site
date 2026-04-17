import "./capela-viva.css";

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
};

function romanMonth(m: number): string {
  return ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"][
    m
  ];
}

function formatShortDate(d: Date): string {
  return `${d.getDate()}·${romanMonth(d.getMonth())}`;
}

function formatTime(d: Date): string {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}H${mm}`;
}

function formatDateLong(d: Date): string {
  const months = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${d.getDate()} de ${months[d.getMonth()]} · ${hh}h${mm}`;
}

function formatPrice(cents: number): string {
  if (cents === 0) return "Grátis";
  const euros = cents / 100;
  return euros % 1 === 0
    ? `${euros.toFixed(0)}€`
    : `${euros.toFixed(2).replace(".", ",")}€`;
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

export function CapelaVivaTicketView({
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
}: Props) {
  const total = priceCents * seats;
  const isAmigoTier = /amigo/i.test(tierName);

  return (
    <>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Serif:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Rubik:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <main className="cv-page">
        {welcome && (
          <div className="cv-welcome">
            Reserva confirmada. Enviámos o bilhete para o teu email.
          </div>
        )}

        <article className="cv-ticket">
          <div
            className="cv-photo"
            style={{
              backgroundImage: `url(/bilheteira/capela-viva/ananda-roda.jpeg)`,
            }}
          />
          <div className="cv-corpo">
            <div className="cv-corpo-top">
              <div className="cv-tipo">{tierName}</div>
              <div className="cv-titulo-italico">A voz da</div>
              <div className="cv-titulo-principal">Ibéria Antiga</div>
              <Ornamento />
              <div className="cv-artista">
                Ananda Roda
                <span className="cv-instrumento">vihuela</span>
              </div>
            </div>
            <div className="cv-corpo-bottom">
              <div className="cv-info">
                <div className="cv-data">{formatDateLong(startsAt)}</div>
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
                {formatPrice(priceCents)}
                {seats > 1 && (
                  <span className="cv-sub">{seats} lugares</span>
                )}
                {seats === 1 && <span className="cv-sub">uma pessoa</span>}
              </div>
              {seats > 1 && priceCents > 0 && (
                <div className="cv-total-line">
                  total {formatPrice(total)}
                </div>
              )}
            </div>
            {checkedInAt && <div className="cv-admitido">✓ Admitido</div>}
          </div>
        </article>

        <section className="cv-details">
          <div className="cv-details-head">
            <div className="cv-details-sub">Detalhes do bilhete</div>
            <div className="cv-details-serial">{serialCode}</div>
          </div>
          <dl className="cv-details-grid">
            <dt>Nome</dt>
            <dd>{buyerName}</dd>
            <dt>Tipo</dt>
            <dd>{tierName}</dd>
            <dt>Lugares</dt>
            <dd>{seats}</dd>
            <dt>Preço</dt>
            <dd>
              {formatPrice(priceCents)}
              {seats > 1 && priceCents > 0 && ` · total ${formatPrice(total)}`}
            </dd>
            {doorsAt && (
              <>
                <dt>Portas</dt>
                <dd>{formatTime(doorsAt)}</dd>
              </>
            )}
          </dl>
          <div className="cv-verso-texto">
            <p>
              A vihuela antecedeu a guitarra em duzentos anos. Quase ninguém a
              toca hoje.
            </p>
            <p>
              Ananda Roda, formada em música antiga, devolve o som de um
              repertório que atravessou a Ibéria em mãos de poetas, monges e
              peregrinos.
            </p>
            <p>
              A Capela do Hospital de Jesus é barroca, pequena e sonora.
              Senta-se, escuta-se, regressa-se.
            </p>
            {isAmigoTier ? (
              <p className="cv-assinatura">
                Amigos WEPAC · sustentam a programação da Capela Viva.
                Obrigado.
              </p>
            ) : (
              <p className="cv-assinatura">
                Intransmissível. Apresentar à entrada.
              </p>
            )}
          </div>
          <div className="cv-iva">
            Isento de IVA ao abrigo do art.º 9.º do CIVA.
          </div>
        </section>
      </main>
    </>
  );
}
