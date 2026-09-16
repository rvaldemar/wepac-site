import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.fn();
const userFindUnique = vi.fn();

vi.mock("@/lib/auth", () => ({ auth: (...args: unknown[]) => auth(...args) }));
vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: (...args: unknown[]) => userFindUnique(...args) },
  },
}));

import {
  assertMentorOfUser,
  assertMentorOfUsers,
  assertUserAccess,
  assertUserOwner,
} from "@/lib/wepacker/guards";

function signIn(id: string, role: "member" | "admin") {
  auth.mockResolvedValue({
    user: {
      id,
      role,
      name: "Test Person",
      email: "person@example.test",
      onboarded: true,
      sessionVersion: 1,
    },
  });
  userFindUnique.mockResolvedValue({
    id,
    role,
    name: "Test Person",
    email: "person@example.test",
    onboarded: true,
    sessionVersion: 1,
  });
}

describe("private artifact authorization", () => {
  beforeEach(() => vi.resetAllMocks());

  it("keeps Person artifacts owner-only", async () => {
    signIn("person-1", "member");
    await expect(assertUserAccess("person-1")).resolves.toMatchObject({
      ownerUserId: "person-1",
    });
    await expect(assertUserOwner("person-1")).resolves.toMatchObject({
      ownerUserId: "person-1",
    });
    await expect(assertUserAccess("person-2")).rejects.toThrow(
      "Sem permissão.",
    );
  });

  it.each(["member", "admin"] as const)(
    "does not turn the %s account role into an artifact grant",
    async (role) => {
      signIn(`${role}-1`, role);
      await expect(assertUserAccess("person-1")).rejects.toThrow(
        "Sem permissão.",
      );
      await expect(assertMentorOfUser("person-1")).rejects.toThrow(
        "Explicit artifact grant required.",
      );
      await expect(assertMentorOfUsers(["person-1"])).rejects.toThrow(
        "Explicit artifact grant required.",
      );
    },
  );
});
