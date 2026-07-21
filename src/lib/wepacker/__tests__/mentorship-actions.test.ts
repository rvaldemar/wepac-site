import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const revalidatePath = vi.fn();
const requireUser = vi.fn();
const requireRole = vi.fn();
const getMyMembership = vi.fn();
const getMentoredCohortIds = vi.fn();

const mentorshipFindMany = vi.fn();
const mentorshipFindUnique = vi.fn();
const mentorshipCreate = vi.fn();
const mentorshipUpdateMany = vi.fn();
const mentorshipCount = vi.fn();
const userFindUnique = vi.fn();
const userFindMany = vi.fn();
const cohortMembershipFindFirst = vi.fn();
const cohortMembershipFindMany = vi.fn();
const messageCount = vi.fn();
const taskCount = vi.fn();

const sendMentorshipInvitationEmail = vi.fn(async (input: unknown) => {
  void input;
});
const sendMentorshipAcceptedEmail = vi.fn(async (input: unknown) => {
  void input;
});

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    mentorship: {
      findMany: (...args: unknown[]) => mentorshipFindMany(...args),
      findUnique: (...args: unknown[]) => mentorshipFindUnique(...args),
      create: (...args: unknown[]) => mentorshipCreate(...args),
      updateMany: (...args: unknown[]) => mentorshipUpdateMany(...args),
      count: (...args: unknown[]) => mentorshipCount(...args),
    },
    user: {
      findUnique: (...args: unknown[]) => userFindUnique(...args),
      findMany: (...args: unknown[]) => userFindMany(...args),
    },
    cohortMembership: {
      findFirst: (...args: unknown[]) => cohortMembershipFindFirst(...args),
      findMany: (...args: unknown[]) => cohortMembershipFindMany(...args),
    },
    message: {
      count: (...args: unknown[]) => messageCount(...args),
    },
    task: {
      count: (...args: unknown[]) => taskCount(...args),
    },
  },
}));

vi.mock("@/lib/wepacker/guards", () => ({
  requireUser: (...args: unknown[]) => requireUser(...args),
  requireRole: (...args: unknown[]) => requireRole(...args),
  getMyMembership: (...args: unknown[]) => getMyMembership(...args),
  getMentoredCohortIds: (...args: unknown[]) => getMentoredCohortIds(...args),
}));

vi.mock("@/lib/email", () => ({
  sendMentorshipInvitationEmail: (input: unknown) =>
    sendMentorshipInvitationEmail(input),
  sendMentorshipAcceptedEmail: (input: unknown) =>
    sendMentorshipAcceptedEmail(input),
}));

import {
  endMentorship,
  getMentorshipInviteCandidates,
  getMyMentorships,
  inviteMentee,
  respondToMentorship,
} from "@/lib/wepacker/actions/mentorship";
import { getSidebarCounts } from "@/lib/wepacker/actions/user";

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("MENTORSHIP_WRITES_ENABLED", "true");
  sendMentorshipInvitationEmail.mockResolvedValue(undefined);
  sendMentorshipAcceptedEmail.mockResolvedValue(undefined);
  requireUser.mockResolvedValue({ id: "mentee-1", role: "member" });
  requireRole.mockResolvedValue({ id: "mentor-1", role: "mentor" });
  getMyMembership.mockResolvedValue(null);
  getMentoredCohortIds.mockResolvedValue(["cycle-1"]);
  messageCount.mockResolvedValue(0);
  taskCount.mockResolvedValue(0);
  mentorshipCount.mockResolvedValue(0);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("Mentorship consent workflow", () => {
  it("fails closed before authorization or data access when care-consent policy is disabled", async () => {
    vi.stubEnv("MENTORSHIP_WRITES_ENABLED", "false");

    await expect(inviteMentee("mentee-1")).rejects.toThrow(
      "Mentorship invitations are temporarily disabled"
    );

    expect(requireRole).not.toHaveBeenCalled();
    expect(userFindUnique).not.toHaveBeenCalled();
    expect(mentorshipCreate).not.toHaveBeenCalled();
  });

  it("keeps decline and end available while new consent writes are disabled", async () => {
    vi.stubEnv("MENTORSHIP_WRITES_ENABLED", "false");
    mentorshipUpdateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 1 });

    await expect(
      respondToMentorship("pending-mentorship", "decline")
    ).resolves.toBeUndefined();
    await expect(endMentorship("active-mentorship")).resolves.toBeUndefined();

    expect(mentorshipUpdateMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({
          id: "pending-mentorship",
          menteeId: "mentee-1",
          status: "pending",
          reviewRequired: false,
        }),
        data: expect.objectContaining({ status: "declined" }),
      })
    );
    expect(mentorshipUpdateMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: expect.objectContaining({
          id: "active-mentorship",
          OR: [{ mentorId: "mentee-1" }, { menteeId: "mentee-1" }],
        }),
        data: expect.objectContaining({ status: "ended" }),
      })
    );
  });

  it("creates a pending invitation with mentor consent only and emails the mentee", async () => {
    userFindUnique
      .mockResolvedValueOnce({
        id: "mentee-1",
        name: "Alex Mentee",
        email: "alex@example.test",
      })
      .mockResolvedValueOnce({ name: "Rui Mentor" });
    cohortMembershipFindFirst.mockResolvedValueOnce({ id: "legacy-membership-1" });
    mentorshipCreate.mockResolvedValueOnce({ id: "mentorship-1" });

    await expect(inviteMentee("mentee-1")).resolves.toEqual({
      id: "mentorship-1",
    });

    expect(requireRole).toHaveBeenCalledWith(["mentor", "admin"]);
    expect(getMentoredCohortIds).toHaveBeenCalledWith("mentor-1");
    expect(cohortMembershipFindFirst).toHaveBeenCalledWith({
      where: {
        userId: "mentee-1",
        cohortId: { in: ["cycle-1"] },
        role: "member",
        status: "active",
      },
      select: { id: true },
    });

    const createInput = mentorshipCreate.mock.calls[0][0];
    expect(createInput).toEqual({
      data: {
        mentorId: "mentor-1",
        menteeId: "mentee-1",
        invitedById: "mentor-1",
        status: "pending",
        source: "invitation",
        reviewRequired: false,
        invitedAt: expect.any(Date),
        mentorAcceptedAt: expect.any(Date),
      },
      select: { id: true },
    });
    expect(createInput.data.mentorAcceptedAt).toBe(createInput.data.invitedAt);
    expect(createInput.data).not.toHaveProperty("menteeAcceptedAt");
    expect(createInput.data).not.toHaveProperty("activatedAt");

    expect(sendMentorshipInvitationEmail).toHaveBeenCalledWith({
      mentorshipId: "mentorship-1",
      to: "alex@example.test",
      recipientName: "Alex Mentee",
      mentorName: "Rui Mentor",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/wepacker/mentorships");
    expect(revalidatePath).toHaveBeenCalledWith("/wepacker/mentor/sessions");
  });

  it("rejects a mentor invitation when no active legacy mentoring scope exists", async () => {
    userFindUnique.mockResolvedValueOnce({
      id: "outside-person",
      name: "Outside Person",
      email: "outside@example.test",
    });
    cohortMembershipFindFirst.mockResolvedValueOnce(null);

    await expect(inviteMentee("outside-person")).rejects.toThrow(
      "Sem permissão."
    );

    expect(mentorshipCreate).not.toHaveBeenCalled();
    expect(sendMentorshipInvitationEmail).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("lets an admin invite any other existing person without legacy Cycle scope", async () => {
    requireRole.mockResolvedValueOnce({ id: "admin-1", role: "admin" });
    userFindUnique
      .mockResolvedValueOnce({
        id: "mentee-1",
        name: "Alex Mentee",
        email: "alex@example.test",
      })
      .mockResolvedValueOnce({ name: "Admin Mentor" });
    mentorshipCreate.mockResolvedValueOnce({ id: "mentorship-admin" });

    await inviteMentee("mentee-1");

    expect(getMentoredCohortIds).not.toHaveBeenCalled();
    expect(cohortMembershipFindFirst).not.toHaveBeenCalled();
    expect(mentorshipCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          mentorId: "admin-1",
          menteeId: "mentee-1",
          invitedById: "admin-1",
        }),
      })
    );
  });

  it("prevents self-invitations before looking up or writing personal data", async () => {
    requireRole.mockResolvedValueOnce({ id: "mentor-1", role: "mentor" });

    await expect(inviteMentee("mentor-1")).rejects.toThrow(
      "Escolhe outra pessoa."
    );

    expect(userFindUnique).not.toHaveBeenCalled();
    expect(mentorshipCreate).not.toHaveBeenCalled();
  });

  it("activates only a pending, reviewed invitation accepted by its mentee after mentor consent", async () => {
    mentorshipUpdateMany.mockResolvedValueOnce({ count: 1 });
    mentorshipFindUnique.mockResolvedValueOnce({
      mentor: { name: "Rui Mentor", email: "rui@example.test" },
      mentee: { name: "Alex Mentee" },
    });

    await respondToMentorship("mentorship-1", "accept");

    const updateInput = mentorshipUpdateMany.mock.calls[0][0];
    expect(updateInput.where).toEqual({
      id: "mentorship-1",
      menteeId: "mentee-1",
      status: "pending",
      reviewRequired: false,
      mentorAcceptedAt: { not: null },
    });
    expect(updateInput.data).toEqual({
      status: "active",
      menteeAcceptedAt: expect.any(Date),
      activatedAt: expect.any(Date),
    });
    expect(updateInput.data.menteeAcceptedAt).toBe(updateInput.data.activatedAt);
    expect(sendMentorshipAcceptedEmail).toHaveBeenCalledWith({
      mentorshipId: "mentorship-1",
      to: "rui@example.test",
      recipientName: "Rui Mentor",
      menteeName: "Alex Mentee",
    });
  });

  it("keeps quarantined, unconsented, non-pending, and non-mentee invitations inactive", async () => {
    mentorshipUpdateMany.mockResolvedValueOnce({ count: 0 });

    await expect(
      respondToMentorship("unavailable-mentorship", "accept")
    ).rejects.toThrow("Invitation indisponível ou sem permissão.");

    expect(mentorshipUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          menteeId: "mentee-1",
          status: "pending",
          reviewRequired: false,
          mentorAcceptedAt: { not: null },
        }),
      })
    );
    expect(mentorshipFindUnique).not.toHaveBeenCalled();
    expect(sendMentorshipAcceptedEmail).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("lets only the invited mentee decline and records immediate revocation", async () => {
    mentorshipUpdateMany.mockResolvedValueOnce({ count: 1 });

    await respondToMentorship("mentorship-1", "decline");

    const updateInput = mentorshipUpdateMany.mock.calls[0][0];
    expect(updateInput.where).toEqual({
      id: "mentorship-1",
      menteeId: "mentee-1",
      status: "pending",
      reviewRequired: false,
    });
    expect(updateInput.data).toEqual({
      status: "declined",
      endedAt: expect.any(Date),
    });
    expect(mentorshipFindUnique).not.toHaveBeenCalled();
    expect(sendMentorshipAcceptedEmail).not.toHaveBeenCalled();
  });

  it("allows either endpoint to end any live Mentorship and revokes it immediately", async () => {
    requireUser.mockResolvedValueOnce({ id: "mentor-1", role: "mentor" });
    mentorshipUpdateMany.mockResolvedValueOnce({ count: 1 });

    await endMentorship("mentorship-1");

    expect(mentorshipUpdateMany).toHaveBeenCalledWith({
      where: {
        id: "mentorship-1",
        status: { in: ["pending", "active", "paused"] },
        OR: [{ mentorId: "mentor-1" }, { menteeId: "mentor-1" }],
      },
      data: { status: "ended", endedAt: expect.any(Date) },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/wepacker/mentorships");
    expect(revalidatePath).toHaveBeenCalledWith("/wepacker/mentor/sessions");
  });

  it("does not report success when an outsider or stale action ends no row", async () => {
    requireUser.mockResolvedValueOnce({ id: "outsider-1", role: "member" });
    mentorshipUpdateMany.mockResolvedValueOnce({ count: 0 });

    await expect(endMentorship("mentorship-1")).rejects.toThrow(
      "Mentorship indisponível ou sem permissão."
    );

    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("Mentorship discovery and privacy", () => {
  beforeEach(() => {
    requireUser.mockResolvedValue({ id: "person-1", role: "member" });
    requireRole.mockResolvedValue({ id: "admin-1", role: "admin" });
  });

  it("returns all eligible people to an admin, excluding self and existing live Mentees", async () => {
    mentorshipFindMany.mockResolvedValueOnce([
      { menteeId: "already-active" },
      { menteeId: "already-pending" },
    ]);
    userFindMany.mockResolvedValueOnce([
      { id: "person-2", name: "Person Two", email: "two@example.test" },
    ]);

    await expect(getMentorshipInviteCandidates()).resolves.toEqual([
      { id: "person-2", name: "Person Two", email: "two@example.test" },
    ]);

    expect(mentorshipFindMany).toHaveBeenCalledWith({
      where: {
        mentorId: "admin-1",
        status: { in: ["pending", "active", "paused"] },
      },
      select: { menteeId: true },
    });
    expect(userFindMany).toHaveBeenCalledWith({
      where: {
        id: {
          notIn: ["admin-1", "already-active", "already-pending"],
        },
      },
      select: { id: true, name: true, email: true },
      orderBy: { createdAt: "asc" },
    });
    expect(getMentoredCohortIds).not.toHaveBeenCalled();
    expect(cohortMembershipFindMany).not.toHaveBeenCalled();
  });

  it("keeps the relationship list scoped to the actor and never selects email addresses", async () => {
    const invitedAt = new Date("2026-07-21T18:00:00.000Z");
    const activatedAt = new Date("2026-07-21T18:05:00.000Z");
    mentorshipFindMany.mockResolvedValueOnce([
      {
        id: "mentorship-1",
        status: "active",
        invitedById: "mentor-1",
        reviewRequired: false,
        invitedAt,
        activatedAt,
        endedAt: null,
        mentor: { id: "mentor-1", name: "Rui Mentor" },
        mentee: { id: "person-1", name: "Alex Mentee" },
      },
    ]);

    const rows = await getMyMentorships();

    const query = mentorshipFindMany.mock.calls[0][0];
    expect(query.where).toEqual({
      OR: [{ mentorId: "person-1" }, { menteeId: "person-1" }],
    });
    expect(query.select.mentor.select).toEqual({ id: true, name: true });
    expect(query.select.mentee.select).toEqual({ id: true, name: true });
    expect(JSON.stringify(query.select)).not.toContain("email");
    expect(rows).toEqual([
      expect.objectContaining({
        id: "mentorship-1",
        invitedAt: invitedAt.toISOString(),
        activatedAt: activatedAt.toISOString(),
        endedAt: null,
        mentor: { id: "mentor-1", name: "Rui Mentor" },
        mentee: { id: "person-1", name: "Alex Mentee" },
      }),
    ]);
  });

  it("counts only actionable incoming invitations in the sidebar", async () => {
    requireUser.mockResolvedValueOnce({ id: "person-1", role: "member" });
    getMyMembership.mockResolvedValueOnce(null);
    messageCount.mockResolvedValueOnce(3);
    mentorshipCount.mockResolvedValueOnce(2);

    await expect(getSidebarCounts()).resolves.toEqual({
      unreadMessages: 3,
      pendingTasks: 0,
      pendingMentorships: 2,
    });

    expect(mentorshipCount).toHaveBeenCalledWith({
      where: {
        menteeId: "person-1",
        status: "pending",
        reviewRequired: false,
      },
    });
    expect(taskCount).not.toHaveBeenCalled();
  });
});

describe("Mentorship email failure safety", () => {
  beforeEach(() => {
    requireRole.mockResolvedValue({ id: "admin-1", role: "admin" });
    userFindUnique
      .mockResolvedValueOnce({
        id: "mentee-1",
        name: "Alex Private",
        email: "alex.private@example.test",
      })
      .mockResolvedValueOnce({ name: "Rui Private" });
    mentorshipCreate.mockResolvedValue({ id: "mentorship-private" });
  });

  it("keeps invitation delivery best-effort and scrubs recipient PII from failure logs", async () => {
    const smtpError = Object.assign(
      new Error("550 alex.private@example.test mailbox rejected"),
      { responseCode: 550 }
    );
    sendMentorshipInvitationEmail.mockRejectedValueOnce(smtpError);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(inviteMentee("mentee-1")).resolves.toEqual({
      id: "mentorship-private",
    });
    await vi.waitFor(() => expect(consoleError).toHaveBeenCalledOnce());

    expect(consoleError).toHaveBeenCalledWith(
      "Mentorship invitation email failed",
      {
        mentorshipId: "mentorship-private",
        kind: "Error",
        smtpCode: 550,
      }
    );
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(
      "alex.private@example.test"
    );
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain("Alex Private");
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain("mailbox rejected");

    consoleError.mockRestore();
  });

  it("keeps acceptance delivery best-effort and scrubs Mentor PII from failure logs", async () => {
    requireUser.mockResolvedValueOnce({ id: "mentee-1", role: "member" });
    mentorshipUpdateMany.mockResolvedValueOnce({ count: 1 });
    mentorshipFindUnique.mockResolvedValueOnce({
      mentor: {
        name: "Rui Private",
        email: "rui.private@example.test",
      },
      mentee: { name: "Alex Private" },
    });
    const smtpError = Object.assign(
      new Error("554 rui.private@example.test mailbox rejected"),
      { responseCode: 554 }
    );
    sendMentorshipAcceptedEmail.mockRejectedValueOnce(smtpError);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      respondToMentorship("mentorship-private", "accept")
    ).resolves.toBeUndefined();
    await vi.waitFor(() => expect(consoleError).toHaveBeenCalledOnce());

    expect(consoleError).toHaveBeenCalledWith(
      "Mentorship accepted email failed",
      {
        mentorshipId: "mentorship-private",
        kind: "Error",
        smtpCode: 554,
      }
    );
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(
      "rui.private@example.test"
    );
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain("Rui Private");
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain("mailbox rejected");

    consoleError.mockRestore();
  });
});
