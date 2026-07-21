import { beforeEach, describe, expect, it, vi } from "vitest";

const requireUser = vi.fn();
const taskCreate = vi.fn();

vi.mock("@/lib/wepacker/guards", () => ({
  requireUser: (...args: unknown[]) => requireUser(...args),
  requireMembership: vi.fn(),
  assertMembershipAccess: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    task: { create: (...args: unknown[]) => taskCreate(...args) },
  },
}));

vi.mock("@/lib/email", () => ({ sendTaskCreatedEmail: vi.fn() }));

import { createTaskFromSession } from "@/lib/wepacker/actions/task";

const input = {
  sessionId: "session-1",
  userId: "person-1",
  title: "Follow up",
  deadline: "2026-08-01",
};

describe("createTaskFromSession capability containment", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it.each([
    ["mentor", "mentor-1"],
    ["admin", "admin-1"],
  ] as const)(
    "fails closed for %s because Session access is not a Task grant",
    async (role, id) => {
      requireUser.mockResolvedValueOnce({ id, role });

      await expect(createTaskFromSession(input)).rejects.toThrow(
        "Explicit Task grant required."
      );
      expect(taskCreate).not.toHaveBeenCalled();
    }
  );
});
