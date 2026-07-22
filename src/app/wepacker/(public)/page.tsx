import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PILLAR_LABELS } from "@/lib/wepacker/types";

export const metadata: Metadata = {
  title: { absolute: "WEPACker — plataforma de desenvolvimento humano da WEPAC" },
  description:
    "WEPACKER é um estilo de vida que te permite atingir o teu potencial. Relações de Mentorship, comunidade e experiências reais para desenvolver talento, caráter, disciplina e propósito em qualquer fase da vida.",
};

const PILLAR_DESCRIPTIONS: Record<string, string> = {
  physical: "O corpo como base de presença e energia",
  emotional: "Vida emocional e capacidade expressiva",
  character: "Disciplina, ética e consistência",
  spiritual: "Profundidade, propósito e sentido",
  intellectual: "Pensamento, estratégia e visão",
  social: "Relação, rede e comunidade",
};

const METHODOLOGY_STEPS = [
  {
    label: "My Journey",
    desc: "Um percurso pessoal contínuo, orientado pelos Six Pillars e pelo teu Stage.",
  },
  {
    label: "Life Map",
    desc: "Direção clara — quem és, para onde vais e o que te comprometes a fazer.",
  },
  {
    label: "Mentorship",
    desc: "Relação direta e consentida entre Mentor e Mentee, com Sessions explícitas.",
  },
  {
    label: "Trails",
    desc: "Transformações concretas que ganham forma em ação, hábito e resultado real.",
  },
];

export default function WepackerLandingPage() {
  const heroHref = "/wepacker/intake";

  return (
    <div className="min-h-screen bg-wepac-black">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-6 lg:px-12">
        <Image
          src="/logo/email/wepacker-lockup-white.png"
          alt="WEPACKER"
          width={144}
          height={72}
          className="h-9 w-auto"
          priority
        />
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
            From packers to WEPACkers.
          </p>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-wepac-text-secondary">
            Relações de Mentorship, comunidade e experiências reais para desenvolver talento,
            caráter, disciplina e propósito em qualquer fase da vida.
          </p>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-wepac-text-tertiary">
            Não é só sobre vencer, criar ou performar. É sobre crescer como pessoa e transformar
            potencial em caminho.
          </p>
          <div className="mt-10">
            <a
              href={heroHref}
              className="inline-block border border-wepac-border bg-wepac-white px-8 py-3 text-sm font-bold text-wepac-black transition-colors hover:bg-wepac-accent-muted"
            >
              Apply to WEPACKER
            </a>
          </div>
        </div>
      </section>

      {/* Methodology */}
      <section className="border-t border-wepac-border bg-wepac-dark px-6 py-16 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-wepac-gray">
            Method
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

          {/* Six universal Pillars */}
          <div className="mt-16">
            <p className="text-center text-sm text-wepac-text-tertiary">
              Six Pillars — universais, para qualquer WEPACker, em qualquer momento de
              My Journey.
            </p>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(Object.keys(PILLAR_LABELS) as (keyof typeof PILLAR_LABELS)[]).map((key) => (
                <div key={key} className="border border-wepac-border bg-wepac-black p-4">
                  <p className="font-barlow text-sm font-bold text-wepac-white">
                    {PILLAR_LABELS[key]}
                  </p>
                  <p className="mt-1 text-xs text-wepac-text-tertiary">
                    {PILLAR_DESCRIPTIONS[key]}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="disciplines" className="scroll-mt-16 px-6 py-16 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-wepac-gray">
            Disciplines
          </p>
          <h2 className="mt-3 text-center font-barlow text-3xl font-bold text-wepac-white md:text-4xl">
            Escolhe o teu caminho
          </h2>

          <div className="mx-auto mt-14 max-w-xl">
            <Link
              href="/wepacker/intake?artisticArea=Arts"
              className="flex flex-col border border-wepac-border bg-wepac-card p-8 transition-colors hover:border-wepac-white"
            >
              <h3 className="font-barlow text-2xl font-bold text-wepac-white">Arts</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-wepac-text-secondary">
                Uma Discipline para pessoas que querem desenvolver a sua prática artística
                sem separar talento, caráter e vida.
              </p>
              <span className="mt-6 text-sm font-bold text-wepac-white">Apply →</span>
            </Link>
          </div>
          <p className="mt-10 text-center text-sm text-wepac-text-tertiary">
            Ainda não sabes por onde começar?{" "}
            <Link
              href="/wepacker/intake"
              className="text-wepac-white underline-offset-4 hover:underline"
            >
              Start here →
            </Link>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-wepac-border px-6 py-12 lg:px-12">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 text-center">
          <span className="font-barlow text-2xl font-bold text-wepac-white">WEPACKER</span>
          <p className="text-xs font-bold text-wepac-text-secondary">From packers to WEPACkers.</p>
          <p className="text-xs text-wepac-text-tertiary">WEPAC</p>
          <Link
            href="/wepacker/login"
            className="mt-4 text-xs text-wepac-text-tertiary transition-colors hover:text-wepac-white"
          >
            Já tens conta? Entrar
          </Link>
        </div>
      </footer>
    </div>
  );
}
