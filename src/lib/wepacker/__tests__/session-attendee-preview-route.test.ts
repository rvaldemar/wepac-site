import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROUTE = join(
  process.cwd(),
  "src/app/wepacker/(preview)/mentor/sessions/[id]/preview/[userId]/page.tsx",
);
const ADMIN_GATE = join(
  process.cwd(),
  "src/app/wepacker/(preview)/mentor/sessions/[id]/preview/[userId]/admin-preview-gate.tsx",
);

describe("Session attendee preview route containment", () => {
  const source = readFileSync(ROUTE, "utf8");

  it("uses the audited support projection and disables caching", () => {
    expect(source).toContain("getSessionAttendeeSupportProjection");
    expect(source).toContain("getAdminSupportPreviewGrantFromCookie");
    expect(source).toContain("AdminPreviewGate");
    expect(source).toContain('dynamic = "force-dynamic"');
    expect(source).toContain("noStore()");
  });

  it("keeps a conspicuous identity-preserving read-only banner", () => {
    expect(source).toContain('role="banner"');
    expect(source).toContain("Read-only preview:");
    expect(source).toContain("You are still");
    expect(source).toContain("cannot act as");
    expect(source).toContain("Exit Preview");
  });

  it("does not become client impersonation or a target mutation surface", () => {
    expect(source).not.toContain('"use client"');
    expect(source).not.toMatch(/asUserId|signIn|updateSession|createAction/);
    expect(source).not.toContain("SessionCard");
    expect(source).toContain('preview.accessMode === "admin_support"');
    expect(source).toMatch(/!isAdminPreview\s*&&[\s\S]*meetingUrl/);
  });

  it("revokes Admin grants on exit and leaves organizer exit as navigation", () => {
    expect(source).toContain("revokeAdminSessionAttendeePreviewGrant");
    expect(source).toContain("<form action={revokeGrant}>");
    expect(source).toContain("Exit &amp; revoke access");
    expect(source).toContain("/wepacker/mentor/sessions/${id}");
  });

  it("keeps fresh re-authentication outside the projection", () => {
    const gate = readFileSync(ADMIN_GATE, "utf8");
    expect(gate).not.toContain('"use client"');
    expect(gate).toContain("createAdminSessionAttendeePreviewGrant");
    expect(gate).toContain('name="reasonCode"');
    expect(gate).not.toContain("textarea");
    expect(gate).toContain('name="ticketReference"');
    expect(gate).toContain('name="password"');
    expect(gate).toContain('autoComplete="current-password"');
    expect(gate).toContain("expires after 15 minutes");
  });

  it("never puts the grant capability in a query string", () => {
    expect(source).not.toMatch(/query\.grant|grant\?: string/);
    expect(source).not.toContain("?grant=");
  });
});
