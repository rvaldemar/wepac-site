import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const requirePageUser = vi.fn();
const getMyMentorships = vi.fn();

vi.mock("@/lib/wepacker/page-guards", () => ({
  requirePageUser: (...args: unknown[]) => requirePageUser(...args),
}));

vi.mock("@/lib/wepacker/actions/mentorship", () => ({
  getMyMentorships: (...args: unknown[]) => getMyMentorships(...args),
}));

vi.mock("@/app/wepacker/(platform)/mentorships/page-client", () => ({
  default: vi.fn(() => null),
}));

import MentorshipsPage from "@/app/wepacker/(platform)/mentorships/page";

describe("Mentorship invitation page capability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requirePageUser.mockResolvedValue({ id: "person-1", role: "member" });
    getMyMentorships.mockResolvedValue([]);
  });

  afterEach(() => vi.unstubAllEnvs());

  it("lets any signed-in Person initiate an exact-email invitation", async () => {
    vi.stubEnv("MENTORSHIP_WRITES_ENABLED", "true");

    const page = await MentorshipsPage();

    expect(page).toEqual(
      expect.objectContaining({
        props: expect.objectContaining({
          currentUserId: "person-1",
          canInvite: true,
          writesEnabled: true,
          mentorships: [],
        }),
      }),
    );
  });

  it("keeps new grants unavailable when the consent write gate is closed", async () => {
    vi.stubEnv("MENTORSHIP_WRITES_ENABLED", "false");

    const page = await MentorshipsPage();

    expect(page).toEqual(
      expect.objectContaining({
        props: expect.objectContaining({
          canInvite: false,
          writesEnabled: false,
        }),
      }),
    );
  });
});
