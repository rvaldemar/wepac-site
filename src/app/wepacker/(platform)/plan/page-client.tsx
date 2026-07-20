"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getAreaLabels, type AreaKey } from "@/lib/wepacker/types";
import {
  upsertLifePlan,
  upsertStrategicPlan,
  createGoal,
  updateGoalStatus,
  createMonthlyAction,
  updateMonthlyActionStatus,
} from "@/lib/wepacker/actions/plan";

const LIFE_SECTIONS = [
  { key: "whoIAm", title: "Quem sou", description: "Narrativa pessoal e artística." },
  { key: "whereIAm", title: "Onde estou", description: "Situação actual: pessoal, profissional, artística." },
  { key: "whereIGo", title: "Para onde quero ir", description: "Visão a 3–5 anos." },
  { key: "whyIDo", title: "Porque faço o que faço", description: "Propósito, motivação profunda, missão pessoal." },
  { key: "commitments", title: "O que me comprometo a fazer", description: "Compromissos concretos: hábitos, atitudes, prioridades." },
] as const;

type LifeSectionKey = (typeof LIFE_SECTIONS)[number]["key"];

const STATUS_LABELS: Record<string, string> = {
  not_started: "Não iniciado",
  in_progress: "Em curso",
  completed: "Concluído",
  todo: "To-do",
  done: "Feito",
};

const STATUS_COLORS: Record<string, string> = {
  not_started: "bg-wepac-input text-wepac-text-tertiary",
  in_progress: "bg-wepac-white/10 text-wepac-white",
  completed: "bg-wepac-success-bg text-wepac-success",
  todo: "bg-wepac-input text-wepac-text-tertiary",
  done: "bg-wepac-success-bg text-wepac-success",
};

function getCurrentQuarterLabel(): string {
  const now = new Date();
  const q = Math.floor(now.getMonth() / 3) + 1;
  return `${now.getFullYear()}-Q${q}`;
}

function getCurrentMonthLabel(): string {
  const MONTH_NAMES_PT = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];
  const now = new Date();
  return `${MONTH_NAMES_PT[now.getMonth()]} ${now.getFullYear()}`;
}

function getCurrentMonthKey(): string {
  const now = new Date();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${m}`;
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

interface MonthlyAction {
  id: string;
  title: string;
  month: string;
  deadline: string;
  status: "todo" | "in_progress" | "done";
  goalId: string | null;
}

interface StrategicPlan {
  id: string;
  quarter: string;
  longTermVision: string;
  positioning: string;
  focusAreas: AreaKey[];
  quarterlyReflection: string;
  goals: Goal[];
  monthlyActions: MonthlyAction[];
}

interface LifePlan {
  whoIAm: string;
  whereIAm: string;
  whereIGo: string;
  whyIDo: string;
  commitments: string;
  updatedAt: string;
}

interface Props {
  membershipId: string;
  domainLabel: string;
  lifePlan: LifePlan | null;
  strategicPlan: StrategicPlan | null;
}

export default function PlanPageClient({ membershipId, domainLabel, lifePlan, strategicPlan }: Props) {
  return (
    <div className="p-6 lg:p-8">
      <h1 className="font-barlow text-2xl font-bold text-wepac-white">Plano</h1>
      <p className="mt-1 text-sm text-wepac-text-tertiary">
        O teu plano de projeto de vida e o teu plano estratégico — as escalas
        do teu desenvolvimento.
      </p>

      <div className="mt-8">
        <LifePlanSection membershipId={membershipId} plan={lifePlan} />
      </div>

      <div className="mt-12 border-t border-wepac-border pt-8">
        <StrategicPlanSection
          membershipId={membershipId}
          domainLabel={domainLabel}
          plan={strategicPlan}
        />
      </div>
    </div>
  );
}

function LifePlanSection({ membershipId, plan }: { membershipId: string; plan: LifePlan | null }) {
  const defaultValues: Record<LifeSectionKey, string> = {
    whoIAm: plan?.whoIAm ?? "",
    whereIAm: plan?.whereIAm ?? "",
    whereIGo: plan?.whereIGo ?? "",
    whyIDo: plan?.whyIDo ?? "",
    commitments: plan?.commitments ?? "",
  };

  const [values, setValues] = useState<Record<LifeSectionKey, string>>(defaultValues);
  const [editing, setEditing] = useState<LifeSectionKey | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await upsertLifePlan(membershipId, values);
    } finally {
      setSaving(false);
      setEditing(null);
    }
  };

  return (
    <div>
      <h2 className="font-barlow text-xl font-bold text-wepac-white">
        Plano de Projeto de Vida
      </h2>
      <p className="mt-1 text-sm text-wepac-text-tertiary">
        O teu documento de direcção pessoal e artística.
      </p>
      {plan && (
        <p className="mt-1 text-xs text-wepac-text-tertiary">
          Última atualização: {new Date(plan.updatedAt).toLocaleDateString("pt-PT")}
        </p>
      )}

      <div className="mt-6 space-y-6">
        {LIFE_SECTIONS.map((section) => {
          const isEditing = editing === section.key;
          return (
            <div key={section.key} className="border border-wepac-border bg-wepac-card p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-barlow text-lg font-bold text-wepac-white">
                    {section.title}
                  </h3>
                  <p className="mt-0.5 text-xs text-wepac-text-tertiary">{section.description}</p>
                </div>
                <button
                  onClick={() => (isEditing ? handleSave() : setEditing(section.key))}
                  disabled={saving}
                  className="text-xs text-wepac-white hover:underline disabled:opacity-50"
                >
                  {isEditing ? (saving ? "A guardar..." : "Guardar") : "Editar"}
                </button>
              </div>

              {isEditing ? (
                <textarea
                  value={values[section.key]}
                  onChange={(e) => setValues({ ...values, [section.key]: e.target.value })}
                  rows={5}
                  className="mt-4 w-full bg-wepac-dark px-4 py-3 text-sm leading-relaxed text-wepac-text-secondary outline-none focus:ring-1 focus:ring-wepac-white/50"
                />
              ) : (
                <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-wepac-text-secondary">
                  {values[section.key] || "Ainda por preencher."}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StrategicPlanSection({
  membershipId,
  domainLabel,
  plan,
}: {
  membershipId: string;
  domainLabel: string;
  plan: StrategicPlan | null;
}) {
  const router = useRouter();
  const areaLabels = getAreaLabels(domainLabel);
  const [activeTab, setActiveTab] = useState<"long" | "annual" | "quarterly" | "monthly">("quarterly");

  if (!plan) {
    return <StrategicPlanSetup membershipId={membershipId} areaLabels={areaLabels} onCreated={() => router.refresh()} />;
  }

  const annualGoals = plan.goals.filter((g) => g.scope === "annual");
  const quarterlyGoals = plan.goals.filter((g) => g.scope === "quarterly");

  return (
    <div>
      <h2 className="font-barlow text-xl font-bold text-wepac-white">Plano Estratégico</h2>
      <p className="mt-1 text-sm text-wepac-text-tertiary">
        {plan.quarter} — As quatro escalas do teu plano.
      </p>

      {/* Tab navigation */}
      <div className="mt-6 flex gap-1 overflow-x-auto">
        {[
          { key: "long" as const, label: "Longo prazo" },
          { key: "annual" as const, label: "Anual" },
          { key: "quarterly" as const, label: "Trimestral" },
          { key: "monthly" as const, label: "Mensal" },
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
          <LongTermTab membershipId={membershipId} plan={plan} onSaved={() => router.refresh()} />
        )}
        {activeTab === "annual" && (
          <GoalsTab
            title="Metas Anuais"
            scope="annual"
            goals={annualGoals}
            strategicPlanId={plan.id}
            onChanged={() => router.refresh()}
          />
        )}
        {activeTab === "quarterly" && (
          <QuarterlyTab
            membershipId={membershipId}
            plan={plan}
            goals={quarterlyGoals}
            areaLabels={areaLabels}
            onChanged={() => router.refresh()}
          />
        )}
        {activeTab === "monthly" && (
          <MonthlyTab plan={plan} onChanged={() => router.refresh()} />
        )}
      </div>
    </div>
  );
}

function StrategicPlanSetup({
  membershipId,
  areaLabels,
  onCreated,
}: {
  membershipId: string;
  areaLabels: Record<AreaKey, string>;
  onCreated: () => void;
}) {
  const [quarter, setQuarter] = useState(getCurrentQuarterLabel());
  const [longTermVision, setLongTermVision] = useState("");
  const [positioning, setPositioning] = useState("");
  const [quarterlyReflection, setQuarterlyReflection] = useState("");
  const [focusAreas, setFocusAreas] = useState<AreaKey[]>([]);
  const [saving, setSaving] = useState(false);

  function toggleArea(area: AreaKey) {
    setFocusAreas((prev) => (prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]));
  }

  return (
    <div>
      <h2 className="font-barlow text-xl font-bold text-wepac-white">Plano Estratégico</h2>
      <p className="mt-1 text-sm text-wepac-text-tertiary">
        Ainda sem plano estratégico definido para este trimestre. Cria o
        ponto de partida.
      </p>

      <div className="mt-6 space-y-4 border border-wepac-border bg-wepac-card p-6">
        <div>
          <label className="block text-sm text-wepac-text-secondary">Trimestre</label>
          <input
            value={quarter}
            onChange={(e) => setQuarter(e.target.value)}
            className="mt-1 w-full bg-wepac-input px-4 py-3 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-white/50"
          />
        </div>
        <div>
          <label className="block text-sm text-wepac-text-secondary">Visão de longo prazo</label>
          <textarea
            value={longTermVision}
            onChange={(e) => setLongTermVision(e.target.value)}
            rows={3}
            className="mt-1 w-full bg-wepac-input px-4 py-3 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-white/50"
          />
        </div>
        <div>
          <label className="block text-sm text-wepac-text-secondary">Posicionamento</label>
          <textarea
            value={positioning}
            onChange={(e) => setPositioning(e.target.value)}
            rows={3}
            className="mt-1 w-full bg-wepac-input px-4 py-3 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-white/50"
          />
        </div>
        <div>
          <label className="block text-sm text-wepac-text-secondary">Áreas de foco</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {(Object.keys(areaLabels) as AreaKey[]).map((area) => (
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
          <label className="block text-sm text-wepac-text-secondary">Reflexão trimestral</label>
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
              await upsertStrategicPlan(membershipId, {
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
          {saving ? "A criar..." : "Criar plano estratégico"}
        </button>
      </div>
    </div>
  );
}

function LongTermTab({
  membershipId,
  plan,
  onSaved,
}: {
  membershipId: string;
  plan: StrategicPlan;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(plan.longTermVision);
  const [saving, setSaving] = useState(false);

  return (
    <div className="border border-wepac-border bg-wepac-card p-6">
      <div className="flex items-start justify-between">
        <h2 className="font-barlow text-xl font-bold text-wepac-white">
          Visão de longo prazo (3–5 anos)
        </h2>
        <button
          onClick={async () => {
            if (!editing) {
              setEditing(true);
              return;
            }
            setSaving(true);
            try {
              await upsertStrategicPlan(membershipId, {
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
          {editing ? (saving ? "A guardar..." : "Guardar") : "Editar"}
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
          {value || "Ainda por preencher."}
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
          {showForm ? "Cancelar" : "+ Nova meta"}
        </button>
      </div>

      {showForm && (
        <div className="space-y-3 border border-wepac-border bg-wepac-card p-5">
          <input
            value={title_}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título da meta"
            className="w-full bg-wepac-input px-4 py-2.5 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-white/50"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição"
            rows={2}
            className="w-full bg-wepac-input px-4 py-2.5 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-white/50"
          />
          <input
            value={successCriteria}
            onChange={(e) => setSuccessCriteria(e.target.value)}
            placeholder="Critério de sucesso"
            className="w-full bg-wepac-input px-4 py-2.5 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-white/50"
          />
          <input
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            placeholder="Prazo (ex: 2026-12-31)"
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
            {saving ? "A guardar..." : "Adicionar meta"}
          </button>
        </div>
      )}

      {goals.length === 0 && !showForm && (
        <p className="text-sm text-wepac-text-tertiary">Ainda sem metas nesta escala.</p>
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
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <p className="mt-2 text-sm text-wepac-text-secondary">{goal.description}</p>
          {goal.successCriteria && (
            <p className="mt-2 text-xs text-wepac-text-tertiary">
              Critério: {goal.successCriteria}
            </p>
          )}
          <p className="mt-1 text-xs text-wepac-text-tertiary">Prazo: {goal.deadline}</p>
        </div>
      ))}
    </div>
  );
}

function QuarterlyTab({
  membershipId,
  plan,
  goals,
  areaLabels,
  onChanged,
}: {
  membershipId: string;
  plan: StrategicPlan;
  goals: Goal[];
  areaLabels: Record<AreaKey, string>;
  onChanged: () => void;
}) {
  const [editingReflection, setEditingReflection] = useState(false);
  const [reflection, setReflection] = useState(plan.quarterlyReflection);
  const [saving, setSaving] = useState(false);

  return (
    <div className="space-y-6">
      {/* Positioning */}
      <div className="border border-wepac-border bg-wepac-card p-5">
        <h3 className="text-sm font-bold text-wepac-white">Posicionamento</h3>
        <p className="mt-2 text-sm text-wepac-text-secondary">
          {plan.positioning || "Ainda por preencher."}
        </p>
      </div>

      {/* Focus areas */}
      <div className="border border-wepac-border bg-wepac-card p-5">
        <h3 className="text-sm font-bold text-wepac-white">Áreas de Foco</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {plan.focusAreas.length === 0 && (
            <span className="text-xs text-wepac-text-tertiary">Sem áreas de foco definidas.</span>
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
        title="Metas Trimestrais"
        scope="quarterly"
        goals={goals}
        strategicPlanId={plan.id}
        onChanged={onChanged}
      />

      {/* Reflection */}
      <div className="border border-wepac-border bg-wepac-card p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-wepac-white">Reflexão Trimestral</h3>
          <button
            onClick={async () => {
              if (!editingReflection) {
                setEditingReflection(true);
                return;
              }
              setSaving(true);
              try {
                await upsertStrategicPlan(membershipId, {
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
            {editingReflection ? (saving ? "A guardar..." : "Guardar") : "Editar"}
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
            {reflection || "Ainda sem reflexão. Escreve a tua reflexão no final do trimestre."}
          </p>
        )}
      </div>
    </div>
  );
}

function MonthlyTab({ plan, onChanged }: { plan: StrategicPlan; onChanged: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [goalId, setGoalId] = useState("");
  const [saving, setSaving] = useState(false);

  const currentMonthKey = getCurrentMonthKey();
  const monthActions = plan.monthlyActions.filter((a) => a.month === currentMonthKey);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-barlow text-xl font-bold text-wepac-white">
          Ações do Mês — {getCurrentMonthLabel()}
        </h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-xs text-wepac-white hover:underline"
        >
          {showForm ? "Cancelar" : "+ Nova ação"}
        </button>
      </div>

      {showForm && (
        <div className="space-y-3 border border-wepac-border bg-wepac-card p-5">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título da ação"
            className="w-full bg-wepac-input px-4 py-2.5 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-white/50"
          />
          <input
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            placeholder="Prazo (ex: 2026-07-31)"
            className="w-full bg-wepac-input px-4 py-2.5 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-white/50"
          />
          {plan.goals.length > 0 && (
            <select
              value={goalId}
              onChange={(e) => setGoalId(e.target.value)}
              className="w-full bg-wepac-input px-4 py-2.5 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-white/50"
            >
              <option value="">Sem meta associada</option>
              {plan.goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
          )}
          <button
            disabled={saving || !title.trim() || !deadline.trim()}
            onClick={async () => {
              setSaving(true);
              try {
                await createMonthlyAction({
                  strategicPlanId: plan.id,
                  month: currentMonthKey,
                  title: title.trim(),
                  deadline: deadline.trim(),
                  goalId: goalId || undefined,
                });
                setTitle("");
                setDeadline("");
                setGoalId("");
                setShowForm(false);
                onChanged();
              } finally {
                setSaving(false);
              }
            }}
            className="bg-wepac-white px-5 py-2 text-sm font-bold text-wepac-black transition-colors hover:bg-wepac-accent-muted disabled:opacity-50"
          >
            {saving ? "A guardar..." : "Adicionar ação"}
          </button>
        </div>
      )}

      {monthActions.length === 0 && !showForm && (
        <p className="text-sm text-wepac-text-tertiary">Ainda sem ações este mês.</p>
      )}

      {monthActions.map((action) => (
        <div
          key={action.id}
          className="flex items-center justify-between border border-wepac-border bg-wepac-card p-4"
        >
          <div>
            <p className="text-sm text-wepac-text-secondary">{action.title}</p>
            <p className="mt-0.5 text-xs text-wepac-text-tertiary">
              Prazo: {action.deadline}
              {action.goalId && " · Meta associada"}
            </p>
          </div>
          <select
            value={action.status}
            onChange={async (e) => {
              await updateMonthlyActionStatus(action.id, e.target.value as MonthlyAction["status"]);
              onChanged();
            }}
            className={`px-2 py-0.5 text-xs ${STATUS_COLORS[action.status]}`}
          >
            {["todo", "in_progress", "done"].map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
