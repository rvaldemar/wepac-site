"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SessionKind, SessionType, SessionStatus, AreaKey } from "@/lib/wepacker/types";
import { AREA_LABELS, SESSION_KIND_LABELS } from "@/lib/wepacker/types";
import { updateSessionAttendee } from "@/lib/wepacker/actions/session";
import { createTaskFromSession } from "@/lib/wepacker/actions/task";
import { generateSessionDebrief } from "@/lib/wepacker/actions/debrief";
import type { SessionDebriefView } from "@/lib/wepacker/actions/debrief";
import type {
  AreaObservation,
  AttendeeTaskSuggestion,
  PerAttendeeDebrief,
} from "@/lib/wepacker/debrief/types";

// Local, display-only mirror of the labels used on the tasks pages (see
// mentor/tasks/page-client.tsx) — not worth exporting from types.ts for a
// single read-only panel.
const TASK_STATUS_LABELS: Record<string, string> = {
  todo: "To-do",
  in_progress: "Em curso",
  done: "Feito",
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

interface SessionDetail {
  id: string;
  sessionType: SessionType;
  kind: SessionKind;
  scheduledAt: string;
  status: SessionStatus;
  discussionPoints: string | null;
  meetingUrl: string | null;
  transcript: string | null;
  transcriptUploadedAt: string | null;
  attendees: AttendeeRow[];
  mentor: { id: string; name: string };
}

// Serialized mirror of SessionPrepAreaSummary/HistoryEntry/PendingTask/
// Participant from @/lib/wepacker/actions/session-prep — Dates cross the
// server/client boundary as ISO strings (see `serialize` in page.tsx).
interface PrepAreaSummary {
  area: AreaKey;
  label: string;
  composite: number;
}

interface PrepHistoryEntry {
  sessionId: string;
  scheduledAt: string;
  kind: SessionKind;
  sharedNote: string | null;
  outcome: string | null;
}

interface PrepPendingTask {
  id: string;
  title: string;
  deadline: string;
  status: "todo" | "in_progress" | "done";
}

interface PrepParticipant {
  userId: string;
  name: string;
  hasEvaluation: boolean;
  strengths: PrepAreaSummary[];
  growthAreas: PrepAreaSummary[];
  lastOutcome: string | null;
  recentHistory: PrepHistoryEntry[];
  pendingTasks: PrepPendingTask[];
}

interface Props {
  session: SessionDetail;
  debrief: SessionDebriefView | null;
  preparation: PrepParticipant[];
  canManagePrivateArtifacts: boolean;
}

function attendeeKey(userId: string): string {
  return userId;
}

export function SessionDebriefClient({
  session,
  debrief: initialDebrief,
  preparation,
  canManagePrivateArtifacts,
}: Props) {
  const router = useRouter();
  const [debrief, setDebrief] = useState<SessionDebriefView | null>(initialDebrief);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // ===== Preparation panel: collapsed by default, one entry per
  // participant — see the "empty state" render below.
  const [expandedPrepUserId, setExpandedPrepUserId] = useState<string | null>(
    preparation[0]?.userId ?? null
  );

  // ===== Per-attendee suggestion editing =====
  const [editedOutcome, setEditedOutcome] = useState<Record<string, string>>({});
  const [editedSharedNote, setEditedSharedNote] = useState<Record<string, string>>({});
  const [publishOnApprove, setPublishOnApprove] = useState<Record<string, boolean>>({});
  const [savingAttendeeKey, setSavingAttendeeKey] = useState<string | null>(null);
  const [attendeeFeedback, setAttendeeFeedback] = useState<
    Record<string, { type: "success" | "error"; text: string } | undefined>
  >({});
  const [creatingTaskKey, setCreatingTaskKey] = useState<string | null>(null);
  const [taskFeedback, setTaskFeedback] = useState<
    Record<string, { type: "success" | "error"; text: string } | undefined>
  >({});
  const [showResultDoc, setShowResultDoc] = useState(false);

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

  function suggestionFor(userId: string): PerAttendeeDebrief | undefined {
    return debrief?.perAttendee.find((p) => p.userId === userId);
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
          "Ainda há sugestões por aplicar nesta sessão. Gerar um novo debrief descarta o atual. Continuar?"
        );
        if (!confirmed) return;
      }
    }
    setGenerating(true);
    setGenerateError(null);
    try {
      const result = await generateSessionDebrief(session.id, force ? { force: true } : undefined);
      setDebrief(result);
      setEditedOutcome({});
      setEditedSharedNote({});
      router.refresh();
    } catch (e) {
      setGenerateError(
        e instanceof Error ? e.message : "Não foi possível gerar o debrief. Tenta novamente."
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
      await updateSessionAttendee(session.id, userId, { outcome: outcomeValue(userId) });
      setAttendeeFeedback((prev) => ({
        ...prev,
        [`${key}:outcome`]: { type: "success", text: "Aplicado." },
      }));
      router.refresh();
    } catch (e) {
      console.error("Failed to approve outcome suggestion:", e);
      setAttendeeFeedback((prev) => ({
        ...prev,
        [`${key}:outcome`]: { type: "error", text: "Erro ao aplicar. Tenta novamente." },
      }));
    } finally {
      setSavingAttendeeKey(null);
    }
  }

  async function handleApproveSharedNote(userId: string) {
    const key = attendeeKey(userId);
    setSavingAttendeeKey(`${key}:sharedNote`);
    setAttendeeFeedback((prev) => ({ ...prev, [`${key}:sharedNote`]: undefined }));
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
        [`${key}:sharedNote`]: { type: "error", text: "Erro ao aplicar. Tenta novamente." },
      }));
    } finally {
      setSavingAttendeeKey(null);
    }
  }

  async function handleCreateTask(userId: string, task: AttendeeTaskSuggestion, index: number) {
    const key = `${userId}:${index}`;
    setCreatingTaskKey(key);
    setTaskFeedback((prev) => ({ ...prev, [key]: undefined }));
    try {
      await createTaskFromSession({
        sessionId: session.id,
        userId,
        title: task.title,
        description: task.description,
        deadline: task.deadline ?? "",
      });
      setTaskFeedback((prev) => ({ ...prev, [key]: { type: "success", text: "Tarefa criada." } }));
    } catch (e) {
      console.error("Failed to create task from debrief suggestion:", e);
      setTaskFeedback((prev) => ({
        ...prev,
        [key]: { type: "error", text: "Erro ao criar tarefa. Tenta novamente." },
      }));
    } finally {
      setCreatingTaskKey(null);
    }
  }

  function copyInternalEvaluation() {
    if (!debrief?.internalEvaluation) return;
    const ie = debrief.internalEvaluation;
    const lines = [
      `Resumo: ${ie.sessionSummary}`,
      "",
      "Áreas:",
      ...Object.values(ie.areaObservations).map(
        (o: AreaObservation) => `- ${AREA_LABELS[o.area as AreaKey]} (${o.signal}): ${o.evidence}`
      ),
      "",
      ie.practiceObservations ? `Prática: ${ie.practiceObservations}` : "",
      "",
      "Riscos:",
      ...ie.risks.map((r) => `- ${r}`),
      "",
      "Próximos passos recomendados:",
      ...ie.recommendedFollowUps.map((r) => `- ${r}`),
    ];
    void navigator.clipboard.writeText(lines.join("\n"));
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-barlow text-2xl font-bold text-wepac-white">
            Session Debrief
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
        </div>
        <Link
          href="/wepacker/mentor/sessions"
          className="text-xs text-wepac-text-tertiary hover:text-wepac-white hover:underline"
        >
          Back to Sessions
        </Link>
      </div>

      {/* Preparation panel: one collapsible card per participant, built
          entirely from data that already exists (past sessions,
          evaluations, tasks). Only relevant before the session has taken
          place / been debriefed — hidden once there's a transcript, same
          as the empty state below. */}
      {!session.transcript && preparation.length > 0 && (
        <div className="mt-8 space-y-3">
          <h2 className="text-sm font-bold text-wepac-white">Preparação</h2>
          {preparation.map((p) => {
            const isExpanded = expandedPrepUserId === p.userId;
            return (
              <div key={p.userId} className="border border-wepac-border bg-wepac-card">
                <button
                  onClick={() => setExpandedPrepUserId(isExpanded ? null : p.userId)}
                  className="flex w-full items-center justify-between p-4 text-left"
                >
                  <span className="text-sm font-medium text-wepac-white">{p.name}</span>
                  <span className="text-wepac-text-tertiary">{isExpanded ? "−" : "+"}</span>
                </button>

                {isExpanded && (
                  <div className="space-y-4 border-t border-wepac-border p-4">
                    {/* O que ficou combinado na última sessão */}
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-wepac-text-tertiary">
                        Ficou combinado (última sessão)
                      </p>
                      <p className="mt-1 text-xs text-wepac-text-secondary">
                        {p.lastOutcome || "Sem registo de sessões anteriores."}
                      </p>
                    </div>

                    {canManagePrivateArtifacts && (
                      <>
                    {/* Legacy Assessment summary — Admin-only until grants. */}
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-wepac-text-tertiary">
                        Radar resumido
                      </p>
                      {!p.hasEvaluation ? (
                        <p className="mt-1 text-xs text-wepac-text-tertiary">
                          Ainda sem avaliação.
                        </p>
                      ) : (
                        <div className="mt-1 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div>
                            <p className="text-[10px] text-wepac-text-tertiary">Pontos fortes</p>
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              {p.strengths.map((s) => (
                                <span
                                  key={s.area}
                                  className="bg-wepac-success-bg px-2 py-0.5 text-[10px] text-wepac-success"
                                >
                                  {s.label} · {s.composite}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] text-wepac-text-tertiary">A desenvolver</p>
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              {p.growthAreas.map((g) => (
                                <span
                                  key={g.area}
                                  className="bg-wepac-input px-2 py-0.5 text-[10px] text-wepac-text-secondary"
                                >
                                  {g.label} · {g.composite}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Legacy Tasks — Admin-only until grants. */}
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-wepac-text-tertiary">
                        Tarefas pendentes (de sessões)
                      </p>
                      {p.pendingTasks.length === 0 ? (
                        <p className="mt-1 text-xs text-wepac-text-tertiary">
                          Sem tarefas pendentes.
                        </p>
                      ) : (
                        <ul className="mt-1 space-y-1">
                          {p.pendingTasks.map((t) => (
                            <li key={t.id} className="flex items-center justify-between text-xs">
                              <span className="text-wepac-text-secondary">{t.title}</span>
                              <span className="text-[10px] text-wepac-text-tertiary">
                                {TASK_STATUS_LABELS[t.status] ?? t.status} · {t.deadline}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                      </>
                    )}

                    {/* Últimas notas partilhadas / outcomes */}
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-wepac-text-tertiary">
                        Previous Sessions
                      </p>
                      {p.recentHistory.length === 0 ? (
                        <p className="mt-1 text-xs text-wepac-text-tertiary">
                          Sem sessões anteriores.
                        </p>
                      ) : (
                        <ul className="mt-1 space-y-2">
                          {p.recentHistory.map((h) => (
                            <li key={h.sessionId} className="border-l border-wepac-border pl-2">
                              <p className="text-[10px] text-wepac-text-tertiary">
                                {new Date(h.scheduledAt).toLocaleDateString("pt-PT")} ·{" "}
                                {SESSION_KIND_LABELS[h.kind]?.label ?? h.kind}
                              </p>
                              {h.outcome && (
                                <p className="text-xs text-wepac-text-secondary">
                                  Combinado: {h.outcome}
                                </p>
                              )}
                              {h.sharedNote && (
                                <p className="text-xs text-wepac-text-secondary">
                                  Nota: {h.sharedNote}
                                </p>
                              )}
                              {!h.outcome && !h.sharedNote && (
                                <p className="text-xs text-wepac-text-tertiary">Sem notas.</p>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!session.transcript && (
        <div className="mt-8 border border-wepac-border bg-wepac-card p-6">
          <p className="text-sm text-wepac-text-tertiary">
            Esta sessão ainda não tem transcrição.
          </p>
          <Link
            href="/wepacker/mentor/sessions"
            className="mt-2 inline-block text-xs text-wepac-white hover:underline"
          >
            Voltar para anexar uma transcrição
          </Link>
        </div>
      )}

      {/* Ready to generate / loading / error */}
      {session.transcript && !debrief && (
        <div className="mt-8 border border-wepac-border bg-wepac-card p-6">
          <p className="text-[10px] uppercase tracking-wide text-wepac-text-tertiary">
            Transcrição
          </p>
          <pre className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap text-xs text-wepac-text-secondary">
            {session.transcript}
          </pre>
          {generateError && (
            <p className="mt-3 text-xs text-wepac-error">{generateError}</p>
          )}
          <button
            onClick={() => handleGenerate(false)}
            disabled={generating}
            className="mt-4 bg-wepac-white px-4 py-2 text-sm font-bold text-wepac-black disabled:opacity-30"
          >
            {generating ? "A gerar debrief... (pode demorar até 30s)" : "Gerar debrief"}
          </button>
          {generateError && (
            <button
              onClick={() => handleGenerate(false)}
              className="ml-2 mt-4 border border-wepac-border px-4 py-2 text-sm text-wepac-text-secondary"
            >
              Tentar novamente
            </button>
          )}
        </div>
      )}

      {/* Loaded */}
      {debrief && debrief.status === "failed" && (
        <div className="mt-8 border border-wepac-error bg-wepac-card p-6">
          <p className="text-sm text-wepac-error">{debrief.error ?? "Erro ao gerar debrief."}</p>
          <button
            onClick={() => handleGenerate(true)}
            disabled={generating}
            className="mt-4 bg-wepac-white px-4 py-2 text-sm font-bold text-wepac-black disabled:opacity-30"
          >
            {generating ? "A gerar debrief..." : "Tentar novamente"}
          </button>
        </div>
      )}

      {debrief && debrief.status === "ready" && (
        <div className="mt-8 space-y-6">
          {/* a. Per-attendee */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-wepac-white">Sugestões por participante</h2>
            {session.attendees.map((a) => {
              const suggestion = suggestionFor(a.user.id);
              const outcomeFeedback = attendeeFeedback[`${a.user.id}:outcome`];
              const sharedNoteFeedback = attendeeFeedback[`${a.user.id}:sharedNote`];
              return (
                <div key={a.id} className="border border-wepac-border bg-wepac-card p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-wepac-white">{a.user.name}</p>
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
                            setEditedOutcome((prev) => ({ ...prev, [a.user.id]: e.target.value }))
                          }
                          rows={3}
                          className="mt-1 w-full bg-wepac-input px-3 py-2 text-xs text-wepac-white"
                        />
                        <p className="mt-1 text-[10px] text-wepac-text-tertiary">
                          Atual: {a.outcome || "—"}
                        </p>
                        {outcomeFeedback?.type === "error" && (
                          <p className="text-xs text-wepac-error">{outcomeFeedback.text}</p>
                        )}
                        {outcomeFeedback?.type === "success" && (
                          <p className="text-xs text-wepac-success">{outcomeFeedback.text}</p>
                        )}
                        <button
                          onClick={() => handleApproveOutcome(a.user.id)}
                          disabled={savingAttendeeKey === `${a.user.id}:outcome`}
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
                          {a.sharedNote && (a.sharedNotePublished ? "(publicada)" : "(não publicada)")}
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
                          <p className="text-xs text-wepac-error">{sharedNoteFeedback.text}</p>
                        )}
                        {sharedNoteFeedback?.type === "success" && (
                          <p className="text-xs text-wepac-success">{sharedNoteFeedback.text}</p>
                        )}
                        <button
                          onClick={() => handleApproveSharedNote(a.user.id)}
                          disabled={savingAttendeeKey === `${a.user.id}:sharedNote`}
                          className="mt-2 bg-wepac-white px-3 py-1.5 text-xs font-bold text-wepac-black disabled:opacity-30"
                        >
                          Aprovar
                        </button>
                      </div>
                    </div>
                  )}

                  {canManagePrivateArtifacts &&
                    suggestion &&
                    suggestion.tasks.length > 0 && (
                    <div className="mt-3 space-y-2 border-t border-wepac-border pt-3">
                      <p className="text-[10px] uppercase tracking-wide text-wepac-text-tertiary">
                        Tarefas sugeridas
                      </p>
                      {suggestion.tasks.map((task, index) => {
                        const key = `${a.user.id}:${index}`;
                        const feedback = taskFeedback[key];
                        return (
                          <div
                            key={key}
                            className="flex flex-wrap items-center justify-between gap-2 bg-wepac-input/40 p-2"
                          >
                            <div>
                              <p className="text-xs text-wepac-white">{task.title}</p>
                              {task.description && (
                                <p className="text-[10px] text-wepac-text-tertiary">
                                  {task.description}
                                </p>
                              )}
                              {task.deadline && (
                                <p className="text-[10px] text-wepac-text-tertiary">
                                  Prazo: {task.deadline}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {feedback?.type === "success" ? (
                                <span className="text-xs text-wepac-success">{feedback.text}</span>
                              ) : (
                                <button
                                  onClick={() => handleCreateTask(a.user.id, task, index)}
                                  disabled={creatingTaskKey === key}
                                  className="bg-wepac-white px-2 py-1 text-[10px] font-bold text-wepac-black disabled:opacity-30"
                                >
                                  {creatingTaskKey === key ? "A criar..." : "Criar tarefa"}
                                </button>
                              )}
                              {feedback?.type === "error" && (
                                <span className="text-[10px] text-wepac-error">{feedback.text}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* b. Internal evaluation */}
          {debrief.internalEvaluation && (
            <div className="border border-wepac-border bg-wepac-card p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-wepac-white">Internal review</h2>
                <button
                  onClick={copyInternalEvaluation}
                  className="text-xs text-wepac-white hover:underline"
                >
                  Copiar
                </button>
              </div>
              <p className="mt-2 text-xs text-wepac-text-secondary">
                {debrief.internalEvaluation.sessionSummary}
              </p>
              <div className="mt-3 space-y-1">
                {Object.values(debrief.internalEvaluation.areaObservations).map(
                  (o: AreaObservation) => (
                    <p key={o.area} className="text-xs text-wepac-text-tertiary">
                      <span className="font-bold text-wepac-white">
                        {AREA_LABELS[o.area as AreaKey]}
                      </span>{" "}
                      [{o.signal}] {o.evidence}
                    </p>
                  )
                )}
              </div>
              {debrief.internalEvaluation.practiceObservations && (
                <p className="mt-2 text-xs text-wepac-text-tertiary">
                  Prática: {debrief.internalEvaluation.practiceObservations}
                </p>
              )}
              {debrief.internalEvaluation.risks.length > 0 && (
                <div className="mt-2">
                  <p className="text-[10px] uppercase tracking-wide text-wepac-text-tertiary">
                    Riscos
                  </p>
                  {debrief.internalEvaluation.risks.map((r, i) => (
                    <p key={i} className="text-xs text-wepac-text-tertiary">
                      - {r}
                    </p>
                  ))}
                </div>
              )}
              {debrief.internalEvaluation.recommendedFollowUps.length > 0 && (
                <div className="mt-2">
                  <p className="text-[10px] uppercase tracking-wide text-wepac-text-tertiary">
                    Próximos passos recomendados
                  </p>
                  {debrief.internalEvaluation.recommendedFollowUps.map((r, i) => (
                    <p key={i} className="text-xs text-wepac-text-tertiary">
                      - {r}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* c. Result document — sandboxed preview only, never a
              same-origin blob tab. resultDocumentHtml is model output
              derived from an untrusted transcript. */}
          <div className="border border-wepac-border bg-wepac-card p-4">
            <h2 className="text-sm font-bold text-wepac-white">Documento de resultado</h2>
            {!debrief.resultDocumentHtml ? (
              <p className="mt-2 text-xs text-wepac-text-tertiary">
                Sem documento de resultado — só é gerado para sessões individuais.
              </p>
            ) : (
              <>
                <div className="mt-2 flex gap-3">
                  <button
                    onClick={() => setShowResultDoc((v) => !v)}
                    className="text-xs text-wepac-white hover:underline"
                  >
                    {showResultDoc ? "Ocultar pré-visualização" : "Pré-visualizar"}
                  </button>
                  <a
                    href={`data:text/html;charset=utf-8,${encodeURIComponent(
                      debrief.resultDocumentHtml
                    )}`}
                    download={`debrief-${session.id}.html`}
                    className="text-xs text-wepac-white hover:underline"
                  >
                    Transferir
                  </a>
                </div>
                {showResultDoc && (
                  <iframe
                    srcDoc={debrief.resultDocumentHtml}
                    sandbox=""
                    className="mt-3 h-[600px] w-full border border-wepac-border bg-white"
                    title="Pré-visualização do documento de resultado"
                  />
                )}
              </>
            )}
          </div>

          {/* d. Regenerate */}
          <div>
            {generateError && <p className="mb-2 text-xs text-wepac-error">{generateError}</p>}
            <button
              onClick={() => handleGenerate(true)}
              disabled={generating}
              className="border border-wepac-border px-4 py-2 text-xs text-wepac-text-secondary disabled:opacity-30"
            >
              {generating ? "A gerar..." : "Descartar debrief e gerar novo"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
