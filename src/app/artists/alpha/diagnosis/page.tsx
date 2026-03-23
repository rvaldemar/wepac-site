"use client";

import { useState } from "react";
import { RadarChart } from "@/components/artists/RadarChart";
import {
  getCurrentUser,
  computeAreaScores,
  mockEvaluations,
} from "@/data/artist-mock";
import {
  AREA_LABELS,
  AREA_KEYS,
  INDICATORS,
  SCORE_LABELS,
  type AreaKey,
  type EvaluationMoment,
} from "@/lib/types/artist";

const MOMENT_LABELS: Record<EvaluationMoment, string> = {
  entry: "Entrada",
  mid: "Meio",
  exit: "Saída",
};

export default function DiagnosisPage() {
  const user = getCurrentUser();
  const [moment, setMoment] = useState<EvaluationMoment>("mid");
  const [expandedArea, setExpandedArea] = useState<AreaKey | null>(null);

  const scores = computeAreaScores(user.id, moment);
  const entryScores = computeAreaScores(user.id, "entry");

  const radarCurrent = Object.fromEntries(
    Object.entries(scores).map(([k, v]) => [k, v.composite])
  ) as Record<AreaKey, number>;

  const radarPrevious =
    moment !== "entry"
      ? (Object.fromEntries(
          Object.entries(entryScores).map(([k, v]) => [k, v.composite])
        ) as Record<AreaKey, number>)
      : undefined;

  const availableMoments = ["entry", "mid"] as EvaluationMoment[];

  return (
    <div className="p-6 lg:p-8">
      <h1 className="font-cormorant text-2xl font-bold text-wepac-white">
        Diagnóstico / Avaliação
      </h1>
      <p className="mt-1 text-sm text-wepac-text-tertiary">
        O teu mapa de desenvolvimento ao longo do programa.
      </p>

      {/* Moment selector */}
      <div className="mt-6 flex gap-2">
        {availableMoments.map((m) => (
          <button
            key={m}
            onClick={() => setMoment(m)}
            className={`rounded px-4 py-2 text-sm transition-colors ${
              moment === m
                ? "bg-wepac-borgonha text-wepac-white"
                : "bg-wepac-card text-wepac-text-tertiary hover:text-wepac-text-secondary"
            }`}
          >
            {MOMENT_LABELS[m]}
          </button>
        ))}
      </div>

      {/* Radar */}
      <div className="mt-8 rounded border border-wepac-border bg-wepac-card p-6">
        <RadarChart
          currentValues={radarCurrent}
          previousValues={radarPrevious}
          onAreaClick={(area) => setExpandedArea(area === expandedArea ? null : area)}
          className="mx-auto w-full max-w-md"
          size={380}
        />
        <div className="mt-4 flex justify-center gap-6 text-xs text-wepac-text-tertiary">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-4 bg-wepac-borgonha/40" />
            {MOMENT_LABELS[moment]}
          </span>
          {radarPrevious && (
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-4 border border-dashed border-gray-500" />
              Entrada
            </span>
          )}
        </div>
      </div>

      {/* Area breakdown */}
      <div className="mt-8 space-y-4">
        {AREA_KEYS.map((area) => {
          const areaScores = scores[area];
          const isExpanded = expandedArea === area;
          return (
            <div key={area} className="rounded border border-wepac-border bg-wepac-card">
              <button
                onClick={() => setExpandedArea(isExpanded ? null : area)}
                className="flex w-full items-center justify-between p-4 text-left"
              >
                <div>
                  <h3 className="font-cormorant text-lg font-bold text-wepac-white">
                    {AREA_LABELS[area]}
                  </h3>
                  <div className="mt-1 flex gap-4 text-xs text-wepac-text-tertiary">
                    <span>Auto: {areaScores.selfAvg}</span>
                    <span>Mentor: {areaScores.mentorAvg}</span>
                    <span className="text-wepac-borgonha">
                      Composto: {areaScores.composite}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <div
                        key={v}
                        className={`h-2 w-5 rounded-sm ${
                          v <= Math.round(areaScores.composite)
                            ? "bg-wepac-borgonha"
                            : "bg-wepac-input"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-wepac-text-tertiary">{isExpanded ? "−" : "+"}</span>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-wepac-border px-4 pb-4 pt-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {INDICATORS[area].map((ind, idx) => {
                      // Use area composite as base with slight variation for demo
                      const selfScore = Math.max(1, Math.min(5, Math.round(areaScores.selfAvg + (idx % 3 - 1) * 0.5)));
                      const mentorScore = Math.max(1, Math.min(5, Math.round(areaScores.mentorAvg + ((idx + 1) % 3 - 1) * 0.5)));
                      const composite = Math.round((selfScore * 0.4 + mentorScore * 0.6) * 10) / 10;
                      return (
                        <div key={ind.key} className="flex items-center justify-between rounded bg-wepac-dark p-3">
                          <span className="text-sm text-wepac-text-secondary">{ind.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-wepac-text-tertiary">{composite}</span>
                            <span className="text-xs text-wepac-text-tertiary">
                              ({SCORE_LABELS[Math.round(composite)]})
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
