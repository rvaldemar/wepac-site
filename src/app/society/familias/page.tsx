import type { Metadata } from "next";
import Link from "next/link";
import { FadeIn } from "@/components/FadeIn";
import { SocietyFooter } from "@/components/society/SocietyFooter";
import { SocietyHeader } from "@/components/society/SocietyHeader";

export const metadata: Metadata = {
  title: { absolute: "Life Plan para famílias | WEPAC Society" },
  description:
    "Um Life Plan para ajudar cada pessoa e a família a construir linguagem comum, prioridades e próximos passos sem apagar a individualidade.",
  alternates: { canonical: "/society/familias" },
  openGraph: {
    title: "O caminho começa em casa | WEPAC Society",
    description:
      "Um Life Plan para pessoas diferentes construírem direção e compromissos comuns.",
    url: "/society/familias",
    type: "website",
    locale: "pt_PT",
    images: [
      {
        url: "/logo/og-image.png",
        width: 1200,
        height: 630,
        alt: "WEPAC",
      },
    ],
  },
};

const familyMoments = [
  {
    title: "Falamos muito. Decidimos pouco.",
    line: "As mesmas conversas voltam, mas falta uma forma comum de escolher prioridades e assumir compromissos.",
  },
  {
    title: "Cada pessoa vive numa agenda.",
    line: "A logística funciona, mas o tempo partilhado, os rituais e o que importa à família ficam para depois.",
  },
  {
    title: "Uma transição está a mexer com todos.",
    line: "Adolescência, escola, universidade, trabalho, mudança de casa ou carreira alteram mais do que uma rotina.",
  },
  {
    title: "Queremos ajudar sem controlar.",
    line: "Pais e filhos precisam de equilibrar cuidado, autonomia, responsabilidade e espaço para escolher.",
  },
  {
    title: "Temos objetivos, mas não direção comum.",
    line: "Cada pessoa sabe o que quer fazer; ainda falta perceber o que a família quer proteger e construir junta.",
  },
  {
    title: "É tempo de voltar a alinhar.",
    line: "Não é preciso esperar por uma crise para rever o momento, reparar tensões e escolher o próximo passo.",
  },
];

const stages = [
  {
    years: "0—11",
    name: "Easy Peasy",
    mode: "Discovery",
    state: "Em atividade",
    line: "A família é o primeiro ambiente: presença, ritmo, curiosidade, limites e descoberta acompanhada.",
  },
  {
    years: "12—21",
    name: "Step Up",
    mode: "Build",
    state: "Em desenvolvimento",
    line: "Identidade, escolhas educativas e autonomia crescente, com responsabilidade e conversas que não fogem ao essencial.",
  },
  {
    years: "22—∞",
    name: "YUP",
    mode: "Transform",
    state: "Em construção",
    line: "Vida adulta, relações, carreira, cuidado entre gerações e mudanças que continuam a pedir direção.",
  },
];

const process = [
  {
    number: "01",
    title: "Contar onde estão",
    line: "A família partilha o momento, as perguntas e o que gostaria de construir.",
  },
  {
    number: "02",
    title: "Definir quem participa",
    line: "Antes de começar, clarificamos quem participa, o que é comum e o que permanece individual.",
  },
  {
    number: "03",
    title: "Escolher o que é comum",
    line: "A família identifica prioridades e compromissos que precisam mesmo de ser partilhados.",
  },
  {
    number: "04",
    title: "Definir o próximo ciclo",
    line: "Os objetivos ganham ações proporcionais, responsáveis claros e um próximo passo.",
  },
  {
    number: "05",
    title: "Rever sem dramatizar",
    line: "O que aconteceu volta a ser visto para aprender, ajustar e escolher o movimento seguinte.",
  },
];

function FamilySignal({ className = "" }: { className?: string }) {
  const people = [
    { className: "left-[8%] top-[14%]", label: "Pessoa" },
    { className: "right-[7%] top-[20%]", label: "Pessoa" },
    { className: "bottom-[13%] left-[16%]", label: "Pessoa" },
  ];

  return (
    <div
      aria-hidden="true"
      className={`relative isolate overflow-hidden border border-white/10 bg-[#080808] ${className}`}
    >
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.16) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.16) 1px, transparent 1px)",
          backgroundSize: "52px 52px",
        }}
      />
      <div className="relative flex h-full flex-col p-7 sm:p-10 lg:p-12">
        <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.22em] text-white/40">
          <span>Individual</span>
          <span>Comum</span>
        </div>

        <div className="relative my-8 flex-1">
          <div className="absolute left-1/2 top-1/2 h-px w-[62%] -translate-x-1/2 -rotate-[28deg] bg-white/20" />
          <div className="absolute left-1/2 top-1/2 h-px w-[68%] -translate-x-1/2 rotate-[22deg] bg-white/20" />
          <div className="absolute left-1/2 top-1/2 h-[58%] w-px -translate-x-1/2 -translate-y-1/2 bg-white/20" />

          {people.map((person) => (
            <div
              key={person.className}
              className={`absolute grid aspect-square w-[28%] max-w-32 place-items-center rounded-full border border-white/25 bg-black ${person.className}`}
            >
              <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/55">
                {person.label}
              </span>
            </div>
          ))}

          <div className="absolute left-1/2 top-1/2 grid aspect-square w-[38%] max-w-44 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white bg-black text-center">
            <div>
              <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/40">
                Caminho
              </p>
              <p className="mt-2 font-barlow text-2xl font-black uppercase">Família</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-px bg-white/15 text-center">
          {["Cuidado", "Autonomia", "Compromisso"].map((value) => (
            <div
              key={value}
              className="bg-black/90 px-2 py-4 text-[8px] font-bold uppercase tracking-[0.14em] text-white/55"
            >
              {value}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function FamiliesPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-wepac-gray selection:text-black">
      <SocietyHeader />
      <main>
        <section className="relative isolate min-h-[840px] overflow-hidden border-b border-white/10 px-5 pb-20 pt-32 sm:px-8 lg:px-12 lg:pb-24 lg:pt-40">
          <div className="absolute inset-0 -z-20 bg-black" />
          <div className="absolute inset-y-0 right-0 -z-10 hidden w-[47%] lg:block">
            <FamilySignal className="h-full border-y-0 border-r-0" />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/45 to-black/10" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/35" />
          </div>

          <div className="mx-auto grid min-h-[680px] max-w-[1440px] items-end gap-16 lg:grid-cols-[1.12fr_0.88fr]">
            <FadeIn>
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/50">
                WEPAC Society · Famílias
              </p>
              <h1 className="mt-8 max-w-5xl text-balance font-barlow text-[clamp(3.7rem,8vw,8.2rem)] font-black uppercase leading-[0.84] tracking-[-0.045em]">
                O caminho começa em casa.
              </h1>
              <p className="mt-10 max-w-2xl text-balance text-lg leading-relaxed text-white/68 sm:text-xl">
                Um Life Plan para ajudar cada pessoa e a família a encontrar linguagem comum,
                prioridades e próximos passos — sem apagar a individualidade de ninguém.
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/wepacker/intake?source=familias"
                  className="inline-flex min-h-14 items-center justify-center bg-white px-7 text-xs font-bold uppercase tracking-[0.18em] text-black transition-colors hover:bg-wepac-gray"
                >
                  Começar o Life Plan da família
                </Link>
                <Link
                  href="/society/life-plan"
                  className="inline-flex min-h-14 items-center justify-center border border-white/30 px-7 text-xs font-bold uppercase tracking-[0.18em] text-white transition-colors hover:border-white hover:bg-white hover:text-black"
                >
                  Ver como funciona
                </Link>
              </div>
            </FadeIn>

            <FamilySignal className="aspect-[4/5] lg:hidden" />
          </div>
        </section>

        <section className="border-b border-black/15 bg-wepac-gray px-5 py-24 text-black sm:px-8 lg:px-12 lg:py-32">
          <div className="mx-auto grid max-w-[1440px] gap-14 lg:grid-cols-[0.75fr_1.25fr]">
            <FadeIn>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-black/45">
                A primeira equipa
              </p>
              <h2 className="mt-6 text-balance font-barlow text-5xl font-black uppercase leading-[0.92] tracking-[-0.04em] sm:text-7xl">
                Uma família não é uma pessoa em tamanho grande.
              </h2>
            </FadeIn>
            <FadeIn delay={0.1} className="lg:pt-14">
              <p className="text-balance text-2xl leading-snug text-black/80 sm:text-3xl">
                É um sistema de pessoas inteiras: ligadas, diferentes e responsáveis pelo modo
                como vivem juntas.
              </p>
              <p className="mt-8 max-w-2xl leading-relaxed text-black/60">
                O Life Plan familiar não procura uniformizar vontades nem entregar aos pais o
                mapa dos filhos. Ajuda a distinguir o que pertence a cada pessoa do que precisa
                de conversa, decisão e compromisso partilhado.
              </p>
            </FadeIn>
          </div>
        </section>

        <section className="border-b border-white/10 px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
          <div className="mx-auto max-w-[1440px]">
            <FadeIn>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">
                Situações que reconhecemos
              </p>
              <h2 className="mt-6 max-w-4xl text-balance font-barlow text-5xl font-black uppercase leading-[0.92] tracking-[-0.04em] sm:text-7xl">
                A vida familiar raramente avisa antes de mudar.
              </h2>
            </FadeIn>

            <div className="mt-16 grid gap-px bg-white/15 sm:grid-cols-2 lg:grid-cols-3">
              {familyMoments.map((moment, index) => (
                <FadeIn
                  key={moment.title}
                  delay={index * 0.04}
                  className="flex min-h-[290px] flex-col bg-black p-7 sm:p-8"
                >
                  <p className="font-barlow text-4xl font-black text-white/20">0{index + 1}</p>
                  <div className="mt-auto">
                    <h3 className="font-barlow text-2xl font-black uppercase leading-tight">
                      {moment.title}
                    </h3>
                    <p className="mt-5 text-sm leading-relaxed text-white/58">{moment.line}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#080808] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
          <div className="mx-auto max-w-[1440px]">
            <FadeIn className="grid gap-14 lg:grid-cols-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">
                  Duas escalas
                </p>
                <h2 className="mt-6 font-barlow text-5xl font-black uppercase leading-[0.92] tracking-[-0.04em] sm:text-7xl">
                  O que é meu. O que é nosso.
                </h2>
              </div>
              <p className="max-w-2xl self-end text-lg leading-relaxed text-white/60">
                Um plano familiar saudável não confunde proximidade com acesso total. Torna
                visível a relação entre autonomia individual e responsabilidade partilhada.
              </p>
            </FadeIn>

            <div className="mt-16 grid gap-px bg-white/15 lg:grid-cols-2">
              <FadeIn className="min-h-[410px] bg-black p-8 sm:p-10">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/40">
                  Cada pessoa
                </p>
                <h3 className="mt-8 font-barlow text-4xl font-black uppercase">
                  Identidade e direção próprias.
                </h3>
                <ul className="mt-9 space-y-4 text-sm leading-relaxed text-white/60">
                  <li className="border-t border-white/10 pt-4">O seu Life Map e a sua voz.</li>
                  <li className="border-t border-white/10 pt-4">
                    Prioridades e objetivos pessoais.
                  </li>
                  <li className="border-t border-white/10 pt-4">
                    Escolhas adequadas à idade e à autonomia.
                  </li>
                  <li className="border-t border-white/10 pt-4">
                    Privacidade que não depende do papel na família.
                  </li>
                </ul>
              </FadeIn>

              <FadeIn delay={0.08} className="min-h-[410px] bg-black p-8 sm:p-10">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/40">
                  A família
                </p>
                <h3 className="mt-8 font-barlow text-4xl font-black uppercase">
                  Linguagem e compromissos comuns.
                </h3>
                <ul className="mt-9 space-y-4 text-sm leading-relaxed text-white/60">
                  <li className="border-t border-white/10 pt-4">
                    Prioridades que precisam de cooperação.
                  </li>
                  <li className="border-t border-white/10 pt-4">
                    Rituais, decisões e acordos explícitos.
                  </li>
                  <li className="border-t border-white/10 pt-4">
                    Responsáveis e próximos passos visíveis.
                  </li>
                  <li className="border-t border-white/10 pt-4">
                    Uma forma de rever sem procurar culpados.
                  </li>
                </ul>
              </FadeIn>
            </div>
          </div>
        </section>

        <section className="border-b border-black/15 bg-white px-5 py-24 text-black sm:px-8 lg:px-12 lg:py-32">
          <div className="mx-auto max-w-[1440px]">
            <FadeIn>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-black/45">
                Dos 0 ao infinito — e mais além
              </p>
              <h2 className="mt-6 max-w-5xl text-balance font-barlow text-5xl font-black uppercase leading-[0.92] tracking-[-0.04em] sm:text-7xl">
                A família muda. O caminho educativo muda com ela.
              </h2>
              <p className="mt-8 max-w-2xl leading-relaxed text-black/60">
                Cada stage calibra a linguagem, a autonomia e o papel da família. Nenhuma idade
                transforma uma pessoa num projeto de outra.
              </p>
            </FadeIn>

            <div className="mt-16 grid gap-px bg-black/15 lg:grid-cols-3">
              {stages.map((stage, index) => (
                <FadeIn
                  key={stage.name}
                  delay={index * 0.06}
                  className="flex min-h-[390px] flex-col bg-white p-8"
                >
                  <div className="flex items-start justify-between">
                    <p className="font-barlow text-5xl font-black tracking-[-0.04em] text-black/20">
                      {stage.years}
                    </p>
                    <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-black/40">
                      {stage.state}
                    </span>
                  </div>
                  <div className="mt-auto">
                    <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.18em] text-black/40">
                      {stage.mode}
                    </p>
                    <h3 className="font-barlow text-3xl font-black uppercase">{stage.name}</h3>
                    <p className="mt-5 leading-relaxed text-black/60">{stage.line}</p>
                  </div>
                </FadeIn>
              ))}
            </div>

            <FadeIn className="mt-10">
              <Link
                href="/academy"
                className="inline-flex items-center gap-2 border-b border-black pb-2 text-xs font-bold uppercase tracking-[0.18em]"
              >
                Conhecer a WEPAC Academy <span aria-hidden="true">→</span>
              </Link>
            </FadeIn>
          </div>
        </section>

        <section className="border-b border-white/10 px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
          <div className="mx-auto max-w-[1440px]">
            <FadeIn className="grid gap-14 lg:grid-cols-[0.7fr_1.3fr]">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">
                  Como funciona
                </p>
                <h2 className="mt-6 font-barlow text-5xl font-black uppercase leading-[0.92] tracking-[-0.04em] sm:text-7xl">
                  Da conversa ao próximo ciclo.
                </h2>
              </div>
              <p className="max-w-2xl self-end text-lg leading-relaxed text-white/60">
                O enquadramento concreto é confirmado antes de começar. O processo adapta-se à
                composição e ao momento da família, preservando estes princípios.
              </p>
            </FadeIn>

            <div className="mt-16 border-y border-white/15">
              {process.map((step, index) => (
                <FadeIn
                  key={step.number}
                  delay={index * 0.04}
                  className="grid gap-5 border-b border-white/15 py-7 last:border-b-0 sm:grid-cols-[0.2fr_0.6fr_1.2fr] sm:items-baseline"
                >
                  <p className="font-barlow text-3xl font-black text-white/20">{step.number}</p>
                  <h3 className="font-barlow text-2xl font-black uppercase">{step.title}</h3>
                  <p className="leading-relaxed text-white/58">{step.line}</p>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-black/15 bg-wepac-gray px-5 py-24 text-black sm:px-8 lg:px-12 lg:py-32">
          <div className="mx-auto grid max-w-[1440px] gap-16 lg:grid-cols-[0.8fr_1.2fr]">
            <FadeIn>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-black/45">
                Privacidade e cuidado
              </p>
              <h2 className="mt-6 text-balance font-barlow text-5xl font-black uppercase leading-[0.92] tracking-[-0.04em] sm:text-7xl">
                Estar em família não elimina fronteiras.
              </h2>
            </FadeIn>
            <FadeIn delay={0.1} className="lg:pt-10">
              <div className="space-y-0 border-y border-black/15">
                {[
                  "Partimos do princípio de que o Life Map pertence à pessoa e não é automaticamente visível aos restantes familiares.",
                  "A participação de menores só avança depois de confirmados responsáveis, consentimentos e forma de participação.",
                  "O que é partilhado com a família é acordado antes de começar, respeitando a idade e as responsabilidades legais.",
                  "Pais e responsáveis não recebem por defeito acesso total ao espaço pessoal de outra pessoa.",
                  "Compromissos comuns ficam separados de notas, objetivos e reflexões individuais.",
                  "O Life Plan não substitui apoio médico, psicológico, jurídico ou financeiro quando necessário.",
                ].map((line) => (
                  <p
                    key={line}
                    className="border-b border-black/15 py-5 leading-relaxed text-black/65 last:border-b-0"
                  >
                    {line}
                  </p>
                ))}
              </div>
            </FadeIn>
          </div>
        </section>

        <section className="px-5 py-28 sm:px-8 lg:px-12 lg:py-40">
          <FadeIn className="mx-auto max-w-5xl text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/45">
              O primeiro passo pode ser comum
            </p>
            <h2 className="mt-8 text-balance font-barlow text-5xl font-black uppercase leading-[0.88] tracking-[-0.045em] sm:text-7xl lg:text-8xl">
              Cada pessoa tem o seu mapa. A família pode escolher o caminho que faz junta.
            </h2>
            <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-white/60">
              Conta-nos em que momento estão e o que gostariam de construir. A equipa responde
              sobre o enquadramento possível para começar.
            </p>
            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/wepacker/intake?source=familias"
                className="inline-flex min-h-14 items-center justify-center bg-white px-7 text-xs font-bold uppercase tracking-[0.18em] text-black transition-colors hover:bg-wepac-gray"
              >
                Começar o Life Plan da família
              </Link>
              <Link
                href="/society/life-plan"
                className="inline-flex min-h-14 items-center justify-center border border-white/30 px-7 text-xs font-bold uppercase tracking-[0.18em] transition-colors hover:border-white hover:bg-white hover:text-black"
              >
                Conhecer o Life Plan
              </Link>
            </div>
          </FadeIn>
        </section>
      </main>
      <SocietyFooter />
    </div>
  );
}
