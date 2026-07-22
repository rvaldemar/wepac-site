import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: { absolute: "WEPACKER — mentoria e desenvolvimento pessoal | WEPAC" },
  description:
    "O acompanhamento pessoal da WEPAC — Companhia de Artes: um mentor atribuído, sessões marcadas e um espaço privado onde escreves o mapa da tua vida. Entra-se por candidatura.",
};

const heroHref = "/wepacker/intake";

// What exists, in concrete terms — the promise reduced to three verifiable objects.
const WHAT_IT_IS = [
  {
    title: "Um espaço privado só teu.",
    body: "Aqui escreves o teu Life Map: quem és, onde estás, para onde vais, porquê, e que compromissos assumes — perguntas que a maior parte das pessoas nunca chega a fazer-se com honestidade. Escreves também o plano do trimestre, com objetivos e ações mensais, e os teus Trails: as transformações que decides levar por diante, uma de cada vez. Guardamos todas as versões — daqui a seis meses lês o que escreveste hoje e vês exatamente o que mudou.",
  },
  {
    title: "Um mentor atribuído pela equipa.",
    body: "Achamos que ninguém desbloqueia potencial sozinho, por isso a relação só começa quando as duas partes a aceitam, e termina quando qualquer uma das duas decidir terminá-la. Não é uma linha de apoio nem um chat permanente: é uma pessoa que se senta contigo, com regularidade, e que é a primeira a notar quando escorregas no caminho.",
  },
  {
    title: "Sessões com data no calendário.",
    body: "Cada sessão tem dia, hora, duração e link de videochamada, e chega-te por convite de calendário. É estrutura, não é boa vontade: fica marcado porque o que fica só à mercê da vontade raramente acontece. O que se passa lá dentro fica entre vocês.",
  },
];

// Entry funnel steps. Replaces the old METHODOLOGY_STEPS entirely — those four
// entries described entities (Assessment, Life Map, Mentorship, Trails), not
// a sequence the product actually runs. This is the real sequence.
const HOW_YOU_ENTER = [
  {
    label: "Candidatura",
    body: "Preenches um formulário curto: quem és, o que fazes e o que queres mudar. Cinco minutos, sem currículo e sem portefólio. Candidatar-se é gratuito e não te compromete a nada.",
  },
  {
    label: "Conversa",
    // [INVENTADO] "em até 10 dias úteis" — prazo por confirmar pelo fundador (ver secção de perguntas diretas).
    body: "Lemos todas as candidaturas e respondemos a todas, mesmo quando a resposta é não. É na conversa que se decide, não no formulário — e decidimos os dois.",
  },
  {
    label: "Convite",
    body: "Se avançarmos, recebes um convite pessoal por email para criares a tua conta. O convite é válido durante sete dias.",
  },
  {
    label: "Primeira sessão",
    body: "Aceitas os compromissos de participação, abres o teu espaço — que começa em branco, e é suposto — e marcas a primeira sessão com o teu mentor.",
  },
];

// Literal from agreement/page.tsx, cast to infinitive, per board recommendation.
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

// Six dimensions used as a conversation lens, never as a test. These labels are
// PT-only copy for this page — deliberately not sourced from AREA_LABELS, which
// stays an internal, English, legacy-cohort-scoped map (see types.ts).
const DIMENSIONS = [
  { label: "Corpo", body: "a base da presença e da energia." },
  { label: "Emoção", body: "a vida interior e a capacidade de a exprimir." },
  { label: "Caráter", body: "disciplina, ética e consistência." },
  { label: "Espírito", body: "profundidade, propósito e sentido." },
  { label: "Pensamento", body: "estratégia, leitura e visão." },
  { label: "Relação", body: "as pessoas que te sustentam e as que sustentas." },
];

const WHAT_IT_IS_NOT = [
  "Não é um curso: não há aulas, módulos nem certificado.",
  "Não é uma aplicação de hábitos: não há streaks nem notificações a pedir-te para voltares.",
  "Não é uma rede social: não há feed, não conheces os outros candidatos e não há mensagens para desconhecidos.",
  "Não é acompanhamento clínico: não substitui psicologia nem psicoterapia.",
  "E não é para toda a gente ao mesmo tempo: cada pessoa aceite ocupa um mentor a sério.",
];

// TODO(founder): four questions have no answer yet and must not be invented —
// see "OPEN QUESTIONS FOR THE FOUNDER" in the landing review. Add them here
// once decided:
//   - Quanto custa? (preço/gratuito/mensalidade)
//   - Quanto tempo dura? (nº sessões/mês, durante quantos meses)
//   - É online ou presencial? (morada se presencial)
//   - A partir de que idade? (consentimento parental se aceitar menores) —
//     nota: o material fundador já responde a esta pergunta para este stage
//     (adultos, 22+), mas o produto não tem gate de idade nem fluxo de
//     consentimento parental implementado, por isso continua bloqueada aqui
//     até esse trabalho existir.
const FAQ = [
  {
    q: "Quem vê o que eu escrevo?",
    a: "Só tu. O teu mentor vê as sessões que tem contigo e aquilo que tu decidires partilhar. O teu Life Map, os teus Trails e o teu plano não são partilhados com ninguém — nem com mentores, nem com a equipa. Isto não é uma promessa de marketing: é a forma como o sistema está construído.",
  },
  {
    q: "E se quiser sair?",
    a: "Sais. Qualquer uma das partes pode terminar a mentoria a qualquer momento, e isso corta o acesso do mentor de imediato. As sessões que já aconteceram ficam no teu histórico.",
  },
];

export default function WepackerLandingPage() {
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

      {/* Hero */}
      <section className="px-6 py-16 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-wepac-gray">
            WEPACKER · um programa da WEPAC — Companhia de Artes
          </p>
          <h1 className="mt-4 font-barlow text-4xl font-bold leading-tight text-wepac-white sm:text-5xl md:text-6xl">
            Um mentor. Sessões marcadas. Um espaço onde escreves para onde vais.
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-wepac-text-secondary">
            O WEPACKER é o acompanhamento pessoal da WEPAC — para quem já carrega o próprio peso
            todos os dias, entre trabalho, decisões e gente que depende de si, e sente que tem mais
            para dar do que aquilo que está hoje a conseguir converter em vida. Acompanhamos poucas
            pessoas de cada vez, durante meses: um mentor atribuído pela equipa, sessões com data no
            calendário, e um espaço privado onde constróis o mapa da tua vida — e que é só teu.
          </p>
          <div className="mt-10">
            <a
              href={heroHref}
              className="inline-block border border-wepac-border bg-wepac-white px-8 py-3 text-sm font-bold text-wepac-black transition-colors hover:bg-wepac-accent-muted"
            >
              Candidatar-me
            </a>
            <p className="mx-auto mt-4 max-w-md text-xs leading-relaxed text-wepac-text-tertiary">
              Isto não é um registo. É uma candidatura: a equipa lê, fala contigo, e só depois é
              que existe conta.
            </p>
          </div>
          <a
            href="#o-que-e"
            className="mt-10 inline-block text-sm text-wepac-text-tertiary transition-colors hover:text-wepac-white"
          >
            Ver como funciona ↓
          </a>
        </div>
      </section>

      {/* What it is, concretely */}
      <section id="o-que-e" className="scroll-mt-16 border-t border-wepac-border bg-wepac-dark px-6 py-16 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center font-barlow text-3xl font-bold text-wepac-white md:text-4xl">
            O que é, em concreto
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-wepac-text-secondary">
            Não te perguntamos se acreditas em ti. Perguntamos para onde queres ir, e construímos à
            volta disso a estrutura que falta para lá chegares. Não é motivação — é engenharia.
          </p>

          <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {WHAT_IT_IS.map((item) => (
              <div key={item.title} className="border border-wepac-border bg-wepac-card p-6">
                <h3 className="font-barlow text-xl font-bold text-wepac-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-wepac-text-secondary">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How you enter */}
      <section className="px-6 py-16 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-wepac-gray">
            Como se entra
          </p>
          <h2 className="mt-3 text-center font-barlow text-3xl font-bold text-wepac-white md:text-4xl">
            Um caminho, não uma promessa
          </h2>

          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_YOU_ENTER.map((step, i) => (
              <div key={step.label} className="border border-wepac-border bg-wepac-card p-6">
                <span className="text-xs font-medium uppercase tracking-[0.2em] text-wepac-text-tertiary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 font-barlow text-xl font-bold text-wepac-white">
                  {step.label}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-wepac-text-secondary">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What we will ask of you */}
      <section className="border-t border-wepac-border bg-wepac-dark px-6 py-16 lg:px-12 lg:py-24">
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

      {/* How we look at the person */}
      <section className="px-6 py-16 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center font-barlow text-3xl font-bold text-wepac-white md:text-4xl">
            Olhamos para a pessoa inteira, não para uma competência
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-wepac-text-secondary">
            Ninguém vive por departamentos. É a mesma pessoa vista de seis ângulos, e a pergunta
            nunca é se já chegaste a algum lado — é para onde deves ir a seguir. Estas seis
            dimensões voltam a aparecer em cada conversa. Não é um teste, não gera nota e não é um
            exame de entrada: é a lente com que ouvimos.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {DIMENSIONS.map((dim) => (
              <div key={dim.label} className="border border-wepac-border bg-wepac-black p-4">
                <p className="font-barlow text-sm font-bold text-wepac-white">{dim.label}</p>
                <p className="mt-1 text-xs text-wepac-text-tertiary">— {dim.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What WEPACKER is not */}
      <section className="border-t border-wepac-border bg-wepac-dark px-6 py-16 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center font-barlow text-3xl font-bold text-wepac-white md:text-4xl">
            O que o WEPACKER não é
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

      {/* The first door: Arts */}
      <section className="px-6 py-16 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-barlow text-3xl font-bold text-wepac-white md:text-4xl">
            A primeira porta são as Artes
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-wepac-text-secondary">
            Começámos pela arte não porque seja superior a outras práticas, mas porque foi o
            trabalho que já tínhamos nas mãos — e é aí que a nossa prática é mais funda. Se a tua
            área é outra — desporto, ofício, ensino, liderança —, candidata-te na mesma:
            dizemos-te com franqueza se conseguimos acompanhar-te agora ou se é melhor esperares.
          </p>
        </div>
      </section>

      {/* Who is behind it */}
      <section className="border-t border-wepac-border bg-wepac-dark px-6 py-16 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-barlow text-3xl font-bold text-wepac-white md:text-4xl">
            Quem está por trás
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-wepac-text-secondary">
            O WEPACKER é da WEPAC — Companhia de Artes, uma estrutura cultural multidisciplinar
            portuguesa que trabalha em criação artística (Wessex), educação artística (Easy Peasy)
            e recuperação de espaços com valor patrimonial (Arte à Capela). Não somos uma startup
            nem uma escola de coaching: somos três escuteiros e um virtuoso, gente que passou anos
            a formar quem cresce antes de decidir escrevê-lo em método. O WEPACKER nasceu do
            trabalho que já fazíamos com pessoas dentro dos nossos próprios projetos. Acompanha
            adultos — o trabalho da WEPAC com crianças e jovens vive noutros projetos, fora desta
            página.
          </p>
          <Link
            href="/sobre"
            className="mt-6 inline-block text-sm font-bold text-wepac-white underline-offset-4 hover:underline"
          >
            Conhecer a WEPAC →
          </Link>
        </div>
      </section>

      {/* Direct questions */}
      <section className="px-6 py-16 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center font-barlow text-3xl font-bold text-wepac-white md:text-4xl">
            Perguntas diretas
          </h2>

          <div className="mt-12 flex flex-col gap-6">
            {FAQ.map((item) => (
              <div key={item.q} className="border border-wepac-border bg-wepac-card p-6">
                <h3 className="font-barlow text-lg font-bold text-wepac-white">{item.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-wepac-text-secondary">{item.a}</p>
              </div>
            ))}
            <div className="border border-wepac-border bg-wepac-card p-6">
              <h3 className="font-barlow text-lg font-bold text-wepac-white">
                O que acontece aos meus dados?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-wepac-text-secondary">
                Os dados da candidatura servem apenas para responder à tua candidatura. Podes
                pedir a eliminação a qualquer momento.{" "}
                <Link
                  href="/privacidade"
                  className="text-wepac-white underline-offset-4 hover:underline"
                >
                  Política de privacidade
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="border-t border-wepac-border bg-wepac-dark px-6 py-16 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-barlow text-3xl font-bold text-wepac-white md:text-4xl">
            From packers to WEPACkers.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-wepac-text-secondary">
            Já carregas o teu peso todos os dias — trabalho, contas, decisões, gente que depende de
            ti. Isso não é pouco: é o primeiro requisito. Falta-te uma letra: o WE. Um packer
            carrega o seu próprio peso; um WEPACker carrega o mesmo peso e ainda é o primeiro a
            parar por quem precisa no caminho. É essa a diferença que este acompanhamento trabalha.
          </p>
          <div className="mt-10">
            <a
              href={heroHref}
              className="inline-block border border-wepac-border bg-wepac-white px-8 py-3 text-sm font-bold text-wepac-black transition-colors hover:bg-wepac-accent-muted"
            >
              Candidatar-me
            </a>
            <p className="mx-auto mt-4 max-w-md text-xs leading-relaxed text-wepac-text-tertiary">
              Leva cinco minutos. Lemos tudo.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-wepac-border px-6 py-12 lg:px-12">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 text-center">
          <span className="font-barlow text-2xl font-bold text-wepac-white">WEPACKER</span>
          <p className="text-xs text-wepac-text-tertiary">
            WEPACKER — um projeto da WEPAC, Companhia de Artes
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
