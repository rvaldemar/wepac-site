import { describe, it, expect, vi, beforeEach } from "vitest";

// Story C4: createTaskFromSession must be idempotent by
// (sourceSessionId, membershipId, title) — the debrief review workspace
// doesn't persist per-item "already approved" state, so a page refresh
// re-renders every task suggestion as pending. Calling this twice with
// the same sessionId/userId/title must create exactly one Task row and
// return the first one on the second call, never a duplicate.

const findUnique = vi.fn();
const findFirstMembership = vi.fn();
const findFirstTask = vi.fn();
const create = vi.fn();
const findUniqueUser = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    sessionAttendee: {
      findUnique: (...args: unknown[]) => findUnique(...args),
    },
    cohortMembership: {
      findFirst: (...args: unknown[]) => findFirstMembership(...args),
    },
    task: {
      findFirst: (...args: unknown[]) => findFirstTask(...args),
      create: (...args: unknown[]) => create(...args),
    },
    user: {
      findUnique: (...args: unknown[]) => findUniqueUser(...args),
    },
  },
}));

const sendTaskCreatedEmail = vi.fn(async (..._args: unknown[]) => undefined);
vi.mock("@/lib/email", () => ({
  sendTaskCreatedEmail: (...args: unknown[]) => sendTaskCreatedEmail(...args),
}));

vi.mock("@/lib/wepacker/actions/session", () => ({
  assertMentorOfSession: vi.fn(async () => ({
    cohortId: "cohort-1",
    mentorId: "mentor-1",
  })),
}));

vi.mock("@/lib/wepacker/guards", () => ({
  requireUser: vi.fn(async () => ({ id: "mentor-1", role: "mentor" })),
  requireMembership: vi.fn(),
  assertMembershipAccess: vi.fn(async () => ({
    actor: { id: "mentor-1", role: "mentor" },
    membership: { membershipId: "membership-1" },
    ownerUserId: "member-1",
  })),
  getMentoredCohortIds: vi.fn(async () => ["cohort-1"]),
}));

import { createTaskFromSession } from "@/lib/wepacker/actions/task";

const baseArgs = {
  sessionId: "session-1",
  userId: "member-1",
  title: "Praticar respiração diafragmática",
  deadline: "2026-08-01",
};

const createdTask = {
  id: "task-1",
  membershipId: "membership-1",
  title: baseArgs.title,
  deadline: baseArgs.deadline,
  sourceSessionId: baseArgs.sessionId,
};

describe("createTaskFromSession idempotency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findUnique.mockResolvedValue({ id: "attendee-1" });
    findFirstMembership.mockResolvedValue({ id: "membership-1" });
    findUniqueUser.mockResolvedValue({ name: "Member One", email: "member1@wepac.pt" });
  });

  it("creates exactly one Task row when called twice with the same sessionId/userId/title", async () => {
    // First call: no existing task yet.
    findFirstTask.mockResolvedValueOnce(null);
    create.mockResolvedValueOnce(createdTask);

    const first = await createTaskFromSession(baseArgs);
    expect(create).toHaveBeenCalledTimes(1);
    expect(first).toEqual(createdTask);

    // Second call: the dedup guard finds the row just created and
    // returns it instead of calling prisma.task.create again.
    findFirstTask.mockResolvedValueOnce(createdTask);

    const second = await createTaskFromSession(baseArgs);
    expect(create).toHaveBeenCalledTimes(1); // still 1 — no duplicate insert
    expect(second).toEqual(createdTask);
  });

  it("distinct titles are unaffected by the dedup guard", async () => {
    findFirstTask.mockResolvedValue(null);
    create.mockResolvedValue({ ...createdTask, id: "task-2", title: "Outra tarefa" });

    await createTaskFromSession({ ...baseArgs, title: "Outra tarefa" });
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("sends a 'new task' email to the member for a freshly created task", async () => {
    findFirstTask.mockResolvedValueOnce(null);
    create.mockResolvedValueOnce(createdTask);

    await createTaskFromSession(baseArgs);

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

  it("does not send an email again on the idempotent (already-created) path", async () => {
    findFirstTask.mockResolvedValueOnce(createdTask);

    await createTaskFromSession(baseArgs);

    expect(create).not.toHaveBeenCalled();
    // Give any (incorrectly) fired fan-off a tick to happen before asserting.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(sendTaskCreatedEmail).not.toHaveBeenCalled();
  });
});
