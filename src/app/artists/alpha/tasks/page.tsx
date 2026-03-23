"use client";

import { useState } from "react";
import { mockTasks, getCurrentUser } from "@/data/artist-mock";
import type { TaskStatus } from "@/lib/types/artist";

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To-do",
  in_progress: "Em curso",
  done: "Feito",
};

const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: "bg-wepac-input text-wepac-text-tertiary",
  in_progress: "bg-wepac-borgonha/20 text-wepac-borgonha",
  done: "bg-wepac-success-bg text-wepac-success",
};

const ORIGIN_LABELS: Record<string, string> = {
  plan: "Plano",
  session: "Sessão",
  mentor: "Mentor",
  self: "Próprio",
};

export default function TasksPage() {
  const user = getCurrentUser();
  const userTasks = mockTasks.filter((t) => t.userId === user.id);
  const [filter, setFilter] = useState<"all" | TaskStatus>("all");

  const filtered = filter === "all" ? userTasks : userTasks.filter((t) => t.status === filter);
  const counts = {
    all: userTasks.length,
    todo: userTasks.filter((t) => t.status === "todo").length,
    in_progress: userTasks.filter((t) => t.status === "in_progress").length,
    done: userTasks.filter((t) => t.status === "done").length,
  };

  return (
    <div className="p-6 lg:p-8">
      <h1 className="font-barlow text-2xl font-bold text-wepac-white">
        Tarefas
      </h1>
      <p className="mt-1 text-sm text-wepac-text-tertiary">
        As tuas tarefas e ações do programa.
      </p>

      {/* Filters */}
      <div className="mt-6 flex gap-2">
        {(["all", "todo", "in_progress", "done"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded px-3 py-1.5 text-xs transition-colors ${
              filter === f
                ? "bg-wepac-borgonha text-wepac-white"
                : "bg-wepac-card text-wepac-text-tertiary hover:text-wepac-text-secondary"
            }`}
          >
            {f === "all" ? "Todas" : STATUS_LABELS[f]} ({counts[f]})
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="mt-6 space-y-3">
        {filtered.map((task) => (
          <div key={task.id} className="rounded border border-wepac-border bg-wepac-card p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className={`text-sm font-medium ${
                  task.status === "done" ? "text-wepac-text-tertiary line-through" : "text-wepac-white"
                }`}>
                  {task.title}
                </h3>
                {task.description && (
                  <p className="mt-1 text-xs text-wepac-text-tertiary">
                    {task.description}
                  </p>
                )}
                <div className="mt-2 flex gap-2">
                  <span className="rounded bg-wepac-input px-2 py-0.5 text-xs text-wepac-text-tertiary">
                    {ORIGIN_LABELS[task.origin]}
                  </span>
                  <span className="text-xs text-wepac-text-tertiary">
                    {task.deadline}
                  </span>
                </div>
              </div>
              <span className={`ml-3 rounded px-2 py-0.5 text-xs whitespace-nowrap ${STATUS_COLORS[task.status]}`}>
                {STATUS_LABELS[task.status]}
              </span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-wepac-text-tertiary">
            Sem tarefas nesta categoria.
          </p>
        )}
      </div>
    </div>
  );
}
