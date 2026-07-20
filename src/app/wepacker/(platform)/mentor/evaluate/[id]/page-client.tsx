"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AREA_KEYS,
  getAreaLabels,
  getIndicators,
  MOMENT_LABELS,
  SCORE_LABELS,
  type AreaKey,
  type EvaluationMoment,
} from "@/lib/wepacker/types";
import { submitMentorEvaluation } from "@/lib/wepacker/actions/evaluation";
import { friendlySubmitError } from "@/lib/stale-deployment";

const MOMENTS: EvaluationMoment[] = ["entry", "mid", "exit"];

interface MembershipDetail {
  id: string;
  user: { id: string; name: string };
  cohort: {
    pack: { slug: string; domainLabel: string };
  };
}

interface EvaluationRow {
  evaluationType: "self" | "mentor";
  moment: EvaluationMoment;
}

interface EvaluatePageProps {
  membership: MembershipDetail;
  evaluations: EvaluationRow[];
}

export function MentorEvaluateClient({ membership, evaluations }: EvaluatePageProps) {
  const router = useRouter();
  const indicatorsByArea = getIndicators(membership.cohort.pack.slug);
  const areaLabels = getAreaLabels(membership.cohort.pack.domainLabel);

  const mentorEvaluatedMoments = new Set(
    evaluations.filter((e) => e.evaluationType === "mentor").map((e) => e.moment)
  );

  const [moment, setMoment] = useState<EvaluationMoment>(
    MOMENTS.find((m) => !mentorEvaluatedMoments.has(m)) ?? "entry"
  );
  const [scores, setScores] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [currentArea, setCurrentArea] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const area = AREA_KEYS[currentArea];
  const indicators = indicatorsByArea[area];

  async function handleSave() {
    setSubmitting(true);
    setError(null);

    try {
      const scoreEntries = Object.entries(scores)
        .filter(([, score]) => score > 0)
        .map(([key, score]) => {
          const [scoreArea, indicator] = key.split(".");
          return {
            area: scoreArea,
            indicator,
            score,
            notes: notes[key]?.trim() ? notes[key].trim() : undefined,
          };
        });

      if (scoreEntries.length === 0) {
        setError("Pontua pelo menos um indicador antes de guardar.");
        setSubmitting(false);
        return;
      }

      await submitMentorEvaluation({
        userId: membership.user.id,
        moment,
        scores: scoreEntries,
      });

      setCompleted(true);
      router.push(`/wepacker/mentor/members/${membership.id}`);
    } catch (e) {
      console.error("Failed to submit evaluation:", e);
      setError(friendlySubmitError(e, "Erro ao guardar a avaliação. Tenta novamente."));
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <Link
        href={`/wepacker/mentor/members/${membership.id}`}
        className="text-sm text-wepac-text-tertiary hover:text-wepac-text-secondary"
      >
        ← Voltar ao perfil
      </Link>

      <h1 className="mt-4 font-barlow text-2xl font-bold text-wepac-white">
        Avaliar {membership.user.name}
      </h1>
      <p className="mt-1 text-sm text-wepac-text-tertiary">
        Avaliação do mentor.
      </p>

      {/* Moment selector */}
      <div className="mt-6 flex flex-wrap gap-2">
        {MOMENTS.map((m) => (
          <button
            key={m}
            onClick={() => setMoment(m)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors ${
              m === moment
                ? "bg-wepac-white text-wepac-black"
                : "bg-wepac-card text-wepac-text-tertiary"
            }`}
          >
            {MOMENT_LABELS[m]}
            {mentorEvaluatedMoments.has(m) && (
              <span className="text-[10px] opacity-70">✓</span>
            )}
          </button>
        ))}
      </div>

      {/* Area navigation */}
      <div className="mt-4 flex flex-wrap gap-2">
        {AREA_KEYS.map((a, i) => (
          <button
            key={a}
            onClick={() => setCurrentArea(i)}
            className={`px-3 py-1 text-xs transition-colors ${
              i === currentArea
                ? "bg-wepac-white text-wepac-black"
                : "bg-wepac-card text-wepac-text-tertiary"
            }`}
          >
            {areaLabels[a]}
          </button>
        ))}
      </div>

      <div className="mt-8 border border-wepac-border bg-wepac-card p-6">
        <h2 className="font-barlow text-xl font-bold text-wepac-white">
          {areaLabels[area]}
        </h2>

        <div className="mt-6 space-y-6">
          {indicators.map((ind) => {
            const key = `${area}.${ind.key}`;
            return (
              <div key={ind.key}>
                <p className="text-sm font-medium text-wepac-text-secondary">
                  {ind.label}
                </p>
                <div className="mt-2 flex gap-2">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      key={score}
                      onClick={() =>
                        setScores((prev) => ({ ...prev, [key]: score }))
                      }
                      className={`flex h-10 w-10 items-center justify-center text-sm transition-colors ${
                        scores[key] === score
                          ? "bg-wepac-white text-wepac-black"
                          : "bg-wepac-input text-wepac-text-tertiary hover:bg-wepac-card"
                      }`}
                      title={SCORE_LABELS[score]}
                    >
                      {score}
                    </button>
                  ))}
                </div>
                <input
                  placeholder="Notas (opcional)"
                  value={notes[key] ?? ""}
                  onChange={(e) =>
                    setNotes((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                  className="mt-2 w-full bg-wepac-dark px-3 py-2 text-xs text-wepac-text-secondary placeholder-wepac-text-tertiary outline-none focus:ring-1 focus:ring-wepac-white/50"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Error message */}
      {error && <p className="mt-4 text-sm text-wepac-error">{error}</p>}

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={() => setCurrentArea((prev) => Math.max(0, prev - 1))}
          disabled={currentArea === 0}
          className="border border-wepac-border px-6 py-2 text-sm text-wepac-text-secondary disabled:opacity-30"
        >
          Anterior
        </button>
        {currentArea < AREA_KEYS.length - 1 ? (
          <button
            onClick={() => setCurrentArea((prev) => prev + 1)}
            className="bg-wepac-white px-6 py-2 text-sm font-bold text-wepac-black"
          >
            Seguinte
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={submitting || completed}
            className="bg-wepac-white px-6 py-2 text-sm font-bold text-wepac-black transition-colors hover:bg-wepac-accent-muted disabled:opacity-30"
          >
            {submitting || completed ? "A guardar..." : "Guardar Avaliação"}
          </button>
        )}
      </div>
    </div>
  );
}
