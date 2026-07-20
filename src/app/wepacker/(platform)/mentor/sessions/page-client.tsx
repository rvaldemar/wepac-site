"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SessionStatus, SessionType } from "@/lib/wepacker/types";
import {
  createSession,
  setAttendance,
  updateSession,
} from "@/lib/wepacker/actions/session";

const STATUS_LABELS: Record<SessionStatus, string> = {
  scheduled: "Agendada",
  completed: "Realizada",
  cancelled: "Cancelada",
  no_show: "Falta",
};

interface AttendeeRow {
  id: string;
  attended: boolean;
  user: { id: string; name: string };
}

interface SessionRow {
  id: string;
  cohortId: string | null;
  sessionType: SessionType;
  scheduledAt: string;
  durationMinutes: number;
  status: SessionStatus;
  notes: string | null;
  notesPublished: boolean;
  discussionPoints: string | null;
  attendees: AttendeeRow[];
  mentor: { id: string; name: string };
}

interface CohortMembershipRow {
  id: string;
  role: "member" | "mentor";
  user: { id: string; name: string };
}

interface CohortRow {
  id: string;
  name: string;
  pack: { id: string; name: string };
  memberships: CohortMembershipRow[];
}

// A mentored person, independent of any specific Journey — used to
// populate the participant picker when a session isn't tied to a Pack.
interface MentoredMemberRow {
  id: string;
  name: string;
}

interface MentorSessionsProps {
  sessions: SessionRow[];
  cohorts: CohortRow[];
  members: MentoredMemberRow[];
}

function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export function MentorSessionsClient({
  sessions: rawSessions,
  cohorts,
  members,
}: MentorSessionsProps) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);

  const sessions = [...rawSessions].sort(
    (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
  );

  // ===== Create form state =====
  // A Pack/Journey is just a community/context — most sessions are a
  // personal mentoring relationship, so associating one is opt-in.
  const [associateCohort, setAssociateCohort] = useState(false);
  const [cohortId, setCohortId] = useState(cohorts[0]?.id ?? "");
  const [sessionType, setSessionType] = useState<SessionType>("individual");
  const [scheduledAt, setScheduledAt] = useState(toDatetimeLocalValue(new Date()));
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [discussionPoints, setDiscussionPoints] = useState("");
  const [attendeeIds, setAttendeeIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const selectedCohort = cohorts.find((c) => c.id === cohortId);
  // Participants are always identified by userId — from the selected
  // Journey's memberships when one is associated, or from every person
  // the mentor mentors otherwise.
  const participantOptions = associateCohort
    ? (selectedCohort?.memberships ?? [])
        .filter((m) => m.role === "member")
        .map((m) => ({ userId: m.user.id, name: m.user.name }))
    : members.map((m) => ({ userId: m.id, name: m.name }));

  function toggleAttendee(userId: string) {
    setAttendeeIds((prev) =>
      prev.includes(userId) ? prev.filter((a) => a !== userId) : [...prev, userId]
    );
  }

  function toggleAssociateCohort(checked: boolean) {
    setAssociateCohort(checked);
    setAttendeeIds([]);
  }

  async function handleCreate() {
    if (associateCohort && !cohortId) {
      setCreateError("Escolhe uma Journey.");
      return;
    }
    if (attendeeIds.length === 0) {
      setCreateError("Escolhe pelo menos um participante.");
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      await createSession({
        cohortId: associateCohort ? cohortId : undefined,
        sessionType,
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationMinutes,
        discussionPoints: discussionPoints.trim() || undefined,
        attendeeUserIds: attendeeIds,
      });
      setShowCreate(false);
      setDiscussionPoints("");
      setAttendeeIds([]);
      router.refresh();
    } catch (e) {
      console.error("Failed to create session:", e);
      setCreateError("Erro ao criar sessão. Tenta novamente.");
    } finally {
      setCreating(false);
    }
  }

  // ===== Per-session edit state =====
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [editPublished, setEditPublished] = useState(false);
  const [savingSessionId, setSavingSessionId] = useState<string | null>(null);

  function startEdit(session: SessionRow) {
    setEditingId(session.id);
    setEditNotes(session.notes ?? "");
    setEditPublished(session.notesPublished);
  }

  async function handleStatusChange(sessionId: string, status: SessionStatus) {
    setSavingSessionId(sessionId);
    try {
      await updateSession(sessionId, { status });
      router.refresh();
    } catch (e) {
      console.error("Failed to update session status:", e);
    } finally {
      setSavingSessionId(null);
    }
  }

  async function handleSaveNotes(sessionId: string) {
    setSavingSessionId(sessionId);
    try {
      await updateSession(sessionId, {
        notes: editNotes,
        notesPublished: editPublished,
      });
      setEditingId(null);
      router.refresh();
    } catch (e) {
      console.error("Failed to save session notes:", e);
    } finally {
      setSavingSessionId(null);
    }
  }

  async function handleAttendance(sessionId: string, userId: string, attended: boolean) {
    try {
      await setAttendance(sessionId, userId, attended);
      router.refresh();
    } catch (e) {
      console.error("Failed to update attendance:", e);
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-barlow text-2xl font-bold text-wepac-white">
            Sessões
          </h1>
          <p className="mt-1 text-sm text-wepac-text-tertiary">
            Gestão de sessões com membros.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="bg-wepac-white px-4 py-2 text-sm font-bold text-wepac-black"
        >
          + Nova Sessão
        </button>
      </div>

      {showCreate && (
        <div className="mt-6 border border-wepac-white/20 bg-wepac-card p-6">
          <h3 className="text-sm font-bold text-wepac-white">Criar Sessão</h3>
          <label className="mt-4 flex items-center gap-1.5 text-xs text-wepac-text-tertiary">
            <input
              type="checkbox"
              checked={associateCohort}
              onChange={(e) => toggleAssociateCohort(e.target.checked)}
            />
            Associar a uma Journey específica
          </label>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {associateCohort && (
              <div>
                <label className="block text-xs text-wepac-text-tertiary">Journey</label>
                <select
                  value={cohortId}
                  onChange={(e) => {
                    setCohortId(e.target.value);
                    setAttendeeIds([]);
                  }}
                  className="mt-1 w-full bg-wepac-input px-3 py-2 text-sm text-wepac-white"
                >
                  {cohorts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.pack.name} — {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs text-wepac-text-tertiary">Tipo</label>
              <select
                value={sessionType}
                onChange={(e) => setSessionType(e.target.value as SessionType)}
                className="mt-1 w-full bg-wepac-input px-3 py-2 text-sm text-wepac-white"
              >
                <option value="individual">Individual</option>
                <option value="group">Grupo</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-wepac-text-tertiary">
                Data e hora
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="mt-1 w-full bg-wepac-input px-3 py-2 text-sm text-wepac-white"
              />
            </div>
            <div>
              <label className="block text-xs text-wepac-text-tertiary">
                Duração (min)
              </label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="mt-1 w-full bg-wepac-input px-3 py-2 text-sm text-wepac-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-wepac-text-tertiary">
                Participantes
              </label>
              <div className="mt-1 flex flex-wrap gap-2">
                {participantOptions.map((m) => (
                  <button
                    key={m.userId}
                    type="button"
                    onClick={() => toggleAttendee(m.userId)}
                    className={`px-3 py-1.5 text-xs transition-colors ${
                      attendeeIds.includes(m.userId)
                        ? "bg-wepac-white text-wepac-black"
                        : "bg-wepac-input text-wepac-text-tertiary"
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
                {participantOptions.length === 0 && (
                  <p className="text-xs text-wepac-text-tertiary">
                    {associateCohort
                      ? "Sem membros nesta Journey."
                      : "Sem pessoas mentoradas."}
                  </p>
                )}
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-wepac-text-tertiary">
                Pontos de discussão (opcional)
              </label>
              <textarea
                value={discussionPoints}
                onChange={(e) => setDiscussionPoints(e.target.value)}
                rows={2}
                className="mt-1 w-full bg-wepac-input px-3 py-2 text-sm text-wepac-white"
              />
            </div>
          </div>
          {createError && (
            <p className="mt-3 text-xs text-wepac-error">{createError}</p>
          )}
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleCreate}
              disabled={creating}
              className="bg-wepac-white px-4 py-2 text-sm font-bold text-wepac-black disabled:opacity-30"
            >
              {creating ? "A criar..." : "Criar"}
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="border border-wepac-border px-4 py-2 text-sm text-wepac-text-secondary"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="mt-8 space-y-3">
        {sessions.map((session) => {
          const attendeeNames = session.attendees
            .map((a) => a.user.name)
            .join(", ");
          const isEditing = editingId === session.id;
          return (
            <div key={session.id} className="border border-wepac-border bg-wepac-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-wepac-white">
                    {new Date(session.scheduledAt).toLocaleDateString("pt-PT", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    ·{" "}
                    {new Date(session.scheduledAt).toLocaleTimeString("pt-PT", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="mt-0.5 text-xs text-wepac-text-tertiary">
                    {session.sessionType === "individual" ? "Individual" : "Grupo"} ·{" "}
                    {attendeeNames} · {session.durationMinutes} min
                  </p>
                  {session.discussionPoints && (
                    <p className="mt-1 text-xs text-wepac-text-tertiary">
                      Pontos: {session.discussionPoints}
                    </p>
                  )}
                </div>
                <select
                  value={session.status}
                  onChange={(e) =>
                    handleStatusChange(session.id, e.target.value as SessionStatus)
                  }
                  disabled={savingSessionId === session.id}
                  className={`px-2 py-1 text-xs ${
                    session.status === "scheduled"
                      ? "bg-wepac-white/10 text-wepac-white"
                      : session.status === "completed"
                        ? "bg-wepac-success-bg text-wepac-success"
                        : "bg-wepac-input text-wepac-text-tertiary"
                  }`}
                >
                  {(Object.keys(STATUS_LABELS) as SessionStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Attendance */}
              <div className="mt-3 flex flex-wrap gap-2 border-t border-wepac-border pt-3">
                {session.attendees.map((a) => (
                  <label
                    key={a.id}
                    className="flex items-center gap-1.5 text-xs text-wepac-text-tertiary"
                  >
                    <input
                      type="checkbox"
                      checked={a.attended}
                      onChange={(e) =>
                        handleAttendance(session.id, a.user.id, e.target.checked)
                      }
                    />
                    {a.user.name}
                  </label>
                ))}
              </div>

              {/* Notes */}
              {isEditing ? (
                <div className="mt-3 border-t border-wepac-border pt-3">
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    rows={3}
                    className="w-full bg-wepac-input px-3 py-2 text-xs text-wepac-text-secondary"
                    placeholder="Notas da sessão"
                  />
                  <label className="mt-2 flex items-center gap-1.5 text-xs text-wepac-text-tertiary">
                    <input
                      type="checkbox"
                      checked={editPublished}
                      onChange={(e) => setEditPublished(e.target.checked)}
                    />
                    Publicar notas ao membro
                  </label>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => handleSaveNotes(session.id)}
                      disabled={savingSessionId === session.id}
                      className="bg-wepac-white px-3 py-1.5 text-xs font-bold text-wepac-black disabled:opacity-30"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="border border-wepac-border px-3 py-1.5 text-xs text-wepac-text-secondary"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex items-center justify-between border-t border-wepac-border pt-3">
                  {session.notes ? (
                    <p className="text-xs text-wepac-text-tertiary">{session.notes}</p>
                  ) : (
                    <p className="text-xs text-wepac-text-tertiary">Sem notas.</p>
                  )}
                  <button
                    onClick={() => startEdit(session)}
                    className="text-xs text-wepac-white hover:underline"
                  >
                    Editar notas
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {sessions.length === 0 && (
          <p className="text-sm text-wepac-text-tertiary">Sem sessões ainda.</p>
        )}
      </div>
    </div>
  );
}
