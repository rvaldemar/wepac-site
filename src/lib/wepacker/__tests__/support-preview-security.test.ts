import { beforeEach, describe, expect, it, vi } from "vitest";

const cookieGet = vi.fn();
const cookieSet = vi.fn();

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (...args: unknown[]) => cookieGet(...args),
    set: (...args: unknown[]) => cookieSet(...args),
  }),
}));

import {
  clearAdminSupportPreviewCookie,
  digestSupportTicketReference,
  getAdminSupportPreviewGrantFromCookie,
  setAdminSupportPreviewCookie,
} from "@/lib/wepacker/support-preview-security";

describe("Support Preview cookie capability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXTAUTH_SECRET = "support-preview-test-secret";
    delete process.env.AUTH_SECRET;
  });

  it("stores a signed resource-bound capability in a hardened cookie", async () => {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await setAdminSupportPreviewCookie({
      grantId: "grant-1",
      sessionId: "session-1",
      targetUserId: "attendee-1",
      expiresAt,
    });

    const [name, token, options] = cookieSet.mock.calls[0];
    expect(name).toMatch(/^wepac_support_preview_[0-9a-f]{24}$/);
    expect(token).not.toContain("grant-1");
    expect(options).toMatchObject({
      httpOnly: true,
      sameSite: "strict",
      priority: "high",
      path: "/wepacker/mentor/sessions/session-1/preview/attendee-1",
      expires: expiresAt,
    });

    cookieGet.mockReturnValue({ value: token });
    await expect(
      getAdminSupportPreviewGrantFromCookie("session-1", "attendee-1"),
    ).resolves.toBe("grant-1");
    await expect(
      getAdminSupportPreviewGrantFromCookie("other-session", "attendee-1"),
    ).resolves.toBeNull();
  });

  it("rejects tampered and expired capabilities", async () => {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await setAdminSupportPreviewCookie({
      grantId: "grant-1",
      sessionId: "session-1",
      targetUserId: "attendee-1",
      expiresAt,
    });
    const token = cookieSet.mock.calls[0]?.[1] as string;
    cookieGet.mockReturnValue({ value: `${token}tampered` });
    await expect(
      getAdminSupportPreviewGrantFromCookie("session-1", "attendee-1"),
    ).resolves.toBeNull();

    vi.clearAllMocks();
    await setAdminSupportPreviewCookie({
      grantId: "grant-expired",
      sessionId: "session-1",
      targetUserId: "attendee-1",
      expiresAt: new Date(Date.now() - 1),
    });
    cookieGet.mockReturnValue({ value: cookieSet.mock.calls[0]?.[1] });
    await expect(
      getAdminSupportPreviewGrantFromCookie("session-1", "attendee-1"),
    ).resolves.toBeNull();
  });

  it("uses a keyed normalized digest and clears the exact cookie", async () => {
    expect(digestSupportTicketReference(" sup-123 ")).toBe(
      digestSupportTicketReference("SUP-123"),
    );
    expect(digestSupportTicketReference("SUP-123")).toMatch(/^[0-9a-f]{64}$/);
    expect(digestSupportTicketReference("SUP-123")).not.toContain("SUP-123");

    await clearAdminSupportPreviewCookie("session-1", "attendee-1");
    expect(cookieSet.mock.calls.at(-1)?.[1]).toBe("");
    expect(cookieSet.mock.calls.at(-1)?.[2]).toMatchObject({
      httpOnly: true,
      sameSite: "strict",
      path: "/wepacker/mentor/sessions/session-1/preview/attendee-1",
      maxAge: 0,
    });
  });

  it("fails closed when no signing secret is configured", async () => {
    delete process.env.NEXTAUTH_SECRET;
    delete process.env.AUTH_SECRET;
    await expect(
      setAdminSupportPreviewCookie({
        grantId: "grant-1",
        sessionId: "session-1",
        targetUserId: "attendee-1",
        expiresAt: new Date(Date.now() + 1000),
      }),
    ).rejects.toThrow("signing secret is not configured");
  });
});
