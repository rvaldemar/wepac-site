"use client";

import { useState } from "react";

interface QuarterConfig {
  label: string;
  start: string;
  end: string;
}

interface ProgramSettings {
  programName: string;
  cohortSlug: string;
  quarter: number;
  year: number;
  quarters: QuarterConfig[];
  evaluationMoments: { moment: string; active: boolean }[];
  maxArtists: number;
  sessionDurationMin: number;
}

const initial: ProgramSettings = {
  programName: "Artista Alpha",
  cohortSlug: "alpha",
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
  maxArtists: 12,
  sessionDurationMin: 60,
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState(initial);
  const [saved, setSaved] = useState(false);

  function update<K extends keyof ProgramSettings>(key: K, value: ProgramSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  return (
    <div className="min-h-screen bg-wepac-dark px-6 py-10 lg:px-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-barlow text-3xl font-bold text-wepac-white">
          Configurações do Programa
        </h1>
        <p className="mt-1 text-sm text-wepac-text-tertiary">
          Gestão de parâmetros do programa Artista Alpha.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSaved(true);
          }}
          className="mt-8 space-y-8"
        >
          {/* General */}
          <section className="rounded-lg border border-wepac-border bg-wepac-card p-6">
            <h2 className="font-barlow text-lg font-bold text-wepac-white">Geral</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs text-wepac-text-tertiary">Nome do Programa</label>
                <input
                  value={settings.programName}
                  onChange={(e) => update("programName", e.target.value)}
                  className="mt-1 w-full rounded bg-wepac-input px-3 py-2 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-white/50"
                />
              </div>
              <div>
                <label className="block text-xs text-wepac-text-tertiary">Slug do Cohort</label>
                <input
                  value={settings.cohortSlug}
                  readOnly
                  className="mt-1 w-full rounded bg-wepac-input/50 px-3 py-2 text-sm text-wepac-text-tertiary outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-wepac-text-tertiary">Máx. Artistas</label>
                <input
                  type="number"
                  min={1}
                  value={settings.maxArtists}
                  onChange={(e) => update("maxArtists", parseInt(e.target.value) || 1)}
                  className="mt-1 w-full rounded bg-wepac-input px-3 py-2 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-white/50"
                />
              </div>
              <div>
                <label className="block text-xs text-wepac-text-tertiary">
                  Duração Sessão (minutos)
                </label>
                <input
                  type="number"
                  min={15}
                  step={15}
                  value={settings.sessionDurationMin}
                  onChange={(e) => update("sessionDurationMin", parseInt(e.target.value) || 60)}
                  className="mt-1 w-full rounded bg-wepac-input px-3 py-2 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-white/50"
                />
              </div>
            </div>
          </section>

          {/* Quarters */}
          <section className="rounded-lg border border-wepac-border bg-wepac-card p-6">
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
                  className="mt-1 w-full rounded bg-wepac-input px-3 py-2 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-white/50"
                />
              </div>
              <div>
                <label className="block text-xs text-wepac-text-tertiary">Trimestre Atual</label>
                <select
                  value={settings.quarter}
                  onChange={(e) => update("quarter", parseInt(e.target.value))}
                  className="mt-1 w-full rounded bg-wepac-input px-3 py-2 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-white/50"
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
                  className={`flex items-center gap-4 rounded border p-3 ${
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
                    className="rounded bg-wepac-input px-2 py-1 text-xs text-wepac-white outline-none"
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
                    className="rounded bg-wepac-input px-2 py-1 text-xs text-wepac-white outline-none"
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
          <section className="rounded-lg border border-wepac-border bg-wepac-card p-6">
            <h2 className="font-barlow text-lg font-bold text-wepac-white">
              Momentos de Avaliação
            </h2>
            <div className="mt-4 space-y-3">
              {settings.evaluationMoments.map((em, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded border border-wepac-border p-3"
                >
                  <span className="text-sm text-wepac-white">{em.moment}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...settings.evaluationMoments];
                      updated[idx] = { ...updated[idx], active: !updated[idx].active };
                      update("evaluationMoments", updated);
                    }}
                    className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
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
              className="rounded bg-wepac-white px-8 py-3 text-sm font-bold text-wepac-black"
            >
              Guardar Alterações
            </button>
            {saved && (
              <span className="text-sm text-wepac-success">Configurações guardadas com sucesso!</span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
