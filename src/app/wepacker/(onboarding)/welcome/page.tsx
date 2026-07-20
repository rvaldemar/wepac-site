"use client";

import Link from "next/link";
import { OnboardingStepper } from "@/components/wepacker/OnboardingStepper";

export default function WelcomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-wepac-black px-6 pt-16">
      <OnboardingStepper currentStep={0} />
      <div className="w-full max-w-lg text-center">
        <h1 className="font-barlow text-4xl font-bold text-wepac-white md:text-5xl">
          Bem-vindo à WEPACKER.
        </h1>

        <div className="mt-10 space-y-4 text-left text-sm leading-relaxed text-wepac-text-secondary">
          <p>
            A WEPACKER é a plataforma do programa de desenvolvimento
            artístico integral da WEPAC — Companhia de Artes. Um espaço de
            mentoria, avaliação e planeamento estratégico para quem se
            compromete a crescer a sério.
          </p>
          <p>
            Na plataforma vais encontrar o teu diagnóstico de
            desenvolvimento, o teu plano de projeto de vida, o plano
            estratégico, tarefas, sessões com o teu mentor e mensagens.
          </p>
          <p>
            O que esperamos de ti: presença, honestidade, compromisso e
            disponibilidade para crescer. Não procuramos perfeição —
            procuramos verdade e evolução.
          </p>
          <p>
            Estamos juntos. Juntos somos mais fortes. O ritmo é semanal, o
            ciclo é trimestral — a mentoria, a comunidade e a exigência
            partilhada é o que sustenta o percurso.
          </p>
        </div>

        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/wepacker/login"
            className="border border-wepac-border px-6 py-3 text-sm text-wepac-text-secondary transition-colors hover:bg-wepac-card"
          >
            Voltar
          </Link>
          <Link
            href="/wepacker/agreement"
            className="bg-wepac-white px-8 py-3 text-sm font-bold text-wepac-black transition-colors hover:bg-wepac-accent-muted"
          >
            Continuar
          </Link>
        </div>
      </div>
    </div>
  );
}
