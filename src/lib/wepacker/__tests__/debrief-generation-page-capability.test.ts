import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";

const requirePageUser = vi.fn();
const getMentoredSessionDetail = vi.fn();
const getSessionDebrief = vi.fn();
const getSessionMediaWorkspace = vi.fn();

vi.mock("@/lib/wepacker/page-guards", () => ({
  requirePageUser: (...args: unknown[]) => requirePageUser(...args),
}));

vi.mock("@/lib/wepacker/actions/session", () => ({
  getMentoredSessionDetail: (...args: unknown[]) =>
    getMentoredSessionDetail(...args),
}));

vi.mock("@/lib/wepacker/actions/debrief", () => ({
  getSessionDebrief: (...args: unknown[]) => getSessionDebrief(...args),
}));

vi.mock("@/lib/wepacker/actions/session-media", () => ({
  getSessionMediaWorkspace: (...args: unknown[]) =>
    getSessionMediaWorkspace(...args),
}));

import MentorSessionDebriefPage from "@/app/wepacker/(platform)/mentor/sessions/[id]/page";

type PageProps = {
  debriefGenerationEnabled: boolean;
  transcriptWritesEnabled: boolean;
};

describe("Session Debrief page capability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requirePageUser.mockResolvedValue({ id: "organizer-1", role: "member" });
    getMentoredSessionDetail.mockResolvedValue({
      id: "session-1",
      scheduledAt: new Date("2026-07-22T10:00:00.000Z"),
      attendees: [],
      organizer: { id: "organizer-1", name: "Rui" },
    });
    getSessionDebrief.mockResolvedValue(null);
    getSessionMediaWorkspace.mockResolvedValue({
      attendees: [],
      recordings: [],
      transcriptArtifacts: [],
      resultDocuments: [],
      consentEvents: [],
      consentCapacityAssurances: [],
    });
    vi.stubEnv("SESSION_TRANSCRIPT_WRITES_ENABLED", "false");
  });

  afterEach(() => vi.unstubAllEnvs());

  async function renderPage(): Promise<ReactElement<PageProps>> {
    const fragment = (await MentorSessionDebriefPage({
      params: Promise.resolve({ id: "session-1" }),
    })) as ReactElement<{ children: ReactElement<PageProps>[] }>;
    return fragment.props.children[0];
  }

  it("keeps generation unavailable while the engine is disabled", async () => {
    vi.stubEnv("DEBRIEF_ENGINE", "disabled");
    vi.stubEnv("HUB_API_URL", "https://hub.example.test");
    vi.stubEnv("HUB_DEBRIEF_API_KEY", "configured-test-reference");
    vi.stubEnv("HUB_DEBRIEF_PLAYBOOK_ID", "w01-release");
    vi.stubEnv(
      "HUB_DEBRIEF_CONTRACT_VERSION",
      "wepac-session-debrief-v3",
    );

    const page = await renderPage();

    expect(page.props.debriefGenerationEnabled).toBe(false);
    expect(requirePageUser).toHaveBeenCalledOnce();
  });

  it("keeps generation unavailable for an incomplete Hub cutover", async () => {
    vi.stubEnv("DEBRIEF_ENGINE", "hub");
    vi.stubEnv("HUB_API_URL", "https://hub.example.test");
    vi.stubEnv("HUB_DEBRIEF_API_KEY", "");
    vi.stubEnv("HUB_DEBRIEF_PLAYBOOK_ID", "w01-release");
    vi.stubEnv(
      "HUB_DEBRIEF_CONTRACT_VERSION",
      "wepac-session-debrief-v3",
    );

    const page = await renderPage();

    expect(page.props.debriefGenerationEnabled).toBe(false);
  });

  it("enables generation only for a complete release-bound v3 configuration", async () => {
    vi.stubEnv("DEBRIEF_ENGINE", "hub");
    vi.stubEnv("HUB_API_URL", "https://hub.example.test");
    vi.stubEnv("HUB_DEBRIEF_API_KEY", "configured-test-reference");
    vi.stubEnv("HUB_DEBRIEF_PLAYBOOK_ID", "w01-release");
    vi.stubEnv(
      "HUB_DEBRIEF_CONTRACT_VERSION",
      "wepac-session-debrief-v3",
    );

    const page = await renderPage();

    expect(page.props.debriefGenerationEnabled).toBe(true);
  });
});
