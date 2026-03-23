"use client";

import { useState } from "react";
import { mockUsers } from "@/data/artist-mock";
import type { UserRole, ArtistLevel, ArtistPhase } from "@/lib/types/artist";

const ROLE_LABELS: Record<UserRole, string> = {
  artist: "Artista",
  mentor: "Mentor",
  admin: "Admin",
};

const LEVEL_LABELS: Record<ArtistLevel, string> = {
  seed: "Semente",
  growth: "Crescimento",
  signature: "Assinatura",
  partner: "Parceiro",
};

const PHASE_LABELS: Record<ArtistPhase, string> = {
  diagnosis: "Diagnóstico",
  structuring: "Estruturação",
  development: "Desenvolvimento",
  activation: "Ativação",
  evaluation: "Avaliação",
};

export default function AdminUsersPage() {
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("artist");
  const [inviteName, setInviteName] = useState("");
  const [inviteSent, setInviteSent] = useState(false);

  const filtered =
    roleFilter === "all" ? mockUsers : mockUsers.filter((u) => u.role === roleFilter);

  const counts = {
    total: mockUsers.length,
    artists: mockUsers.filter((u) => u.role === "artist").length,
    mentors: mockUsers.filter((u) => u.role === "mentor").length,
    admins: mockUsers.filter((u) => u.role === "admin").length,
    notOnboarded: mockUsers.filter((u) => !u.onboarded).length,
  };

  return (
    <div className="min-h-screen bg-wepac-dark px-6 py-10 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-barlow text-3xl font-bold text-wepac-white">
              Gestão de Utilizadores
            </h1>
            <p className="mt-1 text-sm text-wepac-text-tertiary">
              {counts.total} utilizadores — {counts.artists} artistas, {counts.mentors} mentores, {counts.admins} admins
            </p>
          </div>
          <button
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="rounded bg-wepac-white px-4 py-2 text-sm font-bold text-wepac-black"
          >
            {showInviteForm ? "Cancelar" : "+ Convidar"}
          </button>
        </div>

        {/* Invite form */}
        {showInviteForm && (
          <div className="mt-6 rounded-lg border border-wepac-border bg-wepac-card p-6">
            <h2 className="font-barlow text-lg font-bold text-wepac-white">
              Convidar Utilizador
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setInviteSent(true);
                setTimeout(() => {
                  setShowInviteForm(false);
                  setInviteEmail("");
                  setInviteName("");
                  setInvitePhone("");
                  setInviteSent(false);
                }, 2000);
              }}
              className="mt-4 grid gap-4 sm:grid-cols-4"
            >
              <div>
                <label className="block text-xs text-wepac-text-tertiary">Nome</label>
                <input
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  required
                  className="mt-1 w-full rounded bg-wepac-input px-3 py-2 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-white/50"
                />
              </div>
              <div>
                <label className="block text-xs text-wepac-text-tertiary">Email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  className="mt-1 w-full rounded bg-wepac-input px-3 py-2 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-white/50"
                />
              </div>
              <div>
                <label className="block text-xs text-wepac-text-tertiary">Telefone</label>
                <input
                  type="tel"
                  value={invitePhone}
                  onChange={(e) => setInvitePhone(e.target.value)}
                  placeholder="+351 912 345 678"
                  className="mt-1 w-full rounded bg-wepac-input px-3 py-2 text-sm text-wepac-white placeholder-wepac-text-tertiary outline-none focus:ring-1 focus:ring-wepac-white/50"
                />
              </div>
              <div>
                <label className="block text-xs text-wepac-text-tertiary">Papel</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                  className="mt-1 w-full rounded bg-wepac-input px-3 py-2 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-white/50"
                >
                  <option value="artist">Artista</option>
                  <option value="mentor">Mentor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="sm:col-span-4">
                <button
                  type="submit"
                  disabled={inviteSent}
                  className="rounded bg-wepac-white px-6 py-2 text-sm font-bold text-wepac-black disabled:opacity-50"
                >
                  {inviteSent ? "Convite enviado por email!" : "Enviar Convite"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          {[
            { label: "Total", value: counts.total },
            { label: "Artistas", value: counts.artists },
            { label: "Mentores", value: counts.mentors },
            { label: "Pendentes", value: counts.notOnboarded },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-wepac-border bg-wepac-card p-4">
              <p className="text-xs text-wepac-text-tertiary">{s.label}</p>
              <p className="mt-1 font-barlow text-2xl font-bold text-wepac-white">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="mt-8 flex gap-2">
          {(["all", "artist", "mentor", "admin"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                roleFilter === r
                  ? "bg-wepac-white text-wepac-black"
                  : "bg-wepac-card text-wepac-text-tertiary hover:text-wepac-white"
              }`}
            >
              {r === "all" ? "Todos" : ROLE_LABELS[r]}
            </button>
          ))}
        </div>

        {/* User list */}
        <div className="mt-6 space-y-3">
          {filtered.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between rounded-lg border border-wepac-border bg-wepac-card p-4"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-wepac-white/10 text-sm font-bold text-wepac-white">
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-medium text-wepac-white">{user.name}</p>
                  <p className="text-xs text-wepac-text-tertiary">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {!user.onboarded && user.phone && (
                  <a
                    href={`https://wa.me/${user.phone.replace(/[\s\-()+"]/g, "")}?text=${encodeURIComponent(
                      `Olá ${user.name.split(" ")[0]}, foste convidado/a para o programa Artista Alpha da WEPAC. Cria a tua conta aqui: ${typeof window !== "undefined" ? window.location.origin : ""}/artists/alpha/invite/${user.inviteToken ?? "demo"}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Enviar convite por WhatsApp"
                    className="flex h-7 w-7 items-center justify-center rounded bg-green-600/20 text-base transition-colors hover:bg-green-600/40"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-green-400">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </a>
                )}
                {!user.onboarded && (
                  <span className="rounded bg-wepac-warning-bg px-2 py-0.5 text-xs font-medium text-wepac-warning">
                    Pendente
                  </span>
                )}
                <span className="rounded bg-wepac-input px-2 py-0.5 text-xs text-wepac-text-tertiary">
                  {ROLE_LABELS[user.role]}
                </span>
                {user.role === "artist" && user.level && (
                  <span className="rounded bg-wepac-input px-2 py-0.5 text-xs text-wepac-text-tertiary">
                    {LEVEL_LABELS[user.level]}
                  </span>
                )}
                {user.role === "artist" && user.currentPhase && (
                  <span className="rounded bg-wepac-white/10 px-2 py-0.5 text-xs text-wepac-accent-muted">
                    {PHASE_LABELS[user.currentPhase]}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
