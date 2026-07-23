import { beforeEach, describe, expect, it, vi } from "vitest";

const queryRaw = vi.fn();
const updateMany = vi.fn();
const tx = {
  $queryRaw: queryRaw,
  sessionConsentEvent: { updateMany },
  sessionConsentCapacityAssurance: { updateMany },
  sessionArtifactAuditEvent: { updateMany },
  sessionRecording: { updateMany },
  transcriptArtifact: { updateMany },
  sessionResultDocument: { updateMany },
};

import { anonymizeSessionMediaForUser } from "@/lib/wepacker/session-media/retention";

describe("Session media account erasure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryRaw.mockResolvedValue([]);
    updateMany.mockResolvedValue({ count: 0 });
  });

  it("opens the maintenance boundary and detaches only user references", async () => {
    await anonymizeSessionMediaForUser(tx as never, "person-1");

    expect(queryRaw).toHaveBeenCalledOnce();
    expect(updateMany).toHaveBeenCalledWith({
      where: { subjectUserId: "person-1" },
      data: { subjectUserId: null },
    });
    expect(updateMany).toHaveBeenCalledWith({
      where: { publishedById: "person-1" },
      data: { publishedById: null },
    });
    expect(updateMany).toHaveBeenCalledTimes(9);
  });

  it("does not mutate when the maintenance boundary fails", async () => {
    queryRaw.mockRejectedValue(new Error("maintenance denied"));
    await expect(
      anonymizeSessionMediaForUser(tx as never, "person-1"),
    ).rejects.toThrow("maintenance denied");
    expect(updateMany).not.toHaveBeenCalled();
  });
});
