"use client";

import Link from "next/link";
import {
  LEVEL_LABELS,
  PHASE_LABELS,
  type MemberLevel,
  type MemberPhase,
  type TaskOrigin,
  type TaskStatus,
} from "@/lib/wepacker/types";

interface MembershipRow {
  id: string;
  level: MemberLevel;
  currentPhase: MemberPhase;
  user: {
    id: string;
    name: string;
    email: string;
    onboarded: boolean;
    inviteToken: string | null;
  };
  cohort: {
    id: string;
    name: string;
    pack: { id: string; name: string };
  };
}

interface TaskRow {
  id: string;
  title: string;
  status: TaskStatus;
  deadline: string;
  origin: TaskOrigin;
  membership: { id: string; user: { id: string; name: string } };
}

interface SessionRow {
  id: string;
  sessionType: "individual" | "group";
  status: "scheduled" | "completed" | "cancelled" | "no_show";
  scheduledAt: string;
  durationMinutes: number;
  attendees: {
    id: string;
    user: { id: string; name: string };
  }[];
}

interface ConversationRow {
  id: string;
  participants: { id: string; name: string; role: string }[];
  messages: {
    id: string;
    userId: string;
    body: string;
    readAt?: string;
    createdAt: string;
  }[];
}

interface MentorDashboardProps {
  memberships: MembershipRow[];
  tasks: TaskRow[];
  sessions: SessionRow[];
  conversations: ConversationRow[];
  currentUserId: string;
}

export function MentorDashboardClient({
  memberships,
  tasks,
  sessions,
  conversations,
  currentUserId,
}: MentorDashboardProps) {
  const pendingSessions = sessions
    .filter((s) => s.status === "scheduled")
    .sort(
      (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    );
  const unreadMessages = conversations
    .flatMap((c) => c.messages)
    .filter((m) => !m.readAt && m.userId !== currentUserId);
  const pendingTasks = tasks.filter((t) => t.status !== "done");

  return (
    <div className="p-6 lg:p-8">
      <h1 className="font-barlow text-2xl font-bold text-wepac-white">
        Painel do Mentor
      </h1>
      <p className="mt-1 text-sm text-wepac-text-tertiary">
        Visão geral dos membros e ações pendentes.
      </p>

      {/* Quick stats */}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="border border-wepac-border bg-wepac-card p-4 text-center">
          <p className="font-barlow text-2xl font-bold text-wepac-white">
            {memberships.length}
          </p>
          <p className="text-xs text-wepac-text-tertiary">Membros</p>
        </div>
        <div className="border border-wepac-border bg-wepac-card p-4 text-center">
          <p className="font-barlow text-2xl font-bold text-wepac-white">
            {pendingSessions.length}
          </p>
          <p className="text-xs text-wepac-text-tertiary">Sessões agendadas</p>
        </div>
        <div className="border border-wepac-border bg-wepac-card p-4 text-center">
          <p className="font-barlow text-2xl font-bold text-wepac-white">
            {unreadMessages.length}
          </p>
          <p className="text-xs text-wepac-text-tertiary">Mensagens por ler</p>
        </div>
        <div className="border border-wepac-border bg-wepac-card p-4 text-center">
          <p className="font-barlow text-2xl font-bold text-wepac-white">
            {pendingTasks.length}
          </p>
          <p className="text-xs text-wepac-text-tertiary">Tarefas pendentes</p>
        </div>
      </div>

      {/* Members list */}
      <div className="mt-8">
        <h2 className="text-sm font-bold uppercase tracking-widest text-wepac-text-tertiary">
          Membros
        </h2>
        <div className="mt-4 space-y-3">
          {memberships.map((m) => {
            const memberTasks = tasks.filter(
              (t) => t.membership.id === m.id && t.status !== "done"
            );
            const health =
              memberTasks.length === 0
                ? "green"
                : memberTasks.some((t) => new Date(t.deadline) < new Date())
                  ? "red"
                  : "yellow";

            return (
              <div
                key={m.id}
                className="flex flex-col gap-3 border border-wepac-border bg-wepac-card p-4 transition-colors hover:border-wepac-white/20 sm:flex-row sm:items-center sm:justify-between"
              >
                <Link
                  href={`/wepacker/mentor/members/${m.id}`}
                  className="flex items-center gap-4"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center bg-wepac-white/10">
                    <span className="text-sm font-bold text-wepac-white">
                      {m.user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-wepac-white">
                      {m.user.name}
                    </p>
                    <div className="mt-0.5 flex flex-wrap gap-2">
                      <span className="text-xs text-wepac-text-tertiary">
                        {m.cohort.pack.name} · {m.cohort.name}
                      </span>
                      <span className="text-xs text-wepac-text-tertiary">
                        · {LEVEL_LABELS[m.level]}
                      </span>
                      <span className="text-xs text-wepac-text-tertiary">
                        · {PHASE_LABELS[m.currentPhase]}
                      </span>
                      {!m.user.onboarded && (
                        <span className="bg-wepac-warning-bg px-1.5 py-0.5 text-[10px] font-bold text-wepac-warning">
                          Convite pendente
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-wepac-text-tertiary">
                    {memberTasks.length} tarefas
                  </span>
                  <Link
                    href={`/wepacker/mentor/evaluate/${m.id}`}
                    className="text-xs text-wepac-white hover:underline"
                  >
                    Avaliar →
                  </Link>
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      health === "green"
                        ? "bg-wepac-success"
                        : health === "yellow"
                          ? "bg-wepac-warning"
                          : "bg-wepac-error"
                    }`}
                  />
                </div>
              </div>
            );
          })}
          {memberships.length === 0 && (
            <p className="text-sm text-wepac-text-tertiary">
              Sem membros nas cohorts que mentorias.
            </p>
          )}
        </div>
      </div>

      {/* Upcoming sessions */}
      <div className="mt-8">
        <h2 className="text-sm font-bold uppercase tracking-widest text-wepac-text-tertiary">
          Próximas sessões
        </h2>
        <div className="mt-4 space-y-3">
          {pendingSessions.slice(0, 5).map((session) => {
            const attendeeNames = session.attendees
              .map((a) => a.user.name)
              .join(", ");
            return (
              <div
                key={session.id}
                className="border border-wepac-border bg-wepac-card p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-wepac-white">
                      {new Date(session.scheduledAt).toLocaleDateString("pt-PT", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      ·{" "}
                      {new Date(session.scheduledAt).toLocaleTimeString("pt-PT", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="mt-0.5 text-xs text-wepac-text-tertiary">
                      {session.sessionType === "individual" ? "Individual" : "Grupo"}{" "}
                      · {attendeeNames}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          {pendingSessions.length === 0 && (
            <p className="text-sm text-wepac-text-tertiary">
              Sem sessões agendadas.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
