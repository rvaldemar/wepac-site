import { defineRouting } from "next-intl/routing";

export const locales = ["pt-PT", "en-US"] as const;
export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "pt-PT";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localeDetection: false,
  localePrefix: {
    mode: "as-needed",
    prefixes: {
      "pt-PT": "/pt",
      "en-US": "/en",
    },
  },
  localeCookie: {
    name: "NEXT_LOCALE",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  },
});

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === "string" && locales.includes(value as AppLocale);
}

export function stripLocalePrefix(pathname: string): {
  locale: AppLocale | null;
  pathname: string;
} {
  const prefixes: ReadonlyArray<readonly [string, AppLocale]> = [
    ["/en-US", "en-US"],
    ["/pt-PT", "pt-PT"],
    ["/en", "en-US"],
    ["/pt", "pt-PT"],
  ];

  for (const [prefix, locale] of prefixes) {
    if (pathname === prefix) return { locale, pathname: "/" };
    if (pathname.startsWith(`${prefix}/`)) {
      return {
        locale,
        pathname: pathname.slice(prefix.length) || "/",
      };
    }
  }

  return { locale: null, pathname };
}
