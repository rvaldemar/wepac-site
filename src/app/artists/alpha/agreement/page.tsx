"use client";

import Link from "next/link";
import { useState } from "react";

const COMMITMENTS = [
  "Comprometo-me a estar presente nas sessões agendadas, salvo motivo de força maior comunicado com antecedência.",
  "Comprometo-me a ser pontual em todas as interações do programa.",
  "Comprometo-me a dar e receber feedback com honestidade e respeito.",
  "Comprometo-me a completar as tarefas e reflexões dentro dos prazos acordados.",
  "Comprometo-me a manter uma atitude aberta ao crescimento e ao confronto construtivo.",
  "Comprometo-me a respeitar a confidencialidade de tudo o que é partilhado no programa.",
  "Comprometo-me a cuidar da minha imagem e postura como representante do programa.",
  "Comprometo-me a concluir o ciclo trimestral completo.",
];

export default function AgreementPage() {
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-wepac-black px-6 py-16">
      <div className="w-full max-w-lg">
        <h1 className="font-barlow text-3xl font-bold text-wepac-white md:text-4xl">
          Acordo de Participação
        </h1>
        <p className="mt-4 text-sm text-wepac-text-secondary">
          Para participar no Artista Alpha, pedimos que leias e aceites os
          seguintes compromissos. São a base da nossa relação.
        </p>

        <div className="mt-8 space-y-4">
          {COMMITMENTS.map((c, i) => (
            <div key={i} className="flex gap-3 border-l-2 border-wepac-border pl-4">
              <span className="mt-0.5 text-xs text-wepac-white">{i + 1}.</span>
              <p className="text-sm leading-relaxed text-wepac-text-secondary">
                {c}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-wepac-border pt-6">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-1 accent-wepac-white"
            />
            <span className="text-sm text-wepac-text-secondary">
              Li e aceito as condições de participação no Artista Alpha.
            </span>
          </label>

          <Link
            href={accepted ? "/artists/alpha/assessment" : "#"}
            onClick={(e) => !accepted && e.preventDefault()}
            className={`mt-6 inline-block rounded px-8 py-3 text-sm font-bold text-wepac-white transition-colors ${
              accepted
                ? "bg-wepac-white hover:bg-wepac-accent-muted text-wepac-black"
                : "cursor-not-allowed bg-wepac-input text-wepac-text-tertiary"
            }`}
          >
            Aceitar e continuar
          </Link>
        </div>
      </div>
    </div>
  );
}
