import { beforeEach, describe, expect, it, vi } from "vitest";

const userFindMany = vi.fn();
const mentorshipFindMany = vi.fn();
const membershipFindMany = vi.fn();
const sessionCreate = vi.fn();
const sessionFindUnique = vi.fn();
const requireRole = vi.fn();
const getMentoredCohortIds = vi.fn();
const assertMentorOfCohort = vi.fn();
const resolveSessionAttendeeAuthorization = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findMany: (...args: unknown[]) => userFindMany(...args),
    },
    mentorship: {
      findMany: (...args: unknown[]) => mentorshipFindMany(...args),
    },
    cohortMembership: {
      findMany: (...args: unknown[]) => membershipFindMany(...args),
    },
    session: {
      create: (...args: unknown[]) => sessionCreate(...args),
      findUnique: (...args: unknown[]) => sessionFindUnique(...args),
    },
  },
}));

vi.mock("@/lib/wepacker/guards", () => ({
  requireRole: (...args: unknown[]) => requireRole(...args),
  getMentoredCohortIds: (...args: unknown[]) => getMentoredCohortIds(...args),
  assertMentorOfCohort: (...args: unknown[]) => assertMentorOfCohort(...args),
  resolveSessionAttendeeAuthorization: (...args: unknown[]) =>
    resolveSessionAttendeeAuthorization(...args),
}));

vi.mock("@/lib/email", () => ({
  sendSessionInviteEmail: vi.fn(async () => undefined),
  sendSessionCancelEmail: vi.fn(async () => undefined),
  sendSharedNotePublishedEmail: vi.fn(async () => undefined),
}));

vi.mock("@/lib/wepacker/ics", () => ({
  buildSessionInviteIcs: vi.fn(() => "ICS-REQUEST"),
  buildSessionCancelIcs: vi.fn(() => "ICS-CANCEL"),
  nextIcsSequence: vi.fn(() => 1),
}));

import {
  createSession,
  getMentoredMembers,
} from "@/lib/wepacker/actions/session";

const unauthorized = {
  authorized: false,
  source: null,
  mentorshipId: null,
} as const;
const directMentorship = {
  authorized: true,
  source: "mentorship",
  mentorshipId: "mentorship-1",
} as const;
const legacyCohort = {
  authorized: true,
  source: "legacy_cohort",
  mentorshipId: null,
} as const;

describe("Mentorship-first Session participant discovery and scheduling", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mentorshipFindMany.mockResolvedValue([]);
    membershipFindMany.mockResolvedValue([]);
    getMentoredCohortIds.mockResolvedValue([]);
    resolveSessionAttendeeAuthorization.mockResolvedValue(unauthorized);
    sessionFindUnique.mockResolvedValue(null);
  });

  it("shows every other Person to an admin without requiring any relationship", async () => {
    requireRole.mockResolvedValueOnce({ id: "admin-1", role: "admin" });
    userFindMany.mockResolvedValueOnce([
      {
        id: "person-without-membership",
        name: "Alexandre Florindo",
        email: "alexandre@example.com",
      },
      {
        id: "staff-person",
        name: "Rui Valdemar Santos",
        email: "rui@example.com",
      },
    ]);

    await expect(getMentoredMembers()).resolves.toEqual([
      {
        id: "person-without-membership",
        name: "Alexandre Florindo",
        email: "alexandre@example.com",
      },
      {
        id: "staff-person",
        name: "Rui Valdemar Santos",
        email: "rui@example.com",
      },
    ]);

    expect(userFindMany).toHaveBeenCalledWith({
      where: { id: { not: "admin-1" } },
      select: { id: true, name: true, email: true },
      orderBy: { createdAt: "asc" },
    });
    expect(mentorshipFindMany).not.toHaveBeenCalled();
    expect(membershipFindMany).not.toHaveBeenCalled();
  });

  it("merges accepted active Mentees with active legacy Cycle participants and dedupes by Person", async () => {
    requireRole.mockResolvedValueOnce({ id: "mentor-1", role: "mentor" });
    getMentoredCohortIds.mockResolvedValueOnce(["cycle-1", "cycle-2"]);
    mentorshipFindMany.mockResolvedValueOnce([
      {
        menteeId: "person-1",
        mentee: { id: "person-1", name: "Pessoa Um", email: "um@example.com" },
      },
    ]);
    membershipFindMany.mockResolvedValueOnce([
      {
        userId: "person-1",
        user: { id: "person-1", name: "Pessoa Um", email: "um@example.com" },
      },
      {
        userId: "person-2",
        user: { id: "person-2", name: "Pessoa Dois", email: "dois@example.com" },
      },
    ]);

    await expect(getMentoredMembers()).resolves.toEqual([
      { id: "person-1", name: "Pessoa Um", email: "um@example.com" },
      { id: "person-2", name: "Pessoa Dois", email: "dois@example.com" },
    ]);

    expect(mentorshipFindMany).toHaveBeenCalledWith({
      where: {
        mentorId: "mentor-1",
        menteeId: { not: "mentor-1" },
        status: "active",
        reviewRequired: false,
        mentorAcceptedAt: { not: null },
        menteeAcceptedAt: { not: null },
        activatedAt: { not: null },
        endedAt: null,
      },
      select: {
        menteeId: true,
        mentee: { select: { id: true, name: true, email: true } },
      },
      orderBy: { activatedAt: "asc" },
    });
    expect(membershipFindMany).toHaveBeenCalledWith({
      where: {
        role: "member",
        status: "active",
        userId: { not: "mentor-1" },
        cohortId: { in: ["cycle-1", "cycle-2"] },
      },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { joinedAt: "asc" },
    });
  });

  it("rejects an organizer adding themselves before any database authorization query", async () => {
    requireRole.mockResolvedValueOnce({ id: "admin-1", role: "admin" });

    await expect(
      createSession({
        sessionType: "individual",
        scheduledAt: "2026-07-22T10:00:00.000Z",
        attendeeUserIds: ["admin-1"],
      })
    ).rejects.toThrow("Participantes inválidos para esta sessão.");

    expect(userFindMany).not.toHaveBeenCalled();
    expect(sessionCreate).not.toHaveBeenCalled();
  });

  it("dedupes IDs and links an Individual Session to its active Mentorship", async () => {
    requireRole.mockResolvedValueOnce({ id: "mentor-1", role: "mentor" });
    resolveSessionAttendeeAuthorization.mockResolvedValueOnce(directMentorship);
    sessionCreate.mockResolvedValueOnce({ id: "session-1" });

    await createSession({
      sessionType: "individual",
      scheduledAt: "2026-07-22T10:00:00.000Z",
      attendeeUserIds: [" person-1 ", "person-1"],
    });

    expect(resolveSessionAttendeeAuthorization).toHaveBeenCalledWith(
      "mentor-1",
      "person-1",
      { legacyCohortId: undefined }
    );
    expect(sessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          mentorId: "mentor-1",
          mentorshipId: "mentorship-1",
          sessionType: "individual",
          attendees: { create: [{ userId: "person-1" }] },
        }),
      })
    );
  });

  it("keeps the active legacy Cohort relationship as a cohortless fallback without inventing Mentorship", async () => {
    requireRole.mockResolvedValueOnce({ id: "mentor-1", role: "mentor" });
    resolveSessionAttendeeAuthorization.mockResolvedValueOnce(legacyCohort);
    sessionCreate.mockResolvedValueOnce({ id: "session-1" });

    await createSession({
      sessionType: "individual",
      scheduledAt: "2026-07-22T10:00:00.000Z",
      attendeeUserIds: ["person-1"],
    });

    expect(sessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ mentorshipId: null }),
      })
    );
  });

  it("rejects a cohortless attendee with neither active Mentorship nor active legacy fallback", async () => {
    requireRole.mockResolvedValueOnce({ id: "mentor-1", role: "mentor" });

    await expect(
      createSession({
        sessionType: "individual",
        scheduledAt: "2026-07-22T10:00:00.000Z",
        attendeeUserIds: ["unrelated-person"],
      })
    ).rejects.toThrow("Participantes inválidos para esta sessão.");

    expect(sessionCreate).not.toHaveBeenCalled();
  });

  it.each([
    ["mentor", { id: "mentor-1", role: "mentor" }],
    ["admin", { id: "admin-1", role: "admin" }],
  ] as const)(
    "does not let a %s attach a non-participant to a persisted Cycle context",
    async (_label, actor) => {
      assertMentorOfCohort.mockResolvedValueOnce(actor);
      membershipFindMany.mockResolvedValueOnce([]);

      await expect(
        createSession({
          cohortId: "cycle-1",
          sessionType: "individual",
          scheduledAt: "2026-07-22T10:00:00.000Z",
          attendeeUserIds: ["person-outside-cycle"],
        })
      ).rejects.toThrow("Participantes inválidos para este Cycle.");

      expect(membershipFindMany).toHaveBeenCalledWith({
        where: {
          cohortId: "cycle-1",
          userId: { in: ["person-outside-cycle"], not: actor.id },
          role: "member",
          status: "active",
        },
        select: { userId: true },
      });
      expect(resolveSessionAttendeeAuthorization).not.toHaveBeenCalled();
      expect(sessionCreate).not.toHaveBeenCalled();
    }
  );

  it("rejects empty, multi-attendee Individual, and deduped one-person Group inputs", async () => {
    await expect(
      createSession({
        sessionType: "individual",
        scheduledAt: "2026-07-22T10:00:00.000Z",
        attendeeUserIds: [],
      })
    ).rejects.toThrow("Escolhe pelo menos um participante.");

    await expect(
      createSession({
        sessionType: "individual",
        scheduledAt: "2026-07-22T10:00:00.000Z",
        attendeeUserIds: ["person-1", "person-2"],
      })
    ).rejects.toThrow("Uma Session individual requer exatamente um participante.");

    await expect(
      createSession({
        sessionType: "group",
        scheduledAt: "2026-07-22T10:00:00.000Z",
        attendeeUserIds: ["person-1", " person-1 "],
      })
    ).rejects.toThrow("Uma Group Session requer pelo menos dois participantes.");

    expect(requireRole).not.toHaveBeenCalled();
    expect(sessionCreate).not.toHaveBeenCalled();
  });

  it("creates a Group Session with explicit unique attendees and no Mentorship link", async () => {
    requireRole.mockResolvedValueOnce({ id: "mentor-1", role: "mentor" });
    resolveSessionAttendeeAuthorization
      .mockResolvedValueOnce(directMentorship)
      .mockResolvedValueOnce({
        ...directMentorship,
        mentorshipId: "mentorship-2",
      });
    sessionCreate.mockResolvedValueOnce({ id: "session-1" });

    await createSession({
      sessionType: "group",
      scheduledAt: "2026-07-22T10:00:00.000Z",
      attendeeUserIds: ["person-1", "person-2", "person-1"],
    });

    expect(sessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          mentorshipId: null,
          sessionType: "group",
          attendees: {
            create: [{ userId: "person-1" }, { userId: "person-2" }],
          },
        }),
      })
    );
  });
});
