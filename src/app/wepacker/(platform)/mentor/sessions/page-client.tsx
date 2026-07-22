"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SessionKind, SessionStatus } from "@/lib/wepacker/types";
import { SESSION_KIND_KEYS, SESSION_KIND_LABELS } from "@/lib/wepacker/types";
import { SessionsCalendar } from "@/components/wepacker/SessionsCalendar";
import {
  createSession,
  getCycleSessionAttendeeCandidate,
  setAttendance,
  updateSession,
  updateSessionAttendee,
} from "@/lib/wepacker/actions/session";

const STATUS_LABELS: Record<SessionStatus, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No show",
};

interface AttendeeRow {
  id: string;
  attended: boolean;
  privateNote: string | null;
  sharedNote: string | null;
  sharedNotePublished: boolean;
  outcome: string | null;
  user: { id: string; name: string };
}

interface SessionRow {
  id: string;
  kind: SessionKind;
  scheduledAt: string;
  durationMinutes: number;
  status: SessionStatus;
  discussionPoints: string | null;
  meetingUrl: string | null;
  attendeeCount: number;
  attendees: AttendeeRow[];
  organizer: { id: string; name: string };
  transcriptUploadedAt: string | null;
  debrief: { id: string; contractVersion: string } | null;
}

interface MentoredMemberRow {
  id: string;
  name: string;
  email: string;
}

interface FacilitatedCycleRow {
  id: string;
  name: string;
  status: "published" | "active";
  role: "lead" | "facilitator";
}

interface MentorSessionsProps {
  sessions: SessionRow[];
  members: MentoredMemberRow[];
  facilitatedCycles: FacilitatedCycleRow[];
  currentUserId: string;
}

function toDatetimeLocalValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function sessionFormat(attendeeCount: number): string {
  return attendeeCount === 1 ? "Individual" : "Group";
}

export function MentorSessionsClient({
  sessions: rawSessions,
  members,
  facilitatedCycles,
  currentUserId,
}: MentorSessionsProps) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [view, setView] = useState<"list" | "calendar">("list");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const sessions = [...rawSessions].sort(
    (first, second) =>
      new Date(second.scheduledAt).getTime() -
      new Date(first.scheduledAt).getTime(),
  );
  const selectedSession =
    sessions.find((session) => session.id === selectedSessionId) ?? null;

  const [sessionKind, setSessionKind] = useState<SessionKind>("checkpoint");
  const [scheduledAt, setScheduledAt] = useState(
    toDatetimeLocalValue(new Date()),
  );
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [discussionPoints, setDiscussionPoints] = useState("");
  const [attendeeIds, setAttendeeIds] = useState<string[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState("");
  const [cycleCandidateEmail, setCycleCandidateEmail] = useState("");
  const [cycleCandidates, setCycleCandidates] = useState<MentoredMemberRow[]>([]);
  const [resolvingCycleCandidate, setResolvingCycleCandidate] = useState(false);
  const [cycleCandidateError, setCycleCandidateError] = useState<string | null>(
    null,
  );
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const availablePeople = Array.from(
    new Map(
      [...members, ...(selectedCycleId ? cycleCandidates : [])].map((person) => [
        person.id,
        person,
      ]),
    ).values(),
  );

  function toggleAttendee(userId: string) {
    setAttendeeIds((previous) =>
      previous.includes(userId)
        ? previous.filter((attendeeId) => attendeeId !== userId)
        : [...previous, userId],
    );
  }

  function changeSessionContext(cycleId: string) {
    setSelectedCycleId(cycleId);
    setAttendeeIds([]);
    setCycleCandidates([]);
    setCycleCandidateEmail("");
    setCycleCandidateError(null);
  }

  async function handleResolveCycleCandidate() {
    if (!selectedCycleId || !cycleCandidateEmail.trim()) return;
    setResolvingCycleCandidate(true);
    setCycleCandidateError(null);
    try {
      const candidate = await getCycleSessionAttendeeCandidate(
        selectedCycleId,
        cycleCandidateEmail,
      );
      if (!candidate) {
        setCycleCandidateError(
          "No Person was added. Check the exact account email.",
        );
        return;
      }
      setCycleCandidates((previous) =>
        previous.some(({ id }) => id === candidate.id)
          ? previous
          : [...previous, candidate],
      );
      setAttendeeIds((previous) =>
        previous.includes(candidate.id) ? previous : [...previous, candidate.id],
      );
      setCycleCandidateEmail("");
    } catch {
      setCycleCandidateError("Não foi possível adicionar esta Person.");
    } finally {
      setResolvingCycleCandidate(false);
    }
  }

  async function handleCreate() {
    if (attendeeIds.length === 0) {
      setCreateError("Choose at least one participant.");
      return;
    }
    if (!scheduledAt || Number.isNaN(new Date(scheduledAt).getTime())) {
      setCreateError("Choose a valid date and time.");
      return;
    }

    setCreating(true);
    setCreateError(null);
    try {
      await createSession({
        cycleId: selectedCycleId || undefined,
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
      setSelectedCycleId("");
      setCycleCandidates([]);
      setCycleCandidateEmail("");
      router.refresh();
    } catch (error) {
      console.error("Failed to create Session:", error);
      setCreateError("Não foi possível criar a Session. Tenta novamente.");
    } finally {
      setCreating(false);
    }
  }

  const [savingSessionId, setSavingSessionId] = useState<string | null>(null);

  async function handleStatusChange(sessionId: string, status: SessionStatus) {
    setSavingSessionId(sessionId);
    try {
      await updateSession(sessionId, { status });
      router.refresh();
    } catch (error) {
      console.error("Failed to update Session status:", error);
    } finally {
      setSavingSessionId(null);
    }
  }

  async function handleAttendance(
    sessionId: string,
    userId: string,
    attended: boolean,
  ) {
    try {
      await setAttendance(sessionId, userId, attended);
      router.refresh();
    } catch (error) {
      console.error("Failed to update attendance:", error);
    }
  }

  const [copiedLinkSessionId, setCopiedLinkSessionId] = useState<string | null>(
    null,
  );
  const [linkEditorSessionId, setLinkEditorSessionId] = useState<string | null>(
    null,
  );
  const [meetingUrlDraft, setMeetingUrlDraft] = useState("");
  const [savingMeetingUrlId, setSavingMeetingUrlId] = useState<string | null>(
    null,
  );
  const [meetingUrlError, setMeetingUrlError] = useState<string | null>(null);

  async function handleCopyMeetingUrl(sessionId: string, url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLinkSessionId(sessionId);
      setTimeout(
        () =>
          setCopiedLinkSessionId((current) =>
            current === sessionId ? null : current,
          ),
        2000,
      );
    } catch (error) {
      console.error("Failed to copy meeting link:", error);
    }
  }

  function openLinkEditor(sessionId: string, currentUrl: string) {
    setLinkEditorSessionId(sessionId);
    setMeetingUrlDraft(currentUrl);
    setMeetingUrlError(null);
  }

  async function handleSaveMeetingUrl(sessionId: string) {
    if (!meetingUrlDraft.trim()) {
      setMeetingUrlError("The link cannot be empty.");
      return;
    }
    setSavingMeetingUrlId(sessionId);
    setMeetingUrlError(null);
    try {
      await updateSession(sessionId, { meetingUrl: meetingUrlDraft.trim() });
      setLinkEditorSessionId(null);
      router.refresh();
    } catch (error) {
      console.error("Failed to update meeting link:", error);
      setMeetingUrlError("Não foi possível guardar o link.");
    } finally {
      setSavingMeetingUrlId(null);
    }
  }

  function attendeeKey(sessionId: string, userId: string): string {
    return `${sessionId}:${userId}`;
  }

  const [editingAttendeeKey, setEditingAttendeeKey] = useState<string | null>(
    null,
  );
  const [attendeePrivateNote, setAttendeePrivateNote] = useState("");
  const [attendeeSharedNote, setAttendeeSharedNote] = useState("");
  const [attendeeOutcome, setAttendeeOutcome] = useState("");
  const [attendeeSharedNotePublished, setAttendeeSharedNotePublished] =
    useState(false);
  const [savingAttendeeKey, setSavingAttendeeKey] = useState<string | null>(
    null,
  );
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
    setAttendeeFeedback((previous) => ({ ...previous, [key]: undefined }));
  }

  async function handleSaveAttendeeNotes(sessionId: string, userId: string) {
    const key = attendeeKey(sessionId, userId);
    setSavingAttendeeKey(key);
    setAttendeeFeedback((previous) => ({ ...previous, [key]: undefined }));
    try {
      await updateSessionAttendee(sessionId, userId, {
        privateNote: attendeePrivateNote,
        sharedNote: attendeeSharedNote,
        outcome: attendeeOutcome,
        sharedNotePublished: attendeeSharedNotePublished,
      });
      setAttendeeFeedback((previous) => ({
        ...previous,
        [key]: { type: "success", text: "Notes saved." },
      }));
      setEditingAttendeeKey(null);
      router.refresh();
    } catch (error) {
      console.error("Failed to save attendee notes:", error);
      setAttendeeFeedback((previous) => ({
        ...previous,
        [key]: { type: "error", text: "Não foi possível guardar as notas." },
      }));
    } finally {
      setSavingAttendeeKey(null);
    }
  }

  function renderSessionCard(session: SessionRow) {
    const attendeeNames = session.attendees
      .map((attendee) => attendee.user.name)
      .join(", ");
    return (
      <article
        key={session.id}
        className="border border-wepac-border bg-wepac-card p-4"
      >
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
              {sessionFormat(session.attendeeCount)} ·{" "}
              {SESSION_KIND_LABELS[session.kind]?.label ?? session.kind} ·{" "}
              {attendeeNames} · {session.durationMinutes} min
            </p>
            {session.discussionPoints && (
              <p className="mt-1 text-xs text-wepac-text-tertiary">
                Discussion: {session.discussionPoints}
              </p>
            )}
          </div>
          <select
            aria-label="Session status"
            value={session.status}
            onChange={(event) =>
              handleStatusChange(session.id, event.target.value as SessionStatus)
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
            {(Object.keys(STATUS_LABELS) as SessionStatus[]).map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3 border-t border-wepac-border pt-3">
          {linkEditorSessionId === session.id ? (
            <div className="space-y-2">
              <label className="block text-xs text-wepac-text-tertiary">
                Video call link
              </label>
              <input
                value={meetingUrlDraft}
                onChange={(event) => setMeetingUrlDraft(event.target.value)}
                placeholder="https://..."
                className="w-full bg-wepac-input px-3 py-2 text-xs text-wepac-white"
              />
              {meetingUrlError && (
                <p className="text-xs text-wepac-error">{meetingUrlError}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => handleSaveMeetingUrl(session.id)}
                  disabled={savingMeetingUrlId === session.id}
                  className="bg-wepac-white px-3 py-1.5 text-xs font-bold text-wepac-black disabled:opacity-30"
                >
                  {savingMeetingUrlId === session.id ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => setLinkEditorSessionId(null)}
                  className="border border-wepac-border px-3 py-1.5 text-xs text-wepac-text-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3 text-xs">
              {session.meetingUrl && (
                <>
                  <a
                    href={session.meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-wepac-white hover:underline"
                  >
                    Join call →
                  </a>
                  <button
                    onClick={() =>
                      handleCopyMeetingUrl(session.id, session.meetingUrl!)
                    }
                    className="text-wepac-text-secondary hover:underline"
                  >
                    {copiedLinkSessionId === session.id ? "Copied" : "Copy link"}
                  </button>
                </>
              )}
              <button
                onClick={() =>
                  openLinkEditor(session.id, session.meetingUrl ?? "")
                }
                className="text-wepac-text-secondary hover:underline"
              >
                {session.meetingUrl ? "Replace link" : "Add link"}
              </button>
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-3 border-t border-wepac-border pt-3">
          {session.attendees.map((attendee) => (
            <label
              key={attendee.id}
              className="flex items-center gap-1.5 text-xs text-wepac-text-tertiary"
            >
              <input
                type="checkbox"
                checked={attendee.attended}
                onChange={(event) =>
                  handleAttendance(
                    session.id,
                    attendee.user.id,
                    event.target.checked,
                  )
                }
              />
              {attendee.user.name} attended
            </label>
          ))}
        </div>

        <div className="mt-3 space-y-2 border-t border-wepac-border pt-3">
          <p className="text-[10px] uppercase tracking-wide text-wepac-text-tertiary">
            Notes by participant
          </p>
          {session.attendees.map((attendee) => {
            const key = attendeeKey(session.id, attendee.user.id);
            const isEditing = editingAttendeeKey === key;
            const feedback = attendeeFeedback[key];
            return (
              <div key={attendee.id} className="border border-wepac-border bg-wepac-input/40 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-wepac-white">
                    {attendee.user.name}
                  </p>
                  {!isEditing && (
                    <button
                      onClick={() => startEditAttendee(session.id, attendee)}
                      className="text-xs text-wepac-white hover:underline"
                    >
                      Edit notes
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="mt-2 space-y-2">
                    <label className="block text-xs text-wepac-text-tertiary">
                      Private note
                      <textarea
                        value={attendeePrivateNote}
                        onChange={(event) => setAttendeePrivateNote(event.target.value)}
                        rows={2}
                        className="mt-1 w-full bg-wepac-input px-3 py-2 text-xs text-wepac-text-secondary"
                      />
                    </label>
                    <label className="block text-xs text-wepac-text-tertiary">
                      Shared note
                      <textarea
                        value={attendeeSharedNote}
                        onChange={(event) => setAttendeeSharedNote(event.target.value)}
                        rows={2}
                        className="mt-1 w-full bg-wepac-input px-3 py-2 text-xs text-wepac-text-secondary"
                      />
                    </label>
                    <label className="block text-xs text-wepac-text-tertiary">
                      Agreed outcome
                      <textarea
                        value={attendeeOutcome}
                        onChange={(event) => setAttendeeOutcome(event.target.value)}
                        rows={2}
                        className="mt-1 w-full bg-wepac-input px-3 py-2 text-xs text-wepac-text-secondary"
                      />
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-wepac-text-tertiary">
                      <input
                        type="checkbox"
                        checked={attendeeSharedNotePublished}
                        onChange={(event) =>
                          setAttendeeSharedNotePublished(event.target.checked)
                        }
                      />
                      Publish shared note to participant
                    </label>
                    {feedback?.type === "error" && (
                      <p className="text-xs text-wepac-error">{feedback.text}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleSaveAttendeeNotes(session.id, attendee.user.id)
                        }
                        disabled={savingAttendeeKey === key}
                        className="bg-wepac-white px-3 py-1.5 text-xs font-bold text-wepac-black disabled:opacity-30"
                      >
                        {savingAttendeeKey === key ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={() => setEditingAttendeeKey(null)}
                        className="border border-wepac-border px-3 py-1.5 text-xs text-wepac-text-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 space-y-1 text-xs text-wepac-text-tertiary">
                    <p>Outcome: {attendee.outcome || "—"}</p>
                    <p>
                      Shared note: {attendee.sharedNote || "—"}{" "}
                      {attendee.sharedNote &&
                        (attendee.sharedNotePublished ? "(published)" : "(private draft)")}
                    </p>
                    <p>Private note: {attendee.privateNote || "—"}</p>
                    {feedback?.type === "success" && (
                      <p className="text-wepac-success">{feedback.text}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-wepac-border pt-3">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-wepac-text-tertiary">
              Session Transcript
            </p>
            <p className="mt-1 text-xs text-wepac-text-tertiary">
              {session.transcriptUploadedAt
                ? `Attached ${new Date(session.transcriptUploadedAt).toLocaleString("pt-PT")}`
                : "No transcript attached"}
            </p>
          </div>
          {session.organizer.id === currentUserId ? (
            <Link
              href={`/wepacker/mentor/sessions/${session.id}`}
              className="border border-wepac-border px-3 py-1.5 text-xs text-wepac-text-secondary hover:text-wepac-white"
            >
              {session.transcriptUploadedAt
                ? session.debrief?.contractVersion ===
                  "wepac-session-debrief-v3"
                  ? "Open Debrief"
                  : "Open Transcript"
                : "Attach Transcript"}
            </Link>
          ) : (
            <span className="border border-wepac-border px-3 py-1.5 text-xs text-wepac-text-tertiary">
              Organizer only
            </span>
          )}
        </div>
      </article>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-barlow text-2xl font-bold text-wepac-white">Sessions</h1>
          <p className="mt-1 text-sm text-wepac-text-tertiary">
            Manage Sessions through accepted Mentorships or active Cycle
            Facilitation. Every participant is chosen explicitly.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1">
            {(["list", "calendar"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setView(tab)}
                className={`px-4 py-2 text-sm capitalize transition-colors ${
                  view === tab
                    ? "bg-wepac-white text-wepac-black"
                    : "bg-wepac-card text-wepac-text-tertiary hover:text-wepac-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          {(members.length > 0 || facilitatedCycles.length > 0) && (
            <button
              onClick={() => setShowCreate((visible) => !visible)}
              className="bg-wepac-white px-4 py-2 text-sm font-bold text-wepac-black"
            >
              + New Session
            </button>
          )}
        </div>
      </header>

      {showCreate && (
        <section className="mt-6 border border-wepac-white/20 bg-wepac-card p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-wepac-white">Create Session</h2>
              <p className="mt-1 text-xs text-wepac-text-tertiary">
                {attendeeIds.length === 0
                  ? "Choose participants to set the format."
                  : `${sessionFormat(attendeeIds.length)} · ${attendeeIds.length} participant${attendeeIds.length === 1 ? "" : "s"}`}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs text-wepac-text-tertiary">
                Session context
              </label>
              <select
                value={selectedCycleId}
                onChange={(event) => changeSessionContext(event.target.value)}
                className="mt-1 w-full bg-wepac-input px-3 py-2 text-sm text-wepac-white"
              >
                <option value="">Accepted Mentorships</option>
                {facilitatedCycles.map((cycle) => (
                  <option key={cycle.id} value={cycle.id}>
                    Cycle · {cycle.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-wepac-text-tertiary">
                Context authorizes this organizer only. It never adds attendees.
              </p>
            </div>
            <div>
              <label className="block text-xs text-wepac-text-tertiary">Date and time</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(event) => setScheduledAt(event.target.value)}
                className="mt-1 w-full bg-wepac-input px-3 py-2 text-sm text-wepac-white"
              />
            </div>
            <div>
              <label className="block text-xs text-wepac-text-tertiary">Duration (min)</label>
              <input
                type="number"
                min={15}
                step={15}
                value={durationMinutes}
                onChange={(event) => setDurationMinutes(Number(event.target.value))}
                className="mt-1 w-full bg-wepac-input px-3 py-2 text-sm text-wepac-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-wepac-text-tertiary">Session purpose</label>
              <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {SESSION_KIND_KEYS.map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => setSessionKind(kind)}
                    className={`px-3 py-2 text-left transition-colors ${
                      sessionKind === kind
                        ? "bg-wepac-white text-wepac-black"
                        : "bg-wepac-input text-wepac-text-tertiary"
                    }`}
                  >
                    <span className="block text-xs font-bold">
                      {SESSION_KIND_LABELS[kind].label}
                    </span>
                    <span className="block text-[11px] opacity-80">
                      {SESSION_KIND_LABELS[kind].description}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-wepac-text-tertiary">Participants</label>
              <div className="mt-1 flex flex-wrap gap-2">
                {availablePeople.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => toggleAttendee(member.id)}
                    className={`px-3 py-1.5 text-xs transition-colors ${
                      attendeeIds.includes(member.id)
                        ? "bg-wepac-white text-wepac-black"
                        : "bg-wepac-input text-wepac-text-tertiary"
                    }`}
                  >
                    {member.name} · {member.email}
                  </button>
                ))}
                {availablePeople.length === 0 && !selectedCycleId && (
                  <p className="text-xs text-wepac-text-tertiary">
                    No accepted Mentees available. Create a Mentorship first.
                  </p>
                )}
              </div>
              {selectedCycleId && (
                <div className="mt-3">
                  <p className="text-[11px] text-wepac-text-tertiary">
                    Add a known Person by exact account email. Cycle Enrollment is
                    not required and is not created.
                  </p>
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                    <input
                      type="email"
                      value={cycleCandidateEmail}
                      onChange={(event) => setCycleCandidateEmail(event.target.value)}
                      placeholder="person@example.com"
                      className="min-w-0 flex-1 bg-wepac-input px-3 py-2 text-sm text-wepac-white"
                    />
                    <button
                      type="button"
                      onClick={handleResolveCycleCandidate}
                      disabled={
                        resolvingCycleCandidate || !cycleCandidateEmail.trim()
                      }
                      className="border border-wepac-border px-4 py-2 text-xs text-wepac-white disabled:opacity-30"
                    >
                      {resolvingCycleCandidate ? "Adding…" : "Add Person"}
                    </button>
                  </div>
                  {cycleCandidateError && (
                    <p className="mt-2 text-xs text-wepac-error">
                      {cycleCandidateError}
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-wepac-text-tertiary">
                Discussion points (optional)
              </label>
              <textarea
                value={discussionPoints}
                onChange={(event) => setDiscussionPoints(event.target.value)}
                rows={2}
                className="mt-1 w-full bg-wepac-input px-3 py-2 text-sm text-wepac-white"
              />
            </div>
          </div>
          {createError && <p className="mt-3 text-xs text-wepac-error">{createError}</p>}
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleCreate}
              disabled={creating || attendeeIds.length === 0}
              className="bg-wepac-white px-4 py-2 text-sm font-bold text-wepac-black disabled:opacity-30"
            >
              {creating ? "Creating..." : "Create"}
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="border border-wepac-border px-4 py-2 text-sm text-wepac-text-secondary"
            >
              Cancel
            </button>
          </div>
        </section>
      )}

      {view === "calendar" ? (
        <div className="mt-8">
          <SessionsCalendar
            sessions={sessions}
            selectedId={selectedSessionId}
            onSelect={setSelectedSessionId}
          />
          <div className="mt-6 space-y-3">
            {selectedSession ? (
              renderSessionCard(selectedSession)
            ) : (
              <p className="text-sm text-wepac-text-tertiary">
                Select a Session to see its details.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {sessions.map((session) => renderSessionCard(session))}
          {sessions.length === 0 && (
            <p className="text-sm text-wepac-text-tertiary">No Sessions yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
