import { describe, it, expect, vi, beforeEach } from "vitest";
import { AREA_KEYS } from "@/lib/wepacker/types";

// Mock prisma and the authorization guards so these units test the
// computation and persistence shape, not the auth layer.
const findMany = vi.fn();
const create = vi.fn();
const membershipFindFirst = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    evaluation: {
      findMany: (...args: unknown[]) => findMany(...args),
      create: (...args: unknown[]) => create(...args),
    },
    cohortMembership: {
      findFirst: (...args: unknown[]) => membershipFindFirst(...args),
    },
  },
}));

const membership = {
  membershipId: "mem-1",
  role: "member",
  level: "seed",
  currentPhase: "diagnosis",
  cohortId: "cohort-1",
  cohortName: "Alpha",
  packId: "pack-1",
  packSlug: "artist",
  packName: "Pack Artista",
};

vi.mock("@/lib/wepacker/guards", () => ({
  assertUserAccess: vi.fn(async () => ({
    actor: { id: "user-1", role: "member" },
    ownerUserId: "user-1",
  })),
  assertMentorOfUser: vi.fn(async () => ({
    actor: { id: "mentor-1", role: "mentor" },
    ownerUserId: "user-1",
  })),
  requireMembership: vi.fn(async () => ({
    user: { id: "user-1", role: "member" },
    membership,
  })),
}));

import {
  computeAreaScores,
  submitMentorEvaluation,
  submitSelfEvaluation,
} from "@/lib/wepacker/actions/evaluation";

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
  membershipFindFirst.mockReset();
  // Default: subject has an active membership on the artist pack, which
  // has dedicated indicators — keeps the existing submitMentorEvaluation
  // test un-gated unless a test overrides this.
  membershipFindFirst.mockResolvedValue({ cohort: { pack: { slug: "artist" } } });
});

describe("computeAreaScores", () => {
  it("composes 40% self / 60% mentor across all 6 areas", async () => {
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

  it("returns 0 composite for an area with no scores", async () => {
    findMany.mockResolvedValue([]);
    const result = await computeAreaScores("user-1", "mid");
    expect(result.social.composite).toBe(0);
  });
});

describe("submitMentorEvaluation", () => {
  it("persists a mentor evaluation on the person with the actor as evaluator", async () => {
    create.mockResolvedValue({ id: "eval-1" });

    await submitMentorEvaluation({
      userId: "user-1",
      moment: "mid",
      scores: [
        { area: "physical", indicator: "posture", score: 4, notes: "boa base" },
        { area: "intellectual", indicator: "technical_knowledge", score: 5 },
      ],
    });

    expect(create).toHaveBeenCalledTimes(1);
    const arg = create.mock.calls[0][0];
    expect(arg.data.userId).toBe("user-1");
    expect(arg.data.evaluatorId).toBe("mentor-1");
    expect(arg.data.evaluationType).toBe("mentor");
    expect(arg.data.moment).toBe("mid");
    expect(arg.data.completedAt).toBeInstanceOf(Date);

    const created = arg.data.scores.create;
    expect(created).toEqual([
      { area: "physical", indicator: "posture", score: 4, notes: "boa base" },
      { area: "intellectual", indicator: "technical_knowledge", score: 5, notes: undefined },
    ]);
  });
});

describe("submitSelfEvaluation", () => {
  it("always targets the caller's own person-level history", async () => {
    create.mockResolvedValue({ id: "eval-2" });

    await submitSelfEvaluation({
      moment: "entry",
      scores: [{ area: "physical", indicator: "posture", score: 3 }],
    });

    const arg = create.mock.calls[0][0];
    expect(arg.data.userId).toBe("user-1");
    expect(arg.data.evaluatorId).toBe("user-1");
    expect(arg.data.evaluationType).toBe("self");
  });
});
