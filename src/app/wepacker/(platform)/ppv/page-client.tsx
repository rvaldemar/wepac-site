"use client";

import { useState } from "react";
import { upsertLifePlan } from "@/lib/wepacker/actions/plan";

const LIFE_SECTIONS = [
  { key: "whoIAm", title: "Quem sou", description: "Narrativa pessoal e artística." },
  { key: "whereIAm", title: "Onde estou", description: "Situação actual: pessoal, profissional, artística." },
  { key: "whereIGo", title: "Para onde quero ir", description: "Visão a 3–5 anos." },
  { key: "whyIDo", title: "Porque faço o que faço", description: "Propósito, motivação profunda, missão pessoal." },
  { key: "commitments", title: "O que me comprometo a fazer", description: "Compromissos concretos: hábitos, atitudes, prioridades." },
] as const;

type LifeSectionKey = (typeof LIFE_SECTIONS)[number]["key"];

interface LifePlan {
  whoIAm: string;
  whereIAm: string;
  whereIGo: string;
  whyIDo: string;
  commitments: string;
  updatedAt: string;
}

interface Props {
  userId: string;
  lifePlan: LifePlan | null;
}

export default function LifePlanPageClient({ userId, lifePlan }: Props) {
  const defaultValues: Record<LifeSectionKey, string> = {
    whoIAm: lifePlan?.whoIAm ?? "",
    whereIAm: lifePlan?.whereIAm ?? "",
    whereIGo: lifePlan?.whereIGo ?? "",
    whyIDo: lifePlan?.whyIDo ?? "",
    commitments: lifePlan?.commitments ?? "",
  };

  const [values, setValues] = useState<Record<LifeSectionKey, string>>(defaultValues);
  const [editing, setEditing] = useState<LifeSectionKey | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await upsertLifePlan(userId, values);
    } finally {
      setSaving(false);
      setEditing(null);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <h1 className="font-barlow text-2xl font-bold text-wepac-white">Life Plan</h1>
      <p className="mt-1 text-sm text-wepac-text-tertiary">
        O teu documento de direcção pessoal e artística.
      </p>
      {lifePlan && (
        <p className="mt-1 text-xs text-wepac-text-tertiary">
          Última atualização: {new Date(lifePlan.updatedAt).toLocaleDateString("pt-PT")}
        </p>
      )}

      <div className="mt-6 space-y-6">
        {LIFE_SECTIONS.map((section) => {
          const isEditing = editing === section.key;
          return (
            <div key={section.key} className="border border-wepac-border bg-wepac-card p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-barlow text-lg font-bold text-wepac-white">
                    {section.title}
                  </h3>
                  <p className="mt-0.5 text-xs text-wepac-text-tertiary">{section.description}</p>
                </div>
                <button
                  onClick={() => (isEditing ? handleSave() : setEditing(section.key))}
                  disabled={saving}
                  className="text-xs text-wepac-white hover:underline disabled:opacity-50"
                >
                  {isEditing ? (saving ? "A guardar..." : "Guardar") : "Editar"}
                </button>
              </div>

              {isEditing ? (
                <textarea
                  value={values[section.key]}
                  onChange={(e) => setValues({ ...values, [section.key]: e.target.value })}
                  rows={5}
                  className="mt-4 w-full bg-wepac-dark px-4 py-3 text-sm leading-relaxed text-wepac-text-secondary outline-none focus:ring-1 focus:ring-wepac-white/50"
                />
              ) : (
                <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-wepac-text-secondary">
                  {values[section.key] || "Ainda por preencher."}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
