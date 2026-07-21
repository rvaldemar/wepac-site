"use client";

import { useState } from "react";
import Link from "next/link";
import { RadarChart } from "@/components/wepacker/RadarChart";
import { StrategicRadar } from "@/components/wepacker/StrategicRadar";
import { ExpeditionTrail, type ExpeditionSession } from "@/components/wepacker/ExpeditionTrail";
import {
  AREA_LABELS,
  getIndicators,
  PHASE_LABELS,
  LEVEL_LABELS,
  type AreaKey,
  type MembershipContext,
} from "@/lib/wepacker/types";

const PHASES: Array<keyof typeof PHASE_LABELS> = [
  "diagnosis",
  "structuring",
  "development",
  "activation",
  "consolidation",
];

const MOMENT_LABELS: Record<"entry" | "mid" | "exit", string> = {
  entry: "Avaliação inicial",
  mid: "Avaliação intermédia",
  exit: "Avaliação final",
};

type AreaScores = Record<string, { selfAvg: number; mentorAvg: number; composite: number }>;

interface Props {
  user: { name: string };
  membership: MembershipContext;
  currentScores: AreaScores;
  currentMoment: "entry" | "mid" | "exit";
  previousScores: AreaScores | null;
  previousMoment: "entry" | "mid" | "exit" | null;
  indicatorScores: Record<string, Record<string, { selfScore: number; mentorScore: number; composite: number }>>;
  strategicMapScores: Array<{
    longTermScore: number;
    annualScore: number;
    quarterlyScore: number;
    monthlyScore: number;
  }>;
  pendingTasks: Array<{
    id: string;
    title: string;
    deadline: string;
    origin: string;
    status: string;
  }>;
  activeTrails: Array<{ id: string; title: string }>;
  nextSession: {
    id: string;
    scheduledAt: string;
    sessionType: string;
    durationMinutes: number;
    meetingUrl: string | null;
  } | null;
  sessions: ExpeditionSession[];
  latestMessage: {
    id: string;
    body: string;
    readAt?: string | null;
    createdAt: string;
    own: boolean;
  } | null;
  quarterWeek: number;
}

export default function DashboardPageClient({
  user,
  membership,
  currentScores,
  currentMoment,
  previousScores,
  previousMoment,
  indicatorScores,
  strategicMapScores,
  pendingTasks,
  activeTrails,
  nextSession,
  sessions,
  latestMessage,
  quarterWeek,
}: Props) {
  const indicatorsByArea = getIndicators(membership.packSlug);
  const areaLabels = AREA_LABELS;
  const [selectedArea, setSelectedArea] = useState<AreaKey | null>(null);

  const currentRadar = Object.fromEntries(
    Object.entries(currentScores).map(([k, v]) => [k, v.composite])
  ) as Record<AreaKey, number>;
  const previousRadar = previousScores
    ? (Object.fromEntries(
        Object.entries(previousScores).map(([k, v]) => [k, v.composite])
      ) as Record<AreaKey, number>)
    : null;

  // Strategic map
  const latestMap = strategicMapScores[strategicMapScores.length - 1];
  const prevMap = strategicMapScores.length > 1 ? strategicMapScores[strategicMapScores.length - 2] : undefined;

  // Tasks
  const upcomingTasks = pendingTasks.slice(0, 5);

  const currentPhaseIdx = PHASES.indexOf(membership.currentPhase);

  // Compact next-action line: the single most useful thing to do next,
  // in priority order — a confirmed session beats a pending task beats a
  // bare CTA to reach out to the mentor.
  const nextAction = nextSession ? (
    <>
      Próxima sessão:{" "}
      <span className="text-wepac-white">
        {new Date(nextSession.scheduledAt).toLocaleDateString("pt-PT", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}{" "}
        às{" "}
        {new Date(nextSession.scheduledAt).toLocaleTimeString("pt-PT", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
      {nextSession.meetingUrl && (
        <>
          {" · "}
          <a
            href={nextSession.meetingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-wepac-white hover:underline"
          >
            Entrar na chamada →
          </a>
        </>
      )}
    </>
  ) : pendingTasks[0] ? (
    <>
      Próxima ação: <span className="text-wepac-white">{pendingTasks[0].title}</span>
    </>
  ) : (
    <Link href="/wepacker/messages" className="text-wepac-white hover:underline">
      Marca uma conversa com o teu mentor →
    </Link>
  );

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-barlow text-2xl font-bold text-wepac-white">{user.name}</h1>
          <div className="mt-1 flex items-center gap-3">
            <span className="bg-wepac-white/10 px-2 py-0.5 text-xs font-bold text-wepac-white">
              {LEVEL_LABELS[membership.level]}
            </span>
            <span className="text-xs text-wepac-text-tertiary">
              {PHASE_LABELS[membership.currentPhase]}
            </span>
          </div>
        </div>
      </div>

      {/* Expedition Trail */}
      <div className="mt-8">
        <ExpeditionTrail sessions={sessions} />
        <p className="mt-3 text-sm text-wepac-text-tertiary">{nextAction}</p>
      </div>

      {/* Radars */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Development Radar */}
        <div className="border border-wepac-border bg-wepac-card p-6">
          <h2 className="font-barlow text-lg font-bold text-wepac-white">
            Mapa de Desenvolvimento
          </h2>
          <div className="mt-1 flex gap-4 text-xs text-wepac-text-tertiary">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-4 bg-wepac-white/20" />{" "}
              {MOMENT_LABELS[currentMoment]}
            </span>
            {previousRadar && previousMoment && (
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-4 border border-dashed border-wepac-border" />{" "}
                {MOMENT_LABELS[previousMoment]}
              </span>
            )}
          </div>
          <RadarChart
            currentValues={currentRadar}
            previousValues={previousRadar ?? undefined}
            areaLabels={areaLabels}
            onAreaClick={(area) => setSelectedArea(area === selectedArea ? null : area)}
            className="mx-auto mt-4 w-full max-w-sm"
          />
        </div>

        {/* Strategic Radar */}
        <div className="border border-wepac-border bg-wepac-card p-6">
          <h2 className="font-barlow text-lg font-bold text-wepac-white">Mapa Estratégico</h2>
          <p className="mt-1 text-xs text-wepac-text-tertiary">
            Grau de definição e execução do plano
          </p>
          {latestMap ? (
            <StrategicRadar
              current={{
                longTerm: latestMap.longTermScore,
                annual: latestMap.annualScore,
                quarterly: latestMap.quarterlyScore,
                monthly: latestMap.monthlyScore,
              }}
              previous={
                prevMap
                  ? {
                      longTerm: prevMap.longTermScore,
                      annual: prevMap.annualScore,
                      quarterly: prevMap.quarterlyScore,
                      monthly: prevMap.monthlyScore,
                    }
                  : undefined
              }
              className="mx-auto mt-4 w-full max-w-sm"
            />
          ) : (
            <p className="mt-4 text-sm text-wepac-text-tertiary">Sem dados estratégicos.</p>
          )}
        </div>
      </div>

      {/* Area drill-down */}
      {selectedArea && (
        <div className="mt-6 border border-wepac-border bg-wepac-card p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-barlow text-lg font-bold text-wepac-white">
              {areaLabels[selectedArea]} — Indicadores
            </h3>
            <button
              onClick={() => setSelectedArea(null)}
              className="text-xs text-wepac-text-tertiary hover:text-wepac-text-secondary"
            >
              Fechar
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {indicatorsByArea[selectedArea].map((ind) => {
              const indData = indicatorScores[selectedArea]?.[ind.key];
              const indScore = indData ? Math.round(indData.composite) : 0;
              return (
                <div key={ind.key} className="flex items-center justify-between">
                  <span className="text-sm text-wepac-text-secondary">{ind.label}</span>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((v) => (
                        <div
                          key={v}
                          className={`h-2 w-4 ${v <= indScore ? "bg-wepac-white" : "bg-wepac-input"}`}
                        />
                      ))}
                    </div>
                    <span className="w-6 text-right text-xs text-wepac-text-tertiary">
                      {indScore > 0 ? indScore : "—"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Trimestral Progress */}
      <div className="mt-8 border border-wepac-border bg-wepac-card p-6">
        <h2 className="font-barlow text-lg font-bold text-wepac-white">Progresso Trimestral</h2>
        <p className="mt-1 text-xs text-wepac-text-tertiary">Semana {quarterWeek} de 12</p>
        <div className="mt-4 flex items-center justify-between">
          {PHASES.map((phase, i) => (
            <div key={phase} className="flex flex-1 items-center">
              <div
                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  i < currentPhaseIdx
                    ? "bg-wepac-white/10 text-wepac-white"
                    : i === currentPhaseIdx
                      ? "bg-wepac-white text-wepac-black"
                      : "bg-wepac-input text-wepac-text-tertiary"
                }`}
              >
                {i < currentPhaseIdx ? "✓" : i + 1}
              </div>
              {i < PHASES.length - 1 && (
                <div
                  className={`mx-1 h-0.5 flex-1 ${
                    i < currentPhaseIdx ? "bg-wepac-white/20" : "bg-wepac-input"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between">
          {PHASES.map((phase) => (
            <span key={phase} className="flex-1 text-center text-[10px] text-wepac-text-tertiary">
              {PHASE_LABELS[phase]}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom grid */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Tasks */}
        <div className="border border-wepac-border bg-wepac-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-barlow text-lg font-bold text-wepac-white">Próximas Ações</h2>
            <Link href="/wepacker/tasks" className="text-xs text-wepac-white hover:underline">
              Ver todas →
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {upcomingTasks.length === 0 ? (
              <p className="text-sm text-wepac-text-tertiary">
                Nenhuma ação pendente. As ações vão surgir do teu plano e sessões com o mentor.
              </p>
            ) : (
              upcomingTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start justify-between border-b border-wepac-border pb-3 last:border-0"
                >
                  <div>
                    <p className="text-sm text-wepac-text-secondary">{task.title}</p>
                    <p className="mt-0.5 text-xs text-wepac-text-tertiary">
                      {task.deadline
                        ? new Date(task.deadline).toLocaleDateString("pt-PT", {
                            day: "numeric",
                            month: "short",
                          })
                        : ""}
                    </p>
                  </div>
                  <span className="bg-wepac-input px-2 py-0.5 text-xs text-wepac-text-tertiary">
                    {task.origin}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Next Session */}
        <div className="border border-wepac-border bg-wepac-card p-6">
          <h2 className="font-barlow text-lg font-bold text-wepac-white">Próxima Sessão</h2>
          {nextSession ? (
            <div className="mt-4">
              <p className="text-sm text-wepac-text-secondary">
                {new Date(nextSession.scheduledAt).toLocaleDateString("pt-PT", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>
              <p className="mt-1 text-sm text-wepac-text-secondary">
                {new Date(nextSession.scheduledAt).toLocaleTimeString("pt-PT", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <div className="mt-3 flex gap-2">
                <span className="bg-wepac-input px-2 py-0.5 text-xs text-wepac-text-tertiary">
                  {nextSession.sessionType === "individual" ? "Individual" : "Grupo"}
                </span>
                <span className="bg-wepac-input px-2 py-0.5 text-xs text-wepac-text-tertiary">
                  {nextSession.durationMinutes} min
                </span>
              </div>
              <Link
                href="/wepacker/sessions"
                className="mt-4 block text-xs text-wepac-white hover:underline"
              >
                Ver sessões →
              </Link>
            </div>
          ) : (
            <p className="mt-4 text-sm text-wepac-text-tertiary">
              O teu mentor irá agendar a próxima sessão. Consulta as mensagens para mais informação.
            </p>
          )}
        </div>

        {/* Recent Messages */}
        <div className="border border-wepac-border bg-wepac-card p-6">
          <h2 className="font-barlow text-lg font-bold text-wepac-white">Mensagens</h2>
          {latestMessage ? (
            <div className="mt-4">
              <p className="line-clamp-3 text-sm text-wepac-text-secondary">{latestMessage.body}</p>
              <p className="mt-2 text-xs text-wepac-text-tertiary">
                {new Date(latestMessage.createdAt).toLocaleDateString("pt-PT")}
              </p>
              {!latestMessage.readAt && !latestMessage.own && (
                <span className="mt-2 inline-block bg-wepac-white/10 px-2 py-0.5 text-xs text-wepac-white">
                  Nova
                </span>
              )}
              <Link
                href="/wepacker/messages"
                className="mt-3 block text-xs text-wepac-white hover:underline"
              >
                Ver mensagens →
              </Link>
            </div>
          ) : (
            <p className="mt-4 text-sm text-wepac-text-tertiary">
              Ainda sem mensagens. Podes iniciar conversa com o teu mentor.
            </p>
          )}
        </div>
      </div>

      {/* Active Trails */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="border border-wepac-border bg-wepac-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-barlow text-lg font-bold text-wepac-white">Trails ativos</h2>
            <Link href="/wepacker/trails" className="text-xs text-wepac-white hover:underline">
              Ver todos →
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {activeTrails.length === 0 ? (
              <p className="text-sm text-wepac-text-tertiary">
                Ainda sem Trails ativos. Define a tua próxima travessia de transformação.
              </p>
            ) : (
              activeTrails.map((trail) => (
                <Link
                  key={trail.id}
                  href={`/wepacker/trails/${trail.id}`}
                  className="block border-b border-wepac-border pb-3 text-sm text-wepac-text-secondary last:border-0 hover:text-wepac-white"
                >
                  {trail.title}
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
