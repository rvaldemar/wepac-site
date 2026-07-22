import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: { absolute: "WEPAC Society — a mesma entrada, seja qual for a tua porta | WEPAC" },
  description:
    "A WEPAC Society é a camada de pertença acima de todas as áreas da WEPAC. Entrar não custa nada — nem o teu primeiro Life Map. Candidata-te.",
};

const applyHref = "/wepacker/intake";

// Chapter 21's concrete Monday-morning passage — the antidote to "visitors
// understand nothing". Kept as short, unglamorous, verifiable claims.
const MONDAY_MORNING = [
  "Acordas com o corpo governado, não sofrido.",
  "Terminas o trabalho com acabamento, mesmo quando ninguém verifica.",
  "Dizes a verdade na reunião das dez, com respeito por quem discorda.",
  "Chegas a casa com presença para quem lá está.",
];

// Publicly supported people the organisation already calls WEPACkers on its
// own Instagram. Consent confirmed by the founder. State only what is
// publicly true: who they are and what they achieved — never that they went
// through the mentoring programme, which has not been confirmed.
const ALREADY_WEPACKERS = [
  {
    name: "Álvaro Luís",
    achievement: "campeão no Abu Dhabi Grand Slam de jiu-jitsu",
  },
  {
    name: "André Vítor",
    achievement: "vice-campeão no mesmo Abu Dhabi Grand Slam",
  },
  {
    name: "Alex Florindo",
    achievement: "3.º lugar no escalão 18-19 anos do Europeu de OCR, 400m, em Mântua",
  },
  {
    name: "Jotta Pê",
    achievement: "violinista e sócio fundador da WEPAC",
  },
];

// Kept verbatim: this is the actual agreement text shown elsewhere in the
// product, not marketing copy free to rephrase.
const COMMITMENTS = [
  "Estar presente nas sessões que aceitei.",
  "Ser pontual nas interações que aceitei.",
  "Dar e receber feedback com honestidade e respeito.",
  "Cumprir os compromissos e as reflexões que assumir.",
  "Manter uma atitude aberta ao crescimento e ao confronto construtivo.",
  "Respeitar a confidencialidade do que as outras pessoas partilham comigo.",
  "Tratar cada pessoa e cada comunidade com cuidado e responsabilidade.",
];

const WHAT_IT_IS_NOT = [
  "Não é um curso: não há aulas, módulos nem certificado.",
  "Não é uma aplicação de hábitos: não há streaks nem notificações a pedir-te para voltares.",
  "Não é uma rede social: não há feed, não conheces os outros membros e não há mensagens para desconhecidos.",
  "Não é acompanhamento clínico: não substitui psicologia nem psicoterapia.",
  "E não é para toda a gente ao mesmo tempo: cada pessoa aceite ocupa um mentor a sério.",
];

// The doors. Society doesn't sell here — each area has (or will have) its own
// page. Link only where a real page exists; name the rest without a link.
const DOORS = [
  {
    name: "Academia",
    body: "Easy Peasy (0-11), Step Up (12-21) e YUP (22+) — o caminho por idade, da descoberta à transformação.",
    href: null,
  },
  {
    name: "Clínica WEPAC",
    body: "Modelo clínico-pedagógico dos 0 aos 24 anos. Abre em Lisboa em setembro de 2026.",
    href: null,
  },
  {
    name: "RH",
    body: "A metodologia WEPAC aplicada dentro de organizações — equipas, liderança, cultura.",
    href: null,
  },
  {
    name: "Universidade de Verão WEPAC Society",
    body: "Uma imersão intensiva no método, para quem quer o essencial concentrado em dias.",
    href: "/society/universidade-verao",
  },
];

export default function SocietyPage() {
  return (
    <div className="min-h-screen bg-wepac-black">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-6 lg:px-12">
        <Link href="/">
          <Image
            src="/logo/email/wepacker-lockup-white.png"
            alt="WEPACKER"
            width={144}
            height={72}
            className="h-9 w-auto"
            priority
          />
        </Link>
        <Link
          href="/wepacker/login"
          className="text-xs text-wepac-text-tertiary transition-colors hover:text-wepac-white"
        >
          Entrar
        </Link>
      </header>

      {/* 1. Hero — whatever door, the same invitation */}
      <section className="px-6 py-16 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-wepac-gray">
            WEPAC Society
          </p>
          <h1 className="mt-4 font-barlow text-4xl font-bold leading-tight text-wepac-white sm:text-5xl md:text-6xl">
            E tu?
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-wepac-text-secondary">
            Talvez estejas aqui como pai ou mãe, à procura de um caminho para os teus filhos.
            Talvez como educador, cansado de sistemas que medem tudo menos o que importa. Talvez
            como artista, como profissional, como alguém que sente há anos a barragem cheia e a
            comporta fechada. Seja qual for a porta por onde entraste nesta página, o convite é o
            mesmo — porque o caminho é o mesmo.
          </p>
          <div className="mt-10">
            <a
              href={applyHref}
              className="inline-block border border-wepac-border bg-wepac-white px-8 py-3 text-sm font-bold text-wepac-black transition-colors hover:bg-wepac-accent-muted"
            >
              Candidatar-me à Society
            </a>
            <p className="mx-auto mt-4 max-w-md text-xs leading-relaxed text-wepac-text-tertiary">
              Isto não é um registo. É uma candidatura: a equipa lê, fala contigo, e só depois é
              que existe conta. Entrar não custa nada — nem o teu primeiro Life Map.
            </p>
          </div>
        </div>
      </section>

      {/* 2. You are already a packer — missing the WE */}
      <section className="border-t border-wepac-border bg-wepac-dark px-6 py-16 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-barlow text-3xl font-bold text-wepac-white md:text-4xl">
            Já és um packer
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-wepac-text-secondary">
            Carregas o teu peso todos os dias — trabalho, contas, decisões, gente que depende de
            ti. Isso não é pouco: é o primeiro requisito. Repara agora no que falta na palavra: o
            WE. Entre <em>packer</em> e <em>WEPACker</em>, a diferença — letra a letra — é a
            comunidade. Ninguém se torna WEPACker sozinho, por definição: falta-lhe, literalmente,
            o WE.
          </p>
        </div>
      </section>

      {/* 3. Monday morning — the concrete passage */}
      <section className="px-6 py-16 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-wepac-gray">
            Numa segunda-feira de manhã
          </p>
          <h2 className="mt-3 text-center font-barlow text-3xl font-bold text-wepac-white md:text-4xl">
            Nada de místico
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-wepac-text-secondary">
            Ser WEPACker não é um estado especial. É isto, sustentado ao longo de uma vida:
          </p>

          <ul className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
            {MONDAY_MORNING.map((line) => (
              <li
                key={line}
                className="border border-wepac-border bg-wepac-card p-5 text-sm leading-relaxed text-wepac-text-secondary"
              >
                {line}
              </li>
            ))}
          </ul>
          <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed text-wepac-text-secondary">
            Nenhuma destas coisas é extraordinária. Extraordinário é a soma delas, sustentada.
          </p>
        </div>
      </section>

      {/* 4. The equation */}
      <section className="border-t border-wepac-border bg-wepac-dark px-6 py-16 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center font-barlow text-3xl font-bold text-wepac-white md:text-4xl">
            A equação
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="border border-wepac-border bg-wepac-card p-6">
              <p className="font-barlow text-sm font-bold uppercase tracking-wide text-wepac-white">
                Autonomia sem serviço
              </p>
              <p className="mt-3 text-sm leading-relaxed text-wepac-text-secondary">
                É egoísmo com bom aspeto. Carregas o teu peso — mas não constróis mais nada.
              </p>
            </div>
            <div className="border border-wepac-border bg-wepac-card p-6">
              <p className="font-barlow text-sm font-bold uppercase tracking-wide text-wepac-white">
                Serviço sem autonomia
              </p>
              <p className="mt-3 text-sm leading-relaxed text-wepac-text-secondary">
                É dependência. Dás o que não tens e, no fim, precisas que te carreguem.
              </p>
            </div>
            <div className="border border-wepac-white bg-wepac-card p-6">
              <p className="font-barlow text-sm font-bold uppercase tracking-wide text-wepac-white">
                O WEPACker
              </p>
              <p className="mt-3 text-sm leading-relaxed text-wepac-text-secondary">
                Tem os dois. Carrega o próprio peso e entrega valor à comunidade. Primeiro
                governa-se; depois, e por isso, serve.
              </p>
            </div>
          </div>
          <p className="mx-auto mt-10 max-w-2xl text-center text-sm leading-relaxed text-wepac-text-secondary">
            A mochila carrega-se sozinho — ninguém pode carregar a tua. O trilho faz-se em grupo.
          </p>
        </div>
      </section>

      {/* 5. Who is already a WEPACker */}
      <section className="px-6 py-16 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center font-barlow text-3xl font-bold text-wepac-white md:text-4xl">
            Quem já é WEPACker
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-wepac-text-secondary">
            Não são estudantes de arte. A WEPAC apoia e reconhece publicamente, na sua própria
            conta de Instagram, pessoas de áreas bem diferentes — e chama-lhes WEPACkers.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {ALREADY_WEPACKERS.map((person) => (
              <div key={person.name} className="border border-wepac-border bg-wepac-card p-6">
                <p className="font-barlow text-lg font-bold text-wepac-white">{person.name}</p>
                <p className="mt-2 text-sm leading-relaxed text-wepac-text-secondary">
                  {person.achievement}
                </p>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-relaxed text-wepac-text-tertiary">
            <a
              href="https://www.instagram.com/wepac.oficial/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-wepac-white underline-offset-4 hover:underline"
            >
              Ver no Instagram da WEPAC
            </a>
            . Desportistas e músicos, não candidatos ao mesmo programa — a prova de que a porta
            muda, o convite não.
          </p>
        </div>
      </section>

      {/* 6. How you get in */}
      <section className="border-t border-wepac-border bg-wepac-dark px-6 py-16 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-barlow text-3xl font-bold text-wepac-white md:text-4xl">
            Como se entra
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-wepac-text-secondary">
            Candidatas-te à Society — não a uma área. Preenches um formulário curto: quem és, o
            que fazes e o que queres mudar. Lemos todas as candidaturas e respondemos a todas,
            mesmo quando a resposta é não. Se avançarmos, abres o teu espaço e escreves o teu
            primeiro Life Map — o mapa da tua vida: quem és, onde estás, para onde vais, porquê, e
            que compromissos assumes. Guardamos todas as versões: daqui a seis meses lês o que
            escreveste hoje e vês exatamente o que mudou.
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-sm font-medium leading-relaxed text-wepac-white">
            Isto não custa dinheiro nenhum. Nem o teu primeiro Life Map. Mas custa alguma coisa:
            aceitar exigência com cuidado, verdade com respeito, comunidade com compromisso.
          </p>
          <div className="mt-10">
            <a
              href={applyHref}
              className="inline-block border border-wepac-border bg-wepac-white px-8 py-3 text-sm font-bold text-wepac-black transition-colors hover:bg-wepac-accent-muted"
            >
              Candidatar-me à Society
            </a>
          </div>
        </div>
      </section>

      {/* 7. The seven commitments */}
      <section className="px-6 py-16 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center font-barlow text-3xl font-bold text-wepac-white md:text-4xl">
            O que te vamos pedir
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-wepac-text-secondary">
            Um compromisso que ninguém lê não vale nada. Antes de entrares, pedimos que leias e
            aceites sete compromissos — não frases emolduradas, mas a base real da relação — e
            preferimos que os leias agora, antes de te candidatares.
          </p>

          <ul className="mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-3">
            {COMMITMENTS.map((item) => (
              <li
                key={item}
                className="border border-wepac-border bg-wepac-card p-4 text-sm leading-relaxed text-wepac-text-secondary"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 8. What this is not */}
      <section className="border-t border-wepac-border bg-wepac-dark px-6 py-16 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center font-barlow text-3xl font-bold text-wepac-white md:text-4xl">
            O que a Society não é
          </h2>

          <ul className="mt-10 grid grid-cols-1 gap-3">
            {WHAT_IT_IS_NOT.map((item) => (
              <li
                key={item}
                className="border border-wepac-border bg-wepac-card p-4 text-sm leading-relaxed text-wepac-text-secondary"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 9. The doors */}
      <section className="px-6 py-16 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center font-barlow text-3xl font-bold text-wepac-white md:text-4xl">
            As portas
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-wepac-text-secondary">
            A Society é a camada de pertença. É nas áreas que o acompanhamento acontece — cada uma
            com a sua própria página. Não vendemos aqui; escolhes a tua porta quando estiveres
            dentro.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {DOORS.map((door) =>
              door.href ? (
                <Link
                  key={door.name}
                  href={door.href}
                  className="border border-wepac-border bg-wepac-card p-6 transition-colors hover:border-wepac-white"
                >
                  <p className="font-barlow text-lg font-bold text-wepac-white">
                    {door.name} →
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-wepac-text-secondary">
                    {door.body}
                  </p>
                </Link>
              ) : (
                <div key={door.name} className="border border-wepac-border bg-wepac-card p-6">
                  <p className="font-barlow text-lg font-bold text-wepac-white">{door.name}</p>
                  <p className="mt-2 text-sm leading-relaxed text-wepac-text-secondary">
                    {door.body}
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* 10. Who is behind it, and the closing */}
      <section className="border-t border-wepac-border bg-wepac-dark px-6 py-16 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-barlow text-3xl font-bold text-wepac-white md:text-4xl">
            Quem está por trás
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-wepac-text-secondary">
            A WEPAC Society é da WEPAC — Companhia de Artes, uma estrutura cultural
            multidisciplinar portuguesa que trabalha em criação artística (Wessex), educação
            artística (Easy Peasy) e recuperação de espaços com valor patrimonial (Arte à Capela).
            Não somos uma startup nem uma escola de coaching: somos três escuteiros e um virtuoso,
            gente que passou anos a formar quem cresce antes de decidir escrevê-lo em método.
          </p>
          <Link
            href="/sobre"
            className="mt-6 inline-block text-sm font-bold text-wepac-white underline-offset-4 hover:underline"
          >
            Conhecer a WEPAC →
          </Link>
        </div>
      </section>

      <section className="px-6 py-16 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-barlow text-3xl font-bold text-wepac-white md:text-4xl">
            From packers to WEPACkers.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-wepac-text-secondary">
            A mochila carrega-se sozinho. O trilho faz-se em grupo. A Society é o nome que damos a
            essa diferença: não é uma turma nem uma audiência — é a decisão de carregar o teu peso
            e ainda teres mão livre para quem precisar, mesmo que nunca chegues a conhecê-lo.
          </p>
          <div className="mt-10">
            <a
              href={applyHref}
              className="inline-block border border-wepac-border bg-wepac-white px-8 py-3 text-sm font-bold text-wepac-black transition-colors hover:bg-wepac-accent-muted"
            >
              Candidatar-me à Society
            </a>
            <p className="mx-auto mt-4 max-w-md text-xs leading-relaxed text-wepac-text-tertiary">
              Leva cinco minutos. Lemos tudo.
            </p>
            <p className="mx-auto mt-6 max-w-md text-xs italic leading-relaxed text-wepac-text-tertiary">
              Isto é um mapa. Boa caminhada.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-wepac-border px-6 py-12 lg:px-12">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 text-center">
          <span className="font-barlow text-2xl font-bold text-wepac-white">WEPAC Society</span>
          <p className="text-xs text-wepac-text-tertiary">
            WEPAC Society — a camada de pertença da WEPAC, Companhia de Artes
          </p>
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-wepac-text-tertiary">
            <Link href="/" className="transition-colors hover:text-wepac-white">
              wepac.pt
            </Link>
            <Link href="/sobre" className="transition-colors hover:text-wepac-white">
              A WEPAC
            </Link>
            <Link href="/contacto" className="transition-colors hover:text-wepac-white">
              Contacto
            </Link>
            <Link href="/privacidade" className="transition-colors hover:text-wepac-white">
              Política de privacidade
            </Link>
          </nav>
          <Link
            href="/wepacker/login"
            className="mt-2 text-xs text-wepac-text-tertiary transition-colors hover:text-wepac-white"
          >
            Já tens conta? Entrar
          </Link>
        </div>
      </footer>
    </div>
  );
}
