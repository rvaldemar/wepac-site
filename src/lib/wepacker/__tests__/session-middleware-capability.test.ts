import { describe, expect, it, vi } from "vitest";

vi.mock("next-auth", () => ({
  default: () => ({
    auth: (callback: (request: unknown) => unknown) => callback,
  }),
}));

import middleware from "@/middleware";

function request(pathname: string, role: "member" | "admin") {
  const url = `https://wepac.example.test${pathname}`;
  return {
    nextUrl: new URL(url),
    url,
    auth: { user: { role, onboarded: true } },
  };
}

describe("Session organizer middleware capability", () => {
  it.each([
    "/wepacker/mentor/sessions",
    "/wepacker/mentor/sessions/session-1",
    "/wepacker/mentor/sessions/session-1/preview/person-1",
  ])("lets an authenticated member reach %s for exact server authorization", (path) => {
    const response = middleware(
      request(path, "member") as never,
      {} as never,
    ) as Response;

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("lets a member reach the workspace for exact server-side graph authorization", () => {
    const response = middleware(
      request("/wepacker/mentor", "member") as never,
      {} as never,
    ) as Response;

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("does not authorize from stale onboarding or role claims in middleware", () => {
    const req = request("/wepacker/admin/users", "member");
    req.auth.user.onboarded = false;
    const response = middleware(req as never, {} as never) as Response;

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });
});
