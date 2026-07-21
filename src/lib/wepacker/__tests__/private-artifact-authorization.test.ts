import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.fn();
const membershipFindUnique = vi.fn();
const membershipFindMany = vi.fn();

vi.mock("@/lib/auth", () => ({ auth: (...args: unknown[]) => auth(...args) }));
vi.mock("@/lib/db", () => ({
  prisma: {
    cohortMembership: {
      findUnique: (...args: unknown[]) => membershipFindUnique(...args),
      findMany: (...args: unknown[]) => membershipFindMany(...args),
    },
  },
}));

import {
  assertMembershipAccess,
  assertMentorOfUser,
  assertMentorOfUsers,
  assertUserAccess,
} from "@/lib/wepacker/guards";

function signIn(id: string, role: "member" | "mentor" | "admin") {
  auth.mockResolvedValue({
    user: {
      id,
      role,
      name: "Test Person",
      email: "person@example.test",
      onboarded: true,
    },
  });
}

describe("private artifact authorization", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("keeps person artifacts owner-only even for a legacy Mentor", async () => {
    signIn("mentor-1", "mentor");

    await expect(assertUserAccess("person-1")).rejects.toThrow("Sem permissão.");
    await expect(assertMentorOfUser("person-1")).rejects.toThrow(
      "Explicit artifact grant required."
    );
    await expect(assertMentorOfUsers(["person-1"])).rejects.toThrow(
      "Explicit artifact grant required."
    );
    expect(membershipFindMany).not.toHaveBeenCalled();
  });

  it("allows a Person to read their own artifacts", async () => {
    signIn("person-1", "member");

    await expect(assertUserAccess("person-1")).resolves.toMatchObject({
      ownerUserId: "person-1",
    });
  });

  it("keeps legacy membership artifacts owner-only", async () => {
    signIn("mentor-1", "mentor");
    membershipFindUnique.mockResolvedValue({
      id: "membership-1",
      userId: "person-1",
      role: "member",
      status: "active",
      level: "seed",
      currentPhase: "diagnosis",
      cohortId: "cohort-1",
      joinedAt: new Date(),
      cohort: {
        id: "cohort-1",
        name: "Legacy cohort",
        packId: "legacy-pack-1",
        pack: { id: "legacy-pack-1", slug: "artist", name: "Artist" },
      },
    });

    await expect(assertMembershipAccess("membership-1")).rejects.toThrow(
      "Sem permissão."
    );
    expect(membershipFindMany).not.toHaveBeenCalled();
  });

  it("does not treat Admin access as an artifact grant", async () => {
    signIn("admin-1", "admin");

    await expect(assertUserAccess("person-1")).rejects.toThrow("Sem permissão.");
    await expect(assertMentorOfUser("person-1")).rejects.toThrow(
      "Explicit artifact grant required."
    );
    await expect(assertMentorOfUsers(["person-1", "person-2"])).rejects.toThrow(
      "Explicit artifact grant required."
    );
  });
});
