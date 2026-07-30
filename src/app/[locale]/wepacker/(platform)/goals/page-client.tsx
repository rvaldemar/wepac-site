"use client";

import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { useLocale } from "next-intl";
import { wp } from "@/i18n/copy/wepacker";
import { Link } from "@/i18n/navigation";
import { PILLAR_LABELS, type PillarKey } from "@/lib/wepacker/types";
import {
  upsertStrategicPlan,
  createGoal,
  updateGoalStatus,
} from "@/lib/wepacker/actions/plan";
import {
  createAction,
  updateActionStatus,
} from "@/lib/wepacker/actions/action";

function getStatusLabels(locale: string): Record<string, string> {
  return {
    not_started: wp(locale, "Não iniciado", "Not started"),
    in_progress: wp(locale, "Em curso", "In progress"),
    completed: wp(locale, "Concluído", "Completed"),
    pending: wp(locale, "Pendente", "Pending"),
    cancelled: wp(locale, "Cancelado", "Cancelled"),
  };
}

const STATUS_COLORS: Record<string, string> = {
  not_started: "bg-wepac-input text-wepac-text-tertiary",
  in_progress: "bg-wepac-white/10 text-wepac-white",
  completed: "bg-wepac-success-bg text-wepac-success",
  pending: "bg-wepac-input text-wepac-text-tertiary",
  cancelled: "bg-wepac-input text-wepac-text-tertiary",
};

function getCurrentQuarterLabel(): string {
  const now = new Date();
  const q = Math.floor(now.getMonth() / 3) + 1;
  return `${now.getFullYear()}-Q${q}`;
}

function getCurrentMonthLabel(locale: string): string {
  const now = new Date();
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(now);
}

interface Goal {
  id: string;
  title: string;
  description: string;
  scope: "annual" | "quarterly";
  status: "not_started" | "in_progress" | "completed";
  successCriteria: string;
  deadline: string;
}

interface PlanAction {
  id: string;
  title: string;
  description: string | null;
  dueAt: string | null;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  goalId: string | null;
  goal: { id: string; title: string } | null;
}

interface StrategicPlan {
  id: string;
  quarter: string;
  longTermVision: string;
  positioning: string;
  focusAreas: PillarKey[];
  quarterlyReflection: string;
  goals: Goal[];
  actions: PlanAction[];
}

interface Props {
  userId: string;
  strategicPlan: StrategicPlan | null;
}

export default function PlanPageClient({ userId, strategicPlan }: Props) {
  const locale = useLocale();
  return (
    <div className="p-6 lg:p-8">
      <h1 className="font-barlow text-2xl font-bold text-wepac-white">Goals</h1>
      <p className="mt-1 text-sm text-wepac-text-tertiary">
        {wp(
          locale,
          "Objetivos claros que transformam direção em compromisso.",
          "Clear goals that turn direction into commitment.",
        )}
      </p>

      <div className="mt-8">
        <StrategicPlanSection userId={userId} plan={strategicPlan} />
      </div>
    </div>
  );
}

function StrategicPlanSection({
  userId,
  plan,
}: {
  userId: string;
  plan: StrategicPlan | null;
}) {
  const locale = useLocale();
  const router = useRouter();
  const areaLabels = PILLAR_LABELS;
  const [activeTab, setActiveTab] = useState<"long" | "annual" | "quarterly" | "actions">("quarterly");

  if (!plan) {
    return <StrategicPlanSetup userId={userId} areaLabels={areaLabels} onCreated={() => router.refresh()} />;
  }

  const annualGoals = plan.goals.filter((g) => g.scope === "annual");
  const quarterlyGoals = plan.goals.filter((g) => g.scope === "quarterly");

  return (
    <div>
      <h2 className="font-barlow text-xl font-bold text-wepac-white">Goals</h2>
      <p className="mt-1 text-sm text-wepac-text-tertiary">
        {plan.quarter} —{" "}
        {wp(
          locale,
          "As quatro escalas dos teus Goals.",
          "The four scales of your Goals.",
        )}
      </p>

      {/* Tab navigation */}
      <div className="mt-6 flex gap-1 overflow-x-auto">
        {[
          {
            key: "long" as const,
            label: wp(locale, "Longo prazo", "Long term"),
          },
          { key: "annual" as const, label: wp(locale, "Anual", "Annual") },
          {
            key: "quarterly" as const,
            label: wp(locale, "Trimestral", "Quarterly"),
          },
          { key: "actions" as const, label: "Actions" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`whitespace-nowrap px-4 py-2 text-sm transition-colors ${
              activeTab === tab.key
                ? "bg-wepac-white text-wepac-black"
                : "bg-wepac-card text-wepac-text-tertiary hover:text-wepac-text-secondary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === "long" && (
          <LongTermTab userId={userId} plan={plan} onSaved={() => router.refresh()} />
        )}
        {activeTab === "annual" && (
          <GoalsTab
            title={wp(locale, "Metas Anuais", "Annual Goals")}
            scope="annual"
            goals={annualGoals}
            strategicPlanId={plan.id}
            onChanged={() => router.refresh()}
          />
        )}
        {activeTab === "quarterly" && (
          <QuarterlyTab
            userId={userId}
            plan={plan}
            goals={quarterlyGoals}
            areaLabels={areaLabels}
            onChanged={() => router.refresh()}
          />
        )}
        {activeTab === "actions" && (
          <ActionsTab plan={plan} onChanged={() => router.refresh()} />
        )}
      </div>
    </div>
  );
}

function StrategicPlanSetup({
  userId,
  areaLabels,
  onCreated,
}: {
  userId: string;
  areaLabels: Record<PillarKey, string>;
  onCreated: () => void;
}) {
  const locale = useLocale();
  const [quarter, setQuarter] = useState(getCurrentQuarterLabel());
  const [longTermVision, setLongTermVision] = useState("");
  const [positioning, setPositioning] = useState("");
  const [quarterlyReflection, setQuarterlyReflection] = useState("");
  const [focusAreas, setFocusAreas] = useState<PillarKey[]>([]);
  const [saving, setSaving] = useState(false);

  function toggleArea(area: PillarKey) {
    setFocusAreas((prev) => (prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]));
  }

  return (
    <div>
      <h2 className="font-barlow text-xl font-bold text-wepac-white">Goals</h2>
      <p className="mt-1 text-sm text-wepac-text-tertiary">
        {wp(
          locale,
          "Ainda sem Goals definidos para este trimestre. Cria o ponto de partida.",
          "No Goals defined for this quarter yet. Create your starting point.",
        )}
      </p>

      <div className="mt-6 space-y-4 border border-wepac-border bg-wepac-card p-6">
        <div>
          <label className="block text-sm text-wepac-text-secondary">
            {wp(locale, "Trimestre", "Quarter")}
          </label>
          <input
            value={quarter}
            onChange={(e) => setQuarter(e.target.value)}
            className="mt-1 w-full bg-wepac-input px-4 py-3 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-white/50"
          />
        </div>
        <div>
          <label className="block text-sm text-wepac-text-secondary">
            {wp(locale, "Visão de longo prazo", "Long-term vision")}
          </label>
          <textarea
            value={longTermVision}
            onChange={(e) => setLongTermVision(e.target.value)}
            rows={3}
            className="mt-1 w-full bg-wepac-input px-4 py-3 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-white/50"
          />
        </div>
        <div>
          <label className="block text-sm text-wepac-text-secondary">
            {wp(locale, "Posicionamento", "Positioning")}
          </label>
          <textarea
            value={positioning}
            onChange={(e) => setPositioning(e.target.value)}
            rows={3}
            className="mt-1 w-full bg-wepac-input px-4 py-3 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-white/50"
          />
        </div>
        <div>
          <label className="block text-sm text-wepac-text-secondary">
            {wp(locale, "Pillars de foco", "Focus Pillars")}
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {(Object.keys(areaLabels) as PillarKey[]).map((area) => (
              <button
                key={area}
                type="button"
                onClick={() => toggleArea(area)}
                className={`px-3 py-1 text-xs transition-colors ${
                  focusAreas.includes(area)
                    ? "bg-wepac-white text-wepac-black"
                    : "bg-wepac-input text-wepac-text-tertiary"
                }`}
              >
                {areaLabels[area]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm text-wepac-text-secondary">
            {wp(locale, "Reflexão trimestral", "Quarterly reflection")}
          </label>
          <textarea
            value={quarterlyReflection}
            onChange={(e) => setQuarterlyReflection(e.target.value)}
            rows={3}
            className="mt-1 w-full bg-wepac-input px-4 py-3 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-white/50"
          />
        </div>
        <button
          disabled={saving || !quarter.trim()}
          onClick={async () => {
            setSaving(true);
            try {
              await upsertStrategicPlan(userId, {
                quarter: quarter.trim(),
                longTermVision,
                positioning,
                focusAreas,
                quarterlyReflection,
              });
              onCreated();
            } finally {
              setSaving(false);
            }
          }}
          className="bg-wepac-white px-6 py-3 text-sm font-bold text-wepac-black transition-colors hover:bg-wepac-accent-muted disabled:opacity-50"
        >
          {saving
            ? wp(locale, "A criar...", "Creating...")
            : wp(locale, "Criar Goals", "Create Goals")}
        </button>
      </div>
    </div>
  );
}

function LongTermTab({
  userId,
  plan,
  onSaved,
}: {
  userId: string;
  plan: StrategicPlan;
  onSaved: () => void;
}) {
  const locale = useLocale();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(plan.longTermVision);
  const [saving, setSaving] = useState(false);

  return (
    <div className="border border-wepac-border bg-wepac-card p-6">
      <div className="flex items-start justify-between">
        <h2 className="font-barlow text-xl font-bold text-wepac-white">
          {wp(
            locale,
            "Visão de longo prazo (3–5 anos)",
            "Long-term vision (3–5 years)",
          )}
        </h2>
        <button
          onClick={async () => {
            if (!editing) {
              setEditing(true);
              return;
            }
            setSaving(true);
            try {
              await upsertStrategicPlan(userId, {
                quarter: plan.quarter,
                longTermVision: value,
                positioning: plan.positioning,
                focusAreas: plan.focusAreas,
                quarterlyReflection: plan.quarterlyReflection,
              });
            } finally {
              setSaving(false);
              setEditing(false);
              onSaved();
            }
          }}
          className="text-xs text-wepac-white hover:underline"
        >
          {editing
            ? saving
              ? wp(locale, "A guardar...", "Saving...")
              : wp(locale, "Guardar", "Save")
            : wp(locale, "Editar", "Edit")}
        </button>
      </div>
      {editing ? (
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={6}
          className="mt-4 w-full bg-wepac-dark px-4 py-3 text-sm leading-relaxed text-wepac-text-secondary outline-none focus:ring-1 focus:ring-wepac-white/50"
        />
      ) : (
        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-wepac-text-secondary">
          {value || wp(locale, "Ainda por preencher.", "Not filled in yet.")}
        </p>
      )}
    </div>
  );
}

function GoalsTab({
  title,
  scope,
  goals,
  strategicPlanId,
  onChanged,
}: {
  title: string;
  scope: "annual" | "quarterly";
  goals: Goal[];
  strategicPlanId: string;
  onChanged: () => void;
}) {
  const locale = useLocale();
  const statusLabels = getStatusLabels(locale);
  const [showForm, setShowForm] = useState(false);
  const [title_, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [successCriteria, setSuccessCriteria] = useState("");
  const [deadline, setDeadline] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-barlow text-xl font-bold text-wepac-white">{title}</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-xs text-wepac-white hover:underline"
        >
          {showForm
            ? wp(locale, "Cancelar", "Cancel")
            : wp(locale, "+ Nova meta", "+ New goal")}
        </button>
      </div>

      {showForm && (
        <div className="space-y-3 border border-wepac-border bg-wepac-card p-5">
          <input
            value={title_}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={wp(locale, "Título da meta", "Goal title")}
            className="w-full bg-wepac-input px-4 py-2.5 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-white/50"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={wp(locale, "Descrição", "Description")}
            rows={2}
            className="w-full bg-wepac-input px-4 py-2.5 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-white/50"
          />
          <input
            value={successCriteria}
            onChange={(e) => setSuccessCriteria(e.target.value)}
            placeholder={wp(
              locale,
              "Critério de sucesso",
              "Success criterion",
            )}
            className="w-full bg-wepac-input px-4 py-2.5 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-white/50"
          />
          <input
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            placeholder={wp(
              locale,
              "Prazo (ex.: 2026-12-31)",
              "Deadline (e.g. 2026-12-31)",
            )}
            className="w-full bg-wepac-input px-4 py-2.5 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-white/50"
          />
          <button
            disabled={saving || !title_.trim() || !deadline.trim()}
            onClick={async () => {
              setSaving(true);
              try {
                await createGoal({
                  strategicPlanId,
                  scope,
                  title: title_.trim(),
                  description,
                  successCriteria,
                  deadline: deadline.trim(),
                });
                setTitle("");
                setDescription("");
                setSuccessCriteria("");
                setDeadline("");
                setShowForm(false);
                onChanged();
              } finally {
                setSaving(false);
              }
            }}
            className="bg-wepac-white px-5 py-2 text-sm font-bold text-wepac-black transition-colors hover:bg-wepac-accent-muted disabled:opacity-50"
          >
            {saving
              ? wp(locale, "A guardar...", "Saving...")
              : wp(locale, "Adicionar meta", "Add goal")}
          </button>
        </div>
      )}

      {goals.length === 0 && !showForm && (
        <p className="text-sm text-wepac-text-tertiary">
          {wp(
            locale,
            "Ainda sem metas nesta escala.",
            "No goals at this scale yet.",
          )}
        </p>
      )}

      {goals.map((goal) => (
        <div key={goal.id} className="border border-wepac-border bg-wepac-card p-5">
          <div className="flex items-start justify-between">
            <h3 className="text-sm font-bold text-wepac-white">{goal.title}</h3>
            <select
              value={goal.status}
              onChange={async (e) => {
                await updateGoalStatus(goal.id, e.target.value as Goal["status"]);
                onChanged();
              }}
              className={`px-2 py-0.5 text-xs ${STATUS_COLORS[goal.status]}`}
            >
              {["not_started", "in_progress", "completed"].map((s) => (
                <option key={s} value={s}>
                  {statusLabels[s]}
                </option>
              ))}
            </select>
          </div>
          <p className="mt-2 text-sm text-wepac-text-secondary">{goal.description}</p>
          {goal.successCriteria && (
            <p className="mt-2 text-xs text-wepac-text-tertiary">
              {wp(locale, "Critério", "Criterion")}: {goal.successCriteria}
            </p>
          )}
          <p className="mt-1 text-xs text-wepac-text-tertiary">
            {wp(locale, "Prazo", "Deadline")}: {goal.deadline}
          </p>
        </div>
      ))}
    </div>
  );
}

function QuarterlyTab({
  userId,
  plan,
  goals,
  areaLabels,
  onChanged,
}: {
  userId: string;
  plan: StrategicPlan;
  goals: Goal[];
  areaLabels: Record<PillarKey, string>;
  onChanged: () => void;
}) {
  const locale = useLocale();
  const [editingReflection, setEditingReflection] = useState(false);
  const [reflection, setReflection] = useState(plan.quarterlyReflection);
  const [saving, setSaving] = useState(false);

  return (
    <div className="space-y-6">
      {/* Positioning */}
      <div className="border border-wepac-border bg-wepac-card p-5">
        <h3 className="text-sm font-bold text-wepac-white">
          {wp(locale, "Posicionamento", "Positioning")}
        </h3>
        <p className="mt-2 text-sm text-wepac-text-secondary">
          {plan.positioning ||
            wp(locale, "Ainda por preencher.", "Not filled in yet.")}
        </p>
      </div>

      {/* Focus Pillars */}
      <div className="border border-wepac-border bg-wepac-card p-5">
        <h3 className="text-sm font-bold text-wepac-white">
          {wp(locale, "Pillars de foco", "Focus Pillars")}
        </h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {plan.focusAreas.length === 0 && (
            <span className="text-xs text-wepac-text-tertiary">
              {wp(
                locale,
                "Sem Pillars de foco selecionados.",
                "No Focus Pillars selected.",
              )}
            </span>
          )}
          {plan.focusAreas.map((a) => (
            <span key={a} className="bg-wepac-white/10 px-3 py-1 text-xs text-wepac-white">
              {areaLabels[a]}
            </span>
          ))}
        </div>
      </div>

      {/* Quarterly goals */}
      <GoalsTab
        title={wp(locale, "Metas Trimestrais", "Quarterly Goals")}
        scope="quarterly"
        goals={goals}
        strategicPlanId={plan.id}
        onChanged={onChanged}
      />

      {/* Reflection */}
      <div className="border border-wepac-border bg-wepac-card p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-wepac-white">
            {wp(locale, "Reflexão Trimestral", "Quarterly Reflection")}
          </h3>
          <button
            onClick={async () => {
              if (!editingReflection) {
                setEditingReflection(true);
                return;
              }
              setSaving(true);
              try {
                await upsertStrategicPlan(userId, {
                  quarter: plan.quarter,
                  longTermVision: plan.longTermVision,
                  positioning: plan.positioning,
                  focusAreas: plan.focusAreas,
                  quarterlyReflection: reflection,
                });
              } finally {
                setSaving(false);
                setEditingReflection(false);
                onChanged();
              }
            }}
            className="text-xs text-wepac-white hover:underline"
          >
            {editingReflection
              ? saving
                ? wp(locale, "A guardar...", "Saving...")
                : wp(locale, "Guardar", "Save")
              : wp(locale, "Editar", "Edit")}
          </button>
        </div>
        {editingReflection ? (
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            rows={3}
            className="mt-2 w-full bg-wepac-dark px-4 py-3 text-sm text-wepac-text-secondary outline-none focus:ring-1 focus:ring-wepac-white/50"
          />
        ) : (
          <p className="mt-2 text-sm italic text-wepac-text-tertiary">
            {reflection ||
              wp(
                locale,
                "Ainda sem reflexão. Escreve a tua reflexão no final do trimestre.",
                "No reflection yet. Write your reflection at the end of the quarter.",
              )}
          </p>
        )}
      </div>
    </div>
  );
}

function ActionsTab({ plan, onChanged }: { plan: StrategicPlan; onChanged: () => void }) {
  const locale = useLocale();
  const statusLabels = getStatusLabels(locale);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [goalId, setGoalId] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-barlow text-xl font-bold text-wepac-white">
            Actions · {getCurrentMonthLabel(locale)}
          </h2>
          <p className="mt-1 text-xs text-wepac-text-tertiary">
            {wp(
              locale,
              "Actions ligadas a estes Goals.",
              "Actions connected to these Goals.",
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/wepacker/actions" className="text-xs text-wepac-text-tertiary hover:text-wepac-white">
            {wp(locale, "Ver todas →", "View all →")}
          </Link>
          <button
            onClick={() => setShowForm((visible) => !visible)}
            className="text-xs text-wepac-white hover:underline"
          >
            {showForm
              ? wp(locale, "Cancelar", "Cancel")
              : wp(locale, "+ Nova Action", "+ New Action")}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="space-y-3 border border-wepac-border bg-wepac-card p-5">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={wp(locale, "Título da Action", "Action title")}
            className="w-full bg-wepac-input px-4 py-2.5 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-white/50"
          />
          <input
            type="date"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            className="w-full bg-wepac-input px-4 py-2.5 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-white/50"
          />
          {plan.goals.length > 0 && (
            <select
              value={goalId}
              onChange={(e) => setGoalId(e.target.value)}
              className="w-full bg-wepac-input px-4 py-2.5 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-white/50"
            >
              <option value="">{wp(locale, "Sem Goal", "No Goal")}</option>
              {plan.goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
          )}
          <button
            disabled={saving || !title.trim()}
            onClick={async () => {
              setSaving(true);
              try {
                await createAction({
                  title: title.trim(),
                  dueAt: dueAt || undefined,
                  goalId: goalId || undefined,
                });
                setTitle("");
                setDueAt("");
                setGoalId("");
                setShowForm(false);
                onChanged();
              } finally {
                setSaving(false);
              }
            }}
            className="bg-wepac-white px-5 py-2 text-sm font-bold text-wepac-black transition-colors hover:bg-wepac-accent-muted disabled:opacity-50"
          >
            {saving
              ? wp(locale, "A criar...", "Creating...")
              : wp(locale, "Criar Action", "Create Action")}
          </button>
        </div>
      )}

      {plan.actions.length === 0 && !showForm && (
        <p className="text-sm text-wepac-text-tertiary">
          {wp(
            locale,
            "Sem Actions ligadas a este plano.",
            "No Actions connected to this plan.",
          )}
        </p>
      )}

      {plan.actions.map((action) => (
        <div
          key={action.id}
          className="flex items-center justify-between border border-wepac-border bg-wepac-card p-4"
        >
          <div>
            <p className="text-sm text-wepac-text-secondary">{action.title}</p>
            <p className="mt-0.5 text-xs text-wepac-text-tertiary">
              {action.dueAt
                ? `${wp(locale, "Até", "Due")} ${new Date(
                    action.dueAt,
                  ).toLocaleDateString(locale)}`
                : wp(locale, "Sem data-limite", "No due date")}
              {action.goal ? ` · ${action.goal.title}` : ""}
            </p>
          </div>
          <select
            value={action.status}
            onChange={async (e) => {
              await updateActionStatus(action.id, e.target.value as PlanAction["status"]);
              onChanged();
            }}
            className={`px-2 py-0.5 text-xs ${STATUS_COLORS[action.status]}`}
          >
            {["pending", "in_progress", "completed", "cancelled"].map((s) => (
              <option key={s} value={s}>
                {statusLabels[s]}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
