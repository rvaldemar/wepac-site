"use client";

import Link from "next/link";

export default function WelcomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-wepac-black px-6">
      <div className="w-full max-w-lg text-center">
        <h1 className="font-cormorant text-4xl font-bold text-wepac-white md:text-5xl">
          Bem-vindo ao Artista Alpha.
        </h1>

        <div className="mt-10 space-y-4 text-left text-sm leading-relaxed text-wepac-text-secondary">
          <p>
            O Artista Alpha é a primeira cohort do programa Artistas WEPAC. Um
            grupo fechado de artistas que recebem o serviço completo de
            desenvolvimento — artístico, humano e profissional — durante um
            ciclo trimestral.
          </p>
          <p>
            Na plataforma vais encontrar o teu diagnóstico de desenvolvimento,
            o teu plano de projeto de vida, o plano estratégico, tarefas,
            sessões com o teu mentor e mensagens.
          </p>
          <p>
            O que esperamos de ti: presença, honestidade, compromisso e
            disponibilidade para crescer. Não buscamos perfeição — buscamos
            verdade e evolução.
          </p>
          <p>
            O ritmo é semanal, o ciclo é trimestral. Cada semana traz
            tarefas, reflexões e, por vezes, sessões. Tudo vive aqui dentro.
          </p>
        </div>

        <Link
          href="/artists/alpha/agreement"
          className="mt-10 inline-block rounded bg-wepac-borgonha px-8 py-3 text-sm font-bold text-wepac-white transition-colors hover:bg-wepac-borgonha-light"
        >
          Continuar
        </Link>
      </div>
    </div>
  );
}
