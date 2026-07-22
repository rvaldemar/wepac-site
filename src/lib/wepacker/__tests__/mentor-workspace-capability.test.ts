import { beforeEach, describe, expect, it, vi } from "vitest";

const redirect = vi.fn((path: string) => {
  throw new Error(`redirect:${path}`);
});
const requirePageUser = vi.fn();
const getMentoredSessions = vi.fn();
const getMentoredMembers = vi.fn();
const getFacilitatedCycles = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (...args: [string]) => redirect(...args),
}));

vi.mock("@/lib/wepacker/page-guards", () => ({
  requirePageUser: (...args: unknown[]) => requirePageUser(...args),
}));

vi.mock("@/lib/wepacker/actions/session", () => ({
  getMentoredSessions: (...args: unknown[]) => getMentoredSessions(...args),
  getMentoredMembers: (...args: unknown[]) => getMentoredMembers(...args),
  getFacilitatedCycles: (...args: unknown[]) => getFacilitatedCycles(...args),
}));

vi.mock("@/app/wepacker/(platform)/mentor/page-client", () => ({
  MentorDashboardClient: vi.fn(() => null),
}));

import MentorDashboardPage from "@/app/wepacker/(platform)/mentor/page";

describe("Organizer workspace graph capability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requirePageUser.mockResolvedValue({ id: "person-1", role: "member" });
    getMentoredSessions.mockResolvedValue([]);
    getMentoredMembers.mockResolvedValue([]);
    getFacilitatedCycles.mockResolvedValue([]);
  });

  it("admits a member account through an active CycleFacilitator edge", async () => {
    getFacilitatedCycles.mockResolvedValueOnce([
      { id: "cycle-1", role: "facilitator" },
    ]);

    const page = await MentorDashboardPage();

    expect(redirect).not.toHaveBeenCalled();
    expect(page).toEqual(
      expect.objectContaining({
        props: expect.objectContaining({
          activeMentorships: 0,
          activeFacilitations: 1,
          sessions: [],
        }),
      }),
    );
  });

  it("admits a member account through an accepted directed Mentorship", async () => {
    getMentoredMembers.mockResolvedValueOnce([
      { id: "mentee-1", name: "Alex", email: "alex@example.test" },
    ]);

    const page = await MentorDashboardPage();

    expect(redirect).not.toHaveBeenCalled();
    expect(page).toEqual(
      expect.objectContaining({
        props: expect.objectContaining({
          activeMentorships: 1,
          activeFacilitations: 0,
        }),
      }),
    );
  });

  it("admits the exact owner of a historical Session without account role", async () => {
    getMentoredSessions.mockResolvedValueOnce([
      {
        id: "session-1",
        status: "completed",
        scheduledAt: new Date("2026-07-01T10:00:00.000Z"),
        durationMinutes: 60,
        attendees: [],
      },
    ]);

    const page = await MentorDashboardPage();

    expect(redirect).not.toHaveBeenCalled();
    expect(page).toEqual(
      expect.objectContaining({
        props: expect.objectContaining({
          sessions: [expect.objectContaining({ id: "session-1" })],
        }),
      }),
    );
  });

  it("rejects a Person with no accepted edge and no owned Session", async () => {
    await expect(MentorDashboardPage()).rejects.toThrow(
      "redirect:/wepacker/dashboard",
    );
    expect(redirect).toHaveBeenCalledWith("/wepacker/dashboard");
  });
});
