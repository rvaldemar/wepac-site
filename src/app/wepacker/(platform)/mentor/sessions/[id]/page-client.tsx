"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  SessionKind,
  SessionStatus,
  PillarKey,
} from "@/lib/wepacker/types";
import { PILLAR_LABELS, SESSION_KIND_LABELS } from "@/lib/wepacker/types";
import { updateSessionAttendee } from "@/lib/wepacker/actions/session";
import {
  attachSessionTranscript,
  clearSessionTranscript,
} from "@/lib/wepacker/actions/session-transcript";
import { generateSessionDebrief } from "@/lib/wepacker/actions/debrief";
import type { SessionDebriefView } from "@/lib/wepacker/actions/debrief";
import { MAX_TRANSCRIPT_CHARS } from "@/lib/wepacker/debrief/types";
import type {
  PillarObservation,
  PerAttendeeDebrief,
} from "@/lib/wepacker/debrief/types";
import {
  readTranscriptFile,
  TRANSCRIPT_FILE_ACCEPT,
  TRANSCRIPT_FILE_FORMATS,
} from "@/lib/wepacker/transcript-file";

interface AttendeeRow {
  id: string;
  attended: boolean;
  privateNote: string | null;
  sharedNote: string | null;
  sharedNotePublished: boolean;
  outcome: string | null;
  user: { id: string; name: string };
}

interface SessionDetail {
  id: string;
  kind: SessionKind;
  scheduledAt: string;
  status: SessionStatus;
  discussionPoints: string | null;
  meetingUrl: string | null;
  transcript: string | null;
  transcriptUploadedAt: string | null;
  attendees: AttendeeRow[];
  organizer: { id: string; name: string };
}

interface Props {
  session: SessionDetail;
  debrief: SessionDebriefView | null;
  transcriptWritesEnabled: boolean;
  debriefGenerationEnabled: boolean;
}

function attendeeKey(userId: string): string {
  return userId;
}

function DebriefGenerationUnavailable() {
  return (
    <p className="mt-4 border border-wepac-border bg-wepac-input/40 p-3 text-xs leading-relaxed text-wepac-text-tertiary">
      Debrief generation is unavailable until W01 v3 is published and certified.
      The Transcript remains private to the Session organizer.
    </p>
  );
}

export function SessionDebriefClient({
  session,
  debrief: initialDebrief,
  transcriptWritesEnabled,
  debriefGenerationEnabled,
}: Props) {
  const router = useRouter();
  const [debrief, setDebrief] = useState<SessionDebriefView | null>(
    initialDebrief,
  );
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [editingTranscript, setEditingTranscript] = useState(
    transcriptWritesEnabled && !session.transcript,
  );
  const [transcriptText, setTranscriptText] = useState<string | null>(
    session.transcript,
  );
  const [transcriptDraft, setTranscriptDraft] = useState(
    session.transcript ?? "",
  );
  const [transcriptFileName, setTranscriptFileName] = useState<string | null>(
    null,
  );
  const [transcriptError, setTranscriptError] = useState<string | null>(null);
  const [savingTranscript, setSavingTranscript] = useState(false);
  const [removingTranscript, setRemovingTranscript] = useState(false);

  // ===== Per-attendee suggestion editing =====
  const [editedOutcome, setEditedOutcome] = useState<Record<string, string>>(
    {},
  );
  const [editedSharedNote, setEditedSharedNote] = useState<
    Record<string, string>
  >({});
  const [publishOnApprove, setPublishOnApprove] = useState<
    Record<string, boolean>
  >({});
  const [savingAttendeeKey, setSavingAttendeeKey] = useState<string | null>(
    null,
  );
  const [attendeeFeedback, setAttendeeFeedback] = useState<
    Record<string, { type: "success" | "error"; text: string } | undefined>
  >({});
  // ===== Meeting link: copy-to-clipboard feedback (PT-PT), same pattern
  // as the sessions list card — see mentor/sessions/page-client.tsx.
  const [copiedMeetingLink, setCopiedMeetingLink] = useState(false);

  async function handleCopyMeetingUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedMeetingLink(true);
      setTimeout(() => setCopiedMeetingLink(false), 2000);
    } catch (e) {
      console.error("Failed to copy meeting link:", e);
    }
  }

  async function handleTranscriptFile(file: File) {
    setTranscriptError(null);
    try {
      setTranscriptDraft(await readTranscriptFile(file));
      setTranscriptFileName(file.name);
    } catch (error) {
      setTranscriptFileName(null);
      setTranscriptError(
        error instanceof Error
          ? error.message
          : "Não foi possível ler o ficheiro.",
      );
    }
  }

  async function handleSaveTranscript() {
    if (transcriptText && debrief) {
      const confirmed = window.confirm(
        "Replacing this transcript deletes the current Debrief and any unapplied suggestions. Continue?",
      );
      if (!confirmed) return;
    }

    setSavingTranscript(true);
    setTranscriptError(null);
    try {
      await attachSessionTranscript(session.id, transcriptDraft);
      setDebrief(null);
      setTranscriptText(transcriptDraft.trim());
      setEditingTranscript(false);
      router.refresh();
    } catch (error) {
      setTranscriptError(
        error instanceof Error
          ? error.message
          : "Não foi possível guardar a transcript.",
      );
    } finally {
      setSavingTranscript(false);
    }
  }

  async function handleRemoveTranscript() {
    const confirmed = window.confirm(
      "Isto apaga a transcript e qualquer debrief gerado a partir dela. Continuar?",
    );
    if (!confirmed) return;

    setRemovingTranscript(true);
    setTranscriptError(null);
    try {
      await clearSessionTranscript(session.id);
      setDebrief(null);
      setTranscriptText(null);
      setTranscriptDraft("");
      setTranscriptFileName(null);
      setEditingTranscript(true);
      router.refresh();
    } catch (error) {
      setTranscriptError(
        error instanceof Error
          ? error.message
          : "Não foi possível remover a transcript.",
      );
    } finally {
      setRemovingTranscript(false);
    }
  }

  function suggestionFor(userId: string): PerAttendeeDebrief | undefined {
    const attendeeRef = session.attendees.find((a) => a.user.id === userId)?.id;
    return debrief?.perAttendee.find((p) => p.attendeeRef === attendeeRef);
  }

  function outcomeValue(userId: string): string {
    if (userId in editedOutcome) return editedOutcome[userId];
    return suggestionFor(userId)?.outcomeSuggestion ?? "";
  }

  function sharedNoteValue(userId: string): string {
    if (userId in editedSharedNote) return editedSharedNote[userId];
    return suggestionFor(userId)?.sharedNoteSuggestion ?? "";
  }

  async function handleGenerate(force: boolean) {
    if (!debriefGenerationEnabled) return;
    if (force) {
      const anyUnapplied = session.attendees.some((a) => {
        const suggestion = suggestionFor(a.user.id);
        if (!suggestion) return false;
        return (
          suggestion.outcomeSuggestion !== (a.outcome ?? "") ||
          suggestion.sharedNoteSuggestion !== (a.sharedNote ?? "")
        );
      });
      if (anyUnapplied) {
        const confirmed = window.confirm(
          "Ainda há sugestões por aplicar nesta sessão. Gerar um novo debrief descarta o atual. Continuar?",
        );
        if (!confirmed) return;
      }
    }
    setGenerating(true);
    setGenerateError(null);
    try {
      const result = await generateSessionDebrief(
        session.id,
        force ? { force: true } : undefined,
      );
      setDebrief(result);
      setEditedOutcome({});
      setEditedSharedNote({});
      router.refresh();
    } catch (e) {
      setGenerateError(
        e instanceof Error
          ? e.message
          : "Não foi possível gerar o debrief. Tenta novamente.",
      );
    } finally {
      setGenerating(false);
    }
  }

  async function handleApproveOutcome(userId: string) {
    const key = attendeeKey(userId);
    setSavingAttendeeKey(`${key}:outcome`);
    setAttendeeFeedback((prev) => ({ ...prev, [`${key}:outcome`]: undefined }));
    try {
      await updateSessionAttendee(session.id, userId, {
        outcome: outcomeValue(userId),
      });
      setAttendeeFeedback((prev) => ({
        ...prev,
        [`${key}:outcome`]: { type: "success", text: "Aplicado." },
      }));
      router.refresh();
    } catch (e) {
      console.error("Failed to approve outcome suggestion:", e);
      setAttendeeFeedback((prev) => ({
        ...prev,
        [`${key}:outcome`]: {
          type: "error",
          text: "Erro ao aplicar. Tenta novamente.",
        },
      }));
    } finally {
      setSavingAttendeeKey(null);
    }
  }

  async function handleApproveSharedNote(userId: string) {
    const key = attendeeKey(userId);
    setSavingAttendeeKey(`${key}:sharedNote`);
    setAttendeeFeedback((prev) => ({
      ...prev,
      [`${key}:sharedNote`]: undefined,
    }));
    try {
      await updateSessionAttendee(session.id, userId, {
        sharedNote: sharedNoteValue(userId),
        sharedNotePublished: publishOnApprove[userId] ?? false,
      });
      setAttendeeFeedback((prev) => ({
        ...prev,
        [`${key}:sharedNote`]: { type: "success", text: "Aplicado." },
      }));
      router.refresh();
    } catch (e) {
      console.error("Failed to approve shared-note suggestion:", e);
      setAttendeeFeedback((prev) => ({
        ...prev,
        [`${key}:sharedNote`]: {
          type: "error",
          text: "Erro ao aplicar. Tenta novamente.",
        },
      }));
    } finally {
      setSavingAttendeeKey(null);
    }
  }

  function copyInternalSynthesis() {
    if (!debrief?.internalSynthesis) return;
    const synthesis = debrief.internalSynthesis;
    const lines = [
      `Resumo: ${synthesis.sessionSummary}`,
      "",
      "Pillars:",
      ...Object.entries(synthesis.pillarObservations).map(
        ([pillar, observation]: [string, PillarObservation]) =>
          `- ${PILLAR_LABELS[pillar as PillarKey]} (${observation.signal}): ${observation.evidence}`,
      ),
      "",
      synthesis.disciplineObservations
        ? `Discipline: ${synthesis.disciplineObservations}`
        : "",
      "",
      "Riscos:",
      ...synthesis.risks.map((risk) => `- ${risk}`),
      "",
      "Próximos passos recomendados:",
      ...synthesis.recommendedFollowUps.map((item) => `- ${item}`),
    ];
    void navigator.clipboard.writeText(lines.join("\n"));
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-barlow text-2xl font-bold text-wepac-white">
            Session Workspace
          </h1>
          <p className="mt-1 text-sm text-wepac-text-tertiary">
            {new Date(session.scheduledAt).toLocaleDateString("pt-PT")} ·{" "}
            {SESSION_KIND_LABELS[session.kind]?.label ?? session.kind} ·{" "}
            {session.attendees.map((a) => a.user.name).join(", ")}
          </p>
          {session.meetingUrl && (
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
              <a
                href={session.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-wepac-white hover:underline"
              >
                Entrar na chamada →
              </a>
              <button
                onClick={() => handleCopyMeetingUrl(session.meetingUrl!)}
                className="text-wepac-text-secondary hover:underline"
              >
                {copiedMeetingLink ? "Link copiado!" : "Copiar link"}
              </button>
            </div>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-wepac-text-tertiary">
              Preview attendee view:
            </span>
            {session.attendees.map((attendee) => (
              <Link
                key={attendee.user.id}
                href={`/wepacker/mentor/sessions/${session.id}/preview/${attendee.user.id}`}
                className="text-wepac-white hover:underline"
              >
                {attendee.user.name}
              </Link>
            ))}
          </div>
        </div>
        <Link
          href="/wepacker/mentor/sessions"
          className="text-xs text-wepac-text-tertiary hover:text-wepac-white hover:underline"
        >
          Back to Sessions
        </Link>
      </div>

      {/* Transcript capture lives in the Session workspace itself. Files are
          read as text in the browser; only validated text reaches the server. */}
      {!transcriptWritesEnabled && (
        <div className="mt-8 border border-wepac-border bg-wepac-card p-6">
          <h2 className="text-sm font-bold text-wepac-white">
            Session Transcript
          </h2>
          <p className="mt-2 text-xs text-wepac-text-tertiary">
            New Transcript attachments and replacements are temporarily
            unavailable while Session-specific consent, age or Parent/Guardian
            evidence, and retention controls are being formalized. An existing
            Transcript can still be removed below.
          </p>
        </div>
      )}

      {transcriptWritesEnabled && editingTranscript && (
        <div className="mt-8 border border-wepac-border bg-wepac-card p-6">
          <h2 className="text-sm font-bold text-wepac-white">
            {transcriptText
              ? "Replace Session Transcript"
              : "Attach Session Transcript"}
          </h2>
          <p className="mt-1 text-xs text-wepac-text-tertiary">
            Escolhe um ficheiro de texto ou cola a transcript. O ficheiro
            original não é guardado; apenas o texto privado desta Session.
          </p>
          <textarea
            value={transcriptDraft}
            onChange={(event) => {
              setTranscriptDraft(event.target.value);
              setTranscriptFileName(null);
            }}
            rows={10}
            placeholder="Cola aqui a Session Transcript"
            className="mt-4 w-full bg-wepac-input px-3 py-2 text-xs text-wepac-text-secondary"
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <label className="cursor-pointer border border-wepac-border px-3 py-1.5 text-xs text-wepac-text-secondary hover:text-wepac-white">
              Attach file
              <input
                type="file"
                accept={TRANSCRIPT_FILE_ACCEPT}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleTranscriptFile(file);
                  event.target.value = "";
                }}
                className="sr-only"
              />
            </label>
            <span className="text-[10px] text-wepac-text-tertiary">
              {transcriptFileName ?? TRANSCRIPT_FILE_FORMATS} ·{" "}
              {transcriptDraft.length.toLocaleString("pt-PT")} /{" "}
              {MAX_TRANSCRIPT_CHARS.toLocaleString("pt-PT")} caracteres
            </span>
          </div>
          {transcriptError && (
            <p className="mt-3 text-xs text-wepac-error">{transcriptError}</p>
          )}
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleSaveTranscript}
              disabled={savingTranscript || !transcriptDraft.trim()}
              className="bg-wepac-white px-4 py-2 text-sm font-bold text-wepac-black disabled:opacity-30"
            >
              {savingTranscript ? "A guardar..." : "Save Transcript"}
            </button>
            {transcriptText && (
              <button
                onClick={() => {
                  setTranscriptDraft(transcriptText);
                  setTranscriptFileName(null);
                  setTranscriptError(null);
                  setEditingTranscript(false);
                }}
                disabled={savingTranscript}
                className="border border-wepac-border px-4 py-2 text-sm text-wepac-text-secondary"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      )}

      {transcriptText && !editingTranscript && (
        <div className="mt-8 border border-wepac-border bg-wepac-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-wepac-white">
                Session Transcript
              </h2>
              <p className="mt-1 text-xs text-wepac-text-tertiary">
                {session.transcriptUploadedAt
                  ? `Attached ${new Date(session.transcriptUploadedAt).toLocaleString("pt-PT")}`
                  : "Attached to this Session"}
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-xs">
              {transcriptWritesEnabled && (
                <button
                  onClick={() => {
                    setTranscriptDraft(transcriptText);
                    setTranscriptError(null);
                    setEditingTranscript(true);
                  }}
                  className="text-wepac-white hover:underline"
                >
                  Replace
                </button>
              )}
              <button
                onClick={handleRemoveTranscript}
                disabled={removingTranscript}
                className="text-wepac-error hover:underline disabled:opacity-30"
              >
                {removingTranscript ? "A remover..." : "Remove"}
              </button>
            </div>
          </div>
          <pre className="mt-4 max-h-48 overflow-y-auto whitespace-pre-wrap bg-wepac-input/40 p-3 text-xs text-wepac-text-secondary">
            {transcriptText}
          </pre>
          {!debrief && (
            debriefGenerationEnabled ? (
              <>
                {generateError && (
                  <p className="mt-3 text-xs text-wepac-error">{generateError}</p>
                )}
                <button
                  onClick={() => handleGenerate(false)}
                  disabled={generating}
                  className="mt-4 bg-wepac-white px-4 py-2 text-sm font-bold text-wepac-black disabled:opacity-30"
                >
                  {generating
                    ? "A gerar debrief... (pode demorar até 30s)"
                    : "Generate Debrief"}
                </button>
                {generateError && (
                  <button
                    onClick={() => handleGenerate(false)}
                    className="ml-2 mt-4 border border-wepac-border px-4 py-2 text-sm text-wepac-text-secondary"
                  >
                    Tentar novamente
                  </button>
                )}
              </>
            ) : (
              <DebriefGenerationUnavailable />
            )
          )}
        </div>
      )}

      {/* Loaded */}
      {debrief && debrief.status === "failed" && (
        <div className="mt-8 border border-wepac-error bg-wepac-card p-6">
          <p className="text-sm text-wepac-error">
            {debrief.error ?? "Erro ao gerar debrief."}
          </p>
          {debriefGenerationEnabled ? (
            <button
              onClick={() => handleGenerate(true)}
              disabled={generating}
              className="mt-4 bg-wepac-white px-4 py-2 text-sm font-bold text-wepac-black disabled:opacity-30"
            >
              {generating ? "A gerar debrief..." : "Tentar novamente"}
            </button>
          ) : (
            <DebriefGenerationUnavailable />
          )}
        </div>
      )}

      {debrief && debrief.status === "ready" && (
        <div className="mt-8 space-y-6">
          {/* a. Per-attendee */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-wepac-white">
              Sugestões por participante
            </h2>
            {session.attendees.map((a) => {
              const suggestion = suggestionFor(a.user.id);
              const outcomeFeedback = attendeeFeedback[`${a.user.id}:outcome`];
              const sharedNoteFeedback =
                attendeeFeedback[`${a.user.id}:sharedNote`];
              return (
                <div
                  key={a.id}
                  className="border border-wepac-border bg-wepac-card p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-wepac-white">
                      {a.user.name}
                    </p>
                    {suggestion && (
                      <span className="text-[10px] uppercase text-wepac-text-tertiary">
                        confiança: {suggestion.confidence}
                      </span>
                    )}
                  </div>

                  {!suggestion ? (
                    <p className="mt-2 text-xs text-wepac-text-tertiary">
                      Sem sugestão para este participante.
                    </p>
                  ) : (
                    <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs text-wepac-text-tertiary">
                          Combinado — sugestão
                        </label>
                        <textarea
                          value={outcomeValue(a.user.id)}
                          onChange={(e) =>
                            setEditedOutcome((prev) => ({
                              ...prev,
                              [a.user.id]: e.target.value,
                            }))
                          }
                          rows={3}
                          className="mt-1 w-full bg-wepac-input px-3 py-2 text-xs text-wepac-white"
                        />
                        <p className="mt-1 text-[10px] text-wepac-text-tertiary">
                          Atual: {a.outcome || "—"}
                        </p>
                        {outcomeFeedback?.type === "error" && (
                          <p className="text-xs text-wepac-error">
                            {outcomeFeedback.text}
                          </p>
                        )}
                        {outcomeFeedback?.type === "success" && (
                          <p className="text-xs text-wepac-success">
                            {outcomeFeedback.text}
                          </p>
                        )}
                        <button
                          onClick={() => handleApproveOutcome(a.user.id)}
                          disabled={
                            savingAttendeeKey === `${a.user.id}:outcome`
                          }
                          className="mt-2 bg-wepac-white px-3 py-1.5 text-xs font-bold text-wepac-black disabled:opacity-30"
                        >
                          Aprovar
                        </button>
                      </div>
                      <div>
                        <label className="block text-xs text-wepac-text-tertiary">
                          Nota partilhada — sugestão
                        </label>
                        <textarea
                          value={sharedNoteValue(a.user.id)}
                          onChange={(e) =>
                            setEditedSharedNote((prev) => ({
                              ...prev,
                              [a.user.id]: e.target.value,
                            }))
                          }
                          rows={3}
                          className="mt-1 w-full bg-wepac-input px-3 py-2 text-xs text-wepac-white"
                        />
                        <p className="mt-1 text-[10px] text-wepac-text-tertiary">
                          Atual: {a.sharedNote || "—"}{" "}
                          {a.sharedNote &&
                            (a.sharedNotePublished
                              ? "(publicada)"
                              : "(não publicada)")}
                        </p>
                        <label className="mt-1 flex items-center gap-1.5 text-[10px] text-wepac-text-tertiary">
                          <input
                            type="checkbox"
                            checked={publishOnApprove[a.user.id] ?? false}
                            onChange={(e) =>
                              setPublishOnApprove((prev) => ({
                                ...prev,
                                [a.user.id]: e.target.checked,
                              }))
                            }
                          />
                          Publicar imediatamente
                        </label>
                        {sharedNoteFeedback?.type === "error" && (
                          <p className="text-xs text-wepac-error">
                            {sharedNoteFeedback.text}
                          </p>
                        )}
                        {sharedNoteFeedback?.type === "success" && (
                          <p className="text-xs text-wepac-success">
                            {sharedNoteFeedback.text}
                          </p>
                        )}
                        <button
                          onClick={() => handleApproveSharedNote(a.user.id)}
                          disabled={
                            savingAttendeeKey === `${a.user.id}:sharedNote`
                          }
                          className="mt-2 bg-wepac-white px-3 py-1.5 text-xs font-bold text-wepac-black disabled:opacity-30"
                        >
                          Aprovar
                        </button>
                      </div>
                    </div>
                  )}

                  {suggestion && suggestion.actions.length > 0 && (
                      <div className="mt-3 space-y-2 border-t border-wepac-border pt-3">
                        <p className="text-[10px] uppercase tracking-wide text-wepac-text-tertiary">
                          Action proposals
                        </p>
                        <p className="text-[10px] text-wepac-text-tertiary">
                          Proposals only. Nothing is assigned, persisted or
                          delivered automatically.
                        </p>
                        {suggestion.actions.map((action, index) => (
                            <div
                              key={`${a.id}:${index}`}
                              className="bg-wepac-input/40 p-2"
                            >
                              <p className="text-xs text-wepac-white">
                                {action.title}
                              </p>
                              {action.description && (
                                <p className="text-[10px] text-wepac-text-tertiary">
                                  {action.description}
                                </p>
                              )}
                              {action.dueDate && (
                                <p className="text-[10px] text-wepac-text-tertiary">
                                  Due: {action.dueDate}
                                </p>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                </div>
              );
            })}
          </div>

          {debrief.internalSynthesis && (
            <div className="border border-wepac-border bg-wepac-card p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-wepac-white">
                  Internal synthesis
                </h2>
                <button
                  onClick={copyInternalSynthesis}
                  className="text-xs text-wepac-white hover:underline"
                >
                  Copiar
                </button>
              </div>
              <p className="mt-2 text-xs text-wepac-text-secondary">
                {debrief.internalSynthesis.sessionSummary}
              </p>
              <div className="mt-3 space-y-1">
                {Object.entries(debrief.internalSynthesis.pillarObservations).map(
                  ([pillar, observation]: [string, PillarObservation]) => (
                    <p
                      key={pillar}
                      className="text-xs text-wepac-text-tertiary"
                    >
                      <span className="font-bold text-wepac-white">
                        {PILLAR_LABELS[pillar as PillarKey]}
                      </span>{" "}
                      [{observation.signal}] {observation.evidence}
                    </p>
                  ),
                )}
              </div>
              {debrief.internalSynthesis.disciplineObservations && (
                <p className="mt-2 text-xs text-wepac-text-tertiary">
                  Discipline: {debrief.internalSynthesis.disciplineObservations}
                </p>
              )}
              {debrief.internalSynthesis.risks.length > 0 && (
                <div className="mt-2">
                  <p className="text-[10px] uppercase tracking-wide text-wepac-text-tertiary">
                    Riscos
                  </p>
                  {debrief.internalSynthesis.risks.map((r, i) => (
                    <p key={i} className="text-xs text-wepac-text-tertiary">
                      - {r}
                    </p>
                  ))}
                </div>
              )}
              {debrief.internalSynthesis.recommendedFollowUps.length > 0 && (
                <div className="mt-2">
                  <p className="text-[10px] uppercase tracking-wide text-wepac-text-tertiary">
                    Próximos passos recomendados
                  </p>
                  {debrief.internalSynthesis.recommendedFollowUps.map(
                    (r, i) => (
                      <p key={i} className="text-xs text-wepac-text-tertiary">
                        - {r}
                      </p>
                    ),
                  )}
                </div>
              )}
            </div>
          )}

          <div>
            {debriefGenerationEnabled ? (
              <>
                {generateError && (
                  <p className="mb-2 text-xs text-wepac-error">{generateError}</p>
                )}
                <button
                  onClick={() => handleGenerate(true)}
                  disabled={generating}
                  className="border border-wepac-border px-4 py-2 text-xs text-wepac-text-secondary disabled:opacity-30"
                >
                  {generating ? "A gerar..." : "Descartar debrief e gerar novo"}
                </button>
              </>
            ) : (
              <DebriefGenerationUnavailable />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
