import NextAuth, { type NextAuthRequest } from "next-auth";
import createMiddleware from "next-intl/middleware";
import type { NextFetchEvent } from "next/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import authConfig from "@/auth.config";
import { getPathname } from "@/i18n/navigation";
import {
  defaultLocale,
  isAppLocale,
  routing,
  stripLocalePrefix,
  type AppLocale,
} from "@/i18n/routing";

const { auth } = NextAuth(authConfig);
const handleI18nRouting = createMiddleware(routing);

const PUBLIC_ROUTES = [
  "/wepacker",
  "/wepacker/intake",
  "/wepacker/login",
  "/wepacker/password/reset",
];

const PUBLIC_PREFIXES = ["/wepacker/invite/"];

const SESSION_ATTENDEE_PREVIEW_RE =
  /^\/wepacker\/mentor\/sessions\/[^/]+\/preview\/[^/]+\/?$/;

type RequestWithAuth = NextRequest & {
  auth?: {
    user?: unknown;
  } | null;
};

export function resolveRequestLocale(request: NextRequest): AppLocale {
  const pathLocale = stripLocalePrefix(request.nextUrl.pathname).locale;
  if (pathLocale) return pathLocale;

  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  if (isAppLocale(cookieLocale)) return cookieLocale;

  return defaultLocale;
}

export function isPublicWepackerPath(pathname: string): boolean {
  return (
    PUBLIC_ROUTES.includes(pathname) ||
    PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}

function applyPreviewHeaders(response: NextResponse, pathname: string) {
  if (!SESSION_ATTENDEE_PREVIEW_RE.test(pathname)) return response;

  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");

  const vary = new Set(
    (response.headers.get("Vary") ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
  vary.add("Cookie");
  response.headers.set("Vary", [...vary].join(", "));
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return response;
}

export function routeRequest(request: RequestWithAuth): NextResponse {
  const isInternalLocalePath =
    /^\/(?:pt-PT|en-US)(?:\/|$)/.test(request.nextUrl.pathname);
  const normalized = stripLocalePrefix(request.nextUrl.pathname);
  const pathname = normalized.pathname;

  if (
    pathname.startsWith("/wepacker") &&
    !isPublicWepackerPath(pathname) &&
    !request.auth?.user
  ) {
    const locale = normalized.locale ?? resolveRequestLocale(request);
    const loginPath = getPathname({
      locale,
      href: "/wepacker/login",
    });
    return NextResponse.redirect(new URL(loginPath, request.url));
  }

  // Unprefixed URLs are Portuguese by default. Once the visitor explicitly
  // chooses English, keep unlocalized redirects and legacy links in that
  // chosen locale without using browser-language heuristics.
  if (!normalized.locale && resolveRequestLocale(request) === "en-US") {
    const localizedUrl = new URL(request.url);
    localizedUrl.pathname = `/en${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(localizedUrl);
  }

  // next-intl rewrites the public /pt and /en prefixes to the canonical locale
  // segment consumed by app/[locale]. Next.js can run proxy.ts again for that
  // internal rewrite, especially when it is composed with the Auth.js wrapper.
  // Let the canonical segment reach the route directly; sending it through
  // next-intl again would prepend the locale repeatedly. Authentication above
  // still runs for direct or rewritten WEPACKER requests.
  if (isInternalLocalePath) {
    return applyPreviewHeaders(NextResponse.next(), pathname);
  }

  // JWT claims deliberately remain identity evidence only. Fresh onboarding,
  // role and graph authorization continue to be enforced by page/action guards.
  const response = handleI18nRouting(request);
  return applyPreviewHeaders(response, pathname);
}

const handleProtectedRequest = auth(
  (request: NextAuthRequest, event: NextFetchEvent) => {
    void event;
    return routeRequest(request);
  },
);

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  const pathname = stripLocalePrefix(request.nextUrl.pathname).pathname;
  const isProtectedWepackerPath =
    pathname.startsWith("/wepacker") && !isPublicWepackerPath(pathname);

  // Auth.js only belongs on protected WEPACKER pages. Running its middleware
  // wrapper on every public Society or institutional request creates needless
  // CSRF/callback cookies and can cause internal locale rewrites to re-enter
  // the wrapper.
  if (isProtectedWepackerPath) {
    return handleProtectedRequest(request, event);
  }

  return routeRequest(request);
}

export const config = {
  matcher: [
    "/((?!api|_next|_vercel|trpc|oyZz-oSAZPfGYdcoVTpjZA|.*\\..*).*)",
  ],
};
