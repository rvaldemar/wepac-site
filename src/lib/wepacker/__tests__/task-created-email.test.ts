import { describe, it, expect, vi, beforeEach } from "vitest";

// Story T1/M: a mentor assigning a task to a member should trigger a
// "new task" email to that member; a member creating their own task
// (self-origin) must never trigger one.

const create = vi.fn();
const findUniqueUser = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    task: {
      create: (...args: unknown[]) => create(...args),
    },
    user: {
      findUnique: (...args: unknown[]) => findUniqueUser(...args),
    },
  },
}));

const assertMembershipAccess = vi.fn();
vi.mock("@/lib/wepacker/guards", () => ({
  assertMembershipAccess: (...args: unknown[]) => assertMembershipAccess(...args),
  getMentoredCohortIds: vi.fn(async () => []),
  requireMembership: vi.fn(),
  requireUser: vi.fn(),
}));

// task.ts statically imports assertMentorOfSession from session.ts —
// stub it out so this test never pulls in the real session module (ics,
// nodemailer, etc).
vi.mock("@/lib/wepacker/actions/session", () => ({
  assertMentorOfSession: vi.fn(),
}));

const sendTaskCreatedEmail = vi.fn(async (..._args: unknown[]) => undefined);
vi.mock("@/lib/email", () => ({
  sendTaskCreatedEmail: (...args: unknown[]) => sendTaskCreatedEmail(...args),
}));

import { createTask } from "@/lib/wepacker/actions/task";

const baseArgs = {
  membershipId: "membership-1",
  title: "Ler capítulo 3",
  origin: "self" as const,
  deadline: "2026-08-01",
};

describe("createTask — member notification email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findUniqueUser.mockResolvedValue({ name: "Member One", email: "member1@wepac.pt" });
  });

  it("sends a 'new task' email when a mentor assigns the task to a member", async () => {
    assertMembershipAccess.mockResolvedValueOnce({
      actor: { id: "mentor-1", role: "mentor" },
      membership: { membershipId: "membership-1" },
      ownerUserId: "member-1",
    });
    create.mockResolvedValueOnce({
      id: "task-1",
      title: baseArgs.title,
      deadline: baseArgs.deadline,
    });

    await createTask(baseArgs);

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ assignedById: "mentor-1", origin: "mentor" }),
      })
    );
    await vi.waitFor(() => {
      expect(sendTaskCreatedEmail).toHaveBeenCalledTimes(1);
    });
    expect(sendTaskCreatedEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "member1@wepac.pt",
        recipientName: "Member One",
        title: baseArgs.title,
        deadline: baseArgs.deadline,
      })
    );
  });

  it("does not send an email when a member creates their own task", async () => {
    assertMembershipAccess.mockResolvedValueOnce({
      actor: { id: "member-1", role: "member" },
      membership: { membershipId: "membership-1" },
      ownerUserId: "member-1",
    });
    create.mockResolvedValueOnce({
      id: "task-2",
      title: baseArgs.title,
      deadline: baseArgs.deadline,
    });

    await createTask(baseArgs);

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ assignedById: null, origin: "self" }),
      })
    );
    // Give any (incorrectly) fired fan-off a tick to happen before asserting.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(sendTaskCreatedEmail).not.toHaveBeenCalled();
  });
});
