import Link from "next/link";

export const metadata = {
  title: "Wessex | WEPAC — Música ao vivo para eventos especiais",
  description:
    "Música ao vivo feita sob medida para casamentos, eventos e celebrações íntimas. Do quarteto de cordas à serenata surpresa.",
};

const serif = "font-[family-name:var(--font-pt-serif)]";

export default function WessexPage() {
  return (
    <div className="bg-black text-white overflow-x-hidden">
      {/* HEADER */}
      <header className="absolute top-0 left-0 right-0 z-50 h-[80px] lg:h-[100px]">
        <div className="h-full px-6 md:px-10 xl:px-16 flex items-center justify-between max-w-[1600px] mx-auto">
          <Link href="/wessex" className="flex items-center text-white">
            <img
              src="/images/wessex/logo/main-white.png"
              alt="Wessex"
              className="h-9 sm:h-11 lg:h-[52px] w-auto"
            />
          </Link>
          <nav className="hidden lg:flex items-center gap-8 xl:gap-14 text-[15px] xl:text-[18px] font-medium tracking-wider text-white">
            <a href="#quem-somos" className="hover:text-[#B8A042] transition">QUEM SOMOS</a>
            <a href="#eventos" className="hover:text-[#B8A042] transition">EVENTOS</a>
            <a href="#big-ideia" className="hover:text-[#B8A042] transition">BIG IDEIA</a>
            <a href="#depoimentos" className="hover:text-[#B8A042] transition">DEPOIMENTOS</a>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="relative w-full h-[640px] sm:h-[720px] lg:h-screen lg:min-h-[640px] lg:max-h-[900px] overflow-hidden flex flex-col">
        <div className="absolute inset-0">
          <img
            src="/images/wessex/hero.jpg"
            alt=""
            className="absolute w-full h-full object-cover object-center"
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "linear-gradient(83.62deg, rgb(0,0,0) 31.9%, rgba(0,0,0,0) 82.65%)",
            }}
          />
        </div>

        <div className="relative z-10 flex-1 max-w-[1600px] w-full mx-auto px-6 md:px-10 lg:px-16 xl:px-24 pt-[140px] lg:pt-[200px]">
          <p className={`${serif} font-bold text-white text-[26px] sm:text-[36px] md:text-[48px] lg:text-[60px] leading-[1.15] max-w-full lg:max-w-[640px] mb-5 lg:mb-10 break-words`}>
            A música que transforma celebração em{" "}
            <em className="italic font-normal">memória inesquecível</em>.
          </p>
          <p className="font-light text-white text-[13px] sm:text-[16px] lg:text-[22px] leading-[1.5] max-w-full lg:max-w-[600px] mb-5 lg:mb-10 break-words">
            Música ao vivo feita sob medida para{" "}
            <span className="font-semibold">casamentos</span>,{" "}
            <span className="font-semibold">eventos</span> e{" "}
            <span className="font-semibold">celebrações íntimas</span>. Do
            quarteto de cordas à serenata surpresa, criamos{" "}
            <span className="font-semibold">experiências com elegância</span>,{" "}
            <span className="font-semibold">emoção</span> e{" "}
            <span className="font-semibold">impacto</span>.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/servicos/orcamento"
              className="flex items-center justify-center bg-[#B8A042] text-black font-medium text-[16px] lg:text-[18px] w-full sm:w-[260px] h-[52px] lg:h-[56px] rounded-[12px] hover:bg-[#c9b04f] transition"
            >
              Simular orçamento
            </Link>
            <Link
              href="/contacto"
              className="flex items-center justify-center border border-white text-white font-medium text-[16px] lg:text-[18px] w-full sm:w-[260px] h-[52px] lg:h-[56px] rounded-[12px] hover:bg-white hover:text-black transition"
            >
              Fala connosco
            </Link>
          </div>
        </div>

        {/* TRUST BAR — at bottom of hero viewport */}
        <div className="relative z-10 bg-[#540000] flex-shrink-0">
          <div className="max-w-[1600px] mx-auto h-auto md:h-[88px] flex flex-col md:flex-row items-center justify-around gap-2 md:gap-8 px-6 md:px-10 py-5 md:py-0 text-center">
            <p className="font-light text-[12px] md:text-[16px] lg:text-[22px] text-white uppercase">
              Resposta em menos de 24h
            </p>
            <p className="font-light text-[12px] md:text-[16px] lg:text-[22px] text-white uppercase">
              Sem compromisso inicial
            </p>
            <p className="font-light text-[12px] md:text-[16px] lg:text-[22px] text-white uppercase">
              Proposta personalizada e gratuita
            </p>
          </div>
        </div>
      </section>

      {/* QUEM SOMOS Hero — dramatic with image + big text */}
      <section
        id="quem-somos"
        className="relative bg-black overflow-hidden py-16 lg:py-0 lg:h-[900px]"
      >
        {/* Mobile/Tablet stacked */}
        <div className="lg:hidden max-w-[1200px] mx-auto px-6 md:px-10">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="relative aspect-[844/1500] max-w-[420px] mx-auto md:mx-0">
              <img
                src="/images/wessex/quem-somos.jpg"
                alt="Wessex performance"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
            <div className="space-y-6">
              <h2 className={`${serif} text-white text-[44px] sm:text-[56px] md:text-[68px] leading-[0.95] font-normal`}>
                Quem<br />somos
              </h2>
              <p className="text-[#EFEFF0] text-[16px] md:text-[18px] leading-[1.5] max-w-[400px]">
                Mais do que música ao vivo.{" "}
                <span className="font-semibold text-white">
                  Uma experiência construída para o teu momento
                </span>
                .
              </p>
            </div>
          </div>
        </div>

        {/* Desktop dramatic absolute */}
        <div className="hidden lg:block max-w-[1400px] mx-auto h-full relative px-16">
          {/* Dark rectangle — small, behind right edge of image + subtitle */}
          <div className="absolute left-[30vw] top-[16vh] w-[35vw] h-[70vh] bg-[#2c2d2e]">
            {/* Subtitle in available gray area (right of image), equal margins all sides */}
            <div className="absolute left-[33%] top-0 right-0 bottom-0 flex items-center justify-center">
              <p className="text-[#9ca0a3] text-[30px] leading-[1.3] font-light max-w-[280px]">
                Mais do que música ao vivo.{" "}
                <span className="font-bold text-white">
                  Uma experiência construída para o teu momento.
                </span>
              </p>
            </div>
          </div>

          {/* Image — overlaps left edge of dark box */}
          <div className="absolute left-[18vw] top-[20vh] w-[24%] aspect-[448/750]">
            <img
              src="/images/wessex/quem-somos.jpg"
              alt="Wessex performance"
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
          </div>

          {/* Big "Quem somos" text — partially overlaps top-right of dark box */}
          <h2
            className={`${serif} absolute left-[50%] top-[5vh] text-[#d3d2d1] font-normal leading-[0.92]`}
            style={{ fontSize: "clamp(110px, 11vw, 160px)" }}
          >
            Quem<br />somos
          </h2>

        </div>
      </section>

      {/* QUEM SOMOS Detail */}
      <section className="bg-black py-12 lg:py-20">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-16">
          <p className={`${serif} text-[#FCFCFC] text-[20px] md:text-[24px] uppercase mb-8 lg:mb-12`}>
            quem somos
          </p>

          <div className="grid lg:grid-cols-[400px_1fr_1fr] gap-8 lg:gap-12 items-start">
            <div className="relative w-full max-w-[400px] mx-auto lg:mx-0 aspect-[4/3]">
              <img
                src="/images/wessex/detail.jpg"
                alt=""
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
            </div>

            <p className="text-[#FCFCFC] text-[15px] md:text-[16px] lg:text-[18px] leading-[1.55]">
              A Wessex nasceu de uma convicção simples: a música tem o poder de
              elevar qualquer momento e quando é feita com intenção, torna-se a
              memória que as pessoas guardam para sempre. Somos um ensemble de
              músicos profissionais especializados em eventos especiais. Cada
              performance é construída à medida do teu evento, do teu espaço e
              da emoção que queres criar.
            </p>

            <p className="text-[#FCFCFC] text-[15px] md:text-[16px] lg:text-[18px] leading-[1.55]">
              Trabalhamos com noivos que querem uma cerimónia que arrepia, com
              empresas que querem um jantar que impressiona, com pessoas que
              querem criar uma surpresa que não se esquece. O que une todos? A
              vontade de que a música faça a diferença.
            </p>
          </div>
        </div>
      </section>

      {/* EVENTOS Title */}
      <section id="eventos" className="bg-black pt-12 lg:pt-20">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-16">
          <h2 className={`${serif} text-[#EFEFF0] text-[28px] sm:text-[36px] md:text-[44px] lg:text-[56px] leading-[1.15] font-normal max-w-[1100px]`}>
            Uma performance para cada momento de forma adaptada a celebração.
          </h2>
        </div>
      </section>

      {/* 3 Cards */}
      <section className="bg-black py-12 lg:py-16">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
            {[
              {
                title: "Casamento",
                subtitle: "O dia mais importante merece a música mais especial.",
                image: "/images/wessex/card-casamento.jpg",
                items: [
                  "Cerimónia: entrada da noiva, troca de alianças, saída",
                  "Cocktail: ambiente elegante e envolvente",
                  "Jantar e recepção: repertório personalizado",
                  "Formatos: solo, duo, trio ou quarteto",
                  "Com ou sem voz",
                  "Repertório 100% adaptado ao casal",
                ],
              },
              {
                title: "Cocktail & Celebrações",
                subtitle: "Para os momentos que não precisam de ser grandes, só de ser inesquecíveis.",
                image: "/images/wessex/card-cocktail.jpg",
                items: [
                  "Jantares privados e aniversários em casa",
                  "Pedidos de casamento e serenatas surpresa",
                  "Celebrações íntimas e momentos especiais",
                  "Rooftops, jardins, restaurantes e hotéis",
                  "Formatos compactos a partir de duo",
                  "Organização total do momento surpresa",
                ],
              },
              {
                title: "Corporativo",
                subtitle: "A música certa transforma um evento de empresa num momento de prestígio.",
                image: "/images/wessex/card-corporativo.jpg",
                items: [
                  "Jantares de gala e eventos de empresa",
                  "Lançamentos de produto e apresentações VIP",
                  "Cocktails e recepções corporativas",
                  "Espaços corporativos, hotéis e auditórios",
                  "Tom elegante e profissional garantido",
                  "Proposta comercial detalhada para RH e Marketing",
                ],
              },
            ].map((card) => (
              <div key={card.title} className="space-y-5">
                <div className="relative aspect-[16/10]">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
                <h3 className={`${serif} text-[22px] lg:text-[24px] text-[#FCFCFC]`}>
                  {card.title}
                </h3>
                <p className="font-bold text-[14px] lg:text-[15px] text-[#FCFCFC] leading-[1.3]">
                  {card.subtitle}
                </p>
                <ul className="list-disc pl-5 space-y-1 text-[13px] lg:text-[14px] text-[#FCFCFC] leading-[1.5]">
                  {card.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BIG IDEIA */}
      <section id="big-ideia" className="bg-black py-12 lg:py-20">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-16 space-y-0">
          <div className="bg-[#2c2d2e] py-10 lg:py-14 px-8 lg:px-14 grid lg:grid-cols-[1fr_360px] gap-10 lg:gap-14 items-center">
            <div className="space-y-6 lg:space-y-7">
              {[
                {
                  title: "Música sob medida:",
                  text: "Nenhuma performance é igual à anterior. O repertório, o formato e a intensidade são pensados especificamente para o teu evento, o teu espaço e a emoção que queres criar.",
                },
                {
                  title: "Músicos profissionais",
                  text: "Formação clássica, experiência em eventos premium e capacidade de adaptar qualquer género musical — do clássico ao contemporâneo com elegância e precisão.",
                },
                {
                  title: "Flexibilidade de formatos",
                  text: "Solo, duo, trio ou quarteto com ou sem voz. Adaptamos o ensemble ao teu orçamento, ao espaço disponível e ao momento do evento onde queremos causar mais impacto.",
                },
                {
                  title: "História e impacto musical",
                  text: "A nossa missão não é tocar bem é fazer as pessoas sentir. Cada nota é colocada com intenção. O objectivo é sempre o mesmo: criar o momento que todos vão querer reviver.",
                },
              ].map((feature) => (
                <div key={feature.title} className="space-y-2">
                  <h3 className="capitalize text-white text-[18px] sm:text-[20px] lg:text-[24px] leading-[1.2] font-normal">
                    {feature.title}
                  </h3>
                  <p className="text-[#EFEFF0] text-[13px] sm:text-[14px] lg:text-[15px] leading-[1.55]">
                    {feature.text}
                  </p>
                </div>
              ))}
            </div>

            <div className="relative w-full max-w-[360px] mx-auto lg:mx-0 aspect-[360/440]">
              <img
                src="/images/wessex/features.jpg"
                alt=""
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
            </div>
          </div>

          {/* Banner */}
          <div className="relative w-full h-[200px] sm:h-[280px] lg:h-[340px]">
            <img
              src="/images/wessex/banner.jpg"
              alt=""
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section id="depoimentos" className="bg-[#540000] py-12 lg:py-20">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-16">
          <h2 className={`${serif} italic text-white text-[36px] sm:text-[44px] lg:text-[56px] mb-10 lg:mb-14`}>
            Feedback
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-7">
            {[
              {
                name: "Giovanna Fraga",
                quote: "A música no nosso casamento foi incrível! Tocada pelo Grupo Wessex, com emoção e sensibilidade, tornou o momento ainda mais especial. Convidados encantados e um dia inesquecível. Obrigada!",
              },
              {
                name: "Pedro Azevedo",
                quote: "A música no nosso casamento foi simplesmente emocionante! Cada nota trouxe um toque especial ao momento, tornando tudo ainda mais inesquecível. A sensibilidade e o talento fizeram toda a diferença.",
              },
              {
                name: "Dinamene Silva",
                quote: "Que momento mágico! A música tornou nosso pedido de casamento ainda mais especial e emocionante. Cada nota transmitiu amor e tornou o momento inesquecível.",
              },
              {
                name: "Chef Eunice Silveira",
                quote: "O talento do saxofonista trouxe um toque de elegância e animação à festa de 18 anos da minha cliente. A música envolvente criou uma atmosfera incrível e encantou a todos.",
              },
            ].map((t) => (
              <div key={t.name} className="border border-white/40 rounded-2xl p-6 lg:p-8 relative">
                <span className={`${serif} italic absolute -top-4 left-6 bg-[#540000] px-2 text-white text-[40px] leading-none`}>
                  &ldquo;
                </span>
                <p className={`${serif} italic text-white/90 text-[14px] lg:text-[16px] leading-[1.55] mb-4`}>
                  {t.quote}
                </p>
                <p className={`${serif} italic text-white text-[14px] lg:text-[16px]`}>
                  {t.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="bg-black py-12 lg:py-20">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-16">
          <div className="bg-[#2c2d2e] relative grid lg:grid-cols-[360px_1fr] items-center gap-8 lg:gap-12 px-6 sm:px-8 lg:pl-0 lg:pr-12 py-10 lg:py-12 lg:min-h-[420px]">
            <div className="relative w-full max-w-[320px] mx-auto lg:mx-0 lg:ml-12 aspect-[3/4] lg:-mt-16 lg:-mb-16 lg:max-w-none lg:w-[320px] lg:h-[520px]">
              <img
                src="/images/wessex/cta.jpg"
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>

            <div className="space-y-5 max-w-[560px]">
              <p className="text-[#EFEFF0] text-[18px] sm:text-[20px] md:text-[24px] lg:text-[26px] leading-[1.35]">
                <span className="font-semibold text-white">
                  O próximo será o seu
                </span>
                , preencha o formulário abaixo para que possamos entrar em
                contacto para montar uma proposta personalizada.
              </p>

              <ul className="list-disc pl-6 space-y-1 text-[14px] sm:text-[15px] lg:text-[16px] text-[#EFEFF0]">
                <li>Consultoria de repertório gratuita</li>
                <li>Registro de em vídeo do momento</li>
                <li>Prioridade de data</li>
              </ul>

              <Link
                href="/servicos/orcamento"
                className="inline-flex items-center justify-center bg-[#B8A042] text-black font-medium text-[16px] lg:text-[18px] w-full sm:w-[260px] h-[52px] lg:h-[56px] rounded-[12px] hover:bg-[#c9b04f] transition"
              >
                Simular orçamento
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#d3d2d1] text-black py-10 lg:py-14">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-16">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
            <Link href="/wessex" className="flex items-center">
              <img
                src="/images/wessex/logo/main-black.png"
                alt="Wessex"
                className="h-9 lg:h-11 w-auto"
              />
            </Link>
            <SocialIcons />
          </div>
          <div className="border-t border-black/20 pt-5 flex flex-col md:flex-row items-center justify-between gap-3 text-[14px] lg:text-[15px]">
            <p>© 2026, All right reserved.</p>
            <Link href="/privacidade" className="hover:opacity-60 transition">
              Terms and Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SocialIcons() {
  const socials = [
    {
      label: "Instagram",
      url: "https://www.instagram.com/wessex.pt/",
      path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z",
    },
  ];
  return (
    <div className="flex items-center gap-4 text-black">
      {socials.map((s) => (
        <a
          key={s.label}
          href={s.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={s.label}
          className="hover:opacity-60 transition"
        >
          <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d={s.path} />
          </svg>
        </a>
      ))}
    </div>
  );
}
