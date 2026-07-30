"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { wp } from "@/i18n/copy/wepacker";
import { useRouter } from "@/i18n/navigation";
import { createInvite, deleteUser } from "@/lib/wepacker/actions/admin";
import type { UserRole } from "@/lib/wepacker/types";

type AccountAccess = "member" | "admin";

function accountAccess(role: UserRole): AccountAccess {
  return role === "admin" ? "admin" : "member";
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  onboarded: boolean;
  phone: string | null;
  createdAt: string;
}

interface AdminUsersPageProps {
  users: AdminUser[];
  currentUserId: string;
  prefill?: {
    name: string;
    email: string;
    phone: string;
    applicationId?: string;
  } | null;
}

export function AdminUsersPageClient({
  users: allUsers,
  currentUserId,
  prefill = null,
}: AdminUsersPageProps) {
  const locale = useLocale();
  const router = useRouter();
  const accountAccessLabels: Record<AccountAccess, string> = {
    member: wp(locale, "Acesso normal", "Standard access"),
    admin: wp(locale, "Acesso de administrador", "Admin access"),
  };
  const [roleFilter, setRoleFilter] = useState<"all" | AccountAccess>("all");
  const [showInviteForm, setShowInviteForm] = useState(prefill !== null);
  const [inviteName, setInviteName] = useState(prefill?.name ?? "");
  const [inviteEmail, setInviteEmail] = useState(prefill?.email ?? "");
  const [invitePhone, setInvitePhone] = useState(prefill?.phone ?? "");
  const [inviteRole, setInviteRole] = useState<AccountAccess>("member");
  const [inviteMessage, setInviteMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteResult, setInviteResult] = useState<{
    inviteUrl: string;
    whatsappUrl: string | null;
  } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered =
    roleFilter === "all"
      ? allUsers
      : allUsers.filter((user) => accountAccess(user.role) === roleFilter);
  const counts = {
    total: allUsers.length,
    members: allUsers.filter((user) => user.role !== "admin").length,
    admins: allUsers.filter((user) => user.role === "admin").length,
    pending: allUsers.filter((user) => !user.onboarded).length,
  };

  async function handleCopy(url: string, id: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setCopiedId(null);
    }
  }

  function resetInviteForm() {
    setInviteName("");
    setInviteEmail("");
    setInvitePhone("");
    setInviteRole("member");
    setInviteMessage("");
    setInviteResult(null);
    setInviteError("");
  }

  function closeInviteForm() {
    setShowInviteForm(false);
    resetInviteForm();
  }

  async function handleInviteSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setInviteError("");
    try {
      const result = await createInvite({
        name: inviteName,
        email: inviteEmail,
        phone: invitePhone || undefined,
        role: inviteRole,
        message: inviteMessage.trim() || undefined,
        applicationId: prefill?.applicationId,
      });
      setInviteResult({
        inviteUrl: result.inviteUrl,
        whatsappUrl: result.whatsappUrl,
      });
      router.refresh();
    } catch (error) {
      setInviteError(
        error instanceof Error
          ? error.message
          : wp(
              locale,
              "Erro ao criar convite.",
              "Could not create the invitation.",
            ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteUser(user: AdminUser) {
    if (
      !window.confirm(
        wp(
          locale,
          `Eliminar ${user.name} permanentemente? Esta ação não pode ser revertida.`,
          `Permanently delete ${user.name}? This action cannot be undone.`,
        ),
      )
    ) {
      return;
    }
    try {
      await deleteUser(user.id);
      router.refresh();
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : wp(
              locale,
              "Erro ao eliminar pessoa.",
              "Could not delete the person.",
            ),
      );
    }
  }

  return (
    <div className="min-h-screen bg-wepac-dark px-6 py-10 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-barlow text-3xl font-bold text-wepac-white">People</h1>
            <p className="mt-1 text-sm text-wepac-text-tertiary">
              {wp(
                locale,
                "Gere identidades e acessos ao espaço de trabalho. As relações são criadas nos seus próprios fluxos.",
                "Manage identity and workspace access. Relationships are created in their own flows.",
              )}
            </p>
          </div>
          <button
            onClick={() =>
              showInviteForm ? closeInviteForm() : setShowInviteForm(true)
            }
            className="bg-wepac-white px-4 py-2 text-sm font-bold text-wepac-black"
          >
            {showInviteForm
              ? wp(locale, "Cancelar", "Cancel")
              : wp(locale, "+ Convidar pessoa", "+ Invite Person")}
          </button>
        </header>

        {showInviteForm && (
          <section className="mt-6 border border-wepac-border bg-wepac-card p-6">
            <h2 className="font-barlow text-lg font-bold text-wepac-white">
              {wp(locale, "Convidar pessoa", "Invite Person")}
            </h2>
            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-wepac-text-tertiary">
              {wp(
                locale,
                "Isto cria apenas um convite para uma conta. Mentorships, pertenças a Packs e inscrições em Cycles exigem aceitações separadas.",
                "This creates an account invitation only. Mentorships, Pack Memberships, and Cycle Enrollments require separate acceptance.",
              )}
            </p>

            {inviteResult ? (
              <div className="mt-4 space-y-4">
                <p className="text-sm text-wepac-success">
                  {wp(locale, "Convite criado.", "Invite created.")}
                </p>
                <div>
                  <label className="block text-xs text-wepac-text-tertiary">
                    {wp(locale, "Link do convite", "Invite link")}
                  </label>
                  <div className="mt-1 flex gap-2">
                    <input
                      readOnly
                      value={inviteResult.inviteUrl}
                      className="w-full bg-wepac-input px-3 py-2 text-sm text-wepac-white outline-none"
                    />
                    <button
                      onClick={() => handleCopy(inviteResult.inviteUrl, "new")}
                      className="whitespace-nowrap bg-wepac-input px-3 py-2 text-xs font-medium text-wepac-white"
                    >
                      {copiedId === "new"
                        ? wp(locale, "Copiado", "Copied")
                        : wp(locale, "Copiar", "Copy")}
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  {inviteResult.whatsappUrl && (
                    <a
                      href={inviteResult.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-green-600/20 px-4 py-2 text-sm font-medium text-green-400"
                    >
                      {wp(locale, "Enviar por WhatsApp", "Send via WhatsApp")}
                    </a>
                  )}
                  <button
                    onClick={closeInviteForm}
                    className="bg-wepac-white px-4 py-2 text-sm font-bold text-wepac-black"
                  >
                    {wp(locale, "Concluir", "Done")}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleInviteSubmit} className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="invite-name" className="block text-xs text-wepac-text-tertiary">
                    {wp(locale, "Nome", "Name")}
                  </label>
                  <input
                    id="invite-name"
                    value={inviteName}
                    onChange={(event) => setInviteName(event.target.value)}
                    required
                    className="mt-1 w-full bg-wepac-input px-3 py-2 text-sm text-wepac-white outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="invite-email" className="block text-xs text-wepac-text-tertiary">
                    Email
                  </label>
                  <input
                    id="invite-email"
                    type="email"
                    value={inviteEmail}
                    onChange={(event) => setInviteEmail(event.target.value)}
                    required
                    className="mt-1 w-full bg-wepac-input px-3 py-2 text-sm text-wepac-white outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="invite-phone" className="block text-xs text-wepac-text-tertiary">
                    {wp(locale, "Telefone", "Phone")}
                  </label>
                  <input
                    id="invite-phone"
                    type="tel"
                    value={invitePhone}
                    onChange={(event) => setInvitePhone(event.target.value)}
                    className="mt-1 w-full bg-wepac-input px-3 py-2 text-sm text-wepac-white outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="invite-role" className="block text-xs text-wepac-text-tertiary">
                    {wp(locale, "Acesso ao espaço de trabalho", "Workspace access")}
                  </label>
                  <select
                    id="invite-role"
                    value={inviteRole}
                    onChange={(event) =>
                      setInviteRole(event.target.value as AccountAccess)
                    }
                    className="mt-1 w-full bg-wepac-input px-3 py-2 text-sm text-wepac-white outline-none"
                  >
                    <option value="member">{accountAccessLabels.member}</option>
                    <option value="admin">{accountAccessLabels.admin}</option>
                  </select>
                </div>
                <div className="sm:col-span-3">
                  <label htmlFor="invite-message" className="block text-xs text-wepac-text-tertiary">
                    {wp(
                      locale,
                      "Mensagem pessoal (opcional)",
                      "Personal message (optional)",
                    )}
                  </label>
                  <textarea
                    id="invite-message"
                    value={inviteMessage}
                    onChange={(event) => setInviteMessage(event.target.value)}
                    rows={3}
                    className="mt-1 w-full resize-none bg-wepac-input px-3 py-2 text-sm text-wepac-white outline-none"
                  />
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
                    {submitting
                      ? wp(locale, "A enviar...", "Sending...")
                      : wp(locale, "Enviar convite", "Send Invite")}
                  </button>
                </div>
              </form>
            )}
          </section>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          {[
            { label: wp(locale, "Pessoas", "People"), value: counts.total },
            { label: wp(locale, "Normais", "Standard"), value: counts.members },
            { label: "Admins", value: counts.admins },
            { label: wp(locale, "Pendentes", "Pending"), value: counts.pending },
          ].map((stat) => (
            <div key={stat.label} className="border border-wepac-border bg-wepac-card p-4">
              <p className="text-xs text-wepac-text-tertiary">{stat.label}</p>
              <p className="mt-1 font-barlow text-2xl font-bold text-wepac-white">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div
          className="mt-8 flex flex-wrap gap-2"
          aria-label={wp(locale, "Filtros de pessoas", "People filters")}
        >
          {(["all", "member", "admin"] as const).map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                roleFilter === role
                  ? "bg-wepac-white text-wepac-black"
                  : "bg-wepac-card text-wepac-text-tertiary hover:text-wepac-white"
              }`}
            >
              {role === "all"
                ? wp(locale, "Todos", "All")
                : accountAccessLabels[role]}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          {filtered.map((user) => {
            return (
              <article
                key={user.id}
                className="flex flex-col gap-3 border border-wepac-border bg-wepac-card p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center bg-wepac-white/10 text-sm font-bold text-wepac-white">
                    {user.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-wepac-white">{user.name}</p>
                    <p className="text-xs text-wepac-text-tertiary">{user.email}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {!user.onboarded && (
                    <span className="bg-wepac-warning-bg px-2 py-0.5 text-xs font-medium text-wepac-warning">
                      {wp(locale, "Pendente", "Pending")}
                    </span>
                  )}
                  <span className="bg-wepac-input px-2 py-0.5 text-xs text-wepac-text-tertiary">
                    {accountAccessLabels[accountAccess(user.role)]}
                  </span>
                  {user.id !== currentUserId && (
                    <button
                      onClick={() => handleDeleteUser(user)}
                      className="text-xs text-red-400/70 hover:text-red-400"
                    >
                      {wp(locale, "Eliminar", "Delete")}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-wepac-text-tertiary">
              {wp(locale, "Nenhuma pessoa encontrada.", "No people found.")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
