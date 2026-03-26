"use client";

import { useState } from "react";
import Link from "next/link";
import { RadarChart } from "@/components/artists/RadarChart";
import { StrategicRadar } from "@/components/artists/StrategicRadar";
import {
 AREA_LABELS,
 INDICATORS,
 PHASE_LABELS,
 LEVEL_LABELS,
 SCORE_LABELS,
 type AreaKey,
 type ArtistLevel,
 type ArtistPhase,
} from "@/lib/types/artist";

const PHASES: ArtistPhase[] = ["diagnosis", "structuring", "development", "activation", "evaluation"];

type AreaScores = Record<string, { selfAvg: number; mentorAvg: number; composite: number }>;

interface Props {
 user: {
  id: string;
  name: string;
  email: string;
  level: string;
  currentPhase: ArtistPhase;
  bio?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
 };
 currentScores: AreaScores;
 previousScores: AreaScores;
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
 nextSession: {
  id: string;
  scheduledAt: string;
  sessionType: string;
  durationMinutes: number;
 } | null;
 latestMessage: {
  id: string;
  body: string;
  readAt?: string | null;
  createdAt: string;
 } | null;
 quarterWeek: number;
}

export default function DashboardPageClient({
 user,
 currentScores,
 previousScores,
 indicatorScores,
 strategicMapScores,
 pendingTasks,
 nextSession,
 latestMessage,
 quarterWeek,
}: Props) {
 const [selectedArea, setSelectedArea] = useState<AreaKey | null>(null);

 const currentRadar = Object.fromEntries(
  Object.entries(currentScores).map(([k, v]) => [k, v.composite])
 ) as Record<AreaKey, number>;
 const previousRadar = Object.fromEntries(
  Object.entries(previousScores).map(([k, v]) => [k, v.composite])
 ) as Record<AreaKey, number>;

 // Strategic map
 const latestMap = strategicMapScores[strategicMapScores.length - 1];
 const prevMap = strategicMapScores.length > 1 ? strategicMapScores[strategicMapScores.length - 2] : undefined;

 // Tasks
 const upcomingTasks = pendingTasks.slice(0, 5);

 const currentPhaseIdx = PHASES.indexOf(user.currentPhase);

 return (
  <div className="p-6 lg:p-8">
   {/* Header */}
   <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
    <div>
     <h1 className="font-barlow text-2xl font-bold text-wepac-white">
      {user.name}
     </h1>
     <div className="mt-1 flex items-center gap-3">
      <span className="bg-wepac-white/10 px-2 py-0.5 text-xs font-bold text-wepac-white">
       {LEVEL_LABELS[user.level as ArtistLevel]}
      </span>
      <span className="text-xs text-wepac-text-tertiary">
       {PHASE_LABELS[user.currentPhase]}
      </span>
     </div>
    </div>
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
       <span className="inline-block h-2 w-4 bg-wepac-white/20" /> Actual
      </span>
      <span className="flex items-center gap-1">
       <span className="inline-block h-2 w-4 border border-dashed border-wepac-border" /> Anterior
      </span>
     </div>
     <RadarChart
      currentValues={currentRadar}
      previousValues={previousRadar}
      onAreaClick={(area) => setSelectedArea(area === selectedArea ? null : area)}
      className="mx-auto mt-4 w-full max-w-sm"
     />
    </div>

    {/* Strategic Radar */}
    <div className="border border-wepac-border bg-wepac-card p-6">
     <h2 className="font-barlow text-lg font-bold text-wepac-white">
      Mapa Estratégico
     </h2>
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
       {AREA_LABELS[selectedArea]} — Indicadores
      </h3>
      <button
       onClick={() => setSelectedArea(null)}
       className="text-xs text-wepac-text-tertiary hover:text-wepac-text-secondary"
      >
       Fechar
      </button>
     </div>
     <div className="mt-4 space-y-3">
      {INDICATORS[selectedArea].map((ind) => {
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
             className={`h-2 w-4 ${
              v <= indScore ? "bg-wepac-white" : "bg-wepac-input"
             }`}
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
    <h2 className="font-barlow text-lg font-bold text-wepac-white">
     Progresso Trimestral
    </h2>
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
        {i < currentPhaseIdx ? "\u2713" : i + 1}
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
      <h2 className="font-barlow text-lg font-bold text-wepac-white">
       Próximas Ações
      </h2>
      <Link
       href="/artists/alpha/tasks"
       className="text-xs text-wepac-white hover:underline"
      >
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
          <p className="text-sm text-wepac-text-secondary">
           {task.title}
          </p>
          <p className="mt-0.5 text-xs text-wepac-text-tertiary">
           {task.deadline ? new Date(task.deadline).toLocaleDateString("pt-PT", { day: "numeric", month: "short" }) : ""}
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
     <h2 className="font-barlow text-lg font-bold text-wepac-white">
      Próxima Sessão
     </h2>
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
        href="/artists/alpha/sessions"
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
     <h2 className="font-barlow text-lg font-bold text-wepac-white">
      Mensagens
     </h2>
     {latestMessage ? (
      <div className="mt-4">
       <p className="text-sm text-wepac-text-secondary line-clamp-3">
        {latestMessage.body}
       </p>
       <p className="mt-2 text-xs text-wepac-text-tertiary">
        {new Date(latestMessage.createdAt).toLocaleDateString("pt-PT")}
       </p>
       {!latestMessage.readAt && (
        <span className="mt-2 inline-block bg-wepac-white/10 px-2 py-0.5 text-xs text-wepac-white">
         Nova
        </span>
       )}
       <Link
        href="/artists/alpha/messages"
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
  </div>
 );
}
