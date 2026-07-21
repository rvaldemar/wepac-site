"use server";

import { prisma } from "@/lib/db";
import { assertMentorOfSession } from "@/lib/wepacker/actions/session";
import { computeAreaScores } from "@/lib/wepacker/actions/evaluation";
import { AREA_KEYS, AREA_LABELS } from "@/lib/wepacker/types";
import type { AreaKey, EvaluationMoment, SessionKind, TaskStatus } from "@/lib/wepacker/types";

// Chronological order — mirrors the mentor member detail page's
// "most recent moment that actually has data" pattern (see
// src/app/wepacker/(platform)/mentor/members/[id]/page.tsx).
const MOMENTS: EvaluationMoment[] = ["entry", "mid", "exit"];

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

// Radar summary for one participant: top-2 / bottom-2 development areas by
// composite score, from whichever evaluation moment is most recently
// populated. Returns null when the person has no evaluation at all yet
// (common right after onboarding) — the caller renders an empty state
// instead of a misleading all-zero radar.
async function radarSummary(userId: string): Promise<{
  strengths: SessionPrepAreaSummary[];
  growthAreas: SessionPrepAreaSummary[];
} | null> {
  const evals = await prisma.evaluation.findMany({
    where: { userId },
    select: { moment: true },
  });
  const availableMoments = MOMENTS.filter((m) => evals.some((e) => e.moment === m));
  const moment = availableMoments[availableMoments.length - 1];
  if (!moment) return null;

  const scores = await computeAreaScores(userId, moment);
  const ranked = AREA_KEYS.map((area) => ({
    area,
    label: AREA_LABELS[area],
    composite: scores[area]?.composite ?? 0,
  })).sort((a, b) => b.composite - a.composite);

  return {
    strengths: ranked.slice(0, 2),
    growthAreas: ranked.slice(-2).reverse(),
  };
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
      const [radar, priorAttendances, pendingTasks] = await Promise.all([
        radarSummary(user.id),
        // Prior sessions this same person attended, excluding the current
        // one, most recent first — source for both the "last agreed
        // outcome" highlight and the shared-note/outcome history strip.
        prisma.sessionAttendee.findMany({
          where: {
            userId: user.id,
            sessionId: { not: sessionId },
            session: { scheduledAt: { lt: session.scheduledAt } },
          },
          select: {
            outcome: true,
            sharedNote: true,
            session: { select: { id: true, scheduledAt: true, kind: true } },
          },
          orderBy: { session: { scheduledAt: "desc" } },
          take: 3,
        }),
        // Session-born tasks still open — the concrete follow-through to
        // check on before the session even starts.
        prisma.task.findMany({
          where: {
            origin: "session",
            status: { not: "done" },
            membership: { userId: user.id },
          },
          select: { id: true, title: true, deadline: true, status: true },
          orderBy: { deadline: "asc" },
          take: 5,
        }),
      ]);

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
        hasEvaluation: radar !== null,
        strengths: radar?.strengths ?? [],
        growthAreas: radar?.growthAreas ?? [],
        lastOutcome: recentHistory[0]?.outcome ?? null,
        recentHistory,
        pendingTasks,
      };
    })
  );
}
