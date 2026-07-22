"use client";

import { useState } from "react";
import { SESSION_KIND_LABELS, type SessionKind } from "@/lib/wepacker/types";
import { SessionsCalendar } from "@/components/wepacker/SessionsCalendar";

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Agendada",
  completed: "Realizada",
  cancelled: "Cancelada",
  no_show: "Não compareceu",
};

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-wepac-white/10 text-wepac-white",
  completed: "bg-wepac-success-bg text-wepac-success",
  cancelled: "bg-wepac-input text-wepac-text-tertiary",
  no_show: "bg-wepac-error-bg text-wepac-error",
};

export interface SessionItem {
  id: string;
  scheduledAt: string;
  durationMinutes: number;
  attendeeCount: number;
  kind: SessionKind;
  status: string;
  organizerName: string;
  outcome: string | null;
  sharedNote: string | null;
  meetingUrl: string | null;
}

interface Props {
  sessions: SessionItem[];
  calcomBookingUrl?: string | null;
}

export function SessionCard({
  session,
  highlighted,
}: {
  session: SessionItem;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`border p-5 ${
        highlighted
          ? "border-wepac-white/20 bg-wepac-card"
          : "border-wepac-border bg-wepac-card"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-wepac-white">
            {new Date(session.scheduledAt).toLocaleDateString("pt-PT", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          <p className="mt-1 text-sm text-wepac-text-secondary">
            {new Date(session.scheduledAt).toLocaleTimeString("pt-PT", {
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            · {session.durationMinutes} min
          </p>
        </div>
        <span
          className={`px-2 py-0.5 text-xs ${STATUS_COLORS[session.status]}`}
        >
          {STATUS_LABELS[session.status]}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="bg-wepac-input px-2 py-0.5 text-xs text-wepac-text-tertiary">
          {session.attendeeCount === 1 ? "Individual" : "Group"}
        </span>
        <span className="bg-wepac-input px-2 py-0.5 text-xs text-wepac-text-tertiary">
          {SESSION_KIND_LABELS[session.kind]?.label ?? session.kind}
        </span>
        <span className="bg-wepac-input px-2 py-0.5 text-xs text-wepac-text-tertiary">
          {session.organizerName}
        </span>
        {session.status === "scheduled" && session.meetingUrl && (
          <a
            href={session.meetingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-wepac-white hover:underline"
          >
            Entrar na chamada →
          </a>
        )}
      </div>
      {(session.outcome || session.sharedNote) && (
        <div className="mt-4 border-t border-wepac-border pt-4">
          {session.outcome && (
            <>
              <h4 className="text-xs font-bold uppercase text-wepac-text-tertiary">
                O que ficou combinado
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-wepac-text-secondary">
                {session.outcome}
              </p>
            </>
          )}
          {session.sharedNote && (
            <>
              <h4 className="mt-3 text-xs font-bold uppercase text-wepac-text-tertiary">
                Shared note
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-wepac-text-secondary">
                {session.sharedNote}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function SessionsPageClient({
  sessions,
  calcomBookingUrl,
}: Props) {
  const [view, setView] = useState<"list" | "calendar">("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const sorted = [...sessions].sort(
    (a, b) =>
      new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
  );

  const upcoming = sorted.filter((s) => s.status === "scheduled");
  const past = sorted.filter((s) => s.status !== "scheduled");
  const selectedSession = sorted.find((s) => s.id === selectedId) ?? null;

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-barlow text-2xl font-bold text-wepac-white">
            Sessions
          </h1>
          <p className="mt-1 text-sm text-wepac-text-tertiary">
            Past and upcoming Sessions you explicitly joined.
          </p>
        </div>
        <div className="flex gap-1">
          {[
            { key: "list" as const, label: "List" },
            { key: "calendar" as const, label: "Calendar" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setView(tab.key)}
              className={`px-4 py-2 text-sm transition-colors ${
                view === tab.key
                  ? "bg-wepac-white text-wepac-black"
                  : "bg-wepac-card text-wepac-text-tertiary hover:text-wepac-text-secondary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {calcomBookingUrl && (
        <div className="mt-8 border border-wepac-border bg-wepac-card p-5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-wepac-text-tertiary">
            Book a Session
          </h2>
          <p className="mt-2 max-w-md text-sm text-wepac-text-secondary">
            Choose an available time through the WEPAC booking calendar. Your
            confirmed Session will identify its organizer.
          </p>
          <a
            href={calcomBookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block bg-wepac-white px-4 py-2 text-sm font-medium text-wepac-black hover:opacity-90"
          >
            Book a Session →
          </a>
        </div>
      )}

      {view === "calendar" ? (
        <div className="mt-8">
          <SessionsCalendar
            sessions={sorted}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          <div className="mt-6">
            {selectedSession ? (
              <SessionCard
                session={selectedSession}
                highlighted={selectedSession.status === "scheduled"}
              />
            ) : (
              <p className="text-sm text-wepac-text-tertiary">
                Seleciona uma Session no calendário para ver o detalhe.
              </p>
            )}
          </div>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="mt-8">
              <h2 className="text-sm font-bold uppercase tracking-widest text-wepac-text-tertiary">
                Upcoming
              </h2>
              <div className="mt-4 space-y-3">
                {upcoming.map((session) => (
                  <SessionCard key={session.id} session={session} highlighted />
                ))}
              </div>
            </div>
          )}

          <div className="mt-8">
            <h2 className="text-sm font-bold uppercase tracking-widest text-wepac-text-tertiary">
              Past
            </h2>
            <div className="mt-4 space-y-3">
              {past.length === 0 ? (
                <p className="text-sm text-wepac-text-tertiary">
                  Ainda sem sessões passadas.
                </p>
              ) : (
                past.map((session) => (
                  <SessionCard key={session.id} session={session} />
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
