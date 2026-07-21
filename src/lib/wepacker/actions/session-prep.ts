"use server";

import { prisma } from "@/lib/db";
import { assertMentorOfSession } from "@/lib/wepacker/actions/session";
import { requireUser } from "@/lib/wepacker/guards";
import type { AreaKey, SessionKind, TaskStatus } from "@/lib/wepacker/types";

export interface SessionPrepAreaSummary {
  area: AreaKey;
  label: string;
  composite: number;
}

export interface SessionPrepHistoryEntry {
  sessionId: string;
  scheduledAt: Date;
  kind: SessionKind;
  sharedNote: string | null;
  outcome: string | null;
}

export interface SessionPrepPendingTask {
  id: string;
  title: string;
  deadline: string;
  status: TaskStatus;
}

export interface SessionPrepParticipant {
  userId: string;
  name: string;
  hasEvaluation: boolean;
  strengths: SessionPrepAreaSummary[];
  growthAreas: SessionPrepAreaSummary[];
  lastOutcome: string | null;
  recentHistory: SessionPrepHistoryEntry[];
  pendingTasks: SessionPrepPendingTask[];
}

// Preparation panel for a mentor about to run a session — one summary
// per participant, assembled entirely from data that already exists
// (evaluations, prior sessions, tasks). Read-only, so it's harmless to
// call even once a session already has a transcript/debrief; the caller
// only renders it before that point.
export async function getSessionPreparation(
  sessionId: string
): Promise<SessionPrepParticipant[]> {
  await assertMentorOfSession(sessionId);
  const actor = await requireUser();

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: {
      scheduledAt: true,
      attendees: { select: { user: { select: { id: true, name: true } } } },
    },
  });
  if (!session) return [];

  return Promise.all(
    session.attendees.map(async ({ user }) => {
      const priorAttendances = await prisma.sessionAttendee.findMany({
        // Prior sessions this same person attended, excluding the current
        // one, most recent first — source for both the "last agreed
        // outcome" highlight and the shared-note/outcome history strip.
        where: {
          userId: user.id,
          sessionId: { not: sessionId },
          // Privacy boundary: only sessions THIS mentor conducted with
          // the person — never another mentor's notes/outcomes.
          session: {
            scheduledAt: { lt: session.scheduledAt },
            mentorId: actor.id,
          },
        },
        select: {
          outcome: true,
          sharedNote: true,
          session: { select: { id: true, scheduledAt: true, kind: true } },
        },
        orderBy: { session: { scheduledAt: "desc" } },
        take: 3,
      });
      const pendingTasks: SessionPrepPendingTask[] = [];

      const recentHistory: SessionPrepHistoryEntry[] = priorAttendances.map((a) => ({
        sessionId: a.session.id,
        scheduledAt: a.session.scheduledAt,
        kind: a.session.kind,
        sharedNote: a.sharedNote,
        outcome: a.outcome,
      }));

      return {
        userId: user.id,
        name: user.name,
        hasEvaluation: false,
        strengths: [],
        growthAreas: [],
        lastOutcome: recentHistory[0]?.outcome ?? null,
        recentHistory,
        pendingTasks,
      };
    })
  );
}
