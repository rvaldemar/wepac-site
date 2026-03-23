"use client";

import { useState } from "react";
import { mockTasks, mockUsers } from "@/data/artist-mock";
import type { TaskStatus } from "@/lib/types/artist";

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To-do",
  in_progress: "Em curso",
  done: "Feito",
};

export default function MentorTasksPage() {
  const [filterArtist, setFilterArtist] = useState("all");
  const [filterStatus, setFilterStatus] = useState<"all" | TaskStatus>("all");

  const artists = mockUsers.filter((u) => u.role === "artist");
  const filtered = mockTasks.filter((t) => {
    if (filterArtist !== "all" && t.userId !== filterArtist) return false;
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="p-6 lg:p-8">
      <h1 className="font-barlow text-2xl font-bold text-wepac-white">
        Tarefas — Todos os artistas
      </h1>

      <div className="mt-6 flex flex-wrap gap-3">
        <select
          value={filterArtist}
          onChange={(e) => setFilterArtist(e.target.value)}
          className="rounded bg-wepac-input px-3 py-2 text-sm text-wepac-white"
        >
          <option value="all">Todos os artistas</option>
          {artists.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>

        <div className="flex gap-1">
          {(["all", "todo", "in_progress", "done"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`rounded px-3 py-2 text-xs ${
                filterStatus === s
                  ? "bg-wepac-borgonha text-wepac-white"
                  : "bg-wepac-card text-wepac-text-tertiary"
              }`}
            >
              {s === "all" ? "Todas" : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-2">
        {filtered.map((task) => {
          const artist = artists.find((a) => a.id === task.userId);
          return (
            <div key={task.id} className="flex items-center justify-between rounded border border-wepac-border bg-wepac-card p-4">
              <div>
                <p className={`text-sm ${task.status === "done" ? "text-wepac-text-tertiary line-through" : "text-wepac-white"}`}>
                  {task.title}
                </p>
                <p className="mt-0.5 text-xs text-wepac-text-tertiary">
                  {artist?.name} · {task.deadline} · {task.origin}
                </p>
              </div>
              <span
                className={`rounded px-2 py-0.5 text-xs ${
                  task.status === "done"
                    ? "bg-wepac-success-bg text-wepac-success"
                    : task.status === "in_progress"
                      ? "bg-wepac-borgonha/20 text-wepac-borgonha"
                      : "bg-wepac-input text-wepac-text-tertiary"
                }`}
              >
                {STATUS_LABELS[task.status]}
              </span>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-wepac-text-tertiary">
            Sem tarefas nesta categoria.
          </p>
        )}
      </div>
    </div>
  );
}
