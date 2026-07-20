"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  updateApplicationStatus,
  updateApplicationNotes,
  deleteApplication,
} from "@/lib/wepacker/actions/application";

interface Application {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  artisticArea: string | null;
  socialLinks: string | null;
  motivation: string | null;
  status: "pending" | "contacted" | "invited" | "rejected";
  notes: string | null;
  packSlug: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  contacted: "Contactado",
  invited: "Convidado",
  rejected: "Rejeitado",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-blue-500/20 text-blue-400",
  contacted: "bg-yellow-500/20 text-yellow-400",
  invited: "bg-green-500/20 text-green-400",
  rejected: "bg-red-500/20 text-red-400",
};

export function AdminApplicationsPageClient({
  applications,
}: {
  applications: Application[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Application | null>(null);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const filtered =
    filter === "all" ? applications : applications.filter((a) => a.status === filter);

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    contacted: applications.filter((a) => a.status === "contacted").length,
    invited: applications.filter((a) => a.status === "invited").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };

  function handleSelect(app: Application) {
    setSelected(app);
    setNotes(app.notes || "");
  }

  async function handleStatusChange(id: string, status: string) {
    await updateApplicationStatus(
      id,
      status as "pending" | "contacted" | "invited" | "rejected"
    );
    router.refresh();
  }

  async function handleSaveNotes() {
    if (!selected) return;
    setSavingNotes(true);
    await updateApplicationNotes(selected.id, notes);
    setSavingNotes(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Eliminar esta candidatura permanentemente? (RGPD)")) return;
    await deleteApplication(id);
    setSelected(null);
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-wepac-dark p-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="font-barlow text-3xl font-bold text-wepac-white">Candidaturas</h1>
        <p className="mt-1 text-sm text-wepac-white/50">
          WEPACKER — gestão de candidaturas por pack
        </p>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-5">
          {[
            { label: "Total", value: stats.total, color: "text-wepac-white" },
            { label: "Pendentes", value: stats.pending, color: "text-blue-400" },
            { label: "Contactados", value: stats.contacted, color: "text-yellow-400" },
            { label: "Convidados", value: stats.invited, color: "text-green-400" },
            { label: "Rejeitados", value: stats.rejected, color: "text-red-400" },
          ].map((s) => (
            <div key={s.label} className="border border-wepac-border bg-wepac-card p-4">
              <p className="text-xs uppercase tracking-wider text-wepac-white/40">{s.label}</p>
              <p className={`mt-1 font-barlow text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-wrap gap-2">
          {["all", "pending", "contacted", "invited", "rejected"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                filter === f
                  ? "bg-wepac-white text-wepac-black"
                  : "border border-wepac-white/20 text-wepac-white/50 hover:text-wepac-white"
              }`}
            >
              {f === "all" ? "Todos" : STATUS_LABELS[f]}
            </button>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* List */}
          <div className="space-y-3">
            {filtered.length === 0 && (
              <p className="py-8 text-center text-sm text-wepac-white/40">
                Nenhuma candidatura encontrada.
              </p>
            )}
            {filtered.map((app) => (
              <button
                key={app.id}
                onClick={() => handleSelect(app)}
                className={`w-full border bg-wepac-card p-4 text-left transition-colors ${
                  selected?.id === app.id
                    ? "border-wepac-white"
                    : "border-wepac-border hover:border-wepac-white/30"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-barlow font-bold text-wepac-white">{app.name}</p>
                    <p className="mt-0.5 text-xs text-wepac-white/50">
                      {[app.email, app.phone].filter(Boolean).join(" | ")}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="bg-wepac-input px-2 py-0.5 text-[10px] uppercase text-wepac-text-tertiary">
                      {app.packSlug}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-xs font-bold uppercase ${STATUS_COLORS[app.status]}`}
                    >
                      {STATUS_LABELS[app.status]}
                    </span>
                  </div>
                </div>
                {app.artisticArea && (
                  <p className="mt-2 text-xs text-wepac-white/40">{app.artisticArea}</p>
                )}
                <p className="mt-1 text-xs text-wepac-white/30">
                  {new Date(app.createdAt).toLocaleDateString("pt-PT", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </button>
            ))}
          </div>

          {/* Detail */}
          {selected && (
            <div className="border border-wepac-border bg-wepac-card p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto">
              <div className="flex items-start justify-between">
                <h2 className="font-barlow text-xl font-bold text-wepac-white">
                  {selected.name}
                </h2>
                <button
                  onClick={() => setSelected(null)}
                  className="text-lg text-wepac-white/40 hover:text-wepac-white"
                >
                  &times;
                </button>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                {[
                  ["Email", selected.email],
                  ["Telefone", selected.phone],
                  ["Pack", selected.packSlug],
                  ["Área", selected.artisticArea],
                  ["Redes sociais", selected.socialLinks],
                  ["Motivação", selected.motivation],
                ]
                  .filter(([, v]) => v)
                  .map(([label, value]) => (
                    <div key={label} className="flex gap-3">
                      <span className="w-28 flex-shrink-0 text-wepac-white/40">{label}</span>
                      <span className="text-wepac-white">{value}</span>
                    </div>
                  ))}
              </div>

              {/* Status update */}
              <div className="mt-6">
                <label className="text-xs uppercase tracking-wider text-wepac-white/40">
                  Alterar estado
                </label>
                <select
                  value={selected.status}
                  onChange={(e) => handleStatusChange(selected.id, e.target.value)}
                  className="mt-1 w-full border border-wepac-border bg-wepac-dark px-3 py-2 text-sm text-wepac-white"
                >
                  <option value="pending">Pendente</option>
                  <option value="contacted">Contactado</option>
                  <option value="invited">Convidado</option>
                  <option value="rejected">Rejeitado</option>
                </select>
              </div>

              {/* Invite CTA */}
              {selected.status !== "invited" && (
                <Link
                  href={`/wepacker/admin/users?name=${encodeURIComponent(
                    selected.name
                  )}&email=${encodeURIComponent(selected.email)}${
                    selected.phone ? `&phone=${encodeURIComponent(selected.phone)}` : ""
                  }`}
                  className="mt-4 block w-full bg-wepac-white px-4 py-2 text-center text-sm font-bold uppercase tracking-wider text-wepac-black transition-colors hover:bg-wepac-white/90"
                >
                  Convidar para a plataforma →
                </Link>
              )}

              {/* Notes */}
              <div className="mt-6">
                <label className="text-xs uppercase tracking-wider text-wepac-white/40">
                  Notas internas
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="mt-1 w-full resize-none border border-wepac-border bg-wepac-dark px-3 py-2 text-sm text-wepac-white"
                />
                <button
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="mt-2 border border-wepac-white/20 px-3 py-1.5 text-xs text-wepac-white/60 transition-colors hover:text-wepac-white disabled:opacity-50"
                >
                  {savingNotes ? "A guardar..." : "Guardar notas"}
                </button>
              </div>

              {/* RGPD delete */}
              <button
                onClick={() => handleDelete(selected.id)}
                className="mt-6 text-xs text-red-400/60 transition-colors hover:text-red-400"
              >
                Eliminar candidatura (RGPD)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
