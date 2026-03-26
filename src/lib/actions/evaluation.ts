"use server";

import { prisma } from "@/lib/db";
import type { AreaKey, EvaluationMoment } from "@prisma/client";

export async function computeAreaScores(
  userId: string,
  moment: EvaluationMoment
): Promise<
  Record<string, { selfAvg: number; mentorAvg: number; composite: number }>
> {
  const evals = await prisma.evaluation.findMany({
    where: { userId, moment },
    include: { scores: true },
  });

  const selfEval = evals.find((e) => e.evaluationType === "self");
  const mentorEval = evals.find((e) => e.evaluationType === "mentor");

  const areas: AreaKey[] = [
    "physical",
    "emotional",
    "character",
    "spiritual",
    "intellectual",
    "social",
  ];

  const result: Record<
    string,
    { selfAvg: number; mentorAvg: number; composite: number }
  > = {};

  for (const area of areas) {
    const selfScores =
      selfEval?.scores.filter((s) => s.area === area).map((s) => s.score) ?? [];
    const mentorScores =
      mentorEval?.scores
        .filter((s) => s.area === area)
        .map((s) => s.score) ?? [];

    const selfAvg =
      selfScores.length > 0
        ? selfScores.reduce((a, b) => a + b, 0) / selfScores.length
        : 0;
    const mentorAvg =
      mentorScores.length > 0
        ? mentorScores.reduce((a, b) => a + b, 0) / mentorScores.length
        : 0;

    let composite: number;
    if (selfAvg > 0 && mentorAvg > 0) {
      composite = selfAvg * 0.4 + mentorAvg * 0.6;
    } else if (selfAvg > 0) {
      composite = selfAvg;
    } else {
      composite = mentorAvg;
    }

    result[area] = {
      selfAvg: Math.round(selfAvg * 10) / 10,
      mentorAvg: Math.round(mentorAvg * 10) / 10,
      composite: Math.round(composite * 10) / 10,
    };
  }

  return result;
}

export async function getEvaluations(userId: string) {
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
  Record<string, Record<string, { selfScore: number; mentorScore: number; composite: number }>>
> {
  const evals = await prisma.evaluation.findMany({
    where: { userId, moment },
    include: { scores: true },
  });

  const selfEval = evals.find((e) => e.evaluationType === "self");
  const mentorEval = evals.find((e) => e.evaluationType === "mentor");

  const areas: AreaKey[] = [
    "physical",
    "emotional",
    "character",
    "spiritual",
    "intellectual",
    "social",
  ];

  const result: Record<
    string,
    Record<string, { selfScore: number; mentorScore: number; composite: number }>
  > = {};

  for (const area of areas) {
    result[area] = {};
    const selfScores = selfEval?.scores.filter((s) => s.area === area) ?? [];
    const mentorScores = mentorEval?.scores.filter((s) => s.area === area) ?? [];

    const allIndicators = new Set([
      ...selfScores.map((s) => s.indicator),
      ...mentorScores.map((s) => s.indicator),
    ]);

    for (const indicator of allIndicators) {
      const selfScore = selfScores.find((s) => s.indicator === indicator)?.score ?? 0;
      const mentorScore = mentorScores.find((s) => s.indicator === indicator)?.score ?? 0;

      let composite: number;
      if (selfScore > 0 && mentorScore > 0) {
        composite = selfScore * 0.4 + mentorScore * 0.6;
      } else if (selfScore > 0) {
        composite = selfScore;
      } else {
        composite = mentorScore;
      }

      result[area][indicator] = {
        selfScore,
        mentorScore,
        composite: Math.round(composite * 10) / 10,
      };
    }
  }

  return result;
}

export async function submitEvaluation(data: {
  userId: string;
  evaluatorId: string;
  evaluationType: "self" | "mentor";
  moment: "entry" | "mid" | "exit";
  scores: { area: string; indicator: string; score: number }[];
}) {
  return prisma.evaluation.create({
    data: {
      userId: data.userId,
      evaluatorId: data.evaluatorId,
      evaluationType: data.evaluationType,
      moment: data.moment,
      completedAt: new Date(),
      scores: {
        create: data.scores.map((s) => ({
          area: s.area as AreaKey,
          indicator: s.indicator,
          score: s.score,
        })),
      },
    },
  });
}
