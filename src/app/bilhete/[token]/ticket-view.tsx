import "./ticket.css";

type Props = {
  name: string;
  seats: number;
  serialCode: string;
  qrSvg: string;
};

export function TicketView({ name, seats, serialCode, qrSvg }: Props) {
  return (
    <>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow:ital,wght@0,700;0,900;1,900&family=Inter:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <main className="sn-page">
        <div className="sn-ticket">
          <div className="sn-hero">
            <div className="sn-hero-overlay">
              <div className="sn-hero-top">
                <div className="sn-logo">wepac</div>
                <div className="sn-header-label">Bilhete</div>
              </div>
              <div className="sn-hero-bottom">
                <div className="sn-hero-pre">Pré-lançamento · Abril 2026</div>
                <h1 className="sn-h1">Jotta Pê</h1>
                <div className="sn-subtitle">Sem Nome</div>
              </div>
            </div>
          </div>

          <div className="sn-container">
            <dl className="sn-metadata">
              <dt>Nome</dt>
              <dd className="sn-name">{name}</dd>

              <dt>Lugares</dt>
              <dd>{seats}</dd>

              <dt>Data</dt>
              <dd>21 ABR 2026 · 19H</dd>

              <dt>Local</dt>
              <dd>
                R. Mar Adriático 620
                <br />
                Porto das Dunas · Aquiraz
              </dd>

              <dt>Porta</dt>
              <dd>18H30</dd>
            </dl>

            <hr className="sn-divider" />

            <div className="sn-code-block">
              <div className="sn-code-label">Código de Entrada</div>
              <div
                className="sn-qr"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
              <div className="sn-code">{serialCode}</div>
            </div>

            <hr className="sn-divider" />

            <div className="sn-instructions">
              <p>Intransmissível. Apresentar à entrada.</p>
              <p>Sem fotografias ou gravações durante o concerto.</p>
            </div>
          </div>

          <div className="sn-footer">
            <div className="sn-footer-brand">
              <div className="sn-logo-footer">wepac</div>
              <div className="sn-tagline">Cultura que transforma</div>
            </div>

            <div className="sn-socials">
              <a
                href="https://www.instagram.com/wepac.oficial/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <svg viewBox="0 0 24 24">
                  <path d="M12 2.2c3.2 0 3.6 0 4.8.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9s.7.8.9 1.4c.2.4.3 1 .4 2.2.1 1.2.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4s-.8.7-1.4.9c-.4.2-1 .3-2.2.4-1.2.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9s-.7-.8-.9-1.4c-.2-.4-.3-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4s.8-.7 1.4-.9c.4-.2 1-.3 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 2c-3.1 0-3.5 0-4.7.1-1.1.1-1.7.2-2.1.4-.5.2-.9.4-1.3.8s-.6.8-.8 1.3c-.2.4-.3 1-.4 2.1C2.6 8.5 2.6 8.9 2.6 12s0 3.5.1 4.7c.1 1.1.2 1.7.4 2.1.2.5.4.9.8 1.3s.8.6 1.3.8c.4.2 1 .3 2.1.4 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c1.1-.1 1.7-.2 2.1-.4.5-.2.9-.4 1.3-.8s.6-.8.8-1.3c.2-.4.3-1 .4-2.1.1-1.2.1-1.6.1-4.7s0-3.5-.1-4.7c-.1-1.1-.2-1.7-.4-2.1-.2-.5-.4-.9-.8-1.3s-.8-.6-1.3-.8c-.4-.2-1-.3-2.1-.4-1.2-.1-1.6-.1-4.7-.1zm0 3.4a4.4 4.4 0 1 1 0 8.8 4.4 4.4 0 0 1 0-8.8zm0 7.3a2.9 2.9 0 1 0 0-5.8 2.9 2.9 0 0 0 0 5.8zm5.6-7.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
                </svg>
              </a>
              <a
                href="https://wepac.pt"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Website"
              >
                <svg viewBox="0 0 24 24">
                  <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.9 6h-2.9a15.5 15.5 0 0 0-1.3-3.4A8 8 0 0 1 18.9 8zM12 4.1c.8 1 1.5 2.4 2 3.9h-4c.5-1.5 1.2-2.9 2-3.9zM4.3 14a8 8 0 0 1 0-4h3.3c-.1.7-.2 1.3-.2 2s.1 1.3.2 2H4.3zm.8 2h2.9a15.5 15.5 0 0 0 1.3 3.4A8 8 0 0 1 5.1 16zm2.9-8H5.1a8 8 0 0 1 4.2-3.4A15.5 15.5 0 0 0 8 8zM12 19.9c-.8-1-1.5-2.4-2-3.9h4c-.5 1.5-1.2 2.9-2 3.9zm2.3-5.9H9.7a13.2 13.2 0 0 1 0-4h4.6a13.2 13.2 0 0 1 0 4zm.3 5.4a15.5 15.5 0 0 0 1.3-3.4h2.9a8 8 0 0 1-4.2 3.4zM16.4 14c.1-.7.2-1.3.2-2s-.1-1.3-.2-2h3.3a8 8 0 0 1 0 4h-3.3z" />
                </svg>
              </a>
              <a href="mailto:info@wepac.pt" aria-label="Email">
                <svg viewBox="0 0 24 24">
                  <path d="M2 5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5zm2 .5v.4l8 5.3 8-5.3v-.4H4zm16 2.8-7.4 4.9a1 1 0 0 1-1.1 0L4 8.3V19h16V8.3z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
