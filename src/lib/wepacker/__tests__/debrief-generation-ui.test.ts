import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/lib/wepacker/actions/session", () => ({
  updateSessionAttendee: vi.fn(),
}));

vi.mock("@/lib/wepacker/actions/session-transcript", () => ({
  attachSessionTranscript: vi.fn(),
  clearSessionTranscript: vi.fn(),
}));

vi.mock("@/lib/wepacker/actions/debrief", () => ({
  generateSessionDebrief: vi.fn(),
}));

import { SessionDebriefClient } from "@/app/wepacker/(platform)/mentor/sessions/[id]/page-client";

const session = {
  id: "session-1",
  kind: "checkpoint" as const,
  scheduledAt: "2026-07-22T10:00:00.000Z",
  status: "scheduled" as const,
  discussionPoints: null,
  meetingUrl: null,
  transcript: "Organizer-private transcript",
  transcriptUploadedAt: "2026-07-22T11:00:00.000Z",
  attendees: [
    {
      id: "attendee-1",
      attended: true,
      privateNote: null,
      sharedNote: null,
      sharedNotePublished: false,
      outcome: null,
      user: { id: "person-1", name: "Alex" },
    },
  ],
  organizer: { id: "organizer-1", name: "Rui" },
};

describe("Session Debrief generation UI", () => {
  it("renders certification state and no generation control when unavailable", () => {
    const html = renderToStaticMarkup(
      createElement(SessionDebriefClient, {
        session,
        debrief: null,
        transcriptWritesEnabled: false,
        debriefGenerationEnabled: false,
      }),
    );

    expect(html).toContain(
      "Debrief generation is unavailable until W01 v3 is published and certified.",
    );
    expect(html).toContain(
      "The Transcript remains private to the Session organizer.",
    );
    expect(html).not.toContain("Generate Debrief");
  });

  it("renders the generation control only when the server grants capability", () => {
    const html = renderToStaticMarkup(
      createElement(SessionDebriefClient, {
        session,
        debrief: null,
        transcriptWritesEnabled: false,
        debriefGenerationEnabled: true,
      }),
    );

    expect(html).toContain("Generate Debrief");
    expect(html).not.toContain("Debrief generation is unavailable");
  });
});
