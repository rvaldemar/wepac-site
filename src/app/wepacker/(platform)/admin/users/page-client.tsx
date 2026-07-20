"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createInvite } from "@/lib/wepacker/actions/admin";
import { LEVEL_LABELS, PHASE_LABELS } from "@/lib/wepacker/types";
import type {
  MemberLevel,
  MemberPhase,
  MembershipRole,
  UserRole,
} from "@/lib/wepacker/types";

const ROLE_LABELS: Record<UserRole, string> = {
  member: "Membro",
  mentor: "Mentor",
  admin: "Admin",
};

interface PackSummary {
  id: string;
  slug: string;
  name: string;
}

interface CohortSummary {
  id: string;
  name: string;
  pack: PackSummary;
}

interface Membership {
  id: string;
  role: MembershipRole;
  level: MemberLevel;
  currentPhase: MemberPhase;
  cohort: CohortSummary;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  onboarded: boolean;
  phone: string | null;
  inviteToken: string | null;
  createdAt: string;
  memberships: Membership[];
}

interface AdminUsersPageProps {
  users: AdminUser[];
  cohorts: CohortSummary[];
  prefill?: { name: string; email: string; phone: string } | null;
}

function buildWhatsappUrl(name: string, phone: string, inviteUrl: string) {
  return `https://wa.me/${phone.replace(/[\s\-()+"]/g, "")}?text=${encodeURIComponent(
    `Olá ${name.split(" ")[0]}, foste convidado/a para o WEPACKER. Cria a tua conta aqui: ${inviteUrl}`
  )}`;
}

export function AdminUsersPageClient({
  users: allUsers,
  cohorts,
  prefill = null,
}: AdminUsersPageProps) {
  const router = useRouter();
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [showInviteForm, setShowInviteForm] = useState(prefill !== null);
  const [inviteName, setInviteName] = useState(prefill?.name ?? "");
  const [inviteEmail, setInviteEmail] = useState(prefill?.email ?? "");
  const [invitePhone, setInvitePhone] = useState(prefill?.phone ?? "");
  const [inviteRole, setInviteRole] = useState<UserRole>("member");
  const [inviteMemberships, setInviteMemberships] = useState<
    { cohortId: string; role: MembershipRole }[]
  >([]);
  const [submitting, setSubmitting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteResult, setInviteResult] = useState<{
    inviteUrl: string;
    whatsappUrl: string | null;
  } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered =
    roleFilter === "all" ? allUsers : allUsers.filter((u) => u.role === roleFilter);

  const counts = {
    total: allUsers.length,
    members: allUsers.filter((u) => u.role === "member").length,
    mentors: allUsers.filter((u) => u.role === "mentor").length,
    admins: allUsers.filter((u) => u.role === "admin").length,
    notOnboarded: allUsers.filter((u) => !u.onboarded).length,
  };

  function origin() {
    return typeof window !== "undefined" ? window.location.origin : "";
  }

  async function handleCopy(url: string, id: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // clipboard unavailable — silently ignore
    }
  }

  function resetInviteForm() {
    setInviteName("");
    setInviteEmail("");
    setInvitePhone("");
    setInviteRole("member");
    setInviteMemberships([]);
    setInviteResult(null);
    setInviteError("");
  }

  function updateInviteMembership(
    index: number,
    patch: Partial<{ cohortId: string; role: MembershipRole }>
  ) {
    setInviteMemberships((prev) =>
      prev.map((m, i) => (i === index ? { ...m, ...patch } : m))
    );
  }

  async function handleInviteSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setInviteError("");
    try {
      const result = await createInvite({
        name: inviteName,
        email: inviteEmail,
        phone: invitePhone || undefined,
        role: inviteRole,
        memberships: inviteMemberships.filter((m) => m.cohortId),
      });
      setInviteResult({ inviteUrl: result.inviteUrl, whatsappUrl: result.whatsappUrl });
      router.refresh();
    } catch (err: unknown) {
      setInviteError(err instanceof Error ? err.message : "Erro ao criar convite.");
    } finally {
      setSubmitting(false);
    }
  }

  function closeInviteForm() {
    setShowInviteForm(false);
    resetInviteForm();
  }

  return (
    <div className="min-h-screen bg-wepac-dark px-6 py-10 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-barlow text-3xl font-bold text-wepac-white">
              Gestão de Utilizadores
            </h1>
            <p className="mt-1 text-sm text-wepac-text-tertiary">
              {counts.total} utilizadores — {counts.members} membros, {counts.mentors} mentores,{" "}
              {counts.admins} admins
            </p>
          </div>
          <button
            onClick={() => (showInviteForm ? closeInviteForm() : setShowInviteForm(true))}
            className="bg-wepac-white px-4 py-2 text-sm font-bold text-wepac-black"
          >
            {showInviteForm ? "Cancelar" : "+ Convidar"}
          </button>
        </div>

        {/* Invite form */}
        {showInviteForm && (
          <div className="mt-6 border border-wepac-border bg-wepac-card p-6">
            <h2 className="font-barlow text-lg font-bold text-wepac-white">
              Convidar Utilizador
            </h2>

            {inviteResult ? (
              <div className="mt-4 space-y-4">
                <p className="text-sm text-wepac-success">Convite criado com sucesso.</p>
                <div>
                  <label className="block text-xs text-wepac-text-tertiary">
                    Link de convite
                  </label>
                  <div className="mt-1 flex gap-2">
                    <input
                      readOnly
                      value={inviteResult.inviteUrl}
                      className="w-full bg-wepac-input px-3 py-2 text-sm text-wepac-white outline-none"
                    />
                    <button
                      onClick={() => handleCopy(inviteResult.inviteUrl, "new")}
                      className="whitespace-nowrap bg-wepac-input px-3 py-2 text-xs font-medium text-wepac-white hover:bg-wepac-accent-muted hover:text-wepac-black"
                    >
                      {copiedId === "new" ? "Copiado!" : "Copiar"}
                    </button>
                  </div>
                </div>
                <div className="flex gap-3">
                  {inviteResult.whatsappUrl && (
                    <a
                      href={inviteResult.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-green-600/20 px-4 py-2 text-sm font-medium text-green-400 hover:bg-green-600/30"
                    >
                      Enviar por WhatsApp
                    </a>
                  )}
                  <button
                    onClick={closeInviteForm}
                    className="bg-wepac-white px-4 py-2 text-sm font-bold text-wepac-black"
                  >
                    Concluir
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleInviteSubmit} className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs text-wepac-text-tertiary">Nome</label>
                  <input
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    required
                    className="mt-1 w-full bg-wepac-input px-3 py-2 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-white/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-wepac-text-tertiary">Email</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    className="mt-1 w-full bg-wepac-input px-3 py-2 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-white/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-wepac-text-tertiary">Telefone</label>
                  <input
                    type="tel"
                    value={invitePhone}
                    onChange={(e) => setInvitePhone(e.target.value)}
                    placeholder="+351 912 345 678"
                    className="mt-1 w-full bg-wepac-input px-3 py-2 text-sm text-wepac-white placeholder-wepac-text-tertiary outline-none focus:ring-1 focus:ring-wepac-white/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-wepac-text-tertiary">Papel</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as UserRole)}
                    className="mt-1 w-full bg-wepac-input px-3 py-2 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-white/50"
                  >
                    <option value="member">Membro</option>
                    <option value="mentor">Mentor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                {/* Multi-pack / multi-cohort memberships */}
                <div className="sm:col-span-3">
                  <label className="block text-xs text-wepac-text-tertiary">
                    Journeys (opcional — a mesma pessoa pode entrar em vários
                    packs)
                  </label>
                  <div className="mt-1 space-y-2">
                    {inviteMemberships.map((m, i) => (
                      <div key={i} className="flex gap-2">
                        <select
                          value={m.cohortId}
                          onChange={(e) =>
                            updateInviteMembership(i, {
                              cohortId: e.target.value,
                            })
                          }
                          className="w-full bg-wepac-input px-3 py-2 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-white/50"
                        >
                          <option value="">Escolher Journey…</option>
                          {cohorts
                            .filter(
                              (c) =>
                                c.id === m.cohortId ||
                                !inviteMemberships.some(
                                  (other, j) =>
                                    j !== i && other.cohortId === c.id
                                )
                            )
                            .map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.pack.name} — {c.name}
                              </option>
                            ))}
                        </select>
                        <select
                          value={m.role}
                          onChange={(e) =>
                            updateInviteMembership(i, {
                              role: e.target.value as MembershipRole,
                            })
                          }
                          className="w-36 bg-wepac-input px-3 py-2 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-white/50"
                        >
                          <option value="member">Membro</option>
                          <option value="mentor">Mentor</option>
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            setInviteMemberships((prev) =>
                              prev.filter((_, j) => j !== i)
                            )
                          }
                          className="px-2 text-wepac-text-tertiary hover:text-wepac-white"
                          aria-label="Remover Journey"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                    {inviteMemberships.length < cohorts.length && (
                      <button
                        type="button"
                        onClick={() =>
                          setInviteMemberships((prev) => [
                            ...prev,
                            { cohortId: "", role: "member" },
                          ])
                        }
                        className="border border-wepac-white/20 px-3 py-1.5 text-xs text-wepac-white/60 transition-colors hover:text-wepac-white"
                      >
                        + Adicionar cohort
                      </button>
                    )}
                  </div>
                </div>
                {inviteError && (
                  <p className="text-sm text-wepac-error sm:col-span-3">{inviteError}</p>
                )}
                <div className="sm:col-span-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-wepac-white px-6 py-2 text-sm font-bold text-wepac-black disabled:opacity-50"
                  >
                    {submitting ? "A enviar..." : "Enviar Convite"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          {[
            { label: "Total", value: counts.total },
            { label: "Membros", value: counts.members },
            { label: "Mentores", value: counts.mentors },
            { label: "Pendentes", value: counts.notOnboarded },
          ].map((s) => (
            <div key={s.label} className="border border-wepac-border bg-wepac-card p-4">
              <p className="text-xs text-wepac-text-tertiary">{s.label}</p>
              <p className="mt-1 font-barlow text-2xl font-bold text-wepac-white">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="mt-8 flex gap-2">
          {(["all", "member", "mentor", "admin"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
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
          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-wepac-text-tertiary">
              Nenhum utilizador encontrado.
            </p>
          )}
          {filtered.map((user) => {
            const membership = user.memberships[0];
            const inviteUrl = user.inviteToken
              ? `${origin()}/wepacker/invite/${user.inviteToken}`
              : null;
            return (
              <div
                key={user.id}
                className="flex flex-col gap-3 border border-wepac-border bg-wepac-card p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center bg-wepac-white/10 text-sm font-bold text-wepac-white">
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
                <div className="flex flex-wrap items-center gap-3">
                  {!user.onboarded && inviteUrl && (
                    <>
                      <button
                        onClick={() => handleCopy(inviteUrl, user.id)}
                        title="Copiar link de convite"
                        className="bg-wepac-input px-2 py-1 text-xs text-wepac-text-secondary transition-colors hover:bg-wepac-accent-muted hover:text-wepac-black"
                      >
                        {copiedId === user.id ? "Copiado!" : "Copiar link"}
                      </button>
                      {user.phone && (
                        <a
                          href={buildWhatsappUrl(user.name, user.phone, inviteUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Enviar convite por WhatsApp"
                          className="flex h-7 w-7 items-center justify-center bg-green-600/20 text-base transition-colors hover:bg-green-600/40"
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-green-400">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                          </svg>
                        </a>
                      )}
                    </>
                  )}
                  {!user.onboarded && (
                    <span className="bg-wepac-warning-bg px-2 py-0.5 text-xs font-medium text-wepac-warning">
                      Pendente
                    </span>
                  )}
                  <span className="bg-wepac-input px-2 py-0.5 text-xs text-wepac-text-tertiary">
                    {ROLE_LABELS[user.role]}
                  </span>
                  {membership && (
                    <>
                      <span className="bg-wepac-input px-2 py-0.5 text-xs text-wepac-text-tertiary">
                        {membership.cohort.pack.name} · {membership.cohort.name}
                      </span>
                      <span className="bg-wepac-input px-2 py-0.5 text-xs text-wepac-text-tertiary">
                        {LEVEL_LABELS[membership.level]}
                      </span>
                      <span className="bg-wepac-white/10 px-2 py-0.5 text-xs text-wepac-accent-muted">
                        {PHASE_LABELS[membership.currentPhase]}
                      </span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
