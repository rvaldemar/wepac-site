"use client";

import { useState } from "react";
import { mockLifePlans } from "@/data/artist-mock";

const SECTIONS = [
  { key: "whoIAm", title: "Quem sou", description: "Narrativa pessoal e artística." },
  { key: "whereIAm", title: "Onde estou", description: "Situação actual: pessoal, profissional, artística." },
  { key: "whereIGo", title: "Para onde quero ir", description: "Visão a 3–5 anos." },
  { key: "whyIDo", title: "Porque faço o que faço", description: "Propósito, motivação profunda, missão pessoal." },
  { key: "commitments", title: "O que me comprometo a fazer", description: "Compromissos concretos: hábitos, atitudes, prioridades." },
] as const;

type SectionKey = (typeof SECTIONS)[number]["key"];

export default function PPVPage() {
  const plan = mockLifePlans[0];
  const [values, setValues] = useState<Record<SectionKey, string>>({
    whoIAm: plan.whoIAm,
    whereIAm: plan.whereIAm,
    whereIGo: plan.whereIGo,
    whyIDo: plan.whyIDo,
    commitments: plan.commitments,
  });
  const [editing, setEditing] = useState<SectionKey | null>(null);

  return (
    <div className="p-6 lg:p-8">
      <h1 className="font-barlow text-2xl font-bold text-wepac-white">
        Plano de Projeto de Vida
      </h1>
      <p className="mt-1 text-sm text-wepac-text-tertiary">
        O teu documento de direcção pessoal e artística.
      </p>
      <p className="mt-1 text-xs text-wepac-text-tertiary">
        Última atualização: {new Date(plan.updatedAt).toLocaleDateString("pt-PT")}
      </p>

      <div className="mt-8 space-y-6">
        {SECTIONS.map((section) => {
          const isEditing = editing === section.key;
          return (
            <div key={section.key} className="rounded border border-wepac-border bg-wepac-card p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-barlow text-xl font-bold text-wepac-white">
                    {section.title}
                  </h2>
                  <p className="mt-0.5 text-xs text-wepac-text-tertiary">
                    {section.description}
                  </p>
                </div>
                <button
                  onClick={() => setEditing(isEditing ? null : section.key)}
                  className="text-xs text-wepac-borgonha hover:underline"
                >
                  {isEditing ? "Guardar" : "Editar"}
                </button>
              </div>

              {isEditing ? (
                <textarea
                  value={values[section.key]}
                  onChange={(e) =>
                    setValues({ ...values, [section.key]: e.target.value })
                  }
                  rows={6}
                  className="mt-4 w-full rounded bg-wepac-dark px-4 py-3 text-sm leading-relaxed text-wepac-text-secondary outline-none focus:ring-1 focus:ring-wepac-borgonha"
                />
              ) : (
                <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-wepac-text-secondary">
                  {values[section.key]}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
