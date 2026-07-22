import { describe, expect, it, vi } from "vitest";

const requirePageUser = vi.fn();
const getMySessions = vi.fn();

vi.mock("@/lib/wepacker/page-guards", () => ({
  requirePageUser: (...args: unknown[]) => requirePageUser(...args),
}));

vi.mock("@/lib/wepacker/actions/session", () => ({
  getMySessions: (...args: unknown[]) => getMySessions(...args),
}));

vi.mock("@/app/wepacker/(platform)/sessions/page-client", () => ({
  default: vi.fn(() => null),
}));

import SessionsPage from "@/app/wepacker/(platform)/sessions/page";

describe("member Sessions page — Person-owned access", () => {
  it("loads Sessions directly for the signed-in Person", async () => {
    requirePageUser.mockResolvedValueOnce({
      id: "person-1",
      role: "member",
    });
    getMySessions.mockResolvedValueOnce([]);

    const page = await SessionsPage();

    expect(requirePageUser).toHaveBeenCalledOnce();
    expect(getMySessions).toHaveBeenCalledOnce();
    expect(page).toEqual(
      expect.objectContaining({
        props: expect.objectContaining({ sessions: [] }),
      }),
    );
  });
});
