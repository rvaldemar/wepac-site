"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createAction,
  deleteAction,
  updateActionStatus,
} from "@/lib/wepacker/actions/action";

type ActionStatus = "pending" | "in_progress" | "completed" | "cancelled";

interface ActionItem {
  id: string;
  title: string;
  description: string | null;
  status: ActionStatus;
  origin: string;
  dueAt: string | null;
  createdAt: string;
}

interface Props {
  actions: ActionItem[];
}

const STATUS_LABELS: Record<ActionStatus, string> = {
  pending: "Pending",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<ActionStatus, string> = {
  pending: "bg-wepac-input text-wepac-text-tertiary",
  in_progress: "bg-wepac-white/10 text-wepac-white",
  completed: "bg-wepac-success-bg text-wepac-success",
  cancelled: "bg-wepac-input text-wepac-text-tertiary",
};

const ORIGIN_LABELS: Record<string, string> = {
  self: "Self",
  plan: "Goal",
  session_proposal: "Session proposal",
};

function sortActions(actions: ActionItem[]): ActionItem[] {
  const terminal = new Set<ActionStatus>(["completed", "cancelled"]);
  return [...actions].sort((first, second) => {
    const firstTerminal = terminal.has(first.status);
    const secondTerminal = terminal.has(second.status);
    if (firstTerminal !== secondTerminal) return firstTerminal ? 1 : -1;

    if (first.dueAt && second.dueAt) {
      return new Date(first.dueAt).getTime() - new Date(second.dueAt).getTime();
    }
    if (first.dueAt) return -1;
    if (second.dueAt) return 1;
    return new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime();
  });
}

function formatDueAt(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ActionsPageClient({ actions }: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState<"active" | "all" | ActionStatus>(
    "active",
  );
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [rowError, setRowError] = useState<Record<string, string>>({});

  const filtered = actions.filter((action) => {
    if (filter === "all") return true;
    if (filter === "active") {
      return action.status === "pending" || action.status === "in_progress";
    }
    return action.status === filter;
  });
  const sorted = sortActions(filtered);
  const activeCount = actions.filter(
    (action) => action.status === "pending" || action.status === "in_progress",
  ).length;

  async function handleCreate() {
    if (!title.trim()) return;
    setSaving(true);
    setFormError(null);
    try {
      await createAction({
        title: title.trim(),
        description: description.trim() || undefined,
        dueAt: dueAt || undefined,
      });
      setTitle("");
      setDescription("");
      setDueAt("");
      setShowForm(false);
      router.refresh();
    } catch (error) {
      console.error("Failed to create Action:", error);
      setFormError("Não foi possível criar a Action. Tenta novamente.");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(actionId: string, status: ActionStatus) {
    setRowError((previous) => ({ ...previous, [actionId]: "" }));
    try {
      await updateActionStatus(actionId, status);
      router.refresh();
    } catch (error) {
      console.error("Failed to update Action:", error);
      setRowError((previous) => ({
        ...previous,
        [actionId]: "Não foi possível atualizar esta Action.",
      }));
    }
  }

  async function handleDelete(actionId: string) {
    if (!window.confirm("Delete this Action?")) return;
    setRowError((previous) => ({ ...previous, [actionId]: "" }));
    try {
      await deleteAction(actionId);
      router.refresh();
    } catch (error) {
      console.error("Failed to delete Action:", error);
      setRowError((previous) => ({
        ...previous,
        [actionId]: "Não foi possível eliminar esta Action.",
      }));
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-barlow text-2xl font-bold text-wepac-white">
            Actions
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-wepac-text-tertiary">
            Os próximos passos que escolheste para avançar em My Journey.
          </p>
        </div>
        <button
          onClick={() => setShowForm((visible) => !visible)}
          className="bg-wepac-white px-4 py-2 text-sm font-bold text-wepac-black"
        >
          {showForm ? "Cancel" : "+ New Action"}
        </button>
      </div>

      {showForm && (
        <section className="mt-6 space-y-3 border border-wepac-border bg-wepac-card p-5">
          <div>
            <label htmlFor="action-title" className="block text-xs text-wepac-text-tertiary">
              Title
            </label>
            <input
              id="action-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-1 w-full bg-wepac-input px-4 py-2.5 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-white/50"
            />
          </div>
          <div>
            <label htmlFor="action-description" className="block text-xs text-wepac-text-tertiary">
              Description (optional)
            </label>
            <textarea
              id="action-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              className="mt-1 w-full resize-none bg-wepac-input px-4 py-2.5 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-white/50"
            />
          </div>
          <div className="max-w-xs">
            <label htmlFor="action-due-at" className="block text-xs text-wepac-text-tertiary">
              Due date (optional)
            </label>
            <input
              id="action-due-at"
              type="date"
              value={dueAt}
              onChange={(event) => setDueAt(event.target.value)}
              className="mt-1 w-full bg-wepac-input px-4 py-2.5 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-white/50"
            />
          </div>
          {formError && <p className="text-xs text-wepac-error">{formError}</p>}
          <button
            disabled={saving || !title.trim()}
            onClick={handleCreate}
            className="bg-wepac-white px-5 py-2 text-sm font-bold text-wepac-black disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Action"}
          </button>
        </section>
      )}

      <div className="mt-6 flex flex-wrap gap-2" aria-label="Action filters">
        {(
          [
            ["active", "Active", activeCount],
            ["pending", "Pending", actions.filter((action) => action.status === "pending").length],
            ["in_progress", "In progress", actions.filter((action) => action.status === "in_progress").length],
            ["completed", "Completed", actions.filter((action) => action.status === "completed").length],
            ["all", "All", actions.length],
          ] as const
        ).map(([value, label, count]) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-3 py-1.5 text-xs transition-colors ${
              filter === value
                ? "bg-wepac-white text-wepac-black"
                : "bg-wepac-card text-wepac-text-tertiary hover:text-wepac-white"
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {sorted.map((action) => {
          const dueLabel = formatDueAt(action.dueAt);
          return (
            <article
              key={action.id}
              className="border border-wepac-border bg-wepac-card p-4"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <h2
                    className={`text-sm font-medium ${
                      action.status === "completed" || action.status === "cancelled"
                        ? "text-wepac-text-tertiary line-through"
                        : "text-wepac-white"
                    }`}
                  >
                    {action.title}
                  </h2>
                  {action.description && (
                    <p className="mt-1 text-xs leading-relaxed text-wepac-text-tertiary">
                      {action.description}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="bg-wepac-input px-2 py-0.5 text-xs text-wepac-text-tertiary">
                      {ORIGIN_LABELS[action.origin] ?? action.origin}
                    </span>
                    {dueLabel && (
                      <span className="px-2 py-0.5 text-xs text-wepac-text-tertiary">
                        Due {dueLabel}
                      </span>
                    )}
                  </div>
                  {rowError[action.id] && (
                    <p className="mt-2 text-xs text-wepac-error">{rowError[action.id]}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <select
                    aria-label={`Status of ${action.title}`}
                    value={action.status}
                    onChange={(event) =>
                      handleStatusChange(action.id, event.target.value as ActionStatus)
                    }
                    className={`px-2 py-1 text-xs ${STATUS_COLORS[action.status]}`}
                  >
                    {(Object.keys(STATUS_LABELS) as ActionStatus[]).map((status) => (
                      <option key={status} value={status}>
                        {STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleDelete(action.id)}
                    className="px-2 py-1 text-xs text-wepac-text-tertiary hover:text-wepac-error"
                    aria-label={`Delete ${action.title}`}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          );
        })}
        {sorted.length === 0 && (
          <div className="border border-dashed border-wepac-border px-6 py-10 text-center">
            <p className="text-sm text-wepac-text-tertiary">
              {filter === "active"
                ? "No active Actions. Choose one clear next step when you are ready."
                : "No Actions in this view."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
