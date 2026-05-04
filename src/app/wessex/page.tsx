import Link from "next/link";

export const metadata = {
  title: "Wessex | WEPAC — Música ao vivo para eventos especiais",
  description:
    "Música ao vivo feita sob medida para casamentos, eventos e celebrações íntimas. Do quarteto de cordas à serenata surpresa.",
};

const serif = "font-[family-name:var(--font-pt-serif)]";

export default function WessexPage() {
  return (
    <div className="bg-black text-white min-h-screen overflow-x-hidden">
      {/* HEADER */}
      <header className="absolute top-0 left-0 right-0 z-50 h-[80px] lg:h-[103px] bg-gradient-to-b from-black/70 via-black/40 to-transparent">
        <div className="h-full px-6 lg:px-[60px] xl:px-[120px] flex items-center justify-between">
          <Link href="/wessex" className="flex items-center text-white">
            <img
              src="/images/wessex/logo/main-white.png"
              alt="Wessex"
              className="h-9 sm:h-11 lg:h-14 w-auto"
            />
          </Link>
          <nav className="hidden lg:flex items-center gap-[28px] xl:gap-[60px] text-[14px] xl:text-[18px] font-medium">
            <a href="#quem-somos" className="hover:text-[#B8A042] transition">
              QUEM SOMOS
            </a>
            <a href="#eventos" className="hover:text-[#B8A042] transition">
              EVENTOS
            </a>
            <a href="#big-ideia" className="hover:text-[#B8A042] transition">
              BIG IDEIA
            </a>
            <a href="#depoimentos" className="hover:text-[#B8A042] transition">
              DEPOIMENTOS
            </a>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="relative w-full min-h-[600px] sm:h-[700px] lg:h-[867px] overflow-hidden max-w-[100vw]">
        <div className="absolute inset-0">
          <img
            src="/images/wessex/hero.jpg"
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-right"
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(83.6deg, rgb(0,0,0) 31.9%, rgba(0,0,0,0) 82.7%)",
            }}
          />
        </div>

        <div className="relative z-10 h-full max-w-[1920px] mx-auto px-6 sm:px-10 lg:pl-[250px] lg:pr-6 pt-[140px] lg:pt-[175px]">
          <h1
            className={`${serif} font-bold text-white text-[28px] sm:text-[36px] md:text-[52px] lg:text-[64px] xl:text-[72px] leading-[1.15] max-w-full lg:max-w-[720px] mb-6 lg:mb-[48px] break-words`}
          >
            A música que transforma celebração em{" "}
            <em className="italic font-normal">memória inesquecível</em>.
          </h1>
          <p className="font-light text-white text-[14px] sm:text-[16px] md:text-[20px] lg:text-[26px] xl:text-[28px] leading-[1.5] max-w-full lg:max-w-[660px] mb-8 lg:mb-[48px] break-words">
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
            <a
              href="#cta"
              className="flex items-center justify-center bg-[#B8A042] text-black font-medium text-[16px] sm:text-[18px] lg:text-[20px] w-full sm:w-[280px] lg:w-[311px] h-[52px] lg:h-[60px] rounded-[12px] hover:bg-[#c9b04f] transition"
            >
              Reserva a tua data
            </a>
            <a
              href="#depoimentos"
              className="flex items-center justify-center border border-white text-white font-medium text-[16px] sm:text-[18px] lg:text-[20px] w-full sm:w-[280px] lg:w-[311px] h-[52px] lg:h-[60px] rounded-[12px] hover:bg-white hover:text-black transition"
            >
              Ouve a nossa música
            </a>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="bg-[#540000]">
        <div className="max-w-[1920px] mx-auto h-auto md:h-[100px] flex flex-col md:flex-row items-center justify-around gap-3 md:gap-[40px] px-6 py-5 md:py-0 text-center">
          <p className="font-light text-[12px] sm:text-[14px] md:text-[18px] lg:text-[24px] xl:text-[28px] text-white uppercase tracking-wide">
            Resposta em menos de 24h
          </p>
          <p className="font-light text-[12px] sm:text-[14px] md:text-[18px] lg:text-[24px] xl:text-[28px] text-white uppercase tracking-wide">
            Sem compromisso inicial
          </p>
          <p className="font-light text-[12px] sm:text-[14px] md:text-[18px] lg:text-[24px] xl:text-[28px] text-white uppercase tracking-wide">
            Proposta personalizada e gratuita
          </p>
        </div>
      </section>

      {/* QUEM SOMOS - Hero block (large) */}
      <section
        id="quem-somos"
        className="relative bg-black overflow-hidden py-20 lg:py-0 lg:h-[1200px]"
      >
        {/* Dark rectangle background (right) */}
        <div className="hidden lg:block absolute right-[10%] top-[200px] w-[795px] h-[957px] bg-[#2c2d2e]" />

        {/* Image */}
        <div className="relative lg:absolute lg:left-[19.7%] lg:top-[270px] w-full lg:w-[448px] h-[400px] sm:h-[500px] lg:h-[750px] z-10 px-6 lg:px-0">
          <img
            src="/images/wessex/quem-somos.jpg"
            alt="Wessex performance"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Big "Quem somos" + subtitle */}
        <div className="relative lg:absolute lg:left-[40%] lg:top-[50px] z-20 mt-12 lg:mt-0 px-6 lg:px-0 max-w-full lg:max-w-[841px]">
          <h2
            className={`${serif} text-[#EFEFF0] text-[64px] sm:text-[110px] md:text-[170px] lg:text-[260px] xl:text-[288px] leading-[0.95] font-normal`}
            style={{ mixBlendMode: "difference" }}
          >
            Quem
            <br />
            somos
          </h2>
          <p
            className="text-[#d3d2d1] text-[24px] md:text-[36px] lg:text-[48px] leading-[1.05] mt-12 lg:mt-[80px] max-w-[323px]"
            style={{ mixBlendMode: "difference" }}
          >
            Mais do que música ao vivo.{" "}
            <span className="font-semibold text-white">
              Uma experiência construída para o teu momento
            </span>
            .
          </p>
        </div>
      </section>

      {/* QUEM SOMOS - Detail */}
      <section className="bg-black pt-12 lg:pt-20 pb-12 lg:pb-32">
        <div className="max-w-[1920px] mx-auto px-6 lg:px-[260px]">
          <p className={`${serif} text-[#FCFCFC] text-[22px] sm:text-[28px] md:text-[36px] uppercase mb-8 lg:mb-12`}>
            quem somos
          </p>

          <div className="grid lg:grid-cols-[436px_1fr] gap-8 lg:gap-[74px] items-start">
            <div className="relative w-full max-w-[436px] mx-auto lg:mx-0 aspect-[436/458]">
              <img
                src="/images/wessex/detail.jpg"
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6 lg:gap-[52px]">
              <p className="text-[#FCFCFC] text-[15px] sm:text-[16px] md:text-[19px] lg:text-[22px] leading-[1.45]">
                A Wessex nasceu de uma convicção simples: a música tem o poder
                de elevar qualquer momento e quando é feita com intenção,
                torna-se a memória que as pessoas guardam para sempre. Somos um
                ensemble de músicos profissionais especializados em eventos
                especiais. Cada performance é construída à medida do teu evento,
                do teu espaço e da emoção que queres criar. Não existe uma
                fórmula. Existe atenção, dedicação e a certeza de que o teu
                momento é único.
              </p>
              <p className="text-[#FCFCFC] text-[15px] sm:text-[16px] md:text-[19px] lg:text-[22px] leading-[1.45]">
                Trabalhamos com noivos que querem uma cerimónia que arrepia, com
                empresas que querem um jantar que impressiona, com pessoas que
                querem criar uma surpresa que não se esquece. O que une todos? A
                vontade de que a música faça a diferença.
              </p>
            </div>
          </div>

          {/* Eventos onde participamos */}
          <div className="mt-16 lg:mt-24">
            <h3
              className={`${serif} italic text-[#FCFCFC] text-[24px] sm:text-[30px] md:text-[36px] lg:text-[42px] leading-[1.2] mb-8 lg:mb-12`}
            >
              É com gosto que já participamos em:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-[60px]">
              {[
                {
                  title: "Casamentos",
                  detail: "Cerimónias e Cocktails",
                },
                {
                  title: "Eventos Corporativos",
                  detail: "Jantares de gala e recepções",
                },
                {
                  title: "Celebrações Privadas",
                  detail: "Aniversários, pedidos e serenatas",
                },
              ].map((item) => (
                <div key={item.title} className="space-y-3 border-t border-white/30 pt-4">
                  <p className={`${serif} text-[#FCFCFC] text-[22px] sm:text-[26px] lg:text-[30px] leading-tight`}>
                    {item.title}
                  </p>
                  <p className="text-[#EFEFF0]/80 text-[14px] sm:text-[15px] lg:text-[17px] leading-[1.4]">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* EVENTOS - Title */}
      <section id="eventos" className="bg-black pt-12 lg:pt-32">
        <div className="max-w-[1920px] mx-auto px-6 lg:px-[260px]">
          <h2
            className="text-[#EFEFF0] text-[26px] sm:text-[36px] md:text-[56px] lg:text-[80px] xl:text-[96px] leading-[1.1] font-normal"
            style={{ mixBlendMode: "difference" }}
          >
            Uma performance para cada momento de forma adaptada a celebração.
          </h2>
        </div>
      </section>

      {/* EVENTOS - 3 Cards */}
      <section className="bg-black py-12 lg:py-20">
        <div className="max-w-[1920px] mx-auto px-6 lg:px-[250px]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-[114px]">
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
            ].map((card) => (
              <div key={card.title} className="space-y-[22px]">
                <div className="relative w-full aspect-[384/240]">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-4">
                  <h3 className={`${serif} text-[24px] text-[#fcfcfc]`}>
                    {card.title}
                  </h3>
                  <p className="font-bold text-[16px] text-[#fcfcfc] leading-[1.25]">
                    {card.subtitle}
                  </p>
                </div>

                <ul className="list-disc pl-6 space-y-1 text-[16px] text-[#fcfcfc] leading-[1.5]">
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
      <section id="big-ideia" className="bg-black pt-12 lg:pt-20 pb-0">
        <div className="max-w-[1920px] mx-auto px-6 lg:px-[240px]">
          <div className="bg-[#2c2d2e] py-12 lg:py-[105px] px-6 sm:px-10 lg:px-[105px] lg:min-h-[1267px]">
            <div className="grid lg:grid-cols-[1fr_476px] gap-10 lg:gap-[100px] items-stretch">
              <div className="flex flex-col gap-[32px] lg:gap-[31px] justify-between">
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
                  <div key={feature.title} className="space-y-[12px]">
                    <h3
                      className="capitalize text-white text-[24px] sm:text-[28px] md:text-[34px] lg:text-[42px] leading-[1.15] font-normal"
                    >
                      {feature.title}
                    </h3>
                    <p
                      className="text-[#EFEFF0] text-[14px] sm:text-[15px] md:text-[17px] lg:text-[19px] leading-[1.5]"
                    >
                      {feature.text}
                    </p>
                  </div>
                ))}
              </div>

              <div className="relative w-full aspect-[476/591] lg:aspect-auto lg:h-full lg:min-h-[1057px]">
                <img
                  src="/images/wessex/features.jpg"
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover object-center"
                />
              </div>
            </div>
          </div>

          {/* Banner */}
          <div className="relative w-full h-[180px] sm:h-[260px] lg:h-[480px]">
            <img
              src="/images/wessex/banner.jpg"
              alt=""
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section id="depoimentos" className="bg-[#540000] py-12 sm:py-16 lg:py-24">
        <div className="max-w-[1920px] mx-auto px-6 lg:px-[160px]">
          <h2
            className={`${serif} italic text-white text-[36px] sm:text-[44px] md:text-[56px] lg:text-[72px] mb-10 sm:mb-12 lg:mb-20`}
          >
            Feedback
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {[
              {
                name: "Giovanna Fraga",
                quote:
                  "A música no nosso casamento foi incrível! Tocada pelo Grupo Wessex, com emoção e sensibilidade, tornou o momento ainda mais especial. Convidados encantados e um dia inesquecível. Obrigada!",
              },
              {
                name: "Pedro Azevedo",
                quote:
                  "A música no nosso casamento foi simplesmente emocionante! Cada nota trouxe um toque especial ao momento, tornando tudo ainda mais inesquecível. A sensibilidade e o talento fizeram toda a diferença. Muito obrigado por essa experiência maravilhosa!",
              },
              {
                name: "Dinamene Silva",
                quote:
                  "Que momento mágico! A música tornou nosso pedido de casamento ainda mais especial e emocionante. Cada nota transmitiu amor e tornou o momento inesquecível. Gratidão por fazer parte desse dia tão único!",
              },
              {
                name: "Chef Eunice Silveira",
                quote:
                  "O talento do saxofonista trouxe um toque de elegância e animação à festa de 18 anos da minha cliente. A música envolvente criou uma atmosfera incrível e encantou a todos. Foi simplesmente perfeito! Muito obrigada!",
              },
            ].map((t) => (
              <div
                key={t.name}
                className="border border-white/40 rounded-2xl p-6 sm:p-8 lg:p-10 relative"
              >
                <span
                  className={`${serif} italic absolute -top-5 left-6 sm:left-8 bg-[#540000] px-3 text-white text-[40px] sm:text-[48px] leading-none`}
                >
                  &ldquo;
                </span>
                <p className={`${serif} italic text-white/90 text-[14px] sm:text-[16px] md:text-[18px] leading-[1.55] mb-5 sm:mb-6`}>
                  {t.quote}
                </p>
                <p className={`${serif} italic text-white text-[14px] sm:text-[16px] md:text-[18px]`}>
                  {t.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section id="cta" className="bg-black py-12 lg:py-20">
        <div className="max-w-[1920px] mx-auto px-6 lg:px-[251px]">
          <div className="relative bg-[#2c2d2e] flex flex-col lg:flex-row items-center gap-8 p-6 sm:p-8 lg:p-0 lg:min-h-[800px]">
            <div className="relative w-full max-w-[400px] aspect-[450/675] lg:absolute lg:left-0 lg:top-[62px] lg:w-[450px] lg:h-[675px] lg:max-w-none">
              <img
                src="/images/wessex/cta.jpg"
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>

            <div className="relative w-full lg:ml-[549px] lg:pt-[168px] lg:pr-[251px] space-y-6 lg:space-y-[34px] max-w-[605px]">
              <p
                className="text-[#EFEFF0] text-[20px] sm:text-[24px] md:text-[30px] lg:text-[37px] leading-[1.2]"
                style={{ mixBlendMode: "difference" }}
              >
                <span className="font-semibold text-white">
                  O próximo será o seu
                </span>
                , preencha o formulário abaixo para que possamos entrar em
                contacto para montar uma proposta personalizada.
              </p>

              <ul
                className="list-disc pl-6 sm:pl-9 space-y-2 text-[15px] sm:text-[17px] md:text-[20px] lg:text-[24px] text-[#EFEFF0]"
                style={{ mixBlendMode: "difference" }}
              >
                <li>Consultoria de repertório gratuita</li>
                <li>Registro de em vídeo do momento</li>
                <li>Prioridade de data</li>
              </ul>

              <Link
                href="/contacto"
                className="inline-flex items-center justify-center bg-[#B8A042] text-black font-medium text-[16px] sm:text-[18px] lg:text-[20px] w-full sm:w-[280px] lg:w-[311px] h-[52px] lg:h-[60px] rounded-[12px] hover:bg-[#c9b04f] transition"
              >
                Reserva a tua data
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#EFEFF0] text-black py-12 lg:py-16">
        <div className="max-w-[1920px] mx-auto px-6 lg:px-[107px]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
            <Link href="/wessex" className="flex items-center">
              <img
                src="/images/wessex/logo/main-black.png"
                alt="Wessex"
                className="h-10 lg:h-12 w-auto"
              />
            </Link>
            <div className="flex items-center gap-4">
              {[
                {
                  label: "Facebook",
                  path: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
                },
                {
                  label: "Instagram",
                  path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z",
                },
                {
                  label: "Twitter",
                  path: "M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z",
                },
                {
                  label: "LinkedIn",
                  path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
                },
              ].map((s) => (
                <a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  className="hover:opacity-60 transition"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d={s.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>
          <div className="border-t border-black/20 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[18px]">
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
