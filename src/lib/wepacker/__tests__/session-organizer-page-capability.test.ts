import { describe, expect, it, vi } from "vitest";

const requirePageUser = vi.fn();
const getMentoredSessions = vi.fn();
const getMentoredMembers = vi.fn();
const getFacilitatedCycles = vi.fn();

vi.mock("@/lib/wepacker/page-guards", () => ({
  requirePageUser: (...args: unknown[]) => requirePageUser(...args),
}));

vi.mock("@/lib/wepacker/actions/session", () => ({
  getMentoredSessions: (...args: unknown[]) => getMentoredSessions(...args),
  getMentoredMembers: (...args: unknown[]) => getMentoredMembers(...args),
  getFacilitatedCycles: (...args: unknown[]) => getFacilitatedCycles(...args),
}));

vi.mock("@/app/wepacker/(platform)/mentor/sessions/page-client", () => ({
  MentorSessionsClient: vi.fn(() => null),
}));

import MentorSessionsPage from "@/app/wepacker/(platform)/mentor/sessions/page";

describe("Session organizer page capability", () => {
  it("loads for a member account and delegates authority to exact graph queries", async () => {
    requirePageUser.mockResolvedValueOnce({ id: "person-1", role: "member" });
    getMentoredSessions.mockResolvedValueOnce([]);
    getMentoredMembers.mockResolvedValueOnce([]);
    getFacilitatedCycles.mockResolvedValueOnce([
      {
        id: "cycle-1",
        name: "Cycle One",
        status: "active",
        role: "facilitator",
      },
    ]);

    const page = await MentorSessionsPage();

    expect(requirePageUser).toHaveBeenCalledOnce();
    expect(getMentoredSessions).toHaveBeenCalledOnce();
    expect(getMentoredMembers).toHaveBeenCalledOnce();
    expect(getFacilitatedCycles).toHaveBeenCalledOnce();
    expect(page).toEqual(
      expect.objectContaining({
        props: expect.objectContaining({
          currentUserId: "person-1",
          sessions: [],
          members: [],
          facilitatedCycles: [
            expect.objectContaining({ id: "cycle-1", role: "facilitator" }),
          ],
        }),
      }),
    );
  });
});
