import { describe, expect, it } from "vitest";
import {
  defaultLocale,
  isAppLocale,
  routing,
  stripLocalePrefix,
} from "@/i18n/routing";

describe("sitewide locale routing", () => {
  it("keeps Portuguese as the unprefixed default and exposes a clean English prefix", () => {
    expect(defaultLocale).toBe("pt-PT");
    expect(routing.localeDetection).toBe(false);
    expect(routing.localePrefix).toMatchObject({
      mode: "as-needed",
      prefixes: {
        "pt-PT": "/pt",
        "en-US": "/en",
      },
    });
  });

  it.each([
    ["/society", null, "/society"],
    ["/en/society", "en-US", "/society"],
    ["/pt/society", "pt-PT", "/society"],
    ["/en-US/wepacker/login", "en-US", "/wepacker/login"],
    ["/pt-PT", "pt-PT", "/"],
  ] as const)(
    "normalizes %s before product and authentication rules",
    (input, locale, pathname) => {
      expect(stripLocalePrefix(input)).toEqual({ locale, pathname });
    },
  );

  it("persists only supported customer choices", () => {
    expect(isAppLocale("pt-PT")).toBe(true);
    expect(isAppLocale("en-US")).toBe(true);
    expect(isAppLocale("en")).toBe(false);
    expect(isAppLocale(undefined)).toBe(false);
    expect(routing.localeCookie).toMatchObject({
      name: "NEXT_LOCALE",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      sameSite: "lax",
    });
  });
});
