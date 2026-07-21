"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AREA_KEYS,
  AREA_LABELS,
  getIndicators,
  SCORE_LABELS,
  type AreaKey,
} from "@/lib/wepacker/types";
import { submitSelfEvaluation } from "@/lib/wepacker/actions/evaluation";
import { friendlySubmitError } from "@/lib/stale-deployment";

type MissingItem = {
  area: AreaKey;
  areaLabel: string;
  indicatorKey: string;
  indicatorLabel: string;
};

type AssessmentDraft = {
  scores?: Record<string, number>;
  currentArea?: number;
};

export default function AssessmentPageClient({
  packSlug,
  membershipId,
}: {
  packSlug: string;
  membershipId: string;
}) {
  const router = useRouter();
  const indicatorsByArea = getIndicators(packSlug);
  const areaLabels = AREA_LABELS;
  const draftKey = `wepacker:assessment-draft:${membershipId}`;
  const [currentArea, setCurrentArea] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [completed, setCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [pendingScrollTo, setPendingScrollTo] = useState<string | null>(null);

  const area = AREA_KEYS[currentArea];
  const indicators = indicatorsByArea[area];
  const totalAreas = AREA_KEYS.length;

  const areaComplete = indicators.every((ind) => scores[`${area}.${ind.key}`] > 0);

  const missingItems = useMemo(() => {
    const missing: MissingItem[] = [];
    for (const a of AREA_KEYS) {
      for (const ind of indicatorsByArea[a]) {
        if (!(scores[`${a}.${ind.key}`] > 0)) {
          missing.push({
            area: a,
            areaLabel: areaLabels[a],
            indicatorKey: ind.key,
            indicatorLabel: ind.label,
          });
        }
      }
    }
    return missing;
  }, [scores, indicatorsByArea, areaLabels]);

  // Restore a draft saved in this browser, if any, once on mount.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(draftKey);
      if (raw) {
        const draft = JSON.parse(raw) as AssessmentDraft;
        if (draft.scores && typeof draft.scores === "object") {
          setScores(draft.scores);
        }
        if (
          typeof draft.currentArea === "number" &&
          draft.currentArea >= 0 &&
          draft.currentArea < totalAreas
        ) {
          setCurrentArea(draft.currentArea);
        }
      }
    } catch {
      // Corrupted or inaccessible draft — start fresh instead of failing.
    }
    // Only run once, on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave the in-progress draft so a reload/crash never loses answers.
  useEffect(() => {
    if (completed) return;
    try {
      window.localStorage.setItem(
        draftKey,
        JSON.stringify({ scores, currentArea })
      );
    } catch {
      // Storage unavailable (private mode / quota) — draft just won't persist.
    }
  }, [scores, currentArea, completed, draftKey]);

  // After jumping to a missing indicator, scroll it into view and focus it
  // once the target area has rendered.
  useEffect(() => {
    if (!pendingScrollTo) return;
    const el = document.getElementById(pendingScrollTo);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.focus();
    setPendingScrollTo(null);
  }, [pendingScrollTo, currentArea]);

  function handleScore(indicatorKey: string, score: number) {
    setScores((prev) => ({ ...prev, [`${area}.${indicatorKey}`]: score }));
  }

  async function handleComplete() {
    setSubmitting(true);
    setError(null);

    try {
      const scoreEntries = Object.entries(scores).map(([key, score]) => {
        const [area, indicator] = key.split(".");
        return { area, indicator, score };
      });

      await submitSelfEvaluation({
        moment: "entry",
        scores: scoreEntries,
      });

      try {
        window.localStorage.removeItem(draftKey);
      } catch {
        // Non-fatal — draft cleanup is best-effort.
      }
      setCompleted(true);
    } catch (e) {
      console.error("Failed to submit evaluation:", e);
      setError(friendlySubmitError(e, "Erro ao guardar a avaliação. Tenta novamente."));
    } finally {
      setSubmitting(false);
    }
  }

  function handleAttemptComplete() {
    setAttemptedSubmit(true);
    if (missingItems.length > 0) return;
    handleComplete();
  }

  function jumpToMissing(item: MissingItem) {
    setCurrentArea(AREA_KEYS.indexOf(item.area));
    setPendingScrollTo(`indicator-${item.area}-${item.indicatorKey}`);
  }

  function nextArea() {
    setCurrentArea((prev) => Math.min(totalAreas - 1, prev + 1));
  }

  if (completed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-wepac-black px-6 pt-16">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center bg-wepac-white/10">
            <span className="text-2xl text-wepac-white">✓</span>
          </div>
          <h1 className="mt-6 font-barlow text-3xl font-bold text-wepac-white">
            Legacy Self-Assessment complete
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-wepac-text-secondary">
            Este legacy Self-Assessment ficou guardado em My Journey como
            histórico. Ainda não é um Stage-calibrated Assessment. Nenhum Mentor
            recebe acesso sem um grant específico.
          </p>
          <button
            onClick={() => router.push("/wepacker/dashboard")}
            className="mt-8 inline-block bg-wepac-white px-8 py-3 text-sm font-bold text-wepac-black transition-colors hover:bg-wepac-accent-muted"
          >
            Ir para o meu espaço
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-wepac-black px-6 pb-16 pt-16">
      <div className="mx-auto max-w-xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-wepac-text-tertiary">
            <span>Legacy Initial Self-Assessment</span>
            <span>
              Área {currentArea + 1} de {totalAreas}
            </span>
          </div>
          <div className="mt-2 h-1 w-full bg-wepac-input">
            <div
              className="h-1 bg-wepac-white transition-all"
              style={{ width: `${((currentArea + 1) / totalAreas) * 100}%` }}
            />
          </div>
        </div>

        {/* Area pills */}
        <div className="mb-8 flex flex-wrap gap-2">
          {AREA_KEYS.map((a, i) => {
            const done = indicatorsByArea[a].every((ind) => scores[`${a}.${ind.key}`] > 0);
            return (
              <button
                key={a}
                onClick={() => setCurrentArea(i)}
                className={`px-3 py-1 text-xs transition-colors ${
                  i === currentArea
                    ? "bg-wepac-white text-wepac-black"
                    : done
                      ? "bg-wepac-card text-wepac-white"
                      : "bg-wepac-card text-wepac-text-tertiary"
                }`}
              >
                {areaLabels[a]} {done && "✓"}
              </button>
            );
          })}
        </div>

        <h2 className="font-barlow text-2xl font-bold text-wepac-white">
          {areaLabels[area]}
        </h2>
        <p className="mt-1 text-sm text-wepac-text-tertiary">
          Avalia cada indicador de 1 a 5.
        </p>

        {/* Scale legend — visible before any selection is made */}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-wepac-text-tertiary">
          {[1, 2, 3, 4, 5].map((score) => (
            <span key={score}>
              <strong className="text-wepac-text-secondary">{score}</strong>{" "}
              {SCORE_LABELS[score]}
            </span>
          ))}
        </div>

        {/* Indicators */}
        <div className="mt-8 space-y-6">
          {indicators.map((ind) => {
            const current = scores[`${area}.${ind.key}`] || 0;
            const groupName = `indicator-${area}-${ind.key}`;
            return (
              <fieldset
                key={ind.key}
                id={`indicator-${area}-${ind.key}`}
                tabIndex={-1}
                className="focus:outline-none"
              >
                <legend className="text-sm font-medium text-wepac-text-secondary">
                  {ind.label}
                </legend>
                <div className="mt-2 flex gap-2">
                  {[1, 2, 3, 4, 5].map((score) => {
                    const inputId = `${groupName}-${score}`;
                    return (
                      <div key={score}>
                        <input
                          type="radio"
                          id={inputId}
                          name={groupName}
                          value={score}
                          checked={current === score}
                          onChange={() => handleScore(ind.key, score)}
                          className="peer sr-only"
                          data-testid={`assessment-score-${area}-${ind.key}-${score}`}
                        />
                        <label
                          htmlFor={inputId}
                          title={SCORE_LABELS[score]}
                          className={`flex h-10 w-10 cursor-pointer items-center justify-center text-sm transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-wepac-white peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-wepac-black ${
                            current === score
                              ? "bg-wepac-white text-wepac-black"
                              : "bg-wepac-input text-wepac-text-tertiary hover:bg-wepac-card hover:text-wepac-text-secondary"
                          }`}
                        >
                          {score}
                        </label>
                      </div>
                    );
                  })}
                </div>
                {current > 0 && (
                  <p className="mt-1 text-xs text-wepac-text-tertiary">
                    {SCORE_LABELS[current]}
                  </p>
                )}
              </fieldset>
            );
          })}
        </div>

        {/* Missing-answers summary — shown once the member tries to finish */}
        {attemptedSubmit && missingItems.length > 0 && (
          <div
            role="alert"
            className="mt-6 border border-wepac-error/40 bg-wepac-error/5 p-4"
          >
            <p className="text-sm font-medium text-wepac-error">
              Falta responder a {missingItems.length}{" "}
              {missingItems.length === 1 ? "indicador" : "indicadores"} antes de
              completar o Self-Assessment:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-wepac-text-secondary">
              {missingItems.map((item) => (
                <li key={`${item.area}.${item.indicatorKey}`}>
                  <button
                    type="button"
                    onClick={() => jumpToMissing(item)}
                    className="underline decoration-wepac-error/60 underline-offset-2 hover:text-wepac-white"
                  >
                    {item.areaLabel} — {item.indicatorLabel}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Error message */}
        {error && (
          <p role="alert" className="mt-4 text-sm text-wepac-error">
            {error}
          </p>
        )}

        {/* Navigation */}
        <div className="mt-10 flex items-center justify-between">
          {currentArea === 0 ? (
            <Link
              href="/wepacker/agreement"
              className="border border-wepac-border px-6 py-2 text-sm text-wepac-text-secondary transition-colors hover:bg-wepac-card"
            >
              Voltar
            </Link>
          ) : (
            <button
              onClick={() => setCurrentArea((prev) => Math.max(0, prev - 1))}
              className="border border-wepac-border px-6 py-2 text-sm text-wepac-text-secondary transition-colors hover:bg-wepac-card"
            >
              Anterior
            </button>
          )}
          {currentArea < totalAreas - 1 ? (
            <button
              onClick={nextArea}
              disabled={!areaComplete}
              data-testid="assessment-next-area"
              className="bg-wepac-white px-6 py-2 text-sm font-bold text-wepac-black transition-colors hover:bg-wepac-accent-muted disabled:opacity-30"
            >
              Seguinte
            </button>
          ) : (
            <button
              onClick={handleAttemptComplete}
              disabled={submitting}
              data-testid="assessment-complete"
              className="bg-wepac-white px-6 py-2 text-sm font-bold text-wepac-black transition-colors hover:bg-wepac-accent-muted disabled:opacity-30"
            >
              {submitting ? "A guardar..." : "Completar"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
