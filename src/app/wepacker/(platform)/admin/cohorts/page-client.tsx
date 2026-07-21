"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createPack,
  updatePack,
  createCohort,
  updateCohortStatus,
  addMembership,
} from "@/lib/wepacker/actions/admin";
import type { CohortStatus, MembershipRole, UserRole } from "@/lib/wepacker/types";

const STATUS_LABELS: Record<CohortStatus, string> = {
  draft: "Draft",
  active: "Active",
  completed: "Completed",
  archived: "Archived",
};

const STATUS_COLORS: Record<CohortStatus, string> = {
  draft: "bg-wepac-input text-wepac-text-tertiary",
  active: "bg-wepac-success-bg text-wepac-success",
  completed: "bg-wepac-info-bg text-wepac-info",
  archived: "bg-wepac-warning-bg text-wepac-warning",
};

interface CohortItem {
  id: string;
  packId: string;
  name: string;
  status: CohortStatus;
  startsAt: string | null;
  endsAt: string | null;
  _count: { memberships: number };
}

interface Pack {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  active: boolean;
  sortOrder: number;
  cohorts: CohortItem[];
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AdminCohortsPageProps {
  packs: Pack[];
  users: AdminUser[];
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function AdminCohortsPageClient({ packs, users }: AdminCohortsPageProps) {
  const router = useRouter();

  const [showPackForm, setShowPackForm] = useState(false);
  const [packSlug, setPackSlug] = useState("");
  const [packName, setPackName] = useState("");
  const [packTagline, setPackTagline] = useState("");
  const [packDescription, setPackDescription] = useState("");
  const [packError, setPackError] = useState("");
  const [savingPack, setSavingPack] = useState(false);

  const [editingPackId, setEditingPackId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{
    name: string;
    tagline: string;
    description: string;
  } | null>(null);

  const [cohortFormPackId, setCohortFormPackId] = useState<string | null>(null);
  const [cohortName, setCohortName] = useState("");
  const [cohortStartsAt, setCohortStartsAt] = useState("");
  const [cohortEndsAt, setCohortEndsAt] = useState("");
  const [cohortError, setCohortError] = useState("");
  const [savingCohort, setSavingCohort] = useState(false);

  const [memberFormCohortId, setMemberFormCohortId] = useState<string | null>(null);
  const [memberUserId, setMemberUserId] = useState("");
  const [memberRole, setMemberRole] = useState<MembershipRole>("member");
  const [memberError, setMemberError] = useState("");
  const [savingMember, setSavingMember] = useState(false);

  // Keyed by pack.id / cohort.id so independent rows can show their own
  // gate error (e.g. activation rejected for lacking dedicated indicators)
  // without clobbering each other.
  const [toggleActiveErrors, setToggleActiveErrors] = useState<Record<string, string>>({});
  const [statusChangeErrors, setStatusChangeErrors] = useState<Record<string, string>>({});

  function resetPackForm() {
    setPackSlug("");
    setPackName("");
    setPackTagline("");
    setPackDescription("");
    setPackError("");
  }

  async function handleCreatePack(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSavingPack(true);
    setPackError("");
    try {
      await createPack({
        slug: packSlug,
        name: packName,
        tagline: packTagline || undefined,
        description: packDescription || undefined,
      });
      resetPackForm();
      setShowPackForm(false);
      router.refresh();
    } catch (err) {
      setPackError(err instanceof Error ? err.message : "Could not create legacy track.");
    } finally {
      setSavingPack(false);
    }
  }

  function startEditPack(pack: Pack) {
    setEditingPackId(pack.id);
    setEditDraft({
      name: pack.name,
      tagline: pack.tagline,
      description: pack.description,
    });
  }

  async function handleSaveEdit(packId: string) {
    if (!editDraft) return;
    await updatePack(packId, editDraft);
    setEditingPackId(null);
    setEditDraft(null);
    router.refresh();
  }

  async function handleToggleActive(pack: Pack) {
    setToggleActiveErrors((prev) => ({ ...prev, [pack.id]: "" }));
    try {
      await updatePack(pack.id, { active: !pack.active });
      router.refresh();
    } catch (err) {
      setToggleActiveErrors((prev) => ({
        ...prev,
        [pack.id]: err instanceof Error ? err.message : "Could not update legacy track.",
      }));
    }
  }

  function resetCohortForm() {
    setCohortName("");
    setCohortStartsAt("");
    setCohortEndsAt("");
    setCohortError("");
  }

  async function handleCreateCohort(e: React.FormEvent<HTMLFormElement>, packId: string) {
    e.preventDefault();
    setSavingCohort(true);
    setCohortError("");
    try {
      await createCohort({
        packId,
        name: cohortName,
        startsAt: cohortStartsAt || undefined,
        endsAt: cohortEndsAt || undefined,
      });
      resetCohortForm();
      setCohortFormPackId(null);
      router.refresh();
    } catch (err) {
      setCohortError(err instanceof Error ? err.message : "Could not create legacy cohort.");
    } finally {
      setSavingCohort(false);
    }
  }

  async function handleStatusChange(cohortId: string, status: CohortStatus) {
    setStatusChangeErrors((prev) => ({ ...prev, [cohortId]: "" }));
    try {
      await updateCohortStatus(cohortId, status);
      router.refresh();
    } catch (err) {
      setStatusChangeErrors((prev) => ({
        ...prev,
        [cohortId]: err instanceof Error ? err.message : "Could not update legacy cohort.",
      }));
    }
  }

  function resetMemberForm() {
    setMemberUserId("");
    setMemberRole("member");
    setMemberError("");
  }

  async function handleAddMember(e: React.FormEvent<HTMLFormElement>, cohortId: string) {
    e.preventDefault();
    if (!memberUserId) return;
    setSavingMember(true);
    setMemberError("");
    try {
      await addMembership({ cohortId, userId: memberUserId, role: memberRole });
      resetMemberForm();
      setMemberFormCohortId(null);
      router.refresh();
    } catch (err) {
      setMemberError(err instanceof Error ? err.message : "Could not add person to legacy cohort.");
    } finally {
      setSavingMember(false);
    }
  }

  return (
    <div className="min-h-screen bg-wepac-dark px-6 py-10 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-barlow text-3xl font-bold text-wepac-white">
              Legacy Delivery
            </h1>
            <p className="mt-1 text-sm text-wepac-text-tertiary">
              {packs.length} legacy tracks — {packs.reduce((n, p) => n + p.cohorts.length, 0)} legacy cohorts
            </p>
          </div>
          <button
            onClick={() => {
              setShowPackForm(!showPackForm);
              resetPackForm();
            }}
            className="bg-wepac-white px-4 py-2 text-sm font-bold text-wepac-black"
          >
            {showPackForm ? "Cancel" : "+ New legacy track"}
          </button>
        </div>

        <p className="mt-5 border border-wepac-warning/40 bg-wepac-warning-bg p-4 text-sm text-wepac-warning">
          This screen operates the old Pack → Cohort → CohortMembership tables.
          These records are not Community Packs, target Cycles, Cycle Enrollments,
          Cycle Facilitators, or verified Disciplines. Keep them explicit until the
          reviewed migration maps each record.
        </p>

        {/* Create a row in the legacy delivery model without target relabelling. */}
        {showPackForm && (
          <form
            onSubmit={handleCreatePack}
            className="mt-6 grid gap-4 border border-wepac-border bg-wepac-card p-6 sm:grid-cols-2"
          >
            <h2 className="font-barlow text-lg font-bold text-wepac-white sm:col-span-2">
              New legacy track
            </h2>
            <div>
              <label className="block text-xs text-wepac-text-tertiary">Slug</label>
              <input
                value={packSlug}
                onChange={(e) => setPackSlug(e.target.value)}
                required
                placeholder="artist"
                className="mt-1 w-full bg-wepac-input px-3 py-2 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-white/50"
              />
            </div>
            <div>
              <label className="block text-xs text-wepac-text-tertiary">Name</label>
              <input
                value={packName}
                onChange={(e) => setPackName(e.target.value)}
                required
                className="mt-1 w-full bg-wepac-input px-3 py-2 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-white/50"
              />
            </div>
            <div>
              <label className="block text-xs text-wepac-text-tertiary">Tagline</label>
              <input
                value={packTagline}
                onChange={(e) => setPackTagline(e.target.value)}
                className="mt-1 w-full bg-wepac-input px-3 py-2 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-white/50"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-wepac-text-tertiary">Description</label>
              <textarea
                value={packDescription}
                onChange={(e) => setPackDescription(e.target.value)}
                rows={3}
                className="mt-1 w-full resize-none bg-wepac-input px-3 py-2 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-white/50"
              />
            </div>
            {packError && <p className="text-sm text-wepac-error sm:col-span-2">{packError}</p>}
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={savingPack}
                className="bg-wepac-white px-6 py-2 text-sm font-bold text-wepac-black disabled:opacity-50"
              >
                {savingPack ? "Creating..." : "Create legacy track"}
              </button>
            </div>
          </form>
        )}

        {/* Rows backed by the legacy packs table during expand. */}
        <div className="mt-8 space-y-6">
          {packs.length === 0 && (
            <p className="py-8 text-center text-sm text-wepac-text-tertiary">
              No legacy tracks yet.
            </p>
          )}
          {packs.map((pack) => (
            <div key={pack.id} className="border border-wepac-border bg-wepac-card p-6">
              {editingPackId === pack.id && editDraft ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs text-wepac-text-tertiary">Nome</label>
                    <input
                      value={editDraft.name}
                      onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })}
                      className="mt-1 w-full bg-wepac-input px-3 py-2 text-sm text-wepac-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-wepac-text-tertiary">Tagline</label>
                    <input
                      value={editDraft.tagline}
                      onChange={(e) => setEditDraft({ ...editDraft, tagline: e.target.value })}
                      className="mt-1 w-full bg-wepac-input px-3 py-2 text-sm text-wepac-white outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-wepac-text-tertiary">Descrição</label>
                    <textarea
                      value={editDraft.description}
                      onChange={(e) =>
                        setEditDraft({ ...editDraft, description: e.target.value })
                      }
                      rows={2}
                      className="mt-1 w-full resize-none bg-wepac-input px-3 py-2 text-sm text-wepac-white outline-none"
                    />
                  </div>
                  <div className="flex gap-3 sm:col-span-2">
                    <button
                      onClick={() => handleSaveEdit(pack.id)}
                      className="bg-wepac-white px-4 py-2 text-xs font-bold text-wepac-black"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => {
                        setEditingPackId(null);
                        setEditDraft(null);
                      }}
                      className="px-4 py-2 text-xs text-wepac-text-tertiary hover:text-wepac-white"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="font-barlow text-xl font-bold text-wepac-white">
                        {pack.name}
                      </h2>
                      <span className="bg-wepac-input px-2 py-0.5 text-xs text-wepac-text-tertiary">
                        {pack.slug}
                      </span>
                      {pack.slug === "artist" && (
                        <span className="bg-wepac-info-bg px-2 py-0.5 text-xs text-wepac-info">
                          Candidate Discipline mapping: Arts
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 text-xs font-medium ${
                          pack.active
                            ? "bg-wepac-success-bg text-wepac-success"
                            : "bg-wepac-input text-wepac-text-tertiary"
                        }`}
                      >
                        {pack.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    {pack.tagline && (
                      <p className="mt-1 text-sm text-wepac-text-secondary">{pack.tagline}</p>
                    )}
                    {toggleActiveErrors[pack.id] && (
                      <p className="mt-1 text-xs text-wepac-error">{toggleActiveErrors[pack.id]}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleActive(pack)}
                      className="border border-wepac-border px-3 py-1.5 text-xs text-wepac-text-secondary hover:text-wepac-white"
                    >
                      {pack.active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => startEditPack(pack)}
                      className="border border-wepac-border px-3 py-1.5 text-xs text-wepac-text-secondary hover:text-wepac-white"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              )}

              {/* Legacy cohorts */}
              <div className="mt-6 space-y-3">
                {pack.cohorts.length === 0 && (
                  <p className="text-xs text-wepac-text-tertiary">No legacy cohorts yet.</p>
                )}
                {pack.cohorts.map((cohort) => (
                  <div key={cohort.id} className="border border-wepac-border bg-wepac-dark p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-wepac-white">{cohort.name}</p>
                        <p className="mt-0.5 text-xs text-wepac-text-tertiary">
                          {formatDate(cohort.startsAt)} — {formatDate(cohort.endsAt)} ·{" "}
                          {cohort._count.memberships} legacy participant records
                        </p>
                        {statusChangeErrors[cohort.id] && (
                          <p className="mt-1 text-xs text-wepac-error">
                            {statusChangeErrors[cohort.id]}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[cohort.status]}`}
                        >
                          {STATUS_LABELS[cohort.status]}
                        </span>
                        <select
                          value={cohort.status}
                          onChange={(e) =>
                            handleStatusChange(cohort.id, e.target.value as CohortStatus)
                          }
                          className="border border-wepac-border bg-wepac-dark px-2 py-1 text-xs text-wepac-white"
                        >
                          {(Object.keys(STATUS_LABELS) as CohortStatus[]).map((s) => (
                            <option key={s} value={s}>
                              {STATUS_LABELS[s]}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => {
                            setMemberFormCohortId(
                              memberFormCohortId === cohort.id ? null : cohort.id
                            );
                            resetMemberForm();
                          }}
                          className="border border-wepac-border px-2 py-1 text-xs text-wepac-text-secondary hover:text-wepac-white"
                        >
                          + Participant
                        </button>
                      </div>
                    </div>

                    {memberFormCohortId === cohort.id && (
                      <form
                        onSubmit={(e) => handleAddMember(e, cohort.id)}
                        className="mt-3 flex flex-wrap items-end gap-3 border-t border-wepac-border pt-3"
                      >
                        <div>
                          <label className="block text-xs text-wepac-text-tertiary">
                            User
                          </label>
                          <select
                            value={memberUserId}
                            onChange={(e) => setMemberUserId(e.target.value)}
                            required
                            className="mt-1 min-w-[220px] bg-wepac-input px-3 py-2 text-sm text-wepac-white outline-none"
                          >
                            <option value="">Select...</option>
                            {users.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.name} ({u.email})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-wepac-text-tertiary">Legacy cohort role</label>
                          <select
                            value={memberRole}
                            onChange={(e) => setMemberRole(e.target.value as MembershipRole)}
                            className="mt-1 bg-wepac-input px-3 py-2 text-sm text-wepac-white outline-none"
                          >
                            <option value="member">Participant</option>
                            <option value="mentor">Facilitator</option>
                          </select>
                        </div>
                        <button
                          type="submit"
                          disabled={savingMember}
                          className="bg-wepac-white px-4 py-2 text-xs font-bold text-wepac-black disabled:opacity-50"
                        >
                          {savingMember ? "Adding..." : "Add"}
                        </button>
                        {memberError && (
                          <p className="w-full text-xs text-wepac-error">{memberError}</p>
                        )}
                      </form>
                    )}
                  </div>
                ))}

                {/* New legacy cohort */}
                {cohortFormPackId === pack.id ? (
                  <form
                    onSubmit={(e) => handleCreateCohort(e, pack.id)}
                    className="flex flex-wrap items-end gap-3 border border-wepac-border bg-wepac-dark p-4"
                  >
                    <div>
                      <label className="block text-xs text-wepac-text-tertiary">Nome</label>
                      <input
                        value={cohortName}
                        onChange={(e) => setCohortName(e.target.value)}
                        required
                        placeholder="Artist pilot 2026"
                        className="mt-1 bg-wepac-input px-3 py-2 text-sm text-wepac-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-wepac-text-tertiary">Início</label>
                      <input
                        type="date"
                        value={cohortStartsAt}
                        onChange={(e) => setCohortStartsAt(e.target.value)}
                        className="mt-1 bg-wepac-input px-3 py-2 text-sm text-wepac-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-wepac-text-tertiary">Fim</label>
                      <input
                        type="date"
                        value={cohortEndsAt}
                        onChange={(e) => setCohortEndsAt(e.target.value)}
                        className="mt-1 bg-wepac-input px-3 py-2 text-sm text-wepac-white outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={savingCohort}
                      className="bg-wepac-white px-4 py-2 text-xs font-bold text-wepac-black disabled:opacity-50"
                    >
                      {savingCohort ? "A criar..." : "Criar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCohortFormPackId(null);
                        resetCohortForm();
                      }}
                      className="px-2 py-2 text-xs text-wepac-text-tertiary hover:text-wepac-white"
                    >
                      Cancelar
                    </button>
                    {cohortError && (
                      <p className="w-full text-xs text-wepac-error">{cohortError}</p>
                    )}
                  </form>
                ) : (
                  <button
                    onClick={() => {
                      setCohortFormPackId(pack.id);
                      resetCohortForm();
                    }}
                    className="border border-wepac-border px-3 py-1.5 text-xs text-wepac-text-secondary hover:text-wepac-white"
                  >
                    + New legacy cohort
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
