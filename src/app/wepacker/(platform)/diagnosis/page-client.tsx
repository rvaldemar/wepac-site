"use client";

import { useState } from "react";
import { RadarChart } from "@/components/wepacker/RadarChart";
import {
  AREA_KEYS,
  getAreaLabels,
  getIndicators,
  MOMENT_LABELS,
  SCORE_LABELS,
  type AreaKey,
  type EvaluationMoment,
} from "@/lib/wepacker/types";

type AreaScores = Record<string, { selfAvg: number; mentorAvg: number; composite: number }>;
type IndicatorScores = Record<string, Record<string, { selfScore: number; mentorScore: number; composite: number }>>;

interface Props {
  scoresByMoment: Record<EvaluationMoment, AreaScores>;
  indicatorsByMoment: Record<EvaluationMoment, IndicatorScores>;
  availableMoments: EvaluationMoment[];
  packSlug: string;
  domainLabel: string;
}

export default function DiagnosisPageClient({
  scoresByMoment,
  indicatorsByMoment,
  availableMoments,
  packSlug,
  domainLabel,
}: Props) {
  const indicatorsByArea = getIndicators(packSlug);
  const areaLabels = getAreaLabels(domainLabel);
  const [moment, setMoment] = useState<EvaluationMoment>(
    availableMoments.includes("mid") ? "mid" : availableMoments[0]
  );
  const [expandedArea, setExpandedArea] = useState<AreaKey | null>(null);

  const scores = scoresByMoment[moment];
  const indicatorScores = indicatorsByMoment[moment];

  const radarCurrent = Object.fromEntries(
    Object.entries(scores).map(([k, v]) => [k, v.composite])
  ) as Record<AreaKey, number>;

  const entryScores = scoresByMoment.entry;
  const radarPrevious =
    moment !== "entry"
      ? (Object.fromEntries(
          Object.entries(entryScores).map(([k, v]) => [k, v.composite])
        ) as Record<AreaKey, number>)
      : undefined;

  return (
    <div className="p-6 lg:p-8">
      <h1 className="font-barlow text-2xl font-bold text-wepac-white">
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
            className={`px-4 py-2 text-sm transition-colors ${
              moment === m
                ? "bg-wepac-white text-wepac-black"
                : "bg-wepac-card text-wepac-text-tertiary hover:text-wepac-text-secondary"
            }`}
          >
            {MOMENT_LABELS[m]}
          </button>
        ))}
      </div>

      {/* Radar */}
      <div className="mt-8 border border-wepac-border bg-wepac-card p-6">
        <RadarChart
          currentValues={radarCurrent}
          previousValues={radarPrevious}
          areaLabels={areaLabels}
          onAreaClick={(area) => setExpandedArea(area === expandedArea ? null : area)}
          className="mx-auto w-full max-w-md"
          size={380}
        />
        <div className="mt-4 flex justify-center gap-6 text-xs text-wepac-text-tertiary">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-4 bg-wepac-white/20" />
            {MOMENT_LABELS[moment]}
          </span>
          {radarPrevious && (
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-4 border border-dashed border-wepac-border" />
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
            <div key={area} className="border border-wepac-border bg-wepac-card">
              <button
                onClick={() => setExpandedArea(isExpanded ? null : area)}
                className="flex w-full items-center justify-between p-4 text-left"
              >
                <div>
                  <h3 className="font-barlow text-lg font-bold text-wepac-white">
                    {areaLabels[area]}
                  </h3>
                  <div className="mt-1 flex gap-4 text-xs text-wepac-text-tertiary">
                    <span>Auto: {areaScores.selfAvg}</span>
                    <span>Mentor: {areaScores.mentorAvg}</span>
                    <span className="text-wepac-white">Composto: {areaScores.composite}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <div
                        key={v}
                        className={`h-2 w-5 ${
                          v <= Math.round(areaScores.composite) ? "bg-wepac-white" : "bg-wepac-input"
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
                    {indicatorsByArea[area].map((ind) => {
                      const indData = indicatorScores[area]?.[ind.key];
                      const composite = indData?.composite ?? 0;
                      return (
                        <div key={ind.key} className="flex items-center justify-between bg-wepac-dark p-3">
                          <span className="text-sm text-wepac-text-secondary">{ind.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-wepac-text-tertiary">
                              {composite > 0 ? composite : "—"}
                            </span>
                            {composite > 0 && (
                              <span className="text-xs text-wepac-text-tertiary">
                                ({SCORE_LABELS[Math.round(composite)]})
                              </span>
                            )}
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
