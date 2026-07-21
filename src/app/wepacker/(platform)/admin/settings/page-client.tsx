"use client";

import { useState } from "react";

interface QuarterConfig {
  label: string;
  start: string;
  end: string;
}

interface PlatformSettings {
  platformName: string;
  slug: string;
  quarter: number;
  year: number;
  quarters: QuarterConfig[];
  evaluationMoments: { moment: string; active: boolean }[];
  maxMembersPerCohort: number;
  sessionDurationMin: number;
}

const initial: PlatformSettings = {
  platformName: "WEPACKER",
  slug: "wepacker",
  quarter: 2,
  year: 2026,
  quarters: [
    { label: "Q1", start: "2026-01-01", end: "2026-03-31" },
    { label: "Q2", start: "2026-04-01", end: "2026-06-30" },
    { label: "Q3", start: "2026-07-01", end: "2026-09-30" },
    { label: "Q4", start: "2026-10-01", end: "2026-12-31" },
  ],
  evaluationMoments: [
    { moment: "Entrada", active: true },
    { moment: "Meio", active: true },
    { moment: "Saída", active: false },
  ],
  maxMembersPerCohort: 12,
  sessionDurationMin: 60,
};

export function AdminSettingsPageClient() {
  const [settings, setSettings] = useState(initial);
  const [saved, setSaved] = useState(false);

  function update<K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  return (
    <div className="min-h-screen bg-wepac-dark px-6 py-10 lg:px-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-barlow text-3xl font-bold text-wepac-white">
          Platform Settings
        </h1>
        <p className="mt-1 text-sm text-wepac-text-tertiary">
          Gestão de parâmetros gerais do WEPACKER.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSaved(true);
          }}
          className="mt-8 space-y-8"
        >
          {/* General */}
          <section className="border border-wepac-border bg-wepac-card p-6">
            <h2 className="font-barlow text-lg font-bold text-wepac-white">Geral</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs text-wepac-text-tertiary">
                  Nome da Plataforma
                </label>
                <input
                  value={settings.platformName}
                  onChange={(e) => update("platformName", e.target.value)}
                  className="mt-1 w-full bg-wepac-input px-3 py-2 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-white/50"
                />
              </div>
              <div>
                <label className="block text-xs text-wepac-text-tertiary">Slug base</label>
                <input
                  value={settings.slug}
                  readOnly
                  className="mt-1 w-full bg-wepac-input/50 px-3 py-2 text-sm text-wepac-text-tertiary outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-wepac-text-tertiary">
                  Legacy max participants per cohort
                </label>
                <input
                  type="number"
                  min={1}
                  value={settings.maxMembersPerCohort}
                  onChange={(e) =>
                    update("maxMembersPerCohort", parseInt(e.target.value) || 1)
                  }
                  className="mt-1 w-full bg-wepac-input px-3 py-2 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-white/50"
                />
              </div>
              <div>
                <label className="block text-xs text-wepac-text-tertiary">
                  Session duration (minutes)
                </label>
                <input
                  type="number"
                  min={15}
                  step={15}
                  value={settings.sessionDurationMin}
                  onChange={(e) =>
                    update("sessionDurationMin", parseInt(e.target.value) || 60)
                  }
                  className="mt-1 w-full bg-wepac-input px-3 py-2 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-white/50"
                />
              </div>
            </div>
          </section>

          {/* Quarters */}
          <section className="border border-wepac-border bg-wepac-card p-6">
            <h2 className="font-barlow text-lg font-bold text-wepac-white">
              Trimestres ({settings.year})
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs text-wepac-text-tertiary">Ano</label>
                <input
                  type="number"
                  value={settings.year}
                  onChange={(e) => update("year", parseInt(e.target.value) || 2026)}
                  className="mt-1 w-full bg-wepac-input px-3 py-2 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-white/50"
                />
              </div>
              <div>
                <label className="block text-xs text-wepac-text-tertiary">Trimestre Atual</label>
                <select
                  value={settings.quarter}
                  onChange={(e) => update("quarter", parseInt(e.target.value))}
                  className="mt-1 w-full bg-wepac-input px-3 py-2 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-white/50"
                >
                  {[1, 2, 3, 4].map((q) => (
                    <option key={q} value={q}>
                      Q{q}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {settings.quarters.map((q, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-4 border p-3 ${
                    settings.quarter === idx + 1
                      ? "border-wepac-white bg-wepac-white/5"
                      : "border-wepac-border"
                  }`}
                >
                  <span className="text-sm font-medium text-wepac-white">{q.label}</span>
                  <input
                    type="date"
                    value={q.start}
                    onChange={(e) => {
                      const updated = [...settings.quarters];
                      updated[idx] = { ...updated[idx], start: e.target.value };
                      update("quarters", updated);
                    }}
                    className="bg-wepac-input px-2 py-1 text-xs text-wepac-white outline-none"
                  />
                  <span className="text-xs text-wepac-text-tertiary">até</span>
                  <input
                    type="date"
                    value={q.end}
                    onChange={(e) => {
                      const updated = [...settings.quarters];
                      updated[idx] = { ...updated[idx], end: e.target.value };
                      update("quarters", updated);
                    }}
                    className="bg-wepac-input px-2 py-1 text-xs text-wepac-white outline-none"
                  />
                  {settings.quarter === idx + 1 && (
                    <span className="ml-auto text-xs font-medium text-wepac-accent-muted">
                      Ativo
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Evaluation Moments */}
          <section className="border border-wepac-border bg-wepac-card p-6">
            <h2 className="font-barlow text-lg font-bold text-wepac-white">
              Assessment Moments
            </h2>
            <div className="mt-4 space-y-3">
              {settings.evaluationMoments.map((em, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between border border-wepac-border p-3"
                >
                  <span className="text-sm text-wepac-white">{em.moment}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...settings.evaluationMoments];
                      updated[idx] = { ...updated[idx], active: !updated[idx].active };
                      update("evaluationMoments", updated);
                    }}
                    className={`px-3 py-1 text-xs font-medium transition-colors ${
                      em.active
                        ? "bg-wepac-success-bg text-wepac-success"
                        : "bg-wepac-input text-wepac-text-tertiary"
                    }`}
                  >
                    {em.active ? "Ativo" : "Inativo"}
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Save */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              className="bg-wepac-white px-8 py-3 text-sm font-bold text-wepac-black"
            >
              Guardar Alterações
            </button>
            {saved && (
              <span className="text-sm text-wepac-success">
                Configurações guardadas com sucesso!
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
