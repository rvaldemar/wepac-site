"use client";

import { StrategicRadar } from "@/components/wepacker/StrategicRadar";
import { STRATEGIC_SCORE_LABELS } from "@/lib/wepacker/types";

interface ScoreEntry {
  id: string;
  month: string;
  longTermScore: number;
  annualScore: number;
  quarterlyScore: number;
  monthlyScore: number;
  notes: string | null;
}

interface Props {
  scores: ScoreEntry[];
}

export default function PPVPageClient({ scores }: Props) {
  const sorted = [...scores].sort((a, b) => a.month.localeCompare(b.month));
  const latest = sorted[sorted.length - 1];
  const previous = sorted.length > 1 ? sorted[sorted.length - 2] : undefined;

  return (
    <div className="p-6 lg:p-8">
      <h1 className="font-barlow text-2xl font-bold text-wepac-white">
        Mapa Estratégico (PPV)
      </h1>
      <p className="mt-1 text-sm text-wepac-text-tertiary">
        Grau de definição e execução do teu plano — longo prazo, anual,
        trimestral e mensal — ao longo do tempo, avaliado pelo teu mentor.
      </p>

      {!latest ? (
        <p className="mt-8 text-sm text-wepac-text-tertiary">
          Ainda sem avaliações do mapa estratégico. O teu mentor regista este
          mapa ao longo do acompanhamento.
        </p>
      ) : (
        <>
          <div className="mt-8 border border-wepac-border bg-wepac-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-barlow text-lg font-bold text-wepac-white">
                {latest.month}
              </h2>
              {previous && (
                <span className="text-xs text-wepac-text-tertiary">
                  vs. {previous.month}
                </span>
              )}
            </div>
            <StrategicRadar
              current={{
                longTerm: latest.longTermScore,
                annual: latest.annualScore,
                quarterly: latest.quarterlyScore,
                monthly: latest.monthlyScore,
              }}
              previous={
                previous
                  ? {
                      longTerm: previous.longTermScore,
                      annual: previous.annualScore,
                      quarterly: previous.quarterlyScore,
                      monthly: previous.monthlyScore,
                    }
                  : undefined
              }
              className="mx-auto mt-4 w-full max-w-md"
              size={360}
            />
            {latest.notes && (
              <p className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-wepac-text-secondary">
                {latest.notes}
              </p>
            )}
          </div>

          {/* History */}
          {sorted.length > 1 && (
            <div className="mt-8">
              <h2 className="text-sm font-bold uppercase tracking-widest text-wepac-text-tertiary">
                Histórico
              </h2>
              <div className="mt-4 space-y-3">
                {[...sorted].reverse().map((s) => (
                  <div key={s.id} className="border border-wepac-border bg-wepac-card p-4">
                    <p className="text-sm font-medium text-wepac-white">{s.month}</p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-wepac-text-tertiary sm:grid-cols-4">
                      <span>Longo prazo: {s.longTermScore} ({STRATEGIC_SCORE_LABELS[s.longTermScore]})</span>
                      <span>Anual: {s.annualScore} ({STRATEGIC_SCORE_LABELS[s.annualScore]})</span>
                      <span>Trimestral: {s.quarterlyScore} ({STRATEGIC_SCORE_LABELS[s.quarterlyScore]})</span>
                      <span>Mensal: {s.monthlyScore} ({STRATEGIC_SCORE_LABELS[s.monthlyScore]})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
