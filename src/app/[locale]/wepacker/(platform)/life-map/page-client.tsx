"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { wp } from "@/i18n/copy/wepacker";
import { useRouter } from "@/i18n/navigation";
import { upsertLifeMap, restoreLifeMapVersion } from "@/lib/wepacker/actions/plan";

const LIFE_SECTION_KEYS = [
  "whoIAm",
  "whereIAm",
  "whereIGo",
  "whyIDo",
  "commitments",
] as const;

type LifeSectionKey = (typeof LIFE_SECTION_KEYS)[number];

function lifeSections(locale: string) {
  return [
    {
      key: "whoIAm" as const,
      title: wp(locale, "Quem sou", "Who I am"),
      description: wp(
        locale,
        "Identidade, história e o que reconheço em mim.",
        "Identity, history, and what I recognize in myself.",
      ),
    },
    {
      key: "whereIAm" as const,
      title: wp(locale, "Onde estou", "Where I am"),
      description: wp(
        locale,
        "Situação atual, relações, trabalho, prática e contexto.",
        "Current situation, relationships, work, practice, and context.",
      ),
    },
    {
      key: "whereIGo" as const,
      title: wp(locale, "Para onde quero ir", "Where I want to go"),
      description: wp(locale, "Visão a 3–5 anos.", "A 3–5 year vision."),
    },
    {
      key: "whyIDo" as const,
      title: wp(locale, "Porque faço o que faço", "Why I do what I do"),
      description: wp(
        locale,
        "Propósito, motivação profunda, missão pessoal.",
        "Purpose, deep motivation, and personal mission.",
      ),
    },
    {
      key: "commitments" as const,
      title: wp(
        locale,
        "O que me comprometo a fazer",
        "What I commit to doing",
      ),
      description: wp(
        locale,
        "Compromissos concretos: hábitos, atitudes, prioridades.",
        "Concrete commitments: habits, attitudes, and priorities.",
      ),
    },
  ];
}

interface LifeMap {
  whoIAm: string;
  whereIAm: string;
  whereIGo: string;
  whyIDo: string;
  commitments: string;
  updatedAt: string;
}

interface LifeMapVersion {
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
  lifeMap: LifeMap | null;
  versions: LifeMapVersion[];
}

export default function LifeMapPageClient({ userId, lifeMap, versions }: Props) {
  const locale = useLocale();
  const sections = lifeSections(locale);
  const defaultValues: Record<LifeSectionKey, string> = {
    whoIAm: lifeMap?.whoIAm ?? "",
    whereIAm: lifeMap?.whereIAm ?? "",
    whereIGo: lifeMap?.whereIGo ?? "",
    whyIDo: lifeMap?.whyIDo ?? "",
    commitments: lifeMap?.commitments ?? "",
  };

  const [values, setValues] = useState<Record<LifeSectionKey, string>>(defaultValues);
  const [editing, setEditing] = useState<LifeSectionKey | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await upsertLifeMap(userId, values);
    } finally {
      setSaving(false);
      setEditing(null);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <h1 className="font-barlow text-2xl font-bold text-wepac-white">Life Map</h1>
      <p className="mt-1 text-sm text-wepac-text-tertiary">
        {wp(
          locale,
          "O teu mapa vivo de direção, identidade e compromissos.",
          "Your living map of direction, identity, and commitments.",
        )}
      </p>
      {lifeMap && (
        <p className="mt-1 text-xs text-wepac-text-tertiary">
          {wp(locale, "Última atualização", "Last updated")}:{" "}
          {new Date(lifeMap.updatedAt).toLocaleDateString(locale)}
        </p>
      )}

      <div className="mt-6 space-y-6">
        {sections.map((section) => {
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
                  {isEditing
                    ? saving
                      ? wp(locale, "A guardar...", "Saving...")
                      : wp(locale, "Guardar", "Save")
                    : wp(locale, "Editar", "Edit")}
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
                  {values[section.key] ||
                    wp(locale, "Ainda por preencher.", "Not filled in yet.")}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {versions.length > 0 && (
        <VersionHistory
          userId={userId}
          versions={versions}
          locale={locale}
        />
      )}
    </div>
  );
}

function VersionHistory({
  userId,
  versions,
  locale,
}: {
  userId: string;
  versions: LifeMapVersion[];
  locale: string;
}) {
  const sections = lifeSections(locale);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const handleRestore = async (versionId: string) => {
    const confirmed = window.confirm(
      wp(
        locale,
        "Restaurar esta versão? O conteúdo atual fica guardado no histórico.",
        "Restore this version? The current content will remain in the history.",
      ),
    );
    if (!confirmed) return;
    setRestoringId(versionId);
    try {
      await restoreLifeMapVersion(userId, versionId);
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
        {wp(locale, "Versões anteriores", "Previous versions")} ({versions.length})
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
                    {new Date(version.createdAt).toLocaleDateString(locale, {
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
                    {sections.map((section) => (
                      <div key={section.key}>
                        <h4 className="font-barlow text-sm font-bold text-wepac-white">
                          {section.title}
                        </h4>
                        <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-wepac-text-tertiary">
                          {version[section.key] ||
                            wp(
                              locale,
                              "Ainda por preencher.",
                              "Not filled in yet.",
                            )}
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
                        ? wp(locale, "A restaurar...", "Restoring...")
                        : wp(
                            locale,
                            "Restaurar esta versão",
                            "Restore this version",
                          )}
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
