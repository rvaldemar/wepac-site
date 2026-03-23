"use client";

import { use } from "react";
import Link from "next/link";
import { RadarChart } from "@/components/artists/RadarChart";
import { StrategicRadar } from "@/components/artists/StrategicRadar";
import {
  mockUsers,
  computeAreaScores,
  mockStrategicMapScores,
  mockTasks,
  mockSessions,
  mockLifePlans,
  mockStrategicPlans,
} from "@/data/artist-mock";
import {
  AREA_LABELS,
  LEVEL_LABELS,
  PHASE_LABELS,
  type AreaKey,
  type ArtistPhase,
} from "@/lib/types/artist";

const PHASES: ArtistPhase[] = ["diagnosis", "structuring", "development", "activation", "evaluation"];

export default function MentorArtistView({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const artist = mockUsers.find((u) => u.id === id);

  if (!artist) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-sm text-wepac-text-tertiary">Artista não encontrado.</p>
      </div>
    );
  }

  // Scores
  let currentScores: Record<AreaKey, { selfAvg: number; mentorAvg: number; composite: number }>;
  let previousScores: Record<AreaKey, { selfAvg: number; mentorAvg: number; composite: number }>;
  try {
    currentScores = computeAreaScores(artist.id, "mid");
    previousScores = computeAreaScores(artist.id, "entry");
  } catch {
    const empty = { selfAvg: 0, mentorAvg: 0, composite: 0 };
    currentScores = Object.fromEntries(
      ["physical", "emotional", "character", "spiritual", "intellectual", "social"].map((k) => [k, empty])
    ) as Record<AreaKey, typeof empty>;
    previousScores = currentScores;
  }

  const currentRadar = Object.fromEntries(
    Object.entries(currentScores).map(([k, v]) => [k, v.composite || 1])
  ) as Record<AreaKey, number>;
  const previousRadar = Object.fromEntries(
    Object.entries(previousScores).map(([k, v]) => [k, v.composite || 1])
  ) as Record<AreaKey, number>;

  const latestMap = mockStrategicMapScores.find((s) => s.userId === artist.id);
  const artistTasks = mockTasks.filter((t) => t.userId === artist.id);
  const artistSessions = mockSessions.filter((s) =>
    s.attendees.some((a) => a.userId === artist.id)
  );
  const lifePlan = mockLifePlans.find((l) => l.userId === artist.id);
  const strategicPlan = mockStrategicPlans.find((l) => l.userId === artist.id);

  const currentPhaseIdx = PHASES.indexOf(artist.currentPhase);

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/artists/alpha/mentor"
          className="text-sm text-wepac-text-tertiary hover:text-wepac-text-secondary"
        >
          ← Voltar
        </Link>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-wepac-borgonha/20">
          <span className="font-barlow text-lg font-bold text-wepac-borgonha">
            {artist.name.split(" ").map((n) => n[0]).join("")}
          </span>
        </div>
        <div>
          <h1 className="font-barlow text-2xl font-bold text-wepac-white">
            {artist.name}
          </h1>
          <div className="mt-1 flex gap-2">
            <span className="rounded bg-wepac-borgonha/20 px-2 py-0.5 text-xs font-bold text-wepac-borgonha">
              {LEVEL_LABELS[artist.level]}
            </span>
            <span className="text-xs text-wepac-text-tertiary">
              {PHASE_LABELS[artist.currentPhase]}
            </span>
          </div>
        </div>
      </div>

      {/* Radars */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded border border-wepac-border bg-wepac-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-barlow text-lg font-bold text-wepac-white">
              Mapa de Desenvolvimento
            </h2>
            <Link
              href={`/artists/alpha/mentor/evaluate/${artist.id}`}
              className="text-xs text-wepac-borgonha hover:underline"
            >
              Avaliar →
            </Link>
          </div>
          <RadarChart
            currentValues={currentRadar}
            previousValues={previousRadar}
            className="mx-auto mt-4 w-full max-w-xs"
            size={300}
          />
        </div>

        <div className="rounded border border-wepac-border bg-wepac-card p-6">
          <h2 className="font-barlow text-lg font-bold text-wepac-white">
            Mapa Estratégico
          </h2>
          <StrategicRadar
            current={
              latestMap
                ? {
                    longTerm: latestMap.longTermScore,
                    annual: latestMap.annualScore,
                    quarterly: latestMap.quarterlyScore,
                    monthly: latestMap.monthlyScore,
                  }
                : { longTerm: 1, annual: 1, quarterly: 1, monthly: 1 }
            }
            className="mx-auto mt-4 w-full max-w-xs"
            size={280}
          />
        </div>
      </div>

      {/* Progress */}
      <div className="mt-8 rounded border border-wepac-border bg-wepac-card p-6">
        <h2 className="font-barlow text-lg font-bold text-wepac-white">
          Progresso Trimestral
        </h2>
        <div className="mt-4 flex items-center justify-between">
          {PHASES.map((phase, i) => (
            <div key={phase} className="flex flex-1 items-center">
              <div
                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  i < currentPhaseIdx
                    ? "bg-wepac-borgonha/20 text-wepac-borgonha"
                    : i === currentPhaseIdx
                      ? "bg-wepac-borgonha text-wepac-white"
                      : "bg-wepac-input text-wepac-text-tertiary"
                }`}
              >
                {i < currentPhaseIdx ? "✓" : i + 1}
              </div>
              {i < PHASES.length - 1 && (
                <div className={`mx-1 h-0.5 flex-1 ${i < currentPhaseIdx ? "bg-wepac-borgonha/40" : "bg-wepac-input"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "PPV", desc: lifePlan ? "Preenchido" : "Não preenchido", href: "#" },
          { label: "Plano", desc: strategicPlan ? strategicPlan.quarter : "—", href: "#" },
          { label: "Tarefas", desc: `${artistTasks.filter((t) => t.status !== "done").length} pendentes`, href: "#" },
          { label: "Sessões", desc: `${artistSessions.length} total`, href: "#" },
        ].map((item) => (
          <div key={item.label} className="rounded border border-wepac-border bg-wepac-card p-4">
            <p className="text-sm font-medium text-wepac-white">{item.label}</p>
            <p className="mt-1 text-xs text-wepac-text-tertiary">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Tasks */}
      <div className="mt-8 rounded border border-wepac-border bg-wepac-card p-6">
        <h2 className="font-barlow text-lg font-bold text-wepac-white">
          Tarefas
        </h2>
        <div className="mt-4 space-y-2">
          {artistTasks.slice(0, 5).map((task) => (
            <div key={task.id} className="flex items-center justify-between border-b border-wepac-border pb-2">
              <span className={`text-sm ${task.status === "done" ? "text-wepac-text-tertiary line-through" : "text-wepac-text-secondary"}`}>
                {task.title}
              </span>
              <span className="text-xs text-wepac-text-tertiary">{task.deadline}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
