import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const PUBLIC_ROUTES = [
  "/artists/alpha/login",
  "/artists/alpha/password/reset",
];

const PUBLIC_PREFIXES = [
  "/artists/alpha/invite/",
];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Only protect /artists/alpha/* routes
  if (!pathname.startsWith("/artists/alpha")) {
    return NextResponse.next();
  }

  // Allow public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Check authentication
  const user = req.auth?.user;
  if (!user) {
    return NextResponse.redirect(new URL("/artists/alpha/login", req.url));
  }

  const role = (user as { role?: string }).role;
  const onboarded = (user as { onboarded?: boolean }).onboarded;

  // Not onboarded — only allow welcome, agreement, assessment
  if (!onboarded) {
    const allowedPaths = [
      "/artists/alpha/welcome",
      "/artists/alpha/agreement",
      "/artists/alpha/assessment",
    ];
    if (!allowedPaths.includes(pathname)) {
      return NextResponse.redirect(new URL("/artists/alpha/welcome", req.url));
    }
    return NextResponse.next();
  }

  // Role-based access
  if (pathname.startsWith("/artists/alpha/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/artists/alpha/dashboard", req.url));
  }
  if (
    pathname.startsWith("/artists/alpha/mentor") &&
    role !== "mentor" &&
    role !== "admin"
  ) {
    return NextResponse.redirect(new URL("/artists/alpha/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/artists/alpha/:path*"],
};
