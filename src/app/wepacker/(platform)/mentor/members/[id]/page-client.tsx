"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RadarChart } from "@/components/wepacker/RadarChart";
import { StrategicRadar } from "@/components/wepacker/StrategicRadar";
import {
  AREA_KEYS,
  LEVEL_LABELS,
  MOMENT_LABELS,
  PHASE_LABELS,
  STRATEGIC_SCORE_LABELS,
  type AreaKey,
  type EvaluationMoment,
  type GoalStatus,
  type MemberLevel,
  type MemberPhase,
  type TaskStatus,
} from "@/lib/wepacker/types";
import { updateMembership } from "@/lib/wepacker/actions/admin";
import { submitStrategicMapScore } from "@/lib/wepacker/actions/plan";
import { createTask, updateTaskStatus } from "@/lib/wepacker/actions/task";
import { friendlySubmitError } from "@/lib/stale-deployment";

const LEVELS: MemberLevel[] = ["seed", "growth", "signature", "partner"];
const PHASES: MemberPhase[] = [
  "diagnosis",
  "structuring",
  "development",
  "activation",
  "consolidation",
];

type AreaScoreAvg = { selfAvg: number; mentorAvg: number; composite: number };

interface MembershipDetail {
  id: string;
  level: MemberLevel;
  currentPhase: MemberPhase;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    bio: string | null;
    onboarded: boolean;
  };
  cohort: {
    id: string;
    name: string;
    pack: { id: string; slug: string; name: string; domainLabel: string };
  };
}

interface EvaluationRow {
  id: string;
  evaluationType: "self" | "mentor";
  moment: EvaluationMoment;
  completedAt: string | null;
  evaluator: { name: string };
  scores: { area: AreaKey; indicator: string; score: number; notes: string | null }[];
}

interface LifePlanRow {
  whoIAm: string;
  whereIAm: string;
  whereIGo: string;
  whyIDo: string;
  commitments: string;
  updatedAt: string;
}

interface GoalRow {
  id: string;
  scope: "annual" | "quarterly";
  title: string;
  description: string;
  successCriteria: string;
  deadline: string;
  status: GoalStatus;
}

interface MonthlyActionRow {
  id: string;
  month: string;
  title: string;
  deadline: string;
  status: TaskStatus;
  goal: { id: string; title: string } | null;
}

interface StrategicPlanRow {
  quarter: string;
  longTermVision: string;
  positioning: string;
  focusAreas: AreaKey[];
  quarterlyReflection: string;
  goals: GoalRow[];
  monthlyActions: MonthlyActionRow[];
}

interface StrategicMapScoreRow {
  id: string;
  month: string;
  longTermScore: number;
  annualScore: number;
  quarterlyScore: number;
  monthlyScore: number;
  notes: string | null;
}

interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  deadline: string;
  status: TaskStatus;
}

interface MentorMemberDetailProps {
  membership: MembershipDetail;
  currentScores: Record<AreaKey, AreaScoreAvg>;
  previousScores: Record<AreaKey, AreaScoreAvg>;
  areaLabels: Record<AreaKey, string>;
  evaluations: EvaluationRow[];
  lifePlan: LifePlanRow | null;
  strategicPlan: StrategicPlanRow | null;
  strategicMapScores: StrategicMapScoreRow[];
  tasks: TaskRow[];
}

export function MentorMemberDetailClient({
  membership,
  currentScores,
  previousScores,
  areaLabels,
  evaluations,
  lifePlan,
  strategicPlan,
  strategicMapScores,
  tasks,
}: MentorMemberDetailProps) {
  const router = useRouter();

  const currentRadar = Object.fromEntries(
    AREA_KEYS.map((k) => [k, currentScores[k]?.composite || 1])
  ) as Record<AreaKey, number>;
  const previousRadar = Object.fromEntries(
    AREA_KEYS.map((k) => [k, previousScores[k]?.composite || 1])
  ) as Record<AreaKey, number>;

  const latestMap = strategicMapScores[strategicMapScores.length - 1] ?? null;

  // Membership controls
  const [level, setLevel] = useState<MemberLevel>(membership.level);
  const [phase, setPhase] = useState<MemberPhase>(membership.currentPhase);
  const [savingMembership, setSavingMembership] = useState(false);

  async function handleSaveMembership() {
    setSavingMembership(true);
    try {
      await updateMembership(membership.id, { level, currentPhase: phase });
      router.refresh();
    } catch (e) {
      console.error("Failed to update membership:", e);
    } finally {
      setSavingMembership(false);
    }
  }

  // Strategic map form
  const [showMapForm, setShowMapForm] = useState(false);
  const [mapMonth, setMapMonth] = useState("");
  const [mapScores, setMapScores] = useState({
    longTermScore: 3,
    annualScore: 3,
    quarterlyScore: 3,
    monthlyScore: 3,
  });
  const [mapNotes, setMapNotes] = useState("");
  const [savingMap, setSavingMap] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  async function handleSubmitMapScore() {
    if (!mapMonth.trim()) {
      setMapError("Indica o mês (ex: 2026-07).");
      return;
    }
    setSavingMap(true);
    setMapError(null);
    try {
      await submitStrategicMapScore({
        userId: membership.user.id,
        month: mapMonth.trim(),
        ...mapScores,
        notes: mapNotes.trim() || undefined,
      });
      setShowMapForm(false);
      setMapMonth("");
      setMapNotes("");
      router.refresh();
    } catch (e) {
      console.error("Failed to submit strategic map score:", e);
      setMapError(friendlySubmitError(e, "Erro ao guardar. Tenta novamente."));
    } finally {
      setSavingMap(false);
    }
  }

  // Task form
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskDeadline, setTaskDeadline] = useState("");
  const [savingTask, setSavingTask] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);

  async function handleCreateTask() {
    if (!taskTitle.trim() || !taskDeadline) {
      setTaskError("Título e prazo são obrigatórios.");
      return;
    }
    setSavingTask(true);
    setTaskError(null);
    try {
      await createTask({
        membershipId: membership.id,
        title: taskTitle.trim(),
        description: taskDescription.trim() || undefined,
        origin: "mentor",
        deadline: taskDeadline,
      });
      setShowTaskForm(false);
      setTaskTitle("");
      setTaskDescription("");
      setTaskDeadline("");
      router.refresh();
    } catch (e) {
      console.error("Failed to create task:", e);
      setTaskError("Erro ao criar tarefa. Tenta novamente.");
    } finally {
      setSavingTask(false);
    }
  }

  async function handleTaskStatus(taskId: string, status: TaskStatus) {
    try {
      await updateTaskStatus(taskId, status);
      router.refresh();
    } catch (e) {
      console.error("Failed to update task status:", e);
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <Link
        href="/wepacker/mentor"
        className="text-sm text-wepac-text-tertiary hover:text-wepac-text-secondary"
      >
        ← Voltar
      </Link>

      {/* Header */}
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center bg-wepac-white/10">
            <span className="font-barlow text-lg font-bold text-wepac-white">
              {membership.user.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </span>
          </div>
          <div>
            <h1 className="font-barlow text-2xl font-bold text-wepac-white">
              {membership.user.name}
            </h1>
            <p className="text-xs text-wepac-text-tertiary">
              {membership.user.email} · {membership.cohort.pack.name} ·{" "}
              {membership.cohort.name}
            </p>
            <div className="mt-1 flex gap-2">
              <span className="bg-wepac-white/10 px-2 py-0.5 text-xs font-bold text-wepac-white">
                {LEVEL_LABELS[membership.level]}
              </span>
              <span className="text-xs text-wepac-text-tertiary">
                {PHASE_LABELS[membership.currentPhase]}
              </span>
            </div>
          </div>
        </div>

        {/* Mentor controls */}
        <div className="flex flex-wrap items-end gap-2 border border-wepac-border bg-wepac-card p-3">
          <div>
            <label className="block text-[10px] text-wepac-text-tertiary">
              Nível
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as MemberLevel)}
              className="mt-1 bg-wepac-input px-2 py-1.5 text-xs text-wepac-white"
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {LEVEL_LABELS[l]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-wepac-text-tertiary">
              Fase
            </label>
            <select
              value={phase}
              onChange={(e) => setPhase(e.target.value as MemberPhase)}
              className="mt-1 bg-wepac-input px-2 py-1.5 text-xs text-wepac-white"
            >
              {PHASES.map((p) => (
                <option key={p} value={p}>
                  {PHASE_LABELS[p]}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleSaveMembership}
            disabled={savingMembership}
            className="bg-wepac-white px-3 py-1.5 text-xs font-bold text-wepac-black disabled:opacity-30"
          >
            {savingMembership ? "A guardar..." : "Guardar"}
          </button>
        </div>
      </div>

      {/* Radars */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="border border-wepac-border bg-wepac-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-barlow text-lg font-bold text-wepac-white">
              Mapa de Desenvolvimento
            </h2>
            <Link
              href={`/wepacker/mentor/evaluate/${membership.id}`}
              className="text-xs text-wepac-white hover:underline"
            >
              Avaliar →
            </Link>
          </div>
          <RadarChart
            currentValues={currentRadar}
            previousValues={previousRadar}
            areaLabels={areaLabels}
            className="mx-auto mt-4 w-full max-w-xs"
            size={300}
          />
        </div>

        <div className="border border-wepac-border bg-wepac-card p-6">
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

      {/* Evaluations timeline */}
      <div className="mt-8 border border-wepac-border bg-wepac-card p-6">
        <h2 className="font-barlow text-lg font-bold text-wepac-white">
          Avaliações
        </h2>
        <div className="mt-4 space-y-4">
          {evaluations.map((ev) => (
            <div key={ev.id} className="border-b border-wepac-border pb-4 last:border-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-wepac-white/10 px-2 py-0.5 text-xs font-bold text-wepac-white">
                  {MOMENT_LABELS[ev.moment]}
                </span>
                <span className="text-xs text-wepac-text-tertiary">
                  {ev.evaluationType === "mentor" ? "Mentor" : "Auto"} ·{" "}
                  {ev.evaluator.name}
                </span>
                {ev.completedAt && (
                  <span className="text-xs text-wepac-text-tertiary">
                    · {new Date(ev.completedAt).toLocaleDateString("pt-PT")}
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs text-wepac-text-tertiary">
                {ev.scores.length} indicadores avaliados
              </p>
            </div>
          ))}
          {evaluations.length === 0 && (
            <p className="text-sm text-wepac-text-tertiary">
              Ainda sem avaliações.
            </p>
          )}
        </div>
      </div>

      {/* Life plan + Strategic plan */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="border border-wepac-border bg-wepac-card p-6">
          <h2 className="font-barlow text-lg font-bold text-wepac-white">
            Projeto de Vida
          </h2>
          {lifePlan ? (
            <div className="mt-4 space-y-3 text-sm text-wepac-text-secondary">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-wepac-text-tertiary">
                  Quem sou
                </p>
                <p className="mt-1 whitespace-pre-wrap">{lifePlan.whoIAm || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-wepac-text-tertiary">
                  Onde estou
                </p>
                <p className="mt-1 whitespace-pre-wrap">{lifePlan.whereIAm || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-wepac-text-tertiary">
                  Para onde vou
                </p>
                <p className="mt-1 whitespace-pre-wrap">{lifePlan.whereIGo || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-wepac-text-tertiary">
                  Porque o faço
                </p>
                <p className="mt-1 whitespace-pre-wrap">{lifePlan.whyIDo || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-wepac-text-tertiary">
                  Compromissos
                </p>
                <p className="mt-1 whitespace-pre-wrap">{lifePlan.commitments || "—"}</p>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-wepac-text-tertiary">
              Ainda não preenchido.
            </p>
          )}
        </div>

        <div className="border border-wepac-border bg-wepac-card p-6">
          <h2 className="font-barlow text-lg font-bold text-wepac-white">
            Plano Estratégico
          </h2>
          {strategicPlan ? (
            <div className="mt-4 space-y-4 text-sm text-wepac-text-secondary">
              <p className="text-xs text-wepac-text-tertiary">
                Trimestre {strategicPlan.quarter}
              </p>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-wepac-text-tertiary">
                  Visão de longo prazo
                </p>
                <p className="mt-1 whitespace-pre-wrap">
                  {strategicPlan.longTermVision || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-wepac-text-tertiary">
                  Posicionamento
                </p>
                <p className="mt-1 whitespace-pre-wrap">
                  {strategicPlan.positioning || "—"}
                </p>
              </div>
              {strategicPlan.focusAreas.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {strategicPlan.focusAreas.map((a) => (
                    <span
                      key={a}
                      className="bg-wepac-input px-2 py-0.5 text-xs text-wepac-text-tertiary"
                    >
                      {areaLabels[a]}
                    </span>
                  ))}
                </div>
              )}
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-wepac-text-tertiary">
                  Objetivos
                </p>
                <div className="mt-2 space-y-1">
                  {strategicPlan.goals.map((g) => (
                    <div key={g.id} className="flex items-center justify-between">
                      <span>{g.title}</span>
                      <span className="text-xs text-wepac-text-tertiary">
                        {g.deadline}
                      </span>
                    </div>
                  ))}
                  {strategicPlan.goals.length === 0 && (
                    <p className="text-xs text-wepac-text-tertiary">Sem objetivos.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-wepac-text-tertiary">
              Ainda não preenchido.
            </p>
          )}
        </div>
      </div>

      {/* Strategic map scores */}
      <div className="mt-8 border border-wepac-border bg-wepac-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-barlow text-lg font-bold text-wepac-white">
            Histórico do Mapa Estratégico (PPV)
          </h2>
          <button
            onClick={() => setShowMapForm(!showMapForm)}
            className="bg-wepac-white px-3 py-1.5 text-xs font-bold text-wepac-black"
          >
            + Nova pontuação
          </button>
        </div>

        {showMapForm && (
          <div className="mt-4 border border-wepac-white/20 p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs text-wepac-text-tertiary">Mês</label>
                <input
                  value={mapMonth}
                  onChange={(e) => setMapMonth(e.target.value)}
                  placeholder="2026-07"
                  className="mt-1 w-full bg-wepac-input px-3 py-2 text-sm text-wepac-white"
                />
              </div>
              {(
                [
                  ["longTermScore", "Longo prazo"],
                  ["annualScore", "Anual"],
                  ["quarterlyScore", "Trimestral"],
                  ["monthlyScore", "Mensal"],
                ] as const
              ).map(([key, label]) => (
                <div key={key}>
                  <label className="block text-xs text-wepac-text-tertiary">
                    {label}
                  </label>
                  <select
                    value={mapScores[key]}
                    onChange={(e) =>
                      setMapScores((prev) => ({
                        ...prev,
                        [key]: Number(e.target.value),
                      }))
                    }
                    className="mt-1 w-full bg-wepac-input px-3 py-2 text-sm text-wepac-white"
                  >
                    {[1, 2, 3, 4, 5].map((s) => (
                      <option key={s} value={s}>
                        {s} — {STRATEGIC_SCORE_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <label className="block text-xs text-wepac-text-tertiary">Notas</label>
              <textarea
                value={mapNotes}
                onChange={(e) => setMapNotes(e.target.value)}
                rows={2}
                className="mt-1 w-full bg-wepac-input px-3 py-2 text-sm text-wepac-white"
              />
            </div>
            {mapError && <p className="mt-2 text-xs text-wepac-error">{mapError}</p>}
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleSubmitMapScore}
                disabled={savingMap}
                className="bg-wepac-white px-4 py-2 text-sm font-bold text-wepac-black disabled:opacity-30"
              >
                {savingMap ? "A guardar..." : "Guardar"}
              </button>
              <button
                onClick={() => setShowMapForm(false)}
                className="border border-wepac-border px-4 py-2 text-sm text-wepac-text-secondary"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 space-y-2">
          {[...strategicMapScores].reverse().map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between border-b border-wepac-border pb-2 text-sm"
            >
              <span className="text-wepac-white">{s.month}</span>
              <span className="text-xs text-wepac-text-tertiary">
                LP {s.longTermScore} · A {s.annualScore} · T {s.quarterlyScore} · M{" "}
                {s.monthlyScore}
              </span>
            </div>
          ))}
          {strategicMapScores.length === 0 && (
            <p className="text-sm text-wepac-text-tertiary">Sem pontuações ainda.</p>
          )}
        </div>
      </div>

      {/* Tasks */}
      <div className="mt-8 border border-wepac-border bg-wepac-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-barlow text-lg font-bold text-wepac-white">
            Tarefas
          </h2>
          <button
            onClick={() => setShowTaskForm(!showTaskForm)}
            className="bg-wepac-white px-3 py-1.5 text-xs font-bold text-wepac-black"
          >
            + Nova tarefa
          </button>
        </div>

        {showTaskForm && (
          <div className="mt-4 border border-wepac-white/20 p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs text-wepac-text-tertiary">
                  Título
                </label>
                <input
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="mt-1 w-full bg-wepac-input px-3 py-2 text-sm text-wepac-white"
                />
              </div>
              <div>
                <label className="block text-xs text-wepac-text-tertiary">
                  Prazo
                </label>
                <input
                  type="date"
                  value={taskDeadline}
                  onChange={(e) => setTaskDeadline(e.target.value)}
                  className="mt-1 w-full bg-wepac-input px-3 py-2 text-sm text-wepac-white"
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-xs text-wepac-text-tertiary">
                Descrição (opcional)
              </label>
              <textarea
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                rows={2}
                className="mt-1 w-full bg-wepac-input px-3 py-2 text-sm text-wepac-white"
              />
            </div>
            {taskError && <p className="mt-2 text-xs text-wepac-error">{taskError}</p>}
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleCreateTask}
                disabled={savingTask}
                className="bg-wepac-white px-4 py-2 text-sm font-bold text-wepac-black disabled:opacity-30"
              >
                {savingTask ? "A guardar..." : "Criar"}
              </button>
              <button
                onClick={() => setShowTaskForm(false)}
                className="border border-wepac-border px-4 py-2 text-sm text-wepac-text-secondary"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between border-b border-wepac-border pb-2"
            >
              <div>
                <p
                  className={`text-sm ${
                    task.status === "done"
                      ? "text-wepac-text-tertiary line-through"
                      : "text-wepac-text-secondary"
                  }`}
                >
                  {task.title}
                </p>
                <p className="text-xs text-wepac-text-tertiary">{task.deadline}</p>
              </div>
              <select
                value={task.status}
                onChange={(e) =>
                  handleTaskStatus(task.id, e.target.value as TaskStatus)
                }
                className="bg-wepac-input px-2 py-1 text-xs text-wepac-white"
              >
                <option value="todo">To-do</option>
                <option value="in_progress">Em curso</option>
                <option value="done">Feito</option>
              </select>
            </div>
          ))}
          {tasks.length === 0 && (
            <p className="text-sm text-wepac-text-tertiary">Sem tarefas.</p>
          )}
        </div>
      </div>
    </div>
  );
}
