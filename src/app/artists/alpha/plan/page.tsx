"use client";

import { useState } from "react";
import { mockStrategicPlans } from "@/data/artist-mock";
import { AREA_LABELS, type AreaKey } from "@/lib/types/artist";

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

export default function PlanPage() {
  const plan = mockStrategicPlans[0];
  const [activeTab, setActiveTab] = useState<"long" | "annual" | "quarterly" | "monthly">("quarterly");

  const annualGoals = plan.goals.filter((g) => g.scope === "annual");
  const quarterlyGoals = plan.goals.filter((g) => g.scope === "quarterly");

  return (
    <div className="p-6 lg:p-8">
      <h1 className="font-barlow text-2xl font-bold text-wepac-white">
        Plano Estratégico
      </h1>
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
            className={`rounded px-4 py-2 text-sm whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? "bg-wepac-white text-wepac-black"
                : "bg-wepac-card text-wepac-text-tertiary hover:text-wepac-text-secondary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="mt-6">
        {/* Long term */}
        {activeTab === "long" && (
          <div className="rounded border border-wepac-border bg-wepac-card p-6">
            <h2 className="font-barlow text-xl font-bold text-wepac-white">
              Visão de longo prazo (3–5 anos)
            </h2>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-wepac-text-secondary">
              {plan.longTermVision}
            </p>
          </div>
        )}

        {/* Annual */}
        {activeTab === "annual" && (
          <div className="space-y-4">
            <h2 className="font-barlow text-xl font-bold text-wepac-white">
              Metas Anuais
            </h2>
            {annualGoals.map((goal) => (
              <div key={goal.id} className="rounded border border-wepac-border bg-wepac-card p-5">
                <div className="flex items-start justify-between">
                  <h3 className="text-sm font-bold text-wepac-white">{goal.title}</h3>
                  <span className={`rounded px-2 py-0.5 text-xs ${STATUS_COLORS[goal.status]}`}>
                    {STATUS_LABELS[goal.status]}
                  </span>
                </div>
                <p className="mt-2 text-sm text-wepac-text-secondary">{goal.description}</p>
                <p className="mt-2 text-xs text-wepac-text-tertiary">
                  Critério: {goal.successCriteria}
                </p>
                <p className="mt-1 text-xs text-wepac-text-tertiary">
                  Prazo: {goal.deadline}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Quarterly */}
        {activeTab === "quarterly" && (
          <div className="space-y-6">
            {/* Positioning */}
            <div className="rounded border border-wepac-border bg-wepac-card p-5">
              <h3 className="text-sm font-bold text-wepac-white">Posicionamento</h3>
              <p className="mt-2 text-sm text-wepac-text-secondary">{plan.positioning}</p>
            </div>

            {/* Focus areas */}
            <div className="rounded border border-wepac-border bg-wepac-card p-5">
              <h3 className="text-sm font-bold text-wepac-white">Áreas de Foco</h3>
              <div className="mt-2 flex gap-2">
                {plan.focusAreas.map((a) => (
                  <span
                    key={a}
                    className="rounded bg-wepac-white/10 px-3 py-1 text-xs text-wepac-white"
                  >
                    {AREA_LABELS[a]}
                  </span>
                ))}
              </div>
            </div>

            {/* Quarterly goals */}
            <div>
              <h3 className="text-sm font-bold text-wepac-white">Metas Trimestrais</h3>
              <div className="mt-3 space-y-3">
                {quarterlyGoals.map((goal) => (
                  <div key={goal.id} className="rounded border border-wepac-border bg-wepac-card p-4">
                    <div className="flex items-start justify-between">
                      <span className="text-sm text-wepac-text-secondary">{goal.title}</span>
                      <span className={`rounded px-2 py-0.5 text-xs ${STATUS_COLORS[goal.status]}`}>
                        {STATUS_LABELS[goal.status]}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-wepac-text-tertiary">{goal.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Reflection */}
            <div className="rounded border border-wepac-border bg-wepac-card p-5">
              <h3 className="text-sm font-bold text-wepac-white">Reflexão Trimestral</h3>
              <p className="mt-2 text-sm text-wepac-text-tertiary italic">
                {plan.quarterlyReflection || "Ainda sem reflexão. Escreve a tua reflexão no final do trimestre."}
              </p>
            </div>
          </div>
        )}

        {/* Monthly */}
        {activeTab === "monthly" && (
          <div className="space-y-4">
            <h2 className="font-barlow text-xl font-bold text-wepac-white">
              Ações do Mês — Março 2026
            </h2>
            {plan.monthlyActions
              .filter((a) => a.month === "2026-03")
              .map((action) => (
                <div key={action.id} className="flex items-center justify-between rounded border border-wepac-border bg-wepac-card p-4">
                  <div>
                    <p className="text-sm text-wepac-text-secondary">{action.title}</p>
                    <p className="mt-0.5 text-xs text-wepac-text-tertiary">
                      Prazo: {action.deadline}
                      {action.goalId && " · Meta associada"}
                    </p>
                  </div>
                  <span className={`rounded px-2 py-0.5 text-xs ${STATUS_COLORS[action.status]}`}>
                    {STATUS_LABELS[action.status]}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
