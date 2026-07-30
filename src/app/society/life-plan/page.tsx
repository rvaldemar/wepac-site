import type { Metadata } from "next";
import Link from "next/link";
import { FadeIn } from "@/components/FadeIn";
import { SocietyFooter } from "@/components/society/SocietyFooter";
import { SocietyHeader } from "@/components/society/SocietyHeader";

export const metadata: Metadata = {
  title: { absolute: "Life Plan — Projeto de Plano de Vida | WEPAC Society" },
  description:
    "O Life Plan ajuda pessoas e famílias a transformar contexto e reflexão em prioridades, objetivos, um ciclo de ação e um próximo passo.",
  alternates: { canonical: "/society/life-plan" },
  openGraph: {
    title: "Life Plan — Projeto de Plano de Vida | WEPAC Society",
    description:
      "Perceber onde estás, escolher para onde vais e definir o que fazes a seguir.",
    url: "/society/life-plan",
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

const path = [
  {
    number: "01",
    name: "Life Map",
    line: "O mapa pessoal: quem sou, onde estou, para onde quero ir e porquê.",
  },
  {
    number: "02",
    name: "Prioridades",
    line: "O que merece atenção agora — sem tentar mudar a vida inteira ao mesmo tempo.",
  },
  {
    number: "03",
    name: "Objetivos",
    line: "Resultados concretos, ligados ao momento e à direção escolhida.",
  },
  {
    number: "04",
    name: "Ciclo",
    line: "Um período de ação com foco suficiente para aprender, rever e ajustar.",
  },
  {
    number: "05",
    name: "Próximo passo",
    line: "Uma ação clara, assumida pela pessoa e colocada no caminho.",
  },
];

const situations = [
  {
    title: "Uma decisão importante",
    line: "Quando existem vários caminhos possíveis, mas ainda falta uma direção suficientemente clara.",
  },
  {
    title: "Uma transição",
    line: "Mudanças educativas, profissionais, familiares ou pessoais que pedem novas prioridades.",
  },
  {
    title: "Muito movimento, pouco avanço",
    line: "Quando a agenda está cheia, mas o essencial continua sem espaço, sequência ou compromisso.",
  },
  {
    title: "Um caminho em família",
    line: "Quando é preciso construir linguagem comum sem transformar pessoas diferentes num plano único.",
  },
];

const outcomes = [
  "Um ponto de partida descrito com honestidade e contexto.",
  "Um Life Map criado ou atualizado pela própria pessoa.",
  "Prioridades e objetivos para o momento atual.",
  "Um ciclo de ação com compromissos proporcionais.",
  "Um próximo passo concreto e uma base para o rever.",
];

export default function LifePlanPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-wepac-gray selection:text-black">
      <SocietyHeader />
      <main>
        <section className="relative isolate min-h-[820px] overflow-hidden border-b border-white/10 px-5 pb-20 pt-32 sm:px-8 lg:px-12 lg:pb-24 lg:pt-40">
          <div className="absolute inset-0 -z-20 bg-black" />
          <div className="absolute inset-y-0 right-0 -z-10 w-full opacity-45 lg:w-[44%]">
            <div className="absolute left-[18%] top-[14%] h-[72%] w-px bg-gradient-to-b from-transparent via-white/60 to-transparent" />
            <div className="absolute left-[18%] top-[23%] h-px w-[48%] bg-white/20" />
            <div className="absolute left-[18%] top-[48%] h-px w-[65%] bg-white/20" />
            <div className="absolute left-[18%] top-[72%] h-px w-[38%] bg-white/20" />
            <div className="absolute left-[18%] top-[22.4%] h-3 w-3 -translate-x-1/2 rounded-full border border-white bg-black" />
            <div className="absolute left-[18%] top-[47.4%] h-3 w-3 -translate-x-1/2 rounded-full border border-white bg-black" />
            <div className="absolute left-[18%] top-[71.4%] h-3 w-3 -translate-x-1/2 rounded-full bg-white" />
          </div>

          <FadeIn className="mx-auto flex min-h-[650px] max-w-[1440px] items-end">
            <div className="max-w-6xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/50">
                WEPAC Society · Life Plan
              </p>
              <h1 className="mt-8 max-w-6xl text-balance font-barlow text-[clamp(3.45rem,7.8vw,8rem)] font-black uppercase leading-[0.84] tracking-[-0.045em]">
                Onde estás.
                <br />
                Para onde vais.
                <br />
                O que fazes a seguir.
              </h1>
              <p className="mt-10 max-w-2xl text-balance text-lg leading-relaxed text-white/68 sm:text-xl">
                O Life Plan — Projeto de Plano de Vida — transforma reflexão em direção,
                prioridades e próximos passos que cabem na vida real.
              </p>
              <Link
                href="/wepacker/intake?source=life-plan"
                className="mt-10 inline-flex min-h-14 items-center justify-center bg-white px-7 text-xs font-bold uppercase tracking-[0.18em] text-black transition-colors hover:bg-wepac-gray"
              >
                Começar o meu Life Plan
              </Link>
            </div>
          </FadeIn>
        </section>

        <section className="border-b border-black/15 bg-wepac-gray px-5 py-24 text-black sm:px-8 lg:px-12 lg:py-32">
          <div className="mx-auto grid max-w-[1440px] gap-14 lg:grid-cols-[0.78fr_1.22fr]">
            <FadeIn>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-black/45">
                O produto de entrada
              </p>
              <h2 className="mt-6 text-balance font-barlow text-5xl font-black uppercase leading-[0.92] tracking-[-0.04em] sm:text-7xl">
                Um plano para viver. Não um formulário para arquivar.
              </h2>
            </FadeIn>
            <FadeIn delay={0.1} className="lg:pt-14">
              <p className="text-balance text-2xl leading-snug text-black/80 sm:text-3xl">
                O Life Plan é o processo que liga o teu ponto de partida às escolhas e ações do
                próximo ciclo.
              </p>
              <p className="mt-8 max-w-2xl leading-relaxed text-black/60">
                O Life Map é uma parte central desse processo: o mapa pessoal, vivo e atualizável.
                Não são a mesma coisa. O mapa ajuda a ver a vida inteira; o plano escolhe o que
                fazer agora e como voltar a olhar para o caminho.
              </p>
            </FadeIn>
          </div>
        </section>

        <section className="border-b border-white/10 px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
          <div className="mx-auto max-w-[1440px]">
            <FadeIn>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">
                Da leitura ao movimento
              </p>
              <h2 className="mt-6 max-w-4xl text-balance font-barlow text-5xl font-black uppercase leading-[0.92] tracking-[-0.04em] sm:text-7xl">
                O mapa abre a vista. O plano põe o caminho em movimento.
              </h2>
            </FadeIn>

            <div className="mt-16 grid gap-px bg-white/15 lg:grid-cols-5">
              {path.map((item, index) => (
                <FadeIn
                  key={item.name}
                  delay={index * 0.05}
                  className="flex min-h-[300px] flex-col bg-black p-7"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-barlow text-4xl font-black text-white/20">
                      {item.number}
                    </span>
                    {index < path.length - 1 && (
                      <span className="text-xl text-white/30" aria-hidden="true">
                        →
                      </span>
                    )}
                  </div>
                  <div className="mt-auto">
                    <h3 className="font-barlow text-2xl font-black uppercase">{item.name}</h3>
                    <p className="mt-4 text-sm leading-relaxed text-white/58">{item.line}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#080808] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
          <div className="mx-auto max-w-[1440px]">
            <FadeIn className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">
                  Quando faz sentido
                </p>
                <h2 className="mt-6 font-barlow text-5xl font-black uppercase leading-[0.92] tracking-[-0.04em] sm:text-7xl">
                  Não precisas de estar perdido para precisar de direção.
                </h2>
              </div>
              <p className="max-w-2xl self-end text-lg leading-relaxed text-white/60">
                O Life Plan pode ser individual ou familiar. O ponto de partida é sempre a
                situação concreta — não uma versão idealizada da pessoa ou da família.
              </p>
            </FadeIn>

            <div className="mt-16 grid gap-px bg-white/15 sm:grid-cols-2">
              {situations.map((situation, index) => (
                <FadeIn
                  key={situation.title}
                  delay={index * 0.05}
                  className="min-h-[250px] bg-black p-7 sm:p-9"
                >
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/35">
                    Situação 0{index + 1}
                  </p>
                  <h3 className="mt-10 font-barlow text-3xl font-black uppercase">
                    {situation.title}
                  </h3>
                  <p className="mt-5 max-w-xl leading-relaxed text-white/60">
                    {situation.line}
                  </p>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-black/15 bg-white px-5 py-24 text-black sm:px-8 lg:px-12 lg:py-32">
          <div className="mx-auto grid max-w-[1440px] gap-16 lg:grid-cols-[0.88fr_1.12fr]">
            <FadeIn>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-black/45">
                O que fica contigo
              </p>
              <h2 className="mt-6 text-balance font-barlow text-5xl font-black uppercase leading-[0.92] tracking-[-0.04em] sm:text-7xl">
                Clareza suficiente para dar o próximo passo.
              </h2>
              <p className="mt-8 max-w-lg leading-relaxed text-black/60">
                A forma concreta de entrega é confirmada antes de começar. O Life Plan deixa
                estes resultados essenciais, sem prometer uma transformação automática.
              </p>
            </FadeIn>
            <div className="border-y border-black/15">
              {outcomes.map((outcome, index) => (
                <FadeIn
                  key={outcome}
                  delay={index * 0.04}
                  className="grid grid-cols-[auto_1fr] gap-6 border-b border-black/15 py-6 last:border-b-0"
                >
                  <span className="font-barlow text-2xl font-black text-black/25">0{index + 1}</span>
                  <p className="text-lg leading-relaxed text-black/75">{outcome}</p>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
          <div className="mx-auto grid max-w-[1440px] gap-px bg-white/15 lg:grid-cols-2">
            <FadeIn className="bg-black p-8 sm:p-12">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">
                A pessoa é dona do mapa
              </p>
              <h2 className="mt-6 font-barlow text-4xl font-black uppercase leading-[0.95] tracking-[-0.035em] sm:text-5xl">
                Privado por princípio.
              </h2>
              <div className="mt-8 space-y-5 leading-relaxed text-white/60">
                <p>
                  O Life Map pertence à pessoa. Família, mentor, facilitador, Pack ou equipa não
                  recebem acesso automático ao seu conteúdo.
                </p>
                <p>
                  Num Life Plan familiar, cada pessoa mantém o seu espaço. Só se torna comum o
                  que for escolhido para ser partilhado como prioridade, compromisso ou ação da
                  família.
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={0.08} className="bg-black p-8 sm:p-12">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">
                Limites claros
              </p>
              <h2 className="mt-6 font-barlow text-4xl font-black uppercase leading-[0.95] tracking-[-0.035em] sm:text-5xl">
                Direção não é decisão por ti.
              </h2>
              <div className="mt-8 space-y-5 leading-relaxed text-white/60">
                <p>
                  O Life Plan organiza reflexão e ação; não avalia o valor de uma pessoa, não
                  garante resultados e não transfere a responsabilidade pelas escolhas.
                </p>
                <p>
                  Não substitui acompanhamento médico, psicológico, jurídico ou financeiro
                  quando essas competências são necessárias.
                </p>
              </div>
            </FadeIn>
          </div>
        </section>

        <section className="border-b border-black/15 bg-wepac-gray px-5 py-24 text-black sm:px-8 lg:px-12 lg:py-32">
          <FadeIn className="mx-auto max-w-5xl text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-black/45">
              Depois do Life Plan
            </p>
            <h2 className="mt-7 text-balance font-barlow text-5xl font-black uppercase leading-[0.9] tracking-[-0.04em] sm:text-7xl">
              O plano dá direção. A continuidade mantém o caminho vivo.
            </h2>
            <p className="mx-auto mt-8 max-w-2xl leading-relaxed text-black/60">
              A continuidade pode acontecer através das subscrições e formas de acompanhamento
              disponíveis. Benefícios, condições, periodicidade e qualquer limite de capacidade
              são apresentados com clareza antes de qualquer adesão.
            </p>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-black/50">
              Uma subscrição não é um Pack. Pack é comunidade real, com pessoas, pertença e obra
              comum.
            </p>
          </FadeIn>
        </section>

        <section className="px-5 py-28 sm:px-8 lg:px-12 lg:py-40">
          <FadeIn className="mx-auto max-w-5xl text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/45">
              O teu ponto de partida
            </p>
            <h2 className="mt-8 text-balance font-barlow text-5xl font-black uppercase leading-[0.88] tracking-[-0.045em] sm:text-7xl lg:text-8xl">
              Não precisas do caminho inteiro. Precisas do próximo passo.
            </h2>
            <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-white/60">
              Conta-nos onde estás e o que gostarias de construir. A equipa responde sobre o
              enquadramento possível para começar.
            </p>
            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/wepacker/intake?source=life-plan"
                className="inline-flex min-h-14 items-center justify-center bg-white px-7 text-xs font-bold uppercase tracking-[0.18em] text-black transition-colors hover:bg-wepac-gray"
              >
                Começar o meu Life Plan
              </Link>
              <Link
                href="/society/familias"
                className="inline-flex min-h-14 items-center justify-center border border-white/30 px-7 text-xs font-bold uppercase tracking-[0.18em] transition-colors hover:border-white hover:bg-white hover:text-black"
              >
                Ver Life Plan para famílias
              </Link>
            </div>
          </FadeIn>
        </section>
      </main>
      <SocietyFooter />
    </div>
  );
}
