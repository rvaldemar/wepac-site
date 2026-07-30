import { describe, expect, it, vi } from "vitest";

vi.mock("next-auth", () => ({
  default: () => ({
    auth: (callback: (request: unknown) => unknown) => callback,
  }),
}));

vi.mock("next-intl/middleware", () => ({
  default: () => () => new Response(null, { status: 200 }),
}));

vi.mock("next-intl/routing", () => ({
  defineRouting: (config: unknown) => config,
}));

vi.mock("@/i18n/navigation", () => ({
  getPathname: ({ href, locale }: { href: string; locale: string }) =>
    locale === "en-US" ? `/en${href}` : href,
}));

import middleware from "@/proxy";

function request(
  pathname: string,
  role?: "member" | "admin",
  locale?: "pt-PT" | "en-US",
) {
  const url = `https://wepac.example.test${pathname}`;
  return {
    nextUrl: new URL(url),
    url,
    headers: new Headers(),
    cookies: {
      get: (name: string) =>
        name === "NEXT_LOCALE" && locale ? { value: locale } : undefined,
    },
    auth: role ? { user: { role, onboarded: true } } : null,
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
    if (req.auth) req.auth.user.onboarded = false;
    const response = middleware(req as never, {} as never) as Response;

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("normalizes the English prefix before applying the exact WEPACKER rules", () => {
    const response = middleware(
      request("/en/wepacker/mentor/sessions", "member") as never,
      {} as never,
    ) as Response;

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("redirects an unauthenticated English request to the English login", () => {
    const response = middleware(
      request("/en/wepacker/dashboard") as never,
      {} as never,
    ) as Response;

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://wepac.example.test/en/wepacker/login",
    );
  });

  it("keeps localized public intake outside the authentication gate", () => {
    const response = middleware(
      request("/en/wepacker/intake") as never,
      {} as never,
    ) as Response;

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("lets next-intl's canonical locale rewrite reach app/[locale] exactly once", () => {
    const response = middleware(
      request("/pt-PT/society") as never,
      {} as never,
    ) as Response;

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("still protects a canonical locale path before passing the rewrite through", () => {
    const response = middleware(
      request("/en-US/wepacker/dashboard") as never,
      {} as never,
    ) as Response;

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://wepac.example.test/en/wepacker/login",
    );
  });

  it("honors the visitor's persisted English choice on an unprefixed public URL", () => {
    const response = middleware(
      request("/society?source=qa", undefined, "en-US") as never,
      {} as never,
    ) as Response;

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://wepac.example.test/en/society?source=qa",
    );
  });
});
