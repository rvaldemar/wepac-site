import { beforeEach, describe, expect, it, vi } from "vitest";

const requireUser = vi.fn();
const actionFindMany = vi.fn();
const actionCreate = vi.fn();
const actionUpdateMany = vi.fn();
const actionDeleteMany = vi.fn();
const goalFindFirst = vi.fn();
const trailFindFirst = vi.fn();

const transactionClient = {
  action: { create: (...args: unknown[]) => actionCreate(...args) },
  goal: { findFirst: (...args: unknown[]) => goalFindFirst(...args) },
  trail: { findFirst: (...args: unknown[]) => trailFindFirst(...args) },
};

vi.mock("@/lib/wepacker/guards", () => ({
  requireUser: (...args: unknown[]) => requireUser(...args),
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    action: {
      findMany: (...args: unknown[]) => actionFindMany(...args),
      updateMany: (...args: unknown[]) => actionUpdateMany(...args),
      deleteMany: (...args: unknown[]) => actionDeleteMany(...args),
    },
    $transaction: (callback: (tx: typeof transactionClient) => unknown) =>
      callback(transactionClient),
  },
}));

import {
  createAction,
  deleteAction,
  getMyActions,
  updateActionStatus,
} from "@/lib/wepacker/actions/action";

describe("Person-owned Actions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    requireUser.mockResolvedValue({ id: "person-1", role: "member" });
    actionFindMany.mockResolvedValue([]);
    actionUpdateMany.mockResolvedValue({ count: 1 });
    actionDeleteMany.mockResolvedValue({ count: 1 });
    goalFindFirst.mockResolvedValue(null);
    trailFindFirst.mockResolvedValue(null);
  });

  it("lists only Actions assigned to the signed-in Person", async () => {
    await getMyActions();
    expect(actionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { assigneeId: "person-1" } }),
    );
  });

  it("creates only a self-owned Action and derives Plan context from an owned Goal", async () => {
    goalFindFirst.mockResolvedValueOnce({
      id: "goal-1",
      strategicPlanId: "plan-1",
    });
    trailFindFirst.mockResolvedValueOnce({ id: "trail-1" });
    actionCreate.mockResolvedValueOnce({ id: "action-1" });

    await createAction({
      title: "  Follow through  ",
      description: "  Concrete next step  ",
      dueAt: "2026-08-01T12:00:00.000Z",
      goalId: "goal-1",
      trailId: "trail-1",
    });

    expect(goalFindFirst).toHaveBeenCalledWith({
      where: {
        id: "goal-1",
        strategicPlan: { userId: "person-1" },
      },
      select: { id: true, strategicPlanId: true },
    });
    expect(trailFindFirst).toHaveBeenCalledWith({
      where: { id: "trail-1", userId: "person-1" },
      select: { id: true },
    });
    expect(actionCreate).toHaveBeenCalledWith({
      data: {
        assigneeId: "person-1",
        createdById: "person-1",
        title: "Follow through",
        description: "Concrete next step",
        origin: "self",
        status: "pending",
        dueAt: new Date("2026-08-01T12:00:00.000Z"),
        strategicPlanId: "plan-1",
        goalId: "goal-1",
        trailId: "trail-1",
      },
    });
  });

  it("rejects Goal and Trail context not owned by the Person", async () => {
    await expect(
      createAction({ title: "Action", goalId: "foreign-goal" }),
    ).rejects.toThrow("Goal unavailable.");
    await expect(
      createAction({ title: "Action", trailId: "foreign-trail" }),
    ).rejects.toThrow("Trail unavailable.");
    expect(actionCreate).not.toHaveBeenCalled();
  });

  it("updates and deletes through an assignee-scoped atomic predicate", async () => {
    await expect(updateActionStatus("action-1", "completed")).resolves.toEqual({
      id: "action-1",
      status: "completed",
    });
    await deleteAction("action-1");
    expect(actionUpdateMany).toHaveBeenCalledWith({
      where: { id: "action-1", assigneeId: "person-1" },
      data: { status: "completed" },
    });
    expect(actionDeleteMany).toHaveBeenCalledWith({
      where: { id: "action-1", assigneeId: "person-1" },
    });
  });

  it("does not reveal whether a foreign Action exists", async () => {
    actionUpdateMany.mockResolvedValueOnce({ count: 0 });
    actionDeleteMany.mockResolvedValueOnce({ count: 0 });
    await expect(updateActionStatus("foreign", "in_progress")).rejects.toThrow(
      "Action unavailable.",
    );
    await expect(deleteAction("foreign")).rejects.toThrow(
      "Action unavailable.",
    );
  });

  it("validates status and date before writing", async () => {
    await expect(
      updateActionStatus("action-1", "todo" as never),
    ).rejects.toThrow("Invalid Action status.");
    await expect(
      createAction({ title: "Action", dueAt: "not-a-date" }),
    ).rejects.toThrow("Invalid Action due date.");
    expect(actionCreate).not.toHaveBeenCalled();
  });

  it("rejects caller-controlled ownership and privileged context fields", async () => {
    for (const forbidden of [
      { assigneeId: "person-2" },
      { createdById: "person-2" },
      { strategicPlanId: "plan-2" },
      { sourceSessionId: "session-1" },
      { cycleId: "cycle-1" },
      { mentorshipId: "mentorship-1" },
      { origin: "session_proposal" },
      { status: "completed" },
    ]) {
      await expect(
        createAction({ title: "Action", ...forbidden }),
      ).rejects.toThrow("unsupported field");
    }
    expect(actionCreate).not.toHaveBeenCalled();
  });

  it("rejects a custom prototype carrying an inherited owner", async () => {
    const hostile = Object.assign(Object.create({ assigneeId: "person-2" }), {
      title: "Action",
    });

    await expect(createAction(hostile)).rejects.toThrow("invalid prototype");
    expect(actionCreate).not.toHaveBeenCalled();
  });

  it("rejects oversized values and invalid context identifiers", async () => {
    await expect(createAction({ title: "x".repeat(201) })).rejects.toThrow(
      "cannot exceed 200 characters",
    );
    await expect(
      createAction({ title: "Action", description: "x".repeat(5_001) }),
    ).rejects.toThrow("cannot exceed 5000 characters");
    await expect(
      createAction({ title: "Action", goalId: 123 }),
    ).rejects.toThrow("Goal ID must be a string");
    await expect(
      createAction({ title: "Action", trailId: "x".repeat(192) }),
    ).rejects.toThrow("Invalid Trail ID");
    await expect(updateActionStatus(123, "completed")).rejects.toThrow(
      "Action ID must be a string",
    );
    expect(goalFindFirst).not.toHaveBeenCalled();
    expect(trailFindFirst).not.toHaveBeenCalled();
    expect(actionCreate).not.toHaveBeenCalled();
    expect(actionUpdateMany).not.toHaveBeenCalled();
  });
});
