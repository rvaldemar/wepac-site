"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AREA_KEYS,
  AREA_LABELS,
  INDICATORS,
  SCORE_LABELS,
  type AreaKey,
} from "@/lib/types/artist";

export default function AssessmentPage() {
  const [currentArea, setCurrentArea] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [completed, setCompleted] = useState(false);

  const area = AREA_KEYS[currentArea];
  const indicators = INDICATORS[area];
  const totalAreas = AREA_KEYS.length;

  const areaComplete = indicators.every((ind) => scores[`${area}.${ind.key}`] > 0);
  const allComplete = AREA_KEYS.every((a) =>
    INDICATORS[a].every((ind) => scores[`${a}.${ind.key}`] > 0)
  );

  function handleScore(indicatorKey: string, score: number) {
    setScores((prev) => ({ ...prev, [`${area}.${indicatorKey}`]: score }));
  }

  function nextArea() {
    if (currentArea < totalAreas - 1) {
      setCurrentArea((prev) => prev + 1);
    } else {
      setCompleted(true);
    }
  }

  if (completed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-wepac-black px-6">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-wepac-borgonha/20">
            <span className="text-2xl text-wepac-borgonha">✓</span>
          </div>
          <h1 className="mt-6 font-barlow text-3xl font-bold text-wepac-white">
            Autoavaliação completa
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-wepac-text-secondary">
            A tua autoavaliação está completa. O teu mentor vai completar o
            diagnóstico após a primeira sessão.
          </p>
          <Link
            href="/artists/alpha/dashboard"
            className="mt-8 inline-block rounded bg-wepac-borgonha px-8 py-3 text-sm font-bold text-wepac-white transition-colors hover:bg-wepac-borgonha-light"
          >
            Ir para o meu espaço
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-wepac-black px-6 py-16">
      <div className="mx-auto max-w-xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-wepac-text-tertiary">
            <span>Autoavaliação Inicial</span>
            <span>
              Área {currentArea + 1} de {totalAreas}
            </span>
          </div>
          <div className="mt-2 h-1 w-full bg-wepac-input">
            <div
              className="h-1 bg-wepac-borgonha transition-all"
              style={{ width: `${((currentArea + 1) / totalAreas) * 100}%` }}
            />
          </div>
        </div>

        {/* Area pills */}
        <div className="mb-8 flex flex-wrap gap-2">
          {AREA_KEYS.map((a, i) => {
            const done = INDICATORS[a].every((ind) => scores[`${a}.${ind.key}`] > 0);
            return (
              <button
                key={a}
                onClick={() => setCurrentArea(i)}
                className={`rounded px-3 py-1 text-xs transition-colors ${
                  i === currentArea
                    ? "bg-wepac-borgonha text-wepac-white"
                    : done
                      ? "bg-wepac-card text-wepac-borgonha"
                      : "bg-wepac-card text-wepac-text-tertiary"
                }`}
              >
                {AREA_LABELS[a]} {done && "✓"}
              </button>
            );
          })}
        </div>

        <h2 className="font-barlow text-2xl font-bold text-wepac-white">
          {AREA_LABELS[area]}
        </h2>
        <p className="mt-1 text-sm text-wepac-text-tertiary">
          Avalia cada indicador de 1 a 5.
        </p>

        {/* Indicators */}
        <div className="mt-8 space-y-6">
          {indicators.map((ind) => {
            const current = scores[`${area}.${ind.key}`] || 0;
            return (
              <div key={ind.key}>
                <p className="text-sm font-medium text-wepac-text-secondary">
                  {ind.label}
                </p>
                <div className="mt-2 flex gap-2">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      key={score}
                      onClick={() => handleScore(ind.key, score)}
                      className={`flex h-10 w-10 items-center justify-center rounded text-sm transition-colors ${
                        current === score
                          ? "bg-wepac-borgonha text-wepac-white"
                          : "bg-wepac-input text-wepac-text-tertiary hover:bg-wepac-card hover:text-wepac-text-secondary"
                      }`}
                      title={SCORE_LABELS[score]}
                    >
                      {score}
                    </button>
                  ))}
                </div>
                {current > 0 && (
                  <p className="mt-1 text-xs text-wepac-text-tertiary">
                    {SCORE_LABELS[current]}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="mt-10 flex items-center justify-between">
          <button
            onClick={() => setCurrentArea((prev) => Math.max(0, prev - 1))}
            disabled={currentArea === 0}
            className="rounded border border-wepac-border px-6 py-2 text-sm text-wepac-text-secondary transition-colors hover:bg-wepac-card disabled:opacity-30"
          >
            Anterior
          </button>
          {currentArea < totalAreas - 1 ? (
            <button
              onClick={nextArea}
              className="rounded bg-wepac-borgonha px-6 py-2 text-sm font-bold text-wepac-white transition-colors hover:bg-wepac-borgonha-light"
            >
              Seguinte
            </button>
          ) : (
            <button
              onClick={nextArea}
              disabled={!allComplete}
              className="rounded bg-wepac-borgonha px-6 py-2 text-sm font-bold text-wepac-white transition-colors hover:bg-wepac-borgonha-light disabled:opacity-30"
            >
              Completar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
