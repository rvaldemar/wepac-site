import Link from "next/link";

export const metadata = {
  title: "Wessex | WEPAC — Música ao vivo para eventos especiais",
  description:
    "Música ao vivo feita sob medida para casamentos, eventos e celebrações íntimas. Do quarteto de cordas à serenata surpresa.",
};

const fontSerif = "font-[family-name:var(--font-pt-serif)]";

export default function WessexPage() {
  return (
    <div className="bg-black text-white overflow-x-hidden">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-40 bg-gradient-to-b from-black/60 to-transparent">
        <div className="container mx-auto px-6 lg:px-16 py-6 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold tracking-wider">
            WEPAC
          </Link>
          <nav className="hidden md:flex items-center gap-8 lg:gap-16 text-sm lg:text-base font-medium">
            <a href="#quem-somos" className="hover:text-[#b8a042] transition">QUEM SOMOS</a>
            <a href="#eventos" className="hover:text-[#b8a042] transition">EVENTOS</a>
            <a href="#big-ideia" className="hover:text-[#b8a042] transition">BIG IDEIA</a>
            <a href="#depoimentos" className="hover:text-[#b8a042] transition">DEPOIMENTOS</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative w-full min-h-[600px] md:min-h-[867px] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/wessex/hero.jpg"
            alt="Wessex Performance"
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(83.6deg, rgb(0,0,0) 31.9%, rgba(0,0,0,0) 82.7%)",
            }}
          />
        </div>

        <div className="relative z-10 container mx-auto px-6 lg:px-16 py-32 md:py-0">
          <div className="max-w-2xl">
            <h1
              className={`${fontSerif} font-bold text-white text-4xl md:text-5xl lg:text-[64px] leading-[1.125] mb-12`}
            >
              A música que transforma celebração em{" "}
              <em className="italic font-normal">memória inesquecível</em>.
            </h1>
            <p className="font-light text-white text-lg md:text-2xl lg:text-[28px] leading-[1.3] mb-12">
              Música ao vivo feita sob medida para{" "}
              <span className="font-semibold">casamentos</span>,{" "}
              <span className="font-semibold">eventos</span> e{" "}
              <span className="font-semibold">celebrações íntimas</span>. Do
              quarteto de cordas à serenata surpresa, criamos{" "}
              <span className="font-semibold">experiências com elegância</span>,{" "}
              <span className="font-semibold">emoção</span> e{" "}
              <span className="font-semibold">impacto</span>.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="#cta"
                className="inline-flex items-center justify-center bg-[#b8a042] text-black font-medium text-lg lg:text-xl px-8 py-4 rounded-xl hover:bg-[#c9b04f] transition w-full sm:w-[311px] h-[60px]"
              >
                Reserva a tua data
              </Link>
              <Link
                href="#depoimentos"
                className="inline-flex items-center justify-center border border-white text-white font-medium text-lg lg:text-xl px-8 py-4 rounded-xl hover:bg-white hover:text-black transition w-full sm:w-[311px] h-[60px]"
              >
                Ouve a nossa música
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="bg-[#540000] py-6 md:py-8">
        <div className="container mx-auto px-6 lg:px-16">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 lg:gap-32 text-center md:text-left">
            <p className="font-light text-base md:text-xl lg:text-[28px] text-white uppercase">
              Resposta em menos de 24h
            </p>
            <p className="font-light text-base md:text-xl lg:text-[28px] text-white uppercase">
              Sem compromisso inicial
            </p>
            <p className="font-light text-base md:text-xl lg:text-[28px] text-white uppercase">
              Proposta personalizada e gratuita
            </p>
          </div>
        </div>
      </section>

      {/* Quem Somos - Hero Block */}
      <section id="quem-somos" className="relative bg-black py-20 md:py-32">
        <div className="container mx-auto px-6 lg:px-16">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div className="relative">
              <div className="relative w-full aspect-[448/750] max-w-[448px] mx-auto bg-[#2c2d2e]">
                <img
                  src="/images/wessex/quem-somos.jpg"
                  alt="Quem somos"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="space-y-12">
              <h2
                className={`${fontSerif} text-[#d3d2d1] text-6xl md:text-8xl lg:text-[180px] leading-[1] mix-blend-difference`}
              >
                Quem
                <br />
                somos
              </h2>
              <p className="text-[#d3d2d1] text-2xl md:text-3xl lg:text-5xl leading-tight max-w-md">
                Mais do que música ao vivo.{" "}
                <span className="font-semibold text-white">
                  Uma experiência construída para o teu momento
                </span>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quem Somos - Detail */}
      <section className="bg-black py-12 md:py-20">
        <div className="container mx-auto px-6 lg:px-16">
          <p
            className={`${fontSerif} text-[#fcfcfc] text-3xl md:text-4xl uppercase mb-8`}
          >
            quem somos
          </p>

          <div className="grid lg:grid-cols-3 gap-12 items-start">
            <div className="relative w-full aspect-[436/458] bg-[#2c2d2e]">
              <img
                src="/images/wessex/detail.jpg"
                alt="Wessex"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>

            <div className="lg:col-span-2 grid md:grid-cols-2 gap-12">
              <p className="text-[#fcfcfc] text-base md:text-lg lg:text-[22px] leading-[1.3]">
                A Wessex nasceu de uma convicção simples: a música tem o poder
                de elevar qualquer momento e quando é feita com intenção,
                torna-se a memória que as pessoas guardam para sempre. Somos um
                ensemble de músicos profissionais especializados em eventos
                especiais. Cada performance é construída à medida do teu evento,
                do teu espaço e da emoção que queres criar. Não existe uma
                fórmula. Existe atenção, dedicação e a certeza de que o teu
                momento é único.
              </p>
              <p className="text-[#fcfcfc] text-base md:text-lg lg:text-[22px] leading-[1.3]">
                Trabalhamos com noivos que querem uma cerimónia que arrepia, com
                empresas que querem um jantar que impressiona, com pessoas que
                querem criar uma surpresa que não se esquece. O que une todos? A
                vontade de que a música faça a diferença.
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-8 md:gap-16 mt-20">
            {[
              { number: "X+", label: "EVENTOS REALIZADOS" },
              { number: "X+", label: "CASAMENTOS MARCADOS\nDE FORMA ESPECIAL" },
              { number: "X+", label: "MUSICAS CRIADAS SOB\nMEDIDA" },
            ].map((stat, i) => (
              <div key={i} className="space-y-3">
                <div className="flex items-start gap-3 text-[#fcfcfc]">
                  <span className="text-5xl md:text-[56px] leading-none">X</span>
                  <span className="text-5xl md:text-[62px] leading-[0.8]">+</span>
                </div>
                <p className="font-bold text-base md:text-lg lg:text-[22px] text-[#fcfcfc] whitespace-pre-line">
                  {stat.label}
                </p>
                <div className="h-px w-full max-w-[204px] bg-[#fcfcfc]" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Eventos - Title */}
      <section id="eventos" className="bg-black py-12 md:py-20">
        <div className="container mx-auto px-6 lg:px-16">
          <h2 className="text-[#d3d2d1] text-4xl md:text-6xl lg:text-[96px] leading-tight max-w-[1410px]">
            Uma performance para cada momento de forma adaptada a celebração.
          </h2>
        </div>
      </section>

      {/* Eventos - 3 Cards */}
      <section className="bg-black pb-20 md:pb-32">
        <div className="container mx-auto px-6 lg:px-16">
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
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
                subtitle:
                  "Para os momentos que não precisam de ser grandes, só de ser inesquecíveis.",
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
                subtitle:
                  "A música certa transforma um evento de empresa num momento de prestígio.",
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
            ].map((card, i) => (
              <div key={i} className="space-y-6">
                <div className="relative w-full aspect-[384/240] overflow-hidden">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <h3 className={`${fontSerif} text-2xl text-[#fcfcfc]`}>
                  {card.title}
                </h3>

                <p className="font-bold text-base text-[#fcfcfc]">
                  {card.subtitle}
                </p>

                <ul className="list-disc pl-6 space-y-1.5 text-base text-[#fcfcfc]">
                  {card.items.map((item, j) => (
                    <li key={j} className="leading-snug">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Big Ideia - 4 Features */}
      <section
        id="big-ideia"
        className="bg-[#2c2d2e] py-20 md:py-32"
      >
        <div className="container mx-auto px-6 lg:px-16">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            <div className="space-y-12">
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
              ].map((feature, i) => (
                <div key={i} className="space-y-3">
                  <h3 className="capitalize text-[#d3d2d1] text-2xl md:text-3xl lg:text-[37px]">
                    {feature.title}
                  </h3>
                  <p className="text-[#d3d2d1] text-sm md:text-base lg:text-[18px] leading-relaxed">
                    {feature.text}
                  </p>
                </div>
              ))}
            </div>

            <div className="relative w-full aspect-[476/591]">
              <img
                src="/images/wessex/features.jpg"
                alt="Wessex Features"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Banner image */}
        <div className="container mx-auto px-6 lg:px-16 mt-16 md:mt-24">
          <div className="relative w-full aspect-[1440/480]">
            <img
              src="/images/wessex/banner.jpg"
              alt="Wessex Banner"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section id="depoimentos" className="bg-black py-20 md:py-32">
        <div className="container mx-auto px-6 lg:px-16">
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-6">
                <div className="relative w-full aspect-[438/407] overflow-hidden">
                  <img
                    src="/images/wessex/testimonial.jpg"
                    alt={`Cliente ${i}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-6">
                  <div className="space-y-6">
                    <p className="font-extralight text-2xl text-[#fcfcfc]">
                      2024
                    </p>
                    <p
                      className={`${fontSerif} font-bold text-3xl md:text-4xl text-[#fcfcfc]`}
                    >
                      Nome do Cliente
                    </p>
                  </div>
                  <p className="text-xl md:text-2xl text-[#fcfcfc] leading-snug">
                    Lorem Ipsum is simply dummy text of the printing and
                    typesetting industry. Lorem Ipsum has been the industry's
                    standard dummy text ever since the 1500s, when an unknown
                    printer took a galley of type and scrambled it to make
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section id="cta" className="bg-black py-20 md:py-32">
        <div className="container mx-auto px-6 lg:px-16">
          <div className="bg-[#2c2d2e] relative grid lg:grid-cols-2 gap-12 items-center p-8 md:p-16">
            <div className="relative w-full aspect-[450/675] max-w-[450px] mx-auto">
              <img
                src="/images/wessex/cta.jpg"
                alt="Wessex CTA"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-8">
              <p className="text-[#d3d2d1] text-2xl md:text-3xl lg:text-[37px] leading-tight">
                <span className="font-semibold text-white">
                  O próximo será o seu
                </span>
                , preencha o formulário abaixo para que possamos entrar em
                contacto para montar uma proposta personalizada.
              </p>

              <ul className="list-disc pl-8 space-y-2 text-lg md:text-xl lg:text-2xl text-[#d3d2d1]">
                <li>Consultoria de repertório gratuita</li>
                <li>Registro de em vídeo do momento</li>
                <li>Prioridade de data</li>
              </ul>

              <Link
                href="/contacto"
                className="inline-flex items-center justify-center bg-[#b8a042] text-black font-medium text-lg lg:text-xl px-8 py-4 rounded-xl hover:bg-[#c9b04f] transition w-full sm:w-[311px] h-[60px]"
              >
                Reserva a tua data
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#d3d2d1] text-black py-12 md:py-16">
        <div className="container mx-auto px-6 lg:px-16">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
            <Link href="/" className="text-2xl font-bold tracking-wider">
              WEPAC
            </Link>
            <div className="flex items-center gap-4">
              <a href="#" aria-label="Facebook" className="hover:opacity-60 transition">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="#" aria-label="Instagram" className="hover:opacity-60 transition">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href="#" aria-label="Twitter" className="hover:opacity-60 transition">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
              </a>
              <a href="#" aria-label="LinkedIn" className="hover:opacity-60 transition">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
            </div>
          </div>
          <div className="border-t border-black/20 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
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
