"use client";

import Link from "next/link";
import {
  ExpeditionTrail,
  type ExpeditionSession,
} from "@/components/wepacker/ExpeditionTrail";
import { STAGE_LABELS, type StageKey } from "@/lib/wepacker/types";

interface Props {
  user: { name: string };
  stage: StageKey | null;
  activeActions: Array<{
    id: string;
    title: string;
    dueAt: string | null;
    origin: string;
  }>;
  activeTrails: Array<{ id: string; title: string }>;
  nextSession: {
    id: string;
    scheduledAt: string;
    durationMinutes: number;
    meetingUrl: string | null;
    attendeeCount: number;
  } | null;
  sessions: ExpeditionSession[];
  latestMessage: {
    id: string;
    body: string;
    readAt?: string | null;
    createdAt: string;
    own: boolean;
  } | null;
}

function sessionFormat(attendeeCount: number): string {
  return attendeeCount === 1 ? "Individual" : "Group";
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default function DashboardPageClient({
  user,
  stage,
  activeActions,
  activeTrails,
  nextSession,
  sessions,
  latestMessage,
}: Props) {
  const nextStep = nextSession ? (
    <>
      Next Session: <span className="text-wepac-white">{formatDate(nextSession.scheduledAt)}</span>
      {nextSession.meetingUrl && (
        <>
          {" · "}
          <a
            href={`/wepacker/sessions/${nextSession.id}/call`}
            className="text-wepac-white hover:underline"
          >
            Join call →
          </a>
        </>
      )}
    </>
  ) : activeActions[0] ? (
    <>
      Next Action: <span className="text-wepac-white">{activeActions[0].title}</span>
    </>
  ) : (
    <Link href="/wepacker/basecamp" className="text-wepac-white hover:underline">
      Open Basecamp and choose your next step →
    </Link>
  );

  return (
    <div className="p-6 lg:p-8">
      <header>
        <h1 className="font-barlow text-2xl font-bold text-wepac-white">My Journey</h1>
        <p className="mt-1 text-sm text-wepac-text-tertiary">
          Olá, {user.name}. Este percurso pertence-te e continua independentemente de
          qualquer Pack, Cycle ou Mentorship.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-wepac-text-tertiary">Current Stage</span>
          <span className="bg-wepac-white/10 px-2 py-0.5 text-xs font-bold text-wepac-white">
            {stage ? STAGE_LABELS[stage] : "Not set"}
          </span>
        </div>
      </header>

      <div className="mt-8">
        <ExpeditionTrail sessions={sessions} />
        <p className="mt-3 text-sm text-wepac-text-tertiary">{nextStep}</p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="border border-wepac-border bg-wepac-card p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-barlow text-lg font-bold text-wepac-white">Actions</h2>
            <Link href="/wepacker/actions" className="text-xs text-wepac-white hover:underline">
              View all →
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {activeActions.length === 0 ? (
              <p className="text-sm text-wepac-text-tertiary">No active Actions.</p>
            ) : (
              activeActions.map((action) => (
                <div
                  key={action.id}
                  className="border-b border-wepac-border pb-3 last:border-0"
                >
                  <p className="text-sm text-wepac-text-secondary">{action.title}</p>
                  {action.dueAt && (
                    <p className="mt-1 text-xs text-wepac-text-tertiary">
                      Due {new Date(action.dueAt).toLocaleDateString("pt-PT")}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        <section className="border border-wepac-border bg-wepac-card p-6">
          <h2 className="font-barlow text-lg font-bold text-wepac-white">Next Session</h2>
          {nextSession ? (
            <div className="mt-4">
              <p className="text-sm text-wepac-text-secondary">
                {formatDate(nextSession.scheduledAt)}
              </p>
              <p className="mt-1 text-sm text-wepac-text-secondary">
                {new Date(nextSession.scheduledAt).toLocaleTimeString("pt-PT", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <div className="mt-3 flex gap-2">
                <span className="bg-wepac-input px-2 py-0.5 text-xs text-wepac-text-tertiary">
                  {sessionFormat(nextSession.attendeeCount)}
                </span>
                <span className="bg-wepac-input px-2 py-0.5 text-xs text-wepac-text-tertiary">
                  {nextSession.durationMinutes} min
                </span>
              </div>
              <Link href="/wepacker/sessions" className="mt-4 block text-xs text-wepac-white hover:underline">
                View Sessions →
              </Link>
            </div>
          ) : (
            <p className="mt-4 text-sm text-wepac-text-tertiary">No scheduled Sessions.</p>
          )}
        </section>

        <section className="border border-wepac-border bg-wepac-card p-6">
          <h2 className="font-barlow text-lg font-bold text-wepac-white">Messages</h2>
          {latestMessage ? (
            <div className="mt-4">
              <p className="line-clamp-3 text-sm text-wepac-text-secondary">
                {latestMessage.body}
              </p>
              <p className="mt-2 text-xs text-wepac-text-tertiary">
                {new Date(latestMessage.createdAt).toLocaleDateString("pt-PT")}
              </p>
              {!latestMessage.readAt && !latestMessage.own && (
                <span className="mt-2 inline-block bg-wepac-white/10 px-2 py-0.5 text-xs text-wepac-white">
                  New
                </span>
              )}
              <Link href="/wepacker/messages" className="mt-3 block text-xs text-wepac-white hover:underline">
                View Messages →
              </Link>
            </div>
          ) : (
            <p className="mt-4 text-sm text-wepac-text-tertiary">No Messages yet.</p>
          )}
        </section>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="border border-wepac-border bg-wepac-card p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-barlow text-lg font-bold text-wepac-white">Active Trails</h2>
            <Link href="/wepacker/trails" className="text-xs text-wepac-white hover:underline">
              View all →
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {activeTrails.length === 0 ? (
              <p className="text-sm text-wepac-text-tertiary">No active Trails yet.</p>
            ) : (
              activeTrails.map((trail) => (
                <Link
                  key={trail.id}
                  href={`/wepacker/trails/${trail.id}`}
                  className="block border-b border-wepac-border pb-3 text-sm text-wepac-text-secondary last:border-0 hover:text-wepac-white"
                >
                  {trail.title} →
                </Link>
              ))
            )}
          </div>
        </section>

        <Link
          href="/wepacker/life-map"
          className="border border-wepac-border bg-wepac-card p-6 transition-colors hover:border-wepac-white/40"
        >
          <h2 className="font-barlow text-lg font-bold text-wepac-white">Life Map</h2>
          <p className="mt-2 text-sm text-wepac-text-tertiary">
            Revisit who you are, where you are and where you are going.
          </p>
          <span className="mt-4 block text-xs text-wepac-white">Open Life Map →</span>
        </Link>

        <Link
          href="/wepacker/goals"
          className="border border-wepac-border bg-wepac-card p-6 transition-colors hover:border-wepac-white/40"
        >
          <h2 className="font-barlow text-lg font-bold text-wepac-white">Goals</h2>
          <p className="mt-2 text-sm text-wepac-text-tertiary">
            Turn direction into clear commitments and next Actions.
          </p>
          <span className="mt-4 block text-xs text-wepac-white">Open Goals →</span>
        </Link>
      </div>
    </div>
  );
}
