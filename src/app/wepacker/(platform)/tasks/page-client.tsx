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

function todayISO(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDeadline(deadline: string): Date | null {
  if (!deadline?.trim()) return null;
  const parsed = new Date(deadline);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

// Overdue first (oldest deadline first), then pending by nearest deadline
// (no-deadline pending tasks last), then completed tasks always at the bottom.
function sortTasks(tasks: Task[]): Task[] {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  return [...tasks].sort((a, b) => {
    if (a.status === "done" && b.status !== "done") return 1;
    if (b.status === "done" && a.status !== "done") return -1;
    if (a.status === "done" && b.status === "done") return 0;

    const dateA = parseDeadline(a.deadline);
    const dateB = parseDeadline(b.deadline);

    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;

    const overdueA = dateA < todayStart;
    const overdueB = dateB < todayStart;
    if (overdueA && !overdueB) return -1;
    if (!overdueA && overdueB) return 1;

    return dateA.getTime() - dateB.getTime();
  });
}

export default function TasksPageClient({ membershipId, tasks }: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | TaskStatus>("all");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [taskErrors, setTaskErrors] = useState<Record<string, string>>({});

  const filtered = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);
  const sorted = sortTasks(filtered);
  const counts = {
    all: tasks.length,
    todo: tasks.filter((t) => t.status === "todo").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    done: tasks.filter((t) => t.status === "done").length,
  };

  async function handleCreate() {
    if (!title.trim()) return;
    setSaving(true);
    setFormError(null);
    try {
      await createTask({
        membershipId,
        title: title.trim(),
        description: description.trim() || undefined,
        origin: "self",
        deadline: deadline || todayISO(),
      });
      setTitle("");
      setDescription("");
      setDeadline("");
      setShowForm(false);
      router.refresh();
    } catch (e) {
      console.error("Failed to create task:", e);
      setFormError("Erro ao criar tarefa. Tenta novamente.");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(taskId: string, status: TaskStatus) {
    setTaskErrors((prev) => {
      if (!(taskId in prev)) return prev;
      const next = { ...prev };
      delete next[taskId];
      return next;
    });
    try {
      await updateTaskStatus(taskId, status);
      router.refresh();
    } catch (e) {
      console.error("Failed to update task status:", e);
      setTaskErrors((prev) => ({
        ...prev,
        [taskId]: "Erro ao atualizar estado. Tenta novamente.",
      }));
    }
  }

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
          <div>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full bg-wepac-input px-4 py-2.5 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-white/50"
            />
            <p className="mt-1 text-xs text-wepac-text-tertiary">
              Prazo opcional — se vazio, assume-se hoje.
            </p>
          </div>
          {formError && <p className="text-xs text-wepac-error">{formError}</p>}
          <button
            disabled={saving || !title.trim()}
            onClick={handleCreate}
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
        {sorted.map((task) => (
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
                {taskErrors[task.id] && (
                  <p className="mt-2 text-xs text-wepac-error">{taskErrors[task.id]}</p>
                )}
              </div>
              <select
                value={task.status}
                onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
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
