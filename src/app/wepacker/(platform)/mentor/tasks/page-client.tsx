"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TaskOrigin, TaskStatus } from "@/lib/wepacker/types";
import { createTask, updateTaskStatus } from "@/lib/wepacker/actions/task";

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To-do",
  in_progress: "Em curso",
  done: "Feito",
};

const ORIGIN_LABELS: Record<TaskOrigin, string> = {
  plan: "Plano",
  session: "Sessão",
  mentor: "Mentor",
  self: "Próprio",
};

interface TaskRow {
  id: string;
  title: string;
  status: TaskStatus;
  origin: TaskOrigin;
  deadline: string;
  membership: { id: string; user: { id: string; name: string } };
}

interface MembershipOption {
  id: string;
  user: { id: string; name: string };
}

interface MentorTasksProps {
  tasks: TaskRow[];
  memberships: MembershipOption[];
}

export function MentorTasksClient({ tasks, memberships }: MentorTasksProps) {
  const router = useRouter();
  const [filterMember, setFilterMember] = useState("all");
  const [filterStatus, setFilterStatus] = useState<"all" | TaskStatus>("all");

  const filtered = tasks.filter((t) => {
    if (filterMember !== "all" && t.membership.id !== filterMember) return false;
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    return true;
  });

  // ===== Create task form =====
  const [showCreate, setShowCreate] = useState(false);
  const [membershipId, setMembershipId] = useState(memberships[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  async function handleCreate() {
    if (!membershipId || !title.trim() || !deadline) {
      setCreateError("Membro, título e prazo são obrigatórios.");
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      await createTask({
        membershipId,
        title: title.trim(),
        description: description.trim() || undefined,
        origin: "mentor",
        deadline,
      });
      setShowCreate(false);
      setTitle("");
      setDescription("");
      setDeadline("");
      router.refresh();
    } catch (e) {
      console.error("Failed to create task:", e);
      setCreateError("Erro ao criar tarefa. Tenta novamente.");
    } finally {
      setCreating(false);
    }
  }

  async function handleStatusChange(taskId: string, status: TaskStatus) {
    try {
      await updateTaskStatus(taskId, status);
      router.refresh();
    } catch (e) {
      console.error("Failed to update task status:", e);
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <h1 className="font-barlow text-2xl font-bold text-wepac-white">
          Tarefas — Todos os membros
        </h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="bg-wepac-white px-4 py-2 text-sm font-bold text-wepac-black"
        >
          + Nova Tarefa
        </button>
      </div>

      {showCreate && (
        <div className="mt-6 border border-wepac-white/20 bg-wepac-card p-6">
          <h3 className="text-sm font-bold text-wepac-white">Criar Tarefa</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-wepac-text-tertiary">Membro</label>
              <select
                value={membershipId}
                onChange={(e) => setMembershipId(e.target.value)}
                className="mt-1 w-full bg-wepac-input px-3 py-2 text-sm text-wepac-white"
              >
                {memberships.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.user.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-wepac-text-tertiary">Prazo</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="mt-1 w-full bg-wepac-input px-3 py-2 text-sm text-wepac-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-wepac-text-tertiary">Título</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full bg-wepac-input px-3 py-2 text-sm text-wepac-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-wepac-text-tertiary">
                Descrição (opcional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="mt-1 w-full bg-wepac-input px-3 py-2 text-sm text-wepac-white"
              />
            </div>
          </div>
          {createError && (
            <p className="mt-3 text-xs text-wepac-error">{createError}</p>
          )}
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleCreate}
              disabled={creating}
              className="bg-wepac-white px-4 py-2 text-sm font-bold text-wepac-black disabled:opacity-30"
            >
              {creating ? "A criar..." : "Criar"}
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="border border-wepac-border px-4 py-2 text-sm text-wepac-text-secondary"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <select
          value={filterMember}
          onChange={(e) => setFilterMember(e.target.value)}
          className="bg-wepac-input px-3 py-2 text-sm text-wepac-white"
        >
          <option value="all">Todos os membros</option>
          {memberships.map((m) => (
            <option key={m.id} value={m.id}>
              {m.user.name}
            </option>
          ))}
        </select>

        <div className="flex gap-1">
          {(["all", "todo", "in_progress", "done"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 text-xs ${
                filterStatus === s
                  ? "bg-wepac-white text-wepac-black"
                  : "bg-wepac-card text-wepac-text-tertiary"
              }`}
            >
              {s === "all" ? "Todas" : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-2">
        {filtered.map((task) => (
          <div
            key={task.id}
            className="flex items-center justify-between border border-wepac-border bg-wepac-card p-4"
          >
            <div>
              <p
                className={`text-sm ${
                  task.status === "done"
                    ? "text-wepac-text-tertiary line-through"
                    : "text-wepac-white"
                }`}
              >
                {task.title}
              </p>
              <p className="mt-0.5 text-xs text-wepac-text-tertiary">
                {task.membership.user.name} · {task.deadline} ·{" "}
                {ORIGIN_LABELS[task.origin]}
              </p>
            </div>
            <select
              value={task.status}
              onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
              className={`px-2 py-1 text-xs ${
                task.status === "done"
                  ? "bg-wepac-success-bg text-wepac-success"
                  : task.status === "in_progress"
                    ? "bg-wepac-white/10 text-wepac-white"
                    : "bg-wepac-input text-wepac-text-tertiary"
              }`}
            >
              <option value="todo">To-do</option>
              <option value="in_progress">Em curso</option>
              <option value="done">Feito</option>
            </select>
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
