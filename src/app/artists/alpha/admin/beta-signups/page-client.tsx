"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
 updateBetaSignupStatus,
 updateBetaSignupNotes,
 deleteBetaSignup,
} from "@/lib/actions/beta-signup";
import { createInvite } from "@/lib/actions/invite";

interface BetaSignup {
 id: string;
 name: string;
 email: string;
 phone: string | null;
 artisticArea: string | null;
 socialLinks: string | null;
 motivation: string | null;
 status: "pending" | "contacted" | "invited" | "rejected";
 notes: string | null;
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

export function BetaSignupsPageClient({
 signups,
}: {
 signups: BetaSignup[];
}) {
 const router = useRouter();
 const [filter, setFilter] = useState<string>("all");
 const [selected, setSelected] = useState<BetaSignup | null>(null);
 const [notes, setNotes] = useState("");
 const [savingNotes, setSavingNotes] = useState(false);
 const [inviting, setInviting] = useState(false);

 const filtered =
  filter === "all" ? signups : signups.filter((s) => s.status === filter);

 const stats = {
  total: signups.length,
  pending: signups.filter((s) => s.status === "pending").length,
  contacted: signups.filter((s) => s.status === "contacted").length,
  invited: signups.filter((s) => s.status === "invited").length,
  rejected: signups.filter((s) => s.status === "rejected").length,
 };

 function handleSelect(signup: BetaSignup) {
  setSelected(signup);
  setNotes(signup.notes || "");
 }

 async function handleStatusChange(id: string, status: string) {
  await updateBetaSignupStatus(
   id,
   status as "pending" | "contacted" | "invited" | "rejected"
  );
  router.refresh();
 }

 async function handleSaveNotes() {
  if (!selected) return;
  setSavingNotes(true);
  await updateBetaSignupNotes(selected.id, notes);
  setSavingNotes(false);
  router.refresh();
 }

 async function handleInvite(signup: BetaSignup) {
  if (!confirm(`Convidar ${signup.name} (${signup.email}) para a plataforma?`))
   return;
  setInviting(true);
  try {
   await createInvite({ name: signup.name, email: signup.email, role: "artist" });
   await updateBetaSignupStatus(signup.id, "invited");
   router.refresh();
  } catch (err) {
   alert("Erro ao criar convite. Verifica se o email já existe na plataforma.");
   console.error(err);
  } finally {
   setInviting(false);
  }
 }

 async function handleDelete(id: string) {
  if (!confirm("Eliminar esta candidatura permanentemente? (RGPD)")) return;
  await deleteBetaSignup(id);
  setSelected(null);
  router.refresh();
 }

 return (
  <div className="min-h-screen bg-wepac-dark p-6">
   <div className="mx-auto max-w-7xl">
    <h1 className="font-barlow text-3xl font-bold text-wepac-white">
     Candidaturas Beta
    </h1>
    <p className="mt-1 text-sm text-wepac-white/50">
     Programa Artistas WEPAC — gestão de candidaturas
    </p>

    {/* Stats */}
    <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-5">
     {[
      { label: "Total", value: stats.total, color: "text-wepac-white" },
      { label: "Pendentes", value: stats.pending, color: "text-blue-400" },
      {
       label: "Contactados",
       value: stats.contacted,
       color: "text-yellow-400",
      },
      {
       label: "Convidados",
       value: stats.invited,
       color: "text-green-400",
      },
      {
       label: "Rejeitados",
       value: stats.rejected,
       color: "text-red-400",
      },
     ].map((s) => (
      <div
       key={s.label}
       className="bg-wepac-card p-4 border border-wepac-border"
      >
       <p className="text-xs text-wepac-white/40 uppercase tracking-wider">
        {s.label}
       </p>
       <p
        className={`mt-1 font-barlow text-2xl font-bold ${s.color}`}
       >
        {s.value}
       </p>
      </div>
     ))}
    </div>

    {/* Filters */}
    <div className="mt-6 flex gap-2 flex-wrap">
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
     {/* Signup list */}
     <div className="space-y-3">
      {filtered.length === 0 && (
       <p className="text-sm text-wepac-white/40 py-8 text-center">
        Nenhuma candidatura encontrada.
       </p>
      )}
      {filtered.map((signup) => (
       <button
        key={signup.id}
        onClick={() => handleSelect(signup)}
        className={`w-full text-left bg-wepac-card border p-4 transition-colors ${
         selected?.id === signup.id
          ? "border-wepac-white"
          : "border-wepac-border hover:border-wepac-white/30"
        }`}
       >
        <div className="flex items-start justify-between gap-3">
         <div>
          <p className="font-barlow font-bold text-wepac-white">
           {signup.name}
          </p>
          <p className="text-xs text-wepac-white/50 mt-0.5">
           {[signup.email, signup.phone].filter(Boolean).join(" | ")}
          </p>
         </div>
         <span
          className={`px-2 py-0.5 text-xs font-bold uppercase ${STATUS_COLORS[signup.status]}`}
         >
          {STATUS_LABELS[signup.status]}
         </span>
        </div>
        {signup.artisticArea && (
         <p className="mt-2 text-xs text-wepac-white/40">
          {signup.artisticArea}
         </p>
        )}
        <p className="mt-1 text-xs text-wepac-white/30">
         {new Date(signup.createdAt).toLocaleDateString("pt-PT", {
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

     {/* Signup detail */}
     {selected && (
      <div className="bg-wepac-card border border-wepac-border p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto">
       <div className="flex items-start justify-between">
        <h2 className="font-barlow text-xl font-bold text-wepac-white">
         {selected.name}
        </h2>
        <button
         onClick={() => setSelected(null)}
         className="text-wepac-white/40 hover:text-wepac-white text-lg"
        >
         &times;
        </button>
       </div>

       {/* Details grid */}
       <div className="mt-4 space-y-2 text-sm">
        {[
         ["Email", selected.email],
         ["Telefone", selected.phone],
         ["Área artística", selected.artisticArea],
         ["Redes sociais", selected.socialLinks],
         ["Motivação", selected.motivation],
        ]
         .filter(([, v]) => v)
         .map(([label, value]) => (
          <div key={label} className="flex gap-3">
           <span className="text-wepac-white/40 w-28 flex-shrink-0">
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
         value={selected.status}
         onChange={(e) =>
          handleStatusChange(selected.id, e.target.value)
         }
         className="mt-1 w-full border border-wepac-border bg-wepac-dark py-2 px-3 text-sm text-wepac-white"
        >
         <option value="pending">Pendente</option>
         <option value="contacted">Contactado</option>
         <option value="invited">Convidado</option>
         <option value="rejected">Rejeitado</option>
        </select>
       </div>

       {/* Invite button */}
       {selected.status !== "invited" && (
        <button
         onClick={() => handleInvite(selected)}
         disabled={inviting}
         className="mt-4 w-full bg-wepac-white text-wepac-black py-2 px-4 text-sm font-bold uppercase tracking-wider transition-colors hover:bg-wepac-white/90 disabled:opacity-50"
        >
         {inviting ? "A convidar..." : "Convidar para plataforma"}
        </button>
       )}

       {/* Notes */}
       <div className="mt-6">
        <label className="text-xs text-wepac-white/40 uppercase tracking-wider">
         Notas internas
        </label>
        <textarea
         value={notes}
         onChange={(e) => setNotes(e.target.value)}
         rows={3}
         className="mt-1 w-full border border-wepac-border bg-wepac-dark py-2 px-3 text-sm text-wepac-white resize-none"
        />
        <button
         onClick={handleSaveNotes}
         disabled={savingNotes}
         className="mt-2 border border-wepac-white/20 px-3 py-1.5 text-xs text-wepac-white/60 hover:text-wepac-white transition-colors disabled:opacity-50"
        >
         {savingNotes ? "A guardar..." : "Guardar notas"}
        </button>
       </div>

       {/* RGPD delete */}
       <button
        onClick={() => handleDelete(selected.id)}
        className="mt-6 text-xs text-red-400/60 hover:text-red-400 transition-colors"
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
