import { describe, it, expect, vi, beforeEach } from "vitest";

// Regression test for the assessment-gate fix (M1 loophole): addMembership
// and createInvite deliberately stay un-gated (assembling a cohort ahead of
// launch is a legitimate admin workflow), but submitSelfEvaluation and
// submitMentorEvaluation must refuse when the pack in play has no dedicated
// indicator set — otherwise the member gets scored against
// DEFAULT_INDICATORS, measuring the wrong dimensions entirely.

const create = vi.fn();
const membershipFindFirst = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    evaluation: {
      create: (...args: unknown[]) => create(...args),
    },
    cohortMembership: {
      findFirst: (...args: unknown[]) => membershipFindFirst(...args),
    },
  },
}));

let selfMembership = {
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
  assertMentorOfUser: vi.fn(async () => ({
    actor: { id: "mentor-1", role: "mentor" },
    ownerUserId: "user-1",
  })),
  requireMembership: vi.fn(async () => ({
    user: { id: "user-1", role: "member" },
    membership: selfMembership,
  })),
}));

import { submitMentorEvaluation, submitSelfEvaluation } from "@/lib/wepacker/actions/evaluation";

const oneScore = [{ area: "physical", indicator: "posture", score: 3 }];

beforeEach(() => {
  create.mockReset();
  membershipFindFirst.mockReset();
  selfMembership = { ...selfMembership, packSlug: "artist", packName: "Pack Artista" };
});

describe("submitSelfEvaluation — indicator gate", () => {
  it("refuses with a clear PT-PT error when the active pack has no dedicated indicators", async () => {
    selfMembership = { ...selfMembership, packSlug: "sport", packName: "Pack Desporto" };

    await expect(
      submitSelfEvaluation({ moment: "entry", scores: oneScore })
    ).rejects.toThrow(/indicadores/i);
    expect(create).not.toHaveBeenCalled();
  });

  it("allows the assessment through when the pack has dedicated indicators", async () => {
    create.mockResolvedValue({ id: "eval-1" });
    selfMembership = { ...selfMembership, packSlug: "artist" };

    await expect(
      submitSelfEvaluation({ moment: "entry", scores: oneScore })
    ).resolves.toBeDefined();
    expect(create).toHaveBeenCalledTimes(1);
  });
});

describe("submitMentorEvaluation — indicator gate", () => {
  it("refuses when the subject's active membership pack has no dedicated indicators", async () => {
    membershipFindFirst.mockResolvedValue({ cohort: { pack: { slug: "sport" } } });

    await expect(
      submitMentorEvaluation({ userId: "user-1", moment: "entry", scores: oneScore })
    ).rejects.toThrow(/indicadores/i);
    expect(create).not.toHaveBeenCalled();

    // Anti-TOCTOU: the subject's pack must be re-read from the DB for
    // this call, not trusted from any earlier-resolved value.
    expect(membershipFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: "user-1" }) })
    );
  });

  it("allows the mentor evaluation through when the subject's pack has dedicated indicators", async () => {
    create.mockResolvedValue({ id: "eval-2" });
    membershipFindFirst.mockResolvedValue({ cohort: { pack: { slug: "artist" } } });

    await expect(
      submitMentorEvaluation({ userId: "user-1", moment: "entry", scores: oneScore })
    ).resolves.toBeDefined();
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("does not block when the subject has no active membership at all", async () => {
    // Membership/invite is deliberately not gated — a subject can be
    // between packs. Only an identified pack without dedicated
    // indicators triggers the refusal.
    create.mockResolvedValue({ id: "eval-3" });
    membershipFindFirst.mockResolvedValue(null);

    await expect(
      submitMentorEvaluation({ userId: "user-1", moment: "entry", scores: oneScore })
    ).resolves.toBeDefined();
    expect(create).toHaveBeenCalledTimes(1);
  });
});
