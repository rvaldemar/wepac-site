import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "@/auth.config";

const { auth } = NextAuth(authConfig);

const PUBLIC_ROUTES = [
  "/wepacker",
  "/wepacker/intake",
  "/wepacker/login",
  "/wepacker/password/reset",
];

const PUBLIC_PREFIXES = ["/wepacker/invite/"];

const SESSION_ATTENDEE_PREVIEW_RE =
  /^\/wepacker\/mentor\/sessions\/[^/]+\/preview\/[^/]+\/?$/;

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith("/wepacker")) {
    return NextResponse.next();
  }

  // Public routes
  if (PUBLIC_ROUTES.includes(pathname)) return NextResponse.next();
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Authentication
  const user = req.auth?.user;
  if (!user) {
    return NextResponse.redirect(new URL("/wepacker/login", req.url));
  }

  // JWT claims are deliberately not authorization state. Current onboarding,
  // account role and graph capabilities are re-read by page/action guards.
  // Middleware only proves that the request carries an authenticated identity.
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
  matcher: ["/wepacker/:path*"],
};
