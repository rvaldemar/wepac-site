"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateLeadStatus, deleteLead } from "@/lib/actions/lead";

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
 updatedAt: string;
}

interface ChatMessage {
 role: "user" | "assistant";
 content: string;
}

const STATUS_LABELS: Record<string, string> = {
 new: "Novo",
 contacted: "Contactado",
 converted: "Convertido",
 lost: "Perdido",
};

const STATUS_COLORS: Record<string, string> = {
 new: "bg-blue-500/20 text-blue-400",
 contacted: "bg-yellow-500/20 text-yellow-400",
 converted: "bg-green-500/20 text-green-400",
 lost: "bg-red-500/20 text-red-400",
};

export function AdminLeadsPageClient({ leads }: { leads: Lead[] }) {
 const router = useRouter();
 const [filter, setFilter] = useState<string>("all");
 const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

 const filtered =
  filter === "all" ? leads : leads.filter((l) => l.status === filter);

 const stats = {
  total: leads.length,
  new: leads.filter((l) => l.status === "new").length,
  contacted: leads.filter((l) => l.status === "contacted").length,
  converted: leads.filter((l) => l.status === "converted").length,
  lost: leads.filter((l) => l.status === "lost").length,
 };

 async function handleStatusChange(id: string, status: string) {
  await updateLeadStatus(
   id,
   status as "new" | "contacted" | "converted" | "lost"
  );
  router.refresh();
 }

 async function handleDelete(id: string) {
  if (!confirm("Eliminar esta lead permanentemente? (RGPD)")) return;
  await deleteLead(id);
  router.refresh();
 }

 const conversation = selectedLead?.conversationHistory as
  | ChatMessage[]
  | null;

 return (
  <div className="min-h-screen bg-wepac-dark p-6">
   <div className="mx-auto max-w-7xl">
    <h1 className="font-barlow text-3xl font-bold text-wepac-white">
     Leads Wessex
    </h1>
    <p className="mt-1 text-sm text-wepac-white/50">
     Gestão de leads do assistente comercial
    </p>

    {/* Stats */}
    <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-5">
     {[
      { label: "Total", value: stats.total, color: "text-wepac-white" },
      { label: "Novos", value: stats.new, color: "text-blue-400" },
      {
       label: "Contactados",
       value: stats.contacted,
       color: "text-yellow-400",
      },
      {
       label: "Convertidos",
       value: stats.converted,
       color: "text-green-400",
      },
      { label: "Perdidos", value: stats.lost, color: "text-red-400" },
     ].map((s) => (
      <div key={s.label} className="bg-wepac-card p-4 border border-wepac-border">
       <p className="text-xs text-wepac-white/40 uppercase tracking-wider">
        {s.label}
       </p>
       <p className={`mt-1 font-barlow text-2xl font-bold ${s.color}`}>
        {s.value}
       </p>
      </div>
     ))}
    </div>

    {/* Filters */}
    <div className="mt-6 flex gap-2 flex-wrap">
     {["all", "new", "contacted", "converted", "lost"].map((f) => (
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
     {/* Lead list */}
     <div className="space-y-3">
      {filtered.length === 0 && (
       <p className="text-sm text-wepac-white/40 py-8 text-center">
        Nenhuma lead encontrada.
       </p>
      )}
      {filtered.map((lead) => (
       <button
        key={lead.id}
        onClick={() => setSelectedLead(lead)}
        className={`w-full text-left bg-wepac-card border p-4 transition-colors ${
         selectedLead?.id === lead.id
          ? "border-wepac-white"
          : "border-wepac-border hover:border-wepac-white/30"
        }`}
       >
        <div className="flex items-start justify-between gap-3">
         <div>
          <p className="font-barlow font-bold text-wepac-white">
           {lead.name}
          </p>
          <p className="text-xs text-wepac-white/50 mt-0.5">
           {[lead.email, lead.phone].filter(Boolean).join(" | ")}
          </p>
         </div>
         <span
          className={`px-2 py-0.5 text-xs font-bold uppercase ${STATUS_COLORS[lead.status]}`}
         >
          {STATUS_LABELS[lead.status]}
         </span>
        </div>
        {lead.eventType && (
         <p className="mt-2 text-xs text-wepac-white/40">
          {lead.eventType}
          {lead.eventDate ? ` — ${lead.eventDate}` : ""}
          {lead.location ? ` — ${lead.location}` : ""}
         </p>
        )}
        <p className="mt-1 text-xs text-wepac-white/30">
         {new Date(lead.createdAt).toLocaleDateString("pt-PT", {
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

     {/* Lead detail */}
     {selectedLead && (
      <div className="bg-wepac-card border border-wepac-border p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto">
       <div className="flex items-start justify-between">
        <h2 className="font-barlow text-xl font-bold text-wepac-white">
         {selectedLead.name}
        </h2>
        <button
         onClick={() => setSelectedLead(null)}
         className="text-wepac-white/40 hover:text-wepac-white text-lg"
        >
         &times;
        </button>
       </div>

       {/* Details grid */}
       <div className="mt-4 space-y-2 text-sm">
        {[
         ["Email", selectedLead.email],
         ["Telefone", selectedLead.phone],
         ["Evento", selectedLead.eventType],
         ["Data", selectedLead.eventDate],
         ["Local", selectedLead.location],
         ["Convidados", selectedLead.guestCount?.toString()],
         ["Preferências", selectedLead.musicalPreferences],
         ["Ensemble", selectedLead.ensemble],
         ["Orçamento", selectedLead.estimatedBudget],
         ["Notas", selectedLead.notes],
         ["Consentimento", selectedLead.consentGiven ? "Sim" : "Não"],
        ]
         .filter(([, v]) => v)
         .map(([label, value]) => (
          <div key={label} className="flex gap-3">
           <span className="text-wepac-white/40 w-24 flex-shrink-0">
            {label}
           </span>
           <span className="text-wepac-white">{value}</span>
          </div>
         ))}
       </div>

       {/* Status update */}
       <div className="mt-6">
        <label className="text-xs text-wepac-white/40 uppercase tracking-wider">
         Alterar estado
        </label>
        <select
         value={selectedLead.status}
         onChange={(e) =>
          handleStatusChange(selectedLead.id, e.target.value)
         }
         className="mt-1 w-full border border-wepac-border bg-wepac-dark py-2 px-3 text-sm text-wepac-white"
        >
         <option value="new">Novo</option>
         <option value="contacted">Contactado</option>
         <option value="converted">Convertido</option>
         <option value="lost">Perdido</option>
        </select>
       </div>

       {/* Conversation history */}
       {conversation && conversation.length > 0 && (
        <div className="mt-6">
         <p className="text-xs text-wepac-white/40 uppercase tracking-wider mb-3">
          Histórico da conversa
         </p>
         <div className="space-y-2 max-h-80 overflow-y-auto">
          {conversation.map((msg, i) => (
           <div
            key={i}
            className={`text-xs p-2 ${
             msg.role === "user"
              ? "bg-wepac-dark text-wepac-white ml-8"
              : "border border-wepac-border text-wepac-white/70 mr-8"
            }`}
           >
            <span className="font-bold text-wepac-white/40 text-[10px] uppercase">
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
        onClick={() => handleDelete(selectedLead.id)}
        className="mt-6 text-xs text-red-400/60 hover:text-red-400 transition-colors"
       >
        Eliminar lead (RGPD)
       </button>
      </div>
     )}
    </div>
   </div>
  </div>
 );
}
