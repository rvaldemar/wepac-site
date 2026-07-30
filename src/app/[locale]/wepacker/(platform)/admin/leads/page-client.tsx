"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { wp } from "@/i18n/copy/wepacker";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
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

function originLabel(item: InboxItem, locale: string): string {
  if (item.kind === "application") {
    return item.data.artisticArea
      ? `${wp(locale, "Candidatura", "Application")} · ${item.data.artisticArea}`
      : `${wp(locale, "Candidatura", "Application")} · WEPACKER`;
  }
  switch (item.data.source) {
    case "chat":
      return "Chat Wessex";
    case "form":
      return wp(locale, "Formulário Wessex", "Wessex form");
    case "contact":
      return wp(locale, "Contacto", "Contact");
    default:
      return item.data.source;
  }
}

const STAGE_COLORS: Record<Stage, string> = {
  new: "bg-blue-500/20 text-blue-400",
  contacted: "bg-yellow-500/20 text-yellow-400",
  won: "bg-green-500/20 text-green-400",
  lost: "bg-red-500/20 text-red-400",
};

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
  const locale = useLocale();
  const router = useRouter();
  const [originFilter, setOriginFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [selected, setSelected] = useState<InboxItem | null>(null);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const stageLabels: Record<Stage, string> = {
    new: wp(locale, "Novas", "New"),
    contacted: wp(locale, "Em contacto", "Contacted"),
    won: wp(locale, "Ganhas", "Won"),
    lost: wp(locale, "Perdidas", "Lost"),
  };
  const leadStatusLabels: Record<Lead["status"], string> = {
    new: wp(locale, "Novo", "New"),
    contacted: wp(locale, "Contactado", "Contacted"),
    converted: wp(locale, "Convertido", "Converted"),
    lost: wp(locale, "Perdido", "Lost"),
  };
  const appStatusLabels: Record<Application["status"], string> = {
    pending: wp(locale, "Pendente", "Pending"),
    contacted: wp(locale, "Contactado", "Contacted"),
    invited: wp(locale, "Convidado", "Invited"),
    joined: wp(locale, "Ingressou", "Joined"),
    rejected: wp(locale, "Rejeitado", "Rejected"),
  };
  const originFilters = [
    { key: "all", label: wp(locale, "Todas as origens", "All sources") },
    { key: "wessex", label: "Wessex" },
    { key: "contact", label: wp(locale, "Contacto", "Contact") },
    {
      key: "application",
      label: wp(locale, "Candidaturas", "Applications"),
    },
  ] as const;

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
    if (
      !confirm(
        wp(
          locale,
          "Eliminar este registo permanentemente? (RGPD)",
          "Permanently delete this record? (GDPR)",
        ),
      )
    )
      return;
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
          {wp(
            locale,
            "Inbox central — chat e formulário Wessex, contacto do site e candidaturas WEPACKER",
            "Central inbox — Wessex chat and form, website contact, and WEPACKER applications",
          )}
        </p>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-5">
          {[
            { label: "Total", value: stats.total, color: "text-wepac-white" },
            {
              label: wp(locale, "Novas", "New"),
              value: stats.new,
              color: "text-blue-400",
            },
            {
              label: wp(locale, "Em contacto", "Contacted"),
              value: stats.contacted,
              color: "text-yellow-400",
            },
            {
              label: wp(locale, "Ganhas", "Won"),
              value: stats.won,
              color: "text-green-400",
            },
            {
              label: wp(locale, "Perdidas", "Lost"),
              value: stats.lost,
              color: "text-red-400",
            },
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
          {originFilters.map((f) => (
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
              {f === "all"
                ? wp(locale, "Todos os estados", "All statuses")
                : stageLabels[f]}
            </button>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Inbox list */}
          <div className="space-y-3">
            {filtered.length === 0 && (
              <p className="py-8 text-center text-sm text-wepac-white/40">
                {wp(locale, "Nenhuma lead encontrada.", "No leads found.")}
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
                      {originLabel(item, locale)}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-xs font-bold uppercase ${STAGE_COLORS[stageOf(item)]}`}
                    >
                      {item.kind === "lead"
                        ? leadStatusLabels[item.data.status]
                        : appStatusLabels[item.data.status]}
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
                  {new Date(item.data.createdAt).toLocaleDateString(locale, {
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
                    {originLabel(selected, locale)}
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
                      [wp(locale, "Telefone", "Phone"), selectedLead.phone],
                      [wp(locale, "Evento", "Event"), selectedLead.eventType],
                      [wp(locale, "Data", "Date"), selectedLead.eventDate],
                      [wp(locale, "Local", "Location"), selectedLead.location],
                      [
                        wp(locale, "Convidados", "Guests"),
                        selectedLead.guestCount?.toString(),
                      ],
                      [
                        wp(locale, "Preferências", "Preferences"),
                        selectedLead.musicalPreferences,
                      ],
                      ["Ensemble", selectedLead.ensemble],
                      [
                        wp(locale, "Orçamento", "Budget"),
                        selectedLead.estimatedBudget,
                      ],
                      [wp(locale, "Mensagem", "Message"), selectedLead.notes],
                      [
                        wp(locale, "Consentimento", "Consent"),
                        selectedLead.consentGiven
                          ? wp(locale, "Sim", "Yes")
                          : wp(locale, "Não", "No"),
                      ],
                    ] as [string, string | null | undefined][])
                  : ([
                      ["Email", selectedApp!.email],
                      [wp(locale, "Telefone", "Phone"), selectedApp!.phone],
                      [wp(locale, "Área", "Field"), selectedApp!.artisticArea],
                      [
                        wp(locale, "Redes sociais", "Social media"),
                        selectedApp!.socialLinks,
                      ],
                      [
                        wp(locale, "Motivação", "Motivation"),
                        selectedApp!.motivation,
                      ],
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
                  {wp(locale, "Alterar estado", "Change status")}
                </label>
                <select
                  value={selected.data.status}
                  onChange={(e) => handleStatusChange(selected, e.target.value)}
                  className="mt-1 w-full border border-wepac-border bg-wepac-dark px-3 py-2 text-sm text-wepac-white"
                >
                  {selected.kind === "lead"
                    ? Object.entries(leadStatusLabels).map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))
                    : Object.entries(appStatusLabels).map(([v, l]) => (
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
                  {wp(
                    locale,
                    "Convidar para a plataforma →",
                    "Invite to the platform →",
                  )}
                </Link>
              )}

              {/* Internal notes (applications) */}
              {selectedApp && (
                <div className="mt-6">
                  <label className="text-xs uppercase tracking-wider text-wepac-white/40">
                    {wp(locale, "Notas internas", "Internal notes")}
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
                    {savingNotes
                      ? wp(locale, "A guardar...", "Saving...")
                      : wp(locale, "Guardar notas", "Save notes")}
                  </button>
                </div>
              )}

              {/* Conversation history (chat leads) */}
              {conversation && conversation.length > 0 && (
                <div className="mt-6">
                  <p className="mb-3 text-xs uppercase tracking-wider text-wepac-white/40">
                    {wp(
                      locale,
                      "Histórico da conversa",
                      "Conversation history",
                    )}
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
                          {msg.role === "user"
                            ? wp(locale, "Cliente", "Client")
                            : "Wessex"}
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
                {wp(
                  locale,
                  "Eliminar registo (RGPD)",
                  "Delete record (GDPR)",
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
