import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const sidebarState = vi.hoisted(() => ({
  pathname: "/wepacker/dashboard",
  role: "member" as "member" | "admin",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => sidebarState.pathname,
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { role: sidebarState.role } } }),
  signOut: vi.fn(),
}));

vi.mock("@/lib/useMobileDrawer", () => ({
  useMobileDrawer: () => ({
    toggleRef: { current: null },
    drawerRef: { current: null },
  }),
}));

import { PlatformSidebar } from "@/components/wepacker/PlatformSidebar";

describe("Session organizer navigation capability", () => {
  beforeEach(() => {
    sidebarState.pathname = "/wepacker/dashboard";
    sidebarState.role = "member";
  });

  it("lets a member account discover Manage Sessions from an exact edge", () => {
    const html = renderToStaticMarkup(
      createElement(PlatformSidebar, { canAccessMentorWorkspace: true }),
    );

    expect(html).toContain("Manage Sessions");
    expect(html).toContain('href="/wepacker/mentor/sessions"');
  });

  it("does not expose the organizer link without a capability edge", () => {
    const html = renderToStaticMarkup(createElement(PlatformSidebar));

    expect(html).not.toContain("Manage Sessions");
  });

  it.each(["member", "admin"] as const)(
    "does not treat the %s account role as workspace authority",
    (role) => {
      sidebarState.role = role;

      const html = renderToStaticMarkup(createElement(PlatformSidebar));

      expect(html).not.toContain("Organizer Workspace");
      expect(html).not.toContain("Manage Sessions");
    },
  );

  it("shows the graph-authorized workspace inside member organizer context", () => {
    sidebarState.pathname = "/wepacker/mentor/sessions";

    const html = renderToStaticMarkup(
      createElement(PlatformSidebar, { canAccessMentorWorkspace: true }),
    );

    expect(html).toContain(">Sessions<");
    expect(html).toContain("Organizer Workspace");
  });

  it("keeps Mentorships in the normal My Journey context for a Mentee", () => {
    sidebarState.pathname = "/wepacker/mentorships";

    const html = renderToStaticMarkup(createElement(PlatformSidebar));

    expect(html).toContain('href="/wepacker/dashboard"');
    expect(html).toContain('href="/wepacker/sessions"');
    expect(html).not.toContain('href="/wepacker/mentor/sessions"');
    expect(html).not.toContain("Organizer Workspace");
  });

  it("keeps every mobile navigation action reachable on short viewports", () => {
    const source = readFileSync(
      "src/components/wepacker/PlatformSidebar.tsx",
      "utf8",
    );

    expect(source).toContain(
      'className="fixed inset-0 z-40 overflow-y-auto overscroll-contain',
    );
  });
});
