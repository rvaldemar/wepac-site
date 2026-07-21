"use server";

import { prisma } from "@/lib/db";
import type { AreaKey, EvaluationMoment } from "@prisma/client";
import { AREA_KEYS, hasDedicatedIndicators } from "@/lib/wepacker/types";
import {
  assertUserAccess,
  assertMentorOfUser,
  requireMembership,
} from "@/lib/wepacker/guards";

// Shown when an assessment is attempted against a pack that has no
// dedicated indicator set — running it would silently score the member
// against DEFAULT_INDICATORS, measuring the wrong domain.
const ASSESSMENT_BLOCKED_MESSAGE =
  "Este pack ainda não tem indicadores de avaliação próprios definidos — a avaliação está bloqueada até isso ser configurado.";

type AreaAverages = Record<
  string,
  { selfAvg: number; mentorAvg: number; composite: number }
>;

function composite(self: number, mentor: number): number {
  if (self > 0 && mentor > 0) return self * 0.4 + mentor * 0.6;
  return self > 0 ? self : mentor;
}

export async function computeAreaScores(
  userId: string,
  moment: EvaluationMoment
): Promise<AreaAverages> {
  await assertUserAccess(userId);

  // A moment can be (re)evaluated multiple times — ordered desc so
  // .find() below grabs the most recent self/mentor submission, not
  // whichever happened to be inserted first.
  const evals = await prisma.evaluation.findMany({
    where: { userId, moment },
    include: { scores: true },
    orderBy: { completedAt: "desc" },
  });
  const selfEval = evals.find((e) => e.evaluationType === "self");
  const mentorEval = evals.find((e) => e.evaluationType === "mentor");

  const result: AreaAverages = {};
  for (const area of AREA_KEYS) {
    const selfScores =
      selfEval?.scores.filter((s) => s.area === area).map((s) => s.score) ?? [];
    const mentorScores =
      mentorEval?.scores.filter((s) => s.area === area).map((s) => s.score) ??
      [];

    const selfAvg =
      selfScores.length > 0
        ? selfScores.reduce((a, b) => a + b, 0) / selfScores.length
        : 0;
    const mentorAvg =
      mentorScores.length > 0
        ? mentorScores.reduce((a, b) => a + b, 0) / mentorScores.length
        : 0;

    result[area] = {
      selfAvg: Math.round(selfAvg * 10) / 10,
      mentorAvg: Math.round(mentorAvg * 10) / 10,
      composite: Math.round(composite(selfAvg, mentorAvg) * 10) / 10,
    };
  }
  return result;
}

export async function getEvaluations(userId: string) {
  await assertUserAccess(userId);
  return prisma.evaluation.findMany({
    where: { userId },
    include: { scores: true, evaluator: { select: { name: true } } },
    orderBy: { completedAt: "asc" },
  });
}

export async function getIndicatorScores(
  userId: string,
  moment: EvaluationMoment
): Promise<
  Record<
    string,
    Record<string, { selfScore: number; mentorScore: number; composite: number }>
  >
> {
  await assertUserAccess(userId);

  // A moment can be (re)evaluated multiple times — ordered desc so
  // .find() below grabs the most recent self/mentor submission, not
  // whichever happened to be inserted first.
  const evals = await prisma.evaluation.findMany({
    where: { userId, moment },
    include: { scores: true },
    orderBy: { completedAt: "desc" },
  });
  const selfEval = evals.find((e) => e.evaluationType === "self");
  const mentorEval = evals.find((e) => e.evaluationType === "mentor");

  const result: Record<
    string,
    Record<string, { selfScore: number; mentorScore: number; composite: number }>
  > = {};

  for (const area of AREA_KEYS) {
    result[area] = {};
    const selfScores = selfEval?.scores.filter((s) => s.area === area) ?? [];
    const mentorScores =
      mentorEval?.scores.filter((s) => s.area === area) ?? [];

    const allIndicators = new Set([
      ...selfScores.map((s) => s.indicator),
      ...mentorScores.map((s) => s.indicator),
    ]);

    for (const indicator of allIndicators) {
      const selfScore =
        selfScores.find((s) => s.indicator === indicator)?.score ?? 0;
      const mentorScore =
        mentorScores.find((s) => s.indicator === indicator)?.score ?? 0;
      result[area][indicator] = {
        selfScore,
        mentorScore,
        composite: Math.round(composite(selfScore, mentorScore) * 10) / 10,
      };
    }
  }
  return result;
}

type ScoreInput = {
  area: string;
  indicator: string;
  score: number;
  notes?: string;
};

// Self-evaluation always targets the caller's own person-level history.
// Still gated on having an active membership (requireMembership) — you
// must be enrolled in a journey to self-evaluate — but only `user.id` is
// used to key the record.
export async function submitSelfEvaluation(data: {
  moment: EvaluationMoment;
  scores: ScoreInput[];
}) {
  // requireMembership() re-reads the active membership from the DB on
  // every call (no cached/passed-in value), so this check is inherently
  // anti-TOCTOU — the pack it gates on is always fresh.
  const { user, membership } = await requireMembership();
  if (!hasDedicatedIndicators(membership.packSlug)) {
    throw new Error(ASSESSMENT_BLOCKED_MESSAGE);
  }
  if (data.scores.some((s) => !Number.isInteger(s.score) || s.score < 1 || s.score > 5)) {
    throw new Error("Scores must be integers between 1 and 5");
  }
  return prisma.evaluation.create({
    data: {
      userId: user.id,
      evaluatorId: user.id,
      evaluationType: "self",
      moment: data.moment,
      completedAt: new Date(),
      scores: {
        create: data.scores.map((s) => ({
          area: s.area as AreaKey,
          indicator: s.indicator,
          score: s.score,
          notes: s.notes,
        })),
      },
    },
  });
}

// Mentor evaluation — only mentors of one of the member's cohorts (or admin).
export async function submitMentorEvaluation(data: {
  userId: string;
  moment: EvaluationMoment;
  scores: ScoreInput[];
}) {
  const { actor } = await assertMentorOfUser(data.userId);

  // Anti-TOCTOU: re-read the SUBJECT's active membership pack fresh from
  // the DB right before gating — never trust a pack/indicator set
  // resolved earlier in the request (mirrors the pack-activation gate's
  // pattern of re-fetching the pack instead of trusting a passed-in
  // value). A member with no active membership isn't covered by this
  // gate — membership/invite is deliberately not gated (see admin.ts) —
  // so we only block when we can identify the pack in play.
  const subjectMembership = await prisma.cohortMembership.findFirst({
    where: { userId: data.userId, status: "active" },
    orderBy: { joinedAt: "desc" },
    select: { cohort: { select: { pack: { select: { slug: true } } } } },
  });
  if (
    subjectMembership &&
    !hasDedicatedIndicators(subjectMembership.cohort.pack.slug)
  ) {
    throw new Error(ASSESSMENT_BLOCKED_MESSAGE);
  }

  if (data.scores.some((s) => !Number.isInteger(s.score) || s.score < 1 || s.score > 5)) {
    throw new Error("Scores must be integers between 1 and 5");
  }
  return prisma.evaluation.create({
    data: {
      userId: data.userId,
      evaluatorId: actor.id,
      evaluationType: "mentor",
      moment: data.moment,
      completedAt: new Date(),
      scores: {
        create: data.scores.map((s) => ({
          area: s.area as AreaKey,
          indicator: s.indicator,
          score: s.score,
          notes: s.notes,
        })),
      },
    },
  });
}
