"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TaskStatus } from "@/lib/wepacker/types";
import { createTask, updateTaskStatus } from "@/lib/wepacker/actions/task";

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To-do",
  in_progress: "Em curso",
  done: "Feito",
};

const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: "bg-wepac-input text-wepac-text-tertiary",
  in_progress: "bg-wepac-white/10 text-wepac-white",
  done: "bg-wepac-success-bg text-wepac-success",
};

const ORIGIN_LABELS: Record<string, string> = {
  plan: "Plano",
  session: "Sessão",
  mentor: "Mentor",
  self: "Próprio",
};

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  origin: string;
  deadline: string;
}

interface Props {
  membershipId: string;
  tasks: Task[];
}

export default function TasksPageClient({ membershipId, tasks }: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | TaskStatus>("all");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [saving, setSaving] = useState(false);

  const filtered = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);
  const counts = {
    all: tasks.length,
    todo: tasks.filter((t) => t.status === "todo").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    done: tasks.filter((t) => t.status === "done").length,
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-barlow text-2xl font-bold text-wepac-white">Tarefas</h1>
          <p className="mt-1 text-sm text-wepac-text-tertiary">
            As tuas tarefas e ações do programa.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-xs text-wepac-white hover:underline"
        >
          {showForm ? "Cancelar" : "+ Nova tarefa"}
        </button>
      </div>

      {showForm && (
        <div className="mt-4 space-y-3 border border-wepac-border bg-wepac-card p-5">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título"
            className="w-full bg-wepac-input px-4 py-2.5 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-white/50"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição (opcional)"
            rows={2}
            className="w-full bg-wepac-input px-4 py-2.5 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-white/50"
          />
          <input
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            placeholder="Prazo (ex: 2026-07-31)"
            className="w-full bg-wepac-input px-4 py-2.5 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-white/50"
          />
          <button
            disabled={saving || !title.trim() || !deadline.trim()}
            onClick={async () => {
              setSaving(true);
              try {
                await createTask({
                  membershipId,
                  title: title.trim(),
                  description: description.trim() || undefined,
                  origin: "self",
                  deadline: deadline.trim(),
                });
                setTitle("");
                setDescription("");
                setDeadline("");
                setShowForm(false);
                router.refresh();
              } finally {
                setSaving(false);
              }
            }}
            className="bg-wepac-white px-5 py-2 text-sm font-bold text-wepac-black transition-colors hover:bg-wepac-accent-muted disabled:opacity-50"
          >
            {saving ? "A guardar..." : "Adicionar tarefa"}
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="mt-6 flex gap-2">
        {(["all", "todo", "in_progress", "done"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs transition-colors ${
              filter === f
                ? "bg-wepac-white text-wepac-black"
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
          <div key={task.id} className="border border-wepac-border bg-wepac-card p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3
                  className={`text-sm font-medium ${
                    task.status === "done" ? "text-wepac-text-tertiary line-through" : "text-wepac-white"
                  }`}
                >
                  {task.title}
                </h3>
                {task.description && (
                  <p className="mt-1 text-xs text-wepac-text-tertiary">{task.description}</p>
                )}
                <div className="mt-2 flex gap-2">
                  <span className="bg-wepac-input px-2 py-0.5 text-xs text-wepac-text-tertiary">
                    {ORIGIN_LABELS[task.origin] ?? task.origin}
                  </span>
                  <span className="text-xs text-wepac-text-tertiary">{task.deadline}</span>
                </div>
              </div>
              <select
                value={task.status}
                onChange={async (e) => {
                  await updateTaskStatus(task.id, e.target.value as TaskStatus);
                  router.refresh();
                }}
                className={`ml-3 px-2 py-0.5 text-xs whitespace-nowrap ${STATUS_COLORS[task.status]}`}
              >
                {(["todo", "in_progress", "done"] as const).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
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
