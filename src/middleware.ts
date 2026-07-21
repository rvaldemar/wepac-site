import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const PUBLIC_ROUTES = [
  "/wepacker",
  "/wepacker/intake",
  "/wepacker/login",
  "/wepacker/password/reset",
];

const PUBLIC_PREFIXES = ["/wepacker/invite/"];

// /wepacker/<pack-slug>/intake is public (candidatura = legacy alias).
const INTAKE_RE = /^\/wepacker\/[^/]+\/(intake|candidatura)\/?$/;

const ONBOARDING_PATHS = [
  "/wepacker/welcome",
  "/wepacker/agreement",
  "/wepacker/assessment",
];

const SESSION_ATTENDEE_PREVIEW_RE =
  /^\/wepacker\/mentor\/sessions\/[^/]+\/preview\/[^/]+\/?$/;

// Legacy Artista Alpha routes → WEPACKER equivalents.
function legacyRedirect(pathname: string): string | null {
  if (!pathname.startsWith("/artists/alpha")) return null;
  const rest = pathname.slice("/artists/alpha".length);
  if (rest.startsWith("/mentor/artists/")) {
    return "/wepacker/mentor/members/" + rest.slice("/mentor/artists/".length);
  }
  if (rest.startsWith("/admin/beta-signups")) {
    return "/wepacker/admin/leads";
  }
  if (rest === "" || rest === "/") return "/wepacker";
  return "/wepacker" + rest;
}

export default auth((req) => {
  const { pathname, search } = req.nextUrl;

  const legacy = legacyRedirect(pathname);
  if (legacy) {
    return NextResponse.redirect(new URL(legacy + search, req.url), 308);
  }

  if (!pathname.startsWith("/wepacker")) {
    return NextResponse.next();
  }

  // Public routes
  if (PUBLIC_ROUTES.includes(pathname)) return NextResponse.next();
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }
  if (INTAKE_RE.test(pathname)) return NextResponse.next();

  // Authentication
  const user = req.auth?.user;
  if (!user) {
    return NextResponse.redirect(new URL("/wepacker/login", req.url));
  }

  const role = (user as { role?: string }).role;
  const onboarded = (user as { onboarded?: boolean }).onboarded;

  // Not onboarded — only allow the onboarding flow
  if (!onboarded) {
    if (!ONBOARDING_PATHS.includes(pathname)) {
      return NextResponse.redirect(new URL("/wepacker/welcome", req.url));
    }
    return NextResponse.next();
  }

  // Role-based access
  if (pathname.startsWith("/wepacker/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/wepacker/dashboard", req.url));
  }
  if (
    pathname.startsWith("/wepacker/mentor") &&
    role !== "mentor" &&
    role !== "admin"
  ) {
    return NextResponse.redirect(new URL("/wepacker/dashboard", req.url));
  }

  const response = NextResponse.next();
  if (SESSION_ATTENDEE_PREVIEW_RE.test(pathname)) {
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("Pragma", "no-cache");
    const vary = response.headers.get("Vary");
    response.headers.set("Vary", vary ? `${vary}, Cookie` : "Cookie");
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  }
  return response;
});

export const config = {
  matcher: ["/wepacker/:path*", "/artists/alpha/:path*"],
};
