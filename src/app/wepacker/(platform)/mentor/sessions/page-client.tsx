"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SessionKind, SessionStatus, SessionType } from "@/lib/wepacker/types";
import { SESSION_KIND_KEYS, SESSION_KIND_LABELS } from "@/lib/wepacker/types";
import {
  createSession,
  setAttendance,
  updateSession,
  updateSessionAttendee,
} from "@/lib/wepacker/actions/session";
import {
  attachSessionTranscript,
  clearSessionTranscript,
} from "@/lib/wepacker/actions/session-transcript";
import { MAX_TRANSCRIPT_CHARS } from "@/lib/wepacker/debrief/types";
import { createTaskFromSession } from "@/lib/wepacker/actions/task";

const MAX_TRANSCRIPT_FILE_BYTES = 2 * 1024 * 1024; // ~2MB

const STATUS_LABELS: Record<SessionStatus, string> = {
  scheduled: "Agendada",
  completed: "Realizada",
  cancelled: "Cancelada",
  no_show: "Falta",
};

interface AttendeeRow {
  id: string;
  attended: boolean;
  // Mentor-only, never shown to the member.
  privateNote: string | null;
  // Shown to the member only once sharedNotePublished is true.
  sharedNote: string | null;
  sharedNotePublished: boolean;
  // What was agreed/gained in the session, for this person specifically.
  outcome: string | null;
  user: { id: string; name: string };
}

interface SessionRow {
  id: string;
  cohortId: string | null;
  sessionType: SessionType;
  kind: SessionKind;
  scheduledAt: string;
  durationMinutes: number;
  status: SessionStatus;
  notes: string | null;
  notesPublished: boolean;
  discussionPoints: string | null;
  attendees: AttendeeRow[];
  mentor: { id: string; name: string };
  transcript: string | null;
  transcriptUploadedAt: string | null;
  transcriptUploadedBy: { id: string; name: string } | null;
  debrief: { id: string } | null;
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
  const [sessionKind, setSessionKind] = useState<SessionKind>("checkpoint");
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
        kind: sessionKind,
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationMinutes,
        discussionPoints: discussionPoints.trim() || undefined,
        attendeeUserIds: attendeeIds,
      });
      setShowCreate(false);
      setSessionKind("checkpoint");
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
  const [savingSessionId, setSavingSessionId] = useState<string | null>(null);

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

  async function handleAttendance(sessionId: string, userId: string, attended: boolean) {
    try {
      await setAttendance(sessionId, userId, attended);
      router.refresh();
    } catch (e) {
      console.error("Failed to update attendance:", e);
    }
  }

  // ===== Per-attendee notes/outcome edit state =====
  // Only one attendee row is edited at a time, identified by
  // "<sessionId>:<userId>" — mirrors the previous single-editor pattern so
  // an in-progress draft never gets clobbered by a router.refresh() caused
  // by an unrelated action (status change, another attendee's checkbox).
  function attendeeKey(sessionId: string, userId: string): string {
    return `${sessionId}:${userId}`;
  }

  const [editingAttendeeKey, setEditingAttendeeKey] = useState<string | null>(null);
  const [attendeePrivateNote, setAttendeePrivateNote] = useState("");
  const [attendeeSharedNote, setAttendeeSharedNote] = useState("");
  const [attendeeOutcome, setAttendeeOutcome] = useState("");
  const [attendeeSharedNotePublished, setAttendeeSharedNotePublished] = useState(false);
  const [savingAttendeeKey, setSavingAttendeeKey] = useState<string | null>(null);
  const [attendeeFeedback, setAttendeeFeedback] = useState<
    Record<string, { type: "success" | "error"; text: string } | undefined>
  >({});

  function startEditAttendee(sessionId: string, attendee: AttendeeRow) {
    const key = attendeeKey(sessionId, attendee.user.id);
    setEditingAttendeeKey(key);
    setAttendeePrivateNote(attendee.privateNote ?? "");
    setAttendeeSharedNote(attendee.sharedNote ?? "");
    setAttendeeOutcome(attendee.outcome ?? "");
    setAttendeeSharedNotePublished(attendee.sharedNotePublished);
    setAttendeeFeedback((prev) => ({ ...prev, [key]: undefined }));
  }

  function cancelEditAttendee() {
    setEditingAttendeeKey(null);
  }

  async function handleSaveAttendeeNotes(sessionId: string, userId: string) {
    const key = attendeeKey(sessionId, userId);
    setSavingAttendeeKey(key);
    setAttendeeFeedback((prev) => ({ ...prev, [key]: undefined }));
    try {
      await updateSessionAttendee(sessionId, userId, {
        privateNote: attendeePrivateNote,
        sharedNote: attendeeSharedNote,
        outcome: attendeeOutcome,
        sharedNotePublished: attendeeSharedNotePublished,
      });
      setAttendeeFeedback((prev) => ({
        ...prev,
        [key]: { type: "success", text: "Notas guardadas." },
      }));
      setEditingAttendeeKey(null);
      router.refresh();
    } catch (e) {
      console.error("Failed to save attendee notes:", e);
      setAttendeeFeedback((prev) => ({
        ...prev,
        [key]: { type: "error", text: "Erro ao guardar notas. Tenta novamente." },
      }));
    } finally {
      setSavingAttendeeKey(null);
    }
  }

  // ===== "Criar tarefa" from a saved outcome =====
  // Only one attendee's inline task form is open at a time, keyed the
  // same way as the notes editor (attendeeKey). Title is prefilled from
  // the saved outcome so the mentor can create the task in one click;
  // the deadline is optional, unlike the standard mentor task form.
  const [taskFormKey, setTaskFormKey] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDeadline, setTaskDeadline] = useState("");
  const [creatingTaskKey, setCreatingTaskKey] = useState<string | null>(null);
  const [taskFeedback, setTaskFeedback] = useState<
    Record<string, { type: "success" | "error"; text: string } | undefined>
  >({});

  function openTaskForm(sessionId: string, attendee: AttendeeRow) {
    const key = attendeeKey(sessionId, attendee.user.id);
    setTaskFormKey(key);
    setTaskTitle(attendee.outcome ?? "");
    setTaskDeadline("");
    setTaskFeedback((prev) => ({ ...prev, [key]: undefined }));
  }

  function cancelTaskForm() {
    setTaskFormKey(null);
  }

  async function handleCreateTaskFromOutcome(sessionId: string, userId: string) {
    const key = attendeeKey(sessionId, userId);
    if (!taskTitle.trim()) {
      setTaskFeedback((prev) => ({
        ...prev,
        [key]: { type: "error", text: "O título é obrigatório." },
      }));
      return;
    }
    setCreatingTaskKey(key);
    setTaskFeedback((prev) => ({ ...prev, [key]: undefined }));
    try {
      await createTaskFromSession({
        sessionId,
        userId,
        title: taskTitle.trim(),
        deadline: taskDeadline,
      });
      setTaskFormKey(null);
      setTaskFeedback((prev) => ({
        ...prev,
        [key]: { type: "success", text: "Tarefa criada." },
      }));
      router.refresh();
    } catch (e) {
      console.error("Failed to create task from session outcome:", e);
      setTaskFeedback((prev) => ({
        ...prev,
        [key]: { type: "error", text: "Erro ao criar tarefa. Tenta novamente." },
      }));
    } finally {
      setCreatingTaskKey(null);
    }
  }

  // ===== Transcript attach/replace/remove =====
  // Only one session's transcript editor is open at a time. Uploading a
  // .txt/.md file reads it client-side via File.text() into the same
  // textarea — the raw file is never sent to the server, only the
  // resulting string via attachSessionTranscript.
  const [transcriptEditorSessionId, setTranscriptEditorSessionId] = useState<
    string | null
  >(null);
  const [transcriptDraft, setTranscriptDraft] = useState("");
  const [transcriptError, setTranscriptError] = useState<string | null>(null);
  const [savingTranscriptId, setSavingTranscriptId] = useState<string | null>(null);
  const [expandedTranscriptId, setExpandedTranscriptId] = useState<string | null>(null);
  const [removingTranscriptId, setRemovingTranscriptId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function openTranscriptEditor(sessionId: string, currentText: string) {
    setTranscriptEditorSessionId(sessionId);
    setTranscriptDraft(currentText);
    setTranscriptError(null);
  }

  function cancelTranscriptEditor() {
    setTranscriptEditorSessionId(null);
    setTranscriptError(null);
  }

  async function handleTranscriptFile(file: File) {
    setTranscriptError(null);
    if (file.size > MAX_TRANSCRIPT_FILE_BYTES) {
      setTranscriptError("Ficheiro demasiado grande.");
      return;
    }
    const okExtension = /\.(txt|md)$/i.test(file.name);
    const okMime = file.type === "text/plain" || file.type === "text/markdown" || file.type === "";
    if (!okExtension && !okMime) {
      setTranscriptError(
        "Formato não suportado — usa .txt, .md ou cola o texto diretamente."
      );
      return;
    }
    const text = await file.text();
    setTranscriptDraft(text);
  }

  async function handleSaveTranscript(sessionId: string) {
    setSavingTranscriptId(sessionId);
    setTranscriptError(null);
    try {
      await attachSessionTranscript(sessionId, transcriptDraft);
      setTranscriptEditorSessionId(null);
      router.refresh();
    } catch (e) {
      console.error("Failed to save session transcript:", e);
      setTranscriptError("Erro ao guardar transcrição. Tenta novamente.");
    } finally {
      setSavingTranscriptId(null);
    }
  }

  async function handleRemoveTranscript(sessionId: string) {
    const confirmed = window.confirm(
      "Isto apaga a transcrição desta sessão e o debrief gerado a partir dela (sugestões, avaliação interna e documento de resultado). Continuar?"
    );
    if (!confirmed) return;
    setRemovingTranscriptId(sessionId);
    try {
      await clearSessionTranscript(sessionId);
      router.refresh();
    } catch (e) {
      console.error("Failed to clear session transcript:", e);
    } finally {
      setRemovingTranscriptId(null);
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
                Motivo da sessão
              </label>
              <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {SESSION_KIND_KEYS.map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setSessionKind(k)}
                    className={`px-3 py-2 text-left transition-colors ${
                      sessionKind === k
                        ? "bg-wepac-white text-wepac-black"
                        : "bg-wepac-input text-wepac-text-tertiary"
                    }`}
                  >
                    <span className="block text-xs font-bold">
                      {SESSION_KIND_LABELS[k].label}
                    </span>
                    <span className="block text-[11px] opacity-80">
                      {SESSION_KIND_LABELS[k].description}
                    </span>
                  </button>
                ))}
              </div>
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
                    {SESSION_KIND_LABELS[session.kind]?.label ?? session.kind} ·{" "}
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

              {/* Per-attendee notes and outcome */}
              <div className="mt-3 space-y-2 border-t border-wepac-border pt-3">
                <p className="text-[10px] uppercase tracking-wide text-wepac-text-tertiary">
                  Notas por participante
                </p>
                {session.attendees.map((a) => {
                  const key = attendeeKey(session.id, a.user.id);
                  const isEditingAttendee = editingAttendeeKey === key;
                  const isSavingAttendee = savingAttendeeKey === key;
                  const feedback = attendeeFeedback[key];
                  return (
                    <div
                      key={a.id}
                      className="border border-wepac-border bg-wepac-input/40 p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-medium text-wepac-white">
                          {a.user.name}
                        </p>
                        {!isEditingAttendee && (
                          <button
                            onClick={() => startEditAttendee(session.id, a)}
                            className="text-xs text-wepac-white hover:underline"
                          >
                            Editar notas
                          </button>
                        )}
                      </div>

                      {isEditingAttendee ? (
                        <div className="mt-2 space-y-2">
                          <div>
                            <label className="block text-xs text-wepac-text-tertiary">
                              Nota privada (só o mentor vê)
                            </label>
                            <textarea
                              value={attendeePrivateNote}
                              onChange={(e) => setAttendeePrivateNote(e.target.value)}
                              rows={2}
                              className="mt-1 w-full bg-wepac-input px-3 py-2 text-xs text-wepac-text-secondary"
                              placeholder="Nota privada"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-wepac-text-tertiary">
                              Nota partilhada com o membro
                            </label>
                            <textarea
                              value={attendeeSharedNote}
                              onChange={(e) => setAttendeeSharedNote(e.target.value)}
                              rows={2}
                              className="mt-1 w-full bg-wepac-input px-3 py-2 text-xs text-wepac-text-secondary"
                              placeholder="Nota partilhada"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-wepac-text-tertiary">
                              O que ficou combinado
                            </label>
                            <textarea
                              value={attendeeOutcome}
                              onChange={(e) => setAttendeeOutcome(e.target.value)}
                              rows={2}
                              className="mt-1 w-full bg-wepac-input px-3 py-2 text-xs text-wepac-text-secondary"
                              placeholder="O que ficou combinado"
                            />
                          </div>
                          <label className="flex items-center gap-1.5 text-xs text-wepac-text-tertiary">
                            <input
                              type="checkbox"
                              checked={attendeeSharedNotePublished}
                              onChange={(e) =>
                                setAttendeeSharedNotePublished(e.target.checked)
                              }
                            />
                            Publicar nota ao membro
                          </label>
                          {feedback?.type === "error" && (
                            <p className="text-xs text-wepac-error">{feedback.text}</p>
                          )}
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                handleSaveAttendeeNotes(session.id, a.user.id)
                              }
                              disabled={isSavingAttendee}
                              className="bg-wepac-white px-3 py-1.5 text-xs font-bold text-wepac-black disabled:opacity-30"
                            >
                              {isSavingAttendee ? "A guardar..." : "Guardar"}
                            </button>
                            <button
                              onClick={cancelEditAttendee}
                              disabled={isSavingAttendee}
                              className="border border-wepac-border px-3 py-1.5 text-xs text-wepac-text-secondary"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs text-wepac-text-tertiary">
                              Combinado: {a.outcome || "—"}
                            </p>
                            {taskFormKey !== key && (
                              <button
                                onClick={() => openTaskForm(session.id, a)}
                                className="shrink-0 text-xs text-wepac-white hover:underline"
                              >
                                Criar tarefa
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-wepac-text-tertiary">
                            Nota partilhada: {a.sharedNote || "—"}{" "}
                            {a.sharedNote && (
                              <span
                                className={
                                  a.sharedNotePublished
                                    ? "text-wepac-success"
                                    : "text-wepac-text-tertiary"
                                }
                              >
                                ({a.sharedNotePublished ? "publicada" : "não publicada"})
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-wepac-text-tertiary">
                            Nota privada: {a.privateNote || "—"}
                          </p>
                          {feedback?.type === "success" && (
                            <p className="text-xs text-wepac-success">{feedback.text}</p>
                          )}

                          {taskFormKey === key && (
                            <div className="mt-2 space-y-2 border-t border-wepac-border pt-2">
                              <div>
                                <label className="block text-xs text-wepac-text-tertiary">
                                  Título da tarefa
                                </label>
                                <input
                                  value={taskTitle}
                                  onChange={(e) => setTaskTitle(e.target.value)}
                                  className="mt-1 w-full bg-wepac-input px-3 py-2 text-xs text-wepac-white"
                                  placeholder="Título da tarefa"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-wepac-text-tertiary">
                                  Prazo (opcional)
                                </label>
                                <input
                                  type="date"
                                  value={taskDeadline}
                                  onChange={(e) => setTaskDeadline(e.target.value)}
                                  className="mt-1 w-full bg-wepac-input px-3 py-2 text-xs text-wepac-white"
                                />
                              </div>
                              {taskFeedback[key]?.type === "error" && (
                                <p className="text-xs text-wepac-error">
                                  {taskFeedback[key]?.text}
                                </p>
                              )}
                              <div className="flex gap-2">
                                <button
                                  onClick={() =>
                                    handleCreateTaskFromOutcome(session.id, a.user.id)
                                  }
                                  disabled={creatingTaskKey === key}
                                  className="bg-wepac-white px-3 py-1.5 text-xs font-bold text-wepac-black disabled:opacity-30"
                                >
                                  {creatingTaskKey === key
                                    ? "A criar..."
                                    : "Criar tarefa"}
                                </button>
                                <button
                                  onClick={cancelTaskForm}
                                  disabled={creatingTaskKey === key}
                                  className="border border-wepac-border px-3 py-1.5 text-xs text-wepac-text-secondary"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          )}
                          {taskFeedback[key]?.type === "success" &&
                            taskFormKey !== key && (
                              <p className="text-xs text-wepac-success">
                                {taskFeedback[key]?.text}
                              </p>
                            )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Transcrição da sessão + debrief IA */}
              <div className="mt-3 space-y-2 border-t border-wepac-border pt-3">
                <p className="text-[10px] uppercase tracking-wide text-wepac-text-tertiary">
                  Transcrição da sessão
                </p>

                {transcriptEditorSessionId === session.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={transcriptDraft}
                      onChange={(e) => setTranscriptDraft(e.target.value)}
                      rows={6}
                      placeholder="Cola aqui a transcrição da sessão (markdown/texto simples)"
                      className="w-full bg-wepac-input px-3 py-2 text-xs text-wepac-text-secondary"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".txt,.md,text/plain,text/markdown"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void handleTranscriptFile(file);
                          e.target.value = "";
                        }}
                        className="text-xs text-wepac-text-tertiary"
                      />
                      <span className="text-[10px] text-wepac-text-tertiary">
                        {transcriptDraft.length.toLocaleString("pt-PT")} /{" "}
                        {MAX_TRANSCRIPT_CHARS.toLocaleString("pt-PT")} caracteres — só
                        .txt/.md; para outros formatos, cola o texto diretamente.
                      </span>
                    </div>
                    {transcriptError && (
                      <p className="text-xs text-wepac-error">{transcriptError}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveTranscript(session.id)}
                        disabled={savingTranscriptId === session.id}
                        className="bg-wepac-white px-3 py-1.5 text-xs font-bold text-wepac-black disabled:opacity-30"
                      >
                        {savingTranscriptId === session.id
                          ? "A guardar..."
                          : "Guardar transcrição"}
                      </button>
                      <button
                        onClick={cancelTranscriptEditor}
                        disabled={savingTranscriptId === session.id}
                        className="border border-wepac-border px-3 py-1.5 text-xs text-wepac-text-secondary"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : session.transcript ? (
                  <div className="space-y-2">
                    <p className="text-xs text-wepac-text-tertiary">
                      Transcrição anexada em{" "}
                      {session.transcriptUploadedAt
                        ? new Date(session.transcriptUploadedAt).toLocaleString("pt-PT")
                        : "—"}{" "}
                      por {session.transcriptUploadedBy?.name ?? "—"}
                    </p>
                    {expandedTranscriptId === session.id && (
                      <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap bg-wepac-input/40 p-3 text-xs text-wepac-text-secondary">
                        {session.transcript}
                      </pre>
                    )}
                    <div className="flex flex-wrap gap-3 text-xs">
                      <button
                        onClick={() =>
                          setExpandedTranscriptId(
                            expandedTranscriptId === session.id ? null : session.id
                          )
                        }
                        className="text-wepac-white hover:underline"
                      >
                        {expandedTranscriptId === session.id ? "Ocultar" : "Ver"}
                      </button>
                      <button
                        onClick={() => openTranscriptEditor(session.id, session.transcript ?? "")}
                        className="text-wepac-white hover:underline"
                      >
                        Substituir
                      </button>
                      <button
                        onClick={() => handleRemoveTranscript(session.id)}
                        disabled={removingTranscriptId === session.id}
                        className="text-wepac-error hover:underline disabled:opacity-30"
                      >
                        {removingTranscriptId === session.id ? "A remover..." : "Remover"}
                      </button>
                      <Link
                        href={`/wepacker/mentor/sessions/${session.id}`}
                        className="text-wepac-white hover:underline"
                      >
                        {session.debrief ? "Ver debrief" : "Gerar debrief"}
                      </Link>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => openTranscriptEditor(session.id, "")}
                    className="border border-wepac-border px-3 py-1.5 text-xs text-wepac-text-secondary hover:text-wepac-white"
                  >
                    Colar transcrição
                  </button>
                )}
              </div>

              {/* Legacy session-level notes — read-only, no new writes */}
              {session.notes && (
                <div className="mt-3 border-t border-wepac-border pt-3">
                  <p className="text-[10px] uppercase tracking-wide text-wepac-text-tertiary">
                    Notas antigas (legacy)
                  </p>
                  <p className="mt-1 text-xs text-wepac-text-tertiary">{session.notes}</p>
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
