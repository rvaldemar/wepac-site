import { describe, it, expect, vi, beforeEach } from "vitest";
import { AREA_KEYS } from "@/lib/types/artist";

// Mock the prisma client so these units never touch a real database.
const findMany = vi.fn();
const create = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    evaluation: {
      findMany: (...args: unknown[]) => findMany(...args),
      create: (...args: unknown[]) => create(...args),
    },
  },
}));

import { computeAreaScores, submitEvaluation } from "@/lib/actions/evaluation";

type Score = { area: string; indicator: string; score: number; notes?: string };

function evalWith(
  evaluationType: "self" | "mentor",
  score: number
): { evaluationType: string; scores: Score[] } {
  const scores: Score[] = AREA_KEYS.map((area) => ({
    area,
    indicator: `${area}_a`,
    score,
  }));
  return { evaluationType, scores };
}

beforeEach(() => {
  findMany.mockReset();
  create.mockReset();
});

describe("computeAreaScores", () => {
  it("composes 40% self / 60% mentor across all 7 pillars", async () => {
    findMany.mockResolvedValue([evalWith("self", 4), evalWith("mentor", 5)]);

    const result = await computeAreaScores("user-1", "mid");

    expect(Object.keys(result).sort()).toEqual([...AREA_KEYS].sort());
    for (const area of AREA_KEYS) {
      expect(result[area].selfAvg).toBe(4);
      expect(result[area].mentorAvg).toBe(5);
      // round(4*0.4 + 5*0.6, 1) = 4.6
      expect(result[area].composite).toBe(4.6);
    }
  });

  it("falls back to the self side when no mentor eval exists", async () => {
    findMany.mockResolvedValue([evalWith("self", 3)]);
    const result = await computeAreaScores("user-1", "mid");
    for (const area of AREA_KEYS) {
      expect(result[area].composite).toBe(3);
      expect(result[area].mentorAvg).toBe(0);
    }
  });

  it("falls back to the mentor side when no self eval exists", async () => {
    findMany.mockResolvedValue([evalWith("mentor", 2)]);
    const result = await computeAreaScores("user-1", "mid");
    for (const area of AREA_KEYS) {
      expect(result[area].composite).toBe(2);
      expect(result[area].selfAvg).toBe(0);
    }
  });

  it("returns 0 composite for an area with no scores (e.g. legacy artistic)", async () => {
    findMany.mockResolvedValue([]);
    const result = await computeAreaScores("user-1", "mid");
    expect(result.artistic.composite).toBe(0);
  });
});

describe("submitEvaluation", () => {
  it("persists a mentor evaluation with notes propagated to each score", async () => {
    create.mockResolvedValue({ id: "eval-1" });

    await submitEvaluation({
      userId: "artist-1",
      evaluatorId: "mentor-1",
      evaluationType: "mentor",
      moment: "mid",
      scores: [
        { area: "physical", indicator: "posture", score: 4, notes: "boa base" },
        { area: "artistic", indicator: "creative_voice", score: 5 },
      ],
    });

    expect(create).toHaveBeenCalledTimes(1);
    const arg = create.mock.calls[0][0];
    expect(arg.data.userId).toBe("artist-1");
    expect(arg.data.evaluatorId).toBe("mentor-1");
    expect(arg.data.evaluationType).toBe("mentor");
    expect(arg.data.moment).toBe("mid");
    expect(arg.data.completedAt).toBeInstanceOf(Date);

    const created = arg.data.scores.create;
    expect(created).toEqual([
      { area: "physical", indicator: "posture", score: 4, notes: "boa base" },
      { area: "artistic", indicator: "creative_voice", score: 5, notes: undefined },
    ]);
  });
});
