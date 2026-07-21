import { describe, expect, it, vi } from "vitest";

const requirePageUser = vi.fn();
const getMyContext = vi.fn();
const getMySessions = vi.fn();

vi.mock("@/lib/wepacker/page-guards", () => ({
  requirePageUser: (...args: unknown[]) => requirePageUser(...args),
}));

vi.mock("@/lib/wepacker/actions/user", () => ({
  getMyContext: (...args: unknown[]) => getMyContext(...args),
}));

vi.mock("@/lib/wepacker/actions/session", () => ({
  getMySessions: (...args: unknown[]) => getMySessions(...args),
}));

vi.mock("@/app/wepacker/(platform)/sessions/page-client", () => ({
  default: vi.fn(() => null),
}));

import SessionsPage from "@/app/wepacker/(platform)/sessions/page";

describe("member sessions page — person-level access", () => {
  it("loads the user's sessions without requiring a Journey membership", async () => {
    requirePageUser.mockResolvedValueOnce({
      id: "member-without-membership",
      role: "member",
    });
    getMyContext.mockResolvedValueOnce({
      user: { id: "member-without-membership", name: "Alexandre Florindo" },
      membership: null,
    });
    getMySessions.mockResolvedValueOnce([]);

    const page = await SessionsPage();

    expect(requirePageUser).toHaveBeenCalledOnce();
    expect(getMySessions).toHaveBeenCalledOnce();
    expect(getMyContext).not.toHaveBeenCalled();
    expect(page).toEqual(
      expect.objectContaining({
        props: expect.objectContaining({ sessions: [] }),
      })
    );
  });
});
