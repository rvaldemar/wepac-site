"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateLeadStatus, deleteLead } from "@/lib/wepacker/actions/lead";
import {
  updateApplicationStatus,
  updateApplicationNotes,
  deleteApplication,
} from "@/lib/wepacker/actions/application";

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  eventType: string | null;
  eventDate: string | null;
  location: string | null;
  guestCount: number | null;
  musicalPreferences: string | null;
  ensemble: string | null;
  estimatedBudget: string | null;
  notes: string | null;
  status: "new" | "contacted" | "converted" | "lost";
  conversationHistory: unknown;
  source: string;
  consentGiven: boolean;
  createdAt: string;
}

interface Application {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  artisticArea: string | null;
  socialLinks: string | null;
  motivation: string | null;
  status: "pending" | "contacted" | "invited" | "joined" | "rejected";
  notes: string | null;
  packSlug: string;
  createdAt: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// Unified inbox item wrapping either pipeline.
type InboxItem =
  | { kind: "lead"; data: Lead }
  | { kind: "application"; data: Application };

// Unified funnel stage so mixed-pipeline stats/filters make sense.
type Stage = "new" | "contacted" | "won" | "lost";

function stageOf(item: InboxItem): Stage {
  const s = item.data.status;
  if (s === "new" || s === "pending") return "new";
  if (s === "contacted") return "contacted";
  if (s === "converted" || s === "invited" || s === "joined") return "won";
  return "lost";
}

function originLabel(item: InboxItem): string {
  if (item.kind === "application") {
    return item.data.packSlug === "wepacker"
      ? "Candidatura · WEPACKER (geral)"
      : `Candidatura · ${item.data.packSlug}`;
  }
  switch (item.data.source) {
    case "chat":
      return "Chat Wessex";
    case "form":
      return "Formulário Wessex";
    case "contact":
      return "Contacto";
    default:
      return item.data.source;
  }
}

const STAGE_LABELS: Record<Stage, string> = {
  new: "Novas",
  contacted: "Em contacto",
  won: "Ganhas",
  lost: "Perdidas",
};

const STAGE_COLORS: Record<Stage, string> = {
  new: "bg-blue-500/20 text-blue-400",
  contacted: "bg-yellow-500/20 text-yellow-400",
  won: "bg-green-500/20 text-green-400",
  lost: "bg-red-500/20 text-red-400",
};

const LEAD_STATUS_LABELS: Record<Lead["status"], string> = {
  new: "Novo",
  contacted: "Contactado",
  converted: "Convertido",
  lost: "Perdido",
};

const APP_STATUS_LABELS: Record<Application["status"], string> = {
  pending: "Pendente",
  contacted: "Contactado",
  invited: "Convidado",
  joined: "Ingressou",
  rejected: "Rejeitado",
};

const ORIGIN_FILTERS = [
  { key: "all", label: "Todas as origens" },
  { key: "wessex", label: "Wessex" },
  { key: "contact", label: "Contacto" },
  { key: "application", label: "Candidaturas" },
] as const;

function matchesOrigin(item: InboxItem, origin: string): boolean {
  if (origin === "all") return true;
  if (origin === "application") return item.kind === "application";
  if (origin === "contact")
    return item.kind === "lead" && item.data.source === "contact";
  // wessex: chat + event form
  return item.kind === "lead" && item.data.source !== "contact";
}

export function AdminLeadsPageClient({
  leads,
  applications,
}: {
  leads: Lead[];
  applications: Application[];
}) {
  const router = useRouter();
  const [originFilter, setOriginFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [selected, setSelected] = useState<InboxItem | null>(null);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const items: InboxItem[] = [
    ...leads.map((l) => ({ kind: "lead" as const, data: l })),
    ...applications.map((a) => ({ kind: "application" as const, data: a })),
  ].sort(
    (a, b) =>
      new Date(b.data.createdAt).getTime() - new Date(a.data.createdAt).getTime()
  );

  const filtered = items.filter(
    (i) =>
      matchesOrigin(i, originFilter) &&
      (stageFilter === "all" || stageOf(i) === stageFilter)
  );

  const stats = {
    total: items.length,
    new: items.filter((i) => stageOf(i) === "new").length,
    contacted: items.filter((i) => stageOf(i) === "contacted").length,
    won: items.filter((i) => stageOf(i) === "won").length,
    lost: items.filter((i) => stageOf(i) === "lost").length,
  };

  function handleSelect(item: InboxItem) {
    setSelected(item);
    setNotes(item.kind === "application" ? item.data.notes || "" : "");
  }

  async function handleStatusChange(item: InboxItem, status: string) {
    if (item.kind === "lead") {
      await updateLeadStatus(item.data.id, status as Lead["status"]);
    } else {
      await updateApplicationStatus(
        item.data.id,
        status as Application["status"]
      );
    }
    router.refresh();
  }

  async function handleSaveNotes() {
    if (!selected || selected.kind !== "application") return;
    setSavingNotes(true);
    await updateApplicationNotes(selected.data.id, notes);
    setSavingNotes(false);
    router.refresh();
  }

  async function handleDelete(item: InboxItem) {
    if (!confirm("Eliminar este registo permanentemente? (RGPD)")) return;
    if (item.kind === "lead") await deleteLead(item.data.id);
    else await deleteApplication(item.data.id);
    setSelected(null);
    router.refresh();
  }

  const selectedLead = selected?.kind === "lead" ? selected.data : null;
  const selectedApp = selected?.kind === "application" ? selected.data : null;
  const conversation = selectedLead?.conversationHistory as
    | ChatMessage[]
    | null;

  return (
    <div className="min-h-screen bg-wepac-dark p-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="font-barlow text-3xl font-bold text-wepac-white">
          Leads
        </h1>
        <p className="mt-1 text-sm text-wepac-white/50">
          Inbox central — chat e formulário Wessex, contacto do site e
          candidaturas WEPACKER
        </p>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-5">
          {[
            { label: "Total", value: stats.total, color: "text-wepac-white" },
            { label: "Novas", value: stats.new, color: "text-blue-400" },
            {
              label: "Em contacto",
              value: stats.contacted,
              color: "text-yellow-400",
            },
            { label: "Ganhas", value: stats.won, color: "text-green-400" },
            { label: "Perdidas", value: stats.lost, color: "text-red-400" },
          ].map((s) => (
            <div
              key={s.label}
              className="border border-wepac-border bg-wepac-card p-4"
            >
              <p className="text-xs uppercase tracking-wider text-wepac-white/40">
                {s.label}
              </p>
              <p className={`mt-1 font-barlow text-2xl font-bold ${s.color}`}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          {ORIGIN_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setOriginFilter(f.key)}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                originFilter === f.key
                  ? "bg-wepac-white text-wepac-black"
                  : "border border-wepac-white/20 text-wepac-white/50 hover:text-wepac-white"
              }`}
            >
              {f.label}
            </button>
          ))}
          <span className="mx-2 h-4 w-px bg-wepac-border" />
          {(["all", "new", "contacted", "won", "lost"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStageFilter(f)}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                stageFilter === f
                  ? "bg-wepac-white text-wepac-black"
                  : "border border-wepac-white/20 text-wepac-white/50 hover:text-wepac-white"
              }`}
            >
              {f === "all" ? "Todos os estados" : STAGE_LABELS[f]}
            </button>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Inbox list */}
          <div className="space-y-3">
            {filtered.length === 0 && (
              <p className="py-8 text-center text-sm text-wepac-white/40">
                Nenhuma lead encontrada.
              </p>
            )}
            {filtered.map((item) => (
              <button
                key={`${item.kind}-${item.data.id}`}
                onClick={() => handleSelect(item)}
                className={`w-full border bg-wepac-card p-4 text-left transition-colors ${
                  selected?.data.id === item.data.id &&
                  selected?.kind === item.kind
                    ? "border-wepac-white"
                    : "border-wepac-border hover:border-wepac-white/30"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-barlow font-bold text-wepac-white">
                      {item.data.name}
                    </p>
                    <p className="mt-0.5 text-xs text-wepac-white/50">
                      {[item.data.email, item.data.phone]
                        .filter(Boolean)
                        .join(" | ")}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="bg-wepac-input px-2 py-0.5 text-[10px] uppercase text-wepac-text-tertiary">
                      {originLabel(item)}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-xs font-bold uppercase ${STAGE_COLORS[stageOf(item)]}`}
                    >
                      {item.kind === "lead"
                        ? LEAD_STATUS_LABELS[item.data.status]
                        : APP_STATUS_LABELS[item.data.status]}
                    </span>
                  </div>
                </div>
                {item.kind === "lead" && item.data.eventType && (
                  <p className="mt-2 text-xs text-wepac-white/40">
                    {item.data.eventType}
                    {item.data.eventDate ? ` — ${item.data.eventDate}` : ""}
                    {item.data.location ? ` — ${item.data.location}` : ""}
                  </p>
                )}
                {item.kind === "application" && item.data.artisticArea && (
                  <p className="mt-2 text-xs text-wepac-white/40">
                    {item.data.artisticArea}
                  </p>
                )}
                <p className="mt-1 text-xs text-wepac-white/30">
                  {new Date(item.data.createdAt).toLocaleDateString("pt-PT", {
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
                <div>
                  <h2 className="font-barlow text-xl font-bold text-wepac-white">
                    {selected.data.name}
                  </h2>
                  <p className="mt-0.5 text-xs uppercase tracking-wider text-wepac-white/40">
                    {originLabel(selected)}
                  </p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="text-lg text-wepac-white/40 hover:text-wepac-white"
                >
                  &times;
                </button>
              </div>

              {/* Details grid */}
              <div className="mt-4 space-y-2 text-sm">
                {(selectedLead
                  ? ([
                      ["Email", selectedLead.email],
                      ["Telefone", selectedLead.phone],
                      ["Evento", selectedLead.eventType],
                      ["Data", selectedLead.eventDate],
                      ["Local", selectedLead.location],
                      ["Convidados", selectedLead.guestCount?.toString()],
                      ["Preferências", selectedLead.musicalPreferences],
                      ["Ensemble", selectedLead.ensemble],
                      ["Orçamento", selectedLead.estimatedBudget],
                      ["Mensagem", selectedLead.notes],
                      [
                        "Consentimento",
                        selectedLead.consentGiven ? "Sim" : "Não",
                      ],
                    ] as [string, string | null | undefined][])
                  : ([
                      ["Email", selectedApp!.email],
                      ["Telefone", selectedApp!.phone],
                      ["Pack", selectedApp!.packSlug],
                      ["Área", selectedApp!.artisticArea],
                      ["Redes sociais", selectedApp!.socialLinks],
                      ["Motivação", selectedApp!.motivation],
                    ] as [string, string | null | undefined][])
                )
                  .filter(([, v]) => v)
                  .map(([label, value]) => (
                    <div key={label} className="flex gap-3">
                      <span className="w-28 flex-shrink-0 text-wepac-white/40">
                        {label}
                      </span>
                      <span className="whitespace-pre-wrap text-wepac-white">
                        {value}
                      </span>
                    </div>
                  ))}
              </div>

              {/* Status update — per-pipeline statuses */}
              <div className="mt-6">
                <label className="text-xs uppercase tracking-wider text-wepac-white/40">
                  Alterar estado
                </label>
                <select
                  value={selected.data.status}
                  onChange={(e) => handleStatusChange(selected, e.target.value)}
                  className="mt-1 w-full border border-wepac-border bg-wepac-dark px-3 py-2 text-sm text-wepac-white"
                >
                  {selected.kind === "lead"
                    ? Object.entries(LEAD_STATUS_LABELS).map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))
                    : Object.entries(APP_STATUS_LABELS).map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                </select>
              </div>

              {/* Invite CTA for applications — hidden once the person has
                  actually joined (they already have an account). Creating
                  the invite auto-advances this application to "invited"
                  (and to "joined" once they accept it) via applicationId. */}
              {selectedApp && selectedApp.status !== "joined" && (
                <Link
                  href={`/wepacker/admin/users?name=${encodeURIComponent(
                    selectedApp.name
                  )}&email=${encodeURIComponent(selectedApp.email)}${
                    selectedApp.phone
                      ? `&phone=${encodeURIComponent(selectedApp.phone)}`
                      : ""
                  }&applicationId=${encodeURIComponent(selectedApp.id)}`}
                  className="mt-4 block w-full bg-wepac-white px-4 py-2 text-center text-sm font-bold uppercase tracking-wider text-wepac-black transition-colors hover:bg-wepac-white/90"
                >
                  Convidar para a plataforma →
                </Link>
              )}

              {/* Internal notes (applications) */}
              {selectedApp && (
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
              )}

              {/* Conversation history (chat leads) */}
              {conversation && conversation.length > 0 && (
                <div className="mt-6">
                  <p className="mb-3 text-xs uppercase tracking-wider text-wepac-white/40">
                    Histórico da conversa
                  </p>
                  <div className="max-h-80 space-y-2 overflow-y-auto">
                    {conversation.map((msg, i) => (
                      <div
                        key={i}
                        className={`p-2 text-xs ${
                          msg.role === "user"
                            ? "ml-8 bg-wepac-dark text-wepac-white"
                            : "mr-8 border border-wepac-border text-wepac-white/70"
                        }`}
                      >
                        <span className="text-[10px] font-bold uppercase text-wepac-white/40">
                          {msg.role === "user" ? "Cliente" : "Wessex"}
                        </span>
                        <p className="mt-0.5">{msg.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* RGPD delete */}
              <button
                onClick={() => handleDelete(selected)}
                className="mt-6 text-xs text-red-400/60 transition-colors hover:text-red-400"
              >
                Eliminar registo (RGPD)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
