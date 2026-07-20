import type { Metadata } from "next";
import Link from "next/link";
import { getActivePacksPublic } from "@/lib/wepacker/actions/admin";
import { getAreaLabels } from "@/lib/wepacker/types";

// The pack list comes from the DB — revalidate so the landing reflects
// pack changes without a rebuild (it is otherwise statically prerendered
// with build-time data).
export const revalidate = 300;

export const metadata: Metadata = {
  title: { absolute: "WEPACker — plataforma de desenvolvimento humano da WEPAC" },
  description:
    "WEPACKER é um estilo de vida que te permite atingir o teu potencial. Mentoria, comunidade e experiências reais para desenvolver talento, caráter, disciplina e propósito em qualquer fase da vida.",
};

const AREA_LABELS = getAreaLabels("Domínio específico do teu percurso");
const AREA_DESCRIPTIONS: Record<string, string> = {
  physical: "O corpo como base de presença e energia",
  emotional: "Vida emocional e capacidade expressiva",
  character: "Disciplina, ética e consistência",
  spiritual: "Profundidade, propósito e sentido",
  intellectual: "Pensamento, estratégia e visão",
  social: "Relação, rede e comunidade",
  domain: "A área concreta em que atuas — específica de cada percurso",
};

const METHODOLOGY_STEPS = [
  {
    label: "Diagnóstico",
    desc: "Um retrato honesto de onde estás, nas 7 áreas de desenvolvimento.",
  },
  {
    label: "Plano",
    desc: "Direção clara — quem és, para onde vais e o que te comprometes a fazer.",
  },
  {
    label: "Mentoria",
    desc: "Acompanhamento próximo, individual e em grupo, ao longo do percurso.",
  },
  {
    label: "Ativação",
    desc: "Estrutura que se transforma em ação, hábito e resultado real.",
  },
];

export default async function WepackerLandingPage() {
  const packs = await getActivePacksPublic();
  const singlePackHref = packs.length === 1 ? `/wepacker/${packs[0].slug}/candidatura` : "#packs";

  return (
    <div className="min-h-screen bg-wepac-black">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-6 lg:px-12">
        <span className="font-barlow text-lg font-bold text-wepac-white">WEPACKER</span>
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
          <h1 className="font-barlow text-4xl font-bold leading-tight text-wepac-white sm:text-5xl md:text-6xl">
            WEPACKER é um estilo de vida que te permite atingir o teu potencial.
          </h1>
          <p className="mt-8 font-barlow text-xl font-bold text-wepac-gray sm:text-2xl">
            Estamos juntos. Juntos somos mais fortes.
          </p>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-wepac-text-secondary">
            Mentoria, comunidade e experiências reais para desenvolver talento, caráter,
            disciplina e propósito em qualquer fase da vida.
          </p>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-wepac-text-tertiary">
            Não é só sobre vencer, criar ou performar. É sobre crescer como pessoa e transformar
            potencial em caminho.
          </p>
          <div className="mt-10">
            <a
              href={singlePackHref}
              className="inline-block border border-wepac-border bg-wepac-white px-8 py-3 text-sm font-bold text-wepac-black transition-colors hover:bg-wepac-accent-muted"
            >
              Começar jornada WEPACKER
            </a>
          </div>
        </div>
      </section>

      {/* Methodology */}
      <section className="border-t border-wepac-border bg-wepac-dark px-6 py-16 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-wepac-gray">
            Método
          </p>
          <h2 className="mt-3 text-center font-barlow text-3xl font-bold text-wepac-white md:text-4xl">
            Um caminho, não uma promessa
          </h2>

          {/* 4 steps */}
          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {METHODOLOGY_STEPS.map((step, i) => (
              <div key={step.label} className="border border-wepac-border bg-wepac-card p-6">
                <span className="text-xs font-medium uppercase tracking-[0.2em] text-wepac-text-tertiary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 font-barlow text-xl font-bold text-wepac-white">
                  {step.label}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-wepac-text-secondary">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

          {/* 7 areas */}
          <div className="mt-16">
            <p className="text-center text-sm text-wepac-text-tertiary">
              7 áreas de desenvolvimento — 6 comuns a todos, mais o domínio específico do teu
              percurso.
            </p>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(Object.keys(AREA_LABELS) as (keyof typeof AREA_LABELS)[]).map((key) => (
                <div
                  key={key}
                  className={`border p-4 ${
                    key === "domain"
                      ? "border-wepac-white/40 bg-wepac-white/5"
                      : "border-wepac-border bg-wepac-black"
                  }`}
                >
                  <p className="font-barlow text-sm font-bold text-wepac-white">
                    {AREA_LABELS[key]}
                  </p>
                  <p className="mt-1 text-xs text-wepac-text-tertiary">
                    {AREA_DESCRIPTIONS[key]}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Packs */}
      <section id="packs" className="scroll-mt-16 px-6 py-16 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-wepac-gray">
            Percursos
          </p>
          <h2 className="mt-3 text-center font-barlow text-3xl font-bold text-wepac-white md:text-4xl">
            Escolhe o teu caminho
          </h2>

          {packs.length === 0 ? (
            <p className="mt-12 text-center text-sm text-wepac-text-tertiary">
              Nenhum percurso disponível de momento.
            </p>
          ) : (
            <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {packs.map((pack) => (
                <Link
                  key={pack.slug}
                  href={`/wepacker/${pack.slug}/candidatura`}
                  className="flex flex-col border border-wepac-border bg-wepac-card p-8 transition-colors hover:border-wepac-white"
                >
                  <h3 className="font-barlow text-2xl font-bold text-wepac-white">
                    {pack.name}
                  </h3>
                  {pack.tagline && (
                    <p className="mt-2 text-sm font-medium text-wepac-gray">{pack.tagline}</p>
                  )}
                  {pack.description && (
                    <p className="mt-4 flex-1 text-sm leading-relaxed text-wepac-text-secondary">
                      {pack.description}
                    </p>
                  )}
                  <span className="mt-6 text-sm font-bold text-wepac-white">
                    Candidatar-me →
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-wepac-border px-6 py-12 lg:px-12">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 text-center">
          <span className="font-barlow text-2xl font-bold text-wepac-white">WEPACKER</span>
          <p className="text-xs text-wepac-text-tertiary">WEPAC</p>
          <Link
            href="/wepacker/login"
            className="mt-4 text-xs text-wepac-text-tertiary transition-colors hover:text-wepac-white"
          >
            Já és membro? Entrar
          </Link>
        </div>
      </footer>
    </div>
  );
}
