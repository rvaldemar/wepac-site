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
  const [inviteRole, setInviteRole] = useState<UserRole>("artist");
  const [inviteName, setInviteName] = useState("");

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
            className="rounded bg-wepac-borgonha px-4 py-2 text-sm font-bold text-wepac-white"
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
                setShowInviteForm(false);
                setInviteEmail("");
                setInviteName("");
              }}
              className="mt-4 grid gap-4 sm:grid-cols-3"
            >
              <div>
                <label className="block text-xs text-wepac-text-tertiary">Nome</label>
                <input
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  required
                  className="mt-1 w-full rounded bg-wepac-input px-3 py-2 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-borgonha"
                />
              </div>
              <div>
                <label className="block text-xs text-wepac-text-tertiary">Email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  className="mt-1 w-full rounded bg-wepac-input px-3 py-2 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-borgonha"
                />
              </div>
              <div>
                <label className="block text-xs text-wepac-text-tertiary">Papel</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                  className="mt-1 w-full rounded bg-wepac-input px-3 py-2 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-borgonha"
                >
                  <option value="artist">Artista</option>
                  <option value="mentor">Mentor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="sm:col-span-3">
                <button
                  type="submit"
                  className="rounded bg-wepac-borgonha px-6 py-2 text-sm font-bold text-wepac-white"
                >
                  Enviar Convite
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
                  ? "bg-wepac-borgonha text-wepac-white"
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
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-wepac-borgonha/20 text-sm font-bold text-wepac-borgonha">
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
                  <span className="rounded bg-wepac-borgonha/10 px-2 py-0.5 text-xs text-wepac-borgonha-light">
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
