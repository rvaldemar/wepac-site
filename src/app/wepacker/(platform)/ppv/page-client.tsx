"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upsertLifePlan, restoreLifePlanVersion } from "@/lib/wepacker/actions/plan";

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

interface LifePlanVersion {
  id: string;
  whoIAm: string;
  whereIAm: string;
  whereIGo: string;
  whyIDo: string;
  commitments: string;
  createdAt: string;
}

interface Props {
  userId: string;
  lifePlan: LifePlan | null;
  versions: LifePlanVersion[];
}

export default function LifePlanPageClient({ userId, lifePlan, versions }: Props) {
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

      {versions.length > 0 && <VersionHistory userId={userId} versions={versions} />}
    </div>
  );
}

function VersionHistory({ userId, versions }: { userId: string; versions: LifePlanVersion[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const handleRestore = async (versionId: string) => {
    const confirmed = window.confirm(
      "Restaurar esta versão? O conteúdo atual fica guardado no histórico."
    );
    if (!confirmed) return;
    setRestoringId(versionId);
    try {
      await restoreLifePlanVersion(userId, versionId);
      router.refresh();
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="mt-10 border-t border-wepac-border pt-4">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 text-xs text-wepac-text-tertiary hover:text-wepac-text-secondary"
      >
        <span aria-hidden="true">{open ? "▾" : "▸"}</span>
        Versões anteriores ({versions.length})
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          {versions.map((version) => {
            const isExpanded = expandedId === version.id;
            return (
              <div key={version.id} className="border border-wepac-border bg-wepac-card">
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : version.id)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-xs text-wepac-text-secondary hover:text-wepac-white"
                >
                  <span>
                    {new Date(version.createdAt).toLocaleDateString("pt-PT", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span aria-hidden="true">{isExpanded ? "▾" : "▸"}</span>
                </button>

                {isExpanded && (
                  <div className="space-y-4 border-t border-wepac-border px-4 py-4">
                    {LIFE_SECTIONS.map((section) => (
                      <div key={section.key}>
                        <h4 className="font-barlow text-sm font-bold text-wepac-white">
                          {section.title}
                        </h4>
                        <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-wepac-text-tertiary">
                          {version[section.key] || "Ainda por preencher."}
                        </p>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleRestore(version.id)}
                      disabled={restoringId === version.id}
                      className="text-xs text-wepac-white hover:underline disabled:opacity-50"
                    >
                      {restoringId === version.id
                        ? "A restaurar..."
                        : "Restaurar esta versão"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
