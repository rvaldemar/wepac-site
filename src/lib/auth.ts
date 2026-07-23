import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compareSync } from "bcryptjs";
import { prisma } from "@/lib/db";

// trustHost is normally left undefined so @auth/core's own default applies
// (true only when NODE_ENV !== "production", i.e. `next dev`; false for a
// real `next start`, which is exactly the posture that protects prod from
// Host-header-driven callback/redirect forgery — see @auth/core's
// UntrustedHost error). `next start` — and therefore `npm run
// test:e2e:build`, this repo's pre-deploy gate — always forces
// NODE_ENV=production regardless of anything in the parent shell, so that
// default alone can't tell "a genuine deploy" apart from "a disposable
// local E2E run against a production build". `E2E_TRUST_HOST` is a
// project-owned signal for exactly that case: it is set nowhere except
// `playwright.config.ts`'s `webServer.env`, which only exists inside the
// Playwright test runner's own child process — it is never read by
// `deploy/deploy.sh`, never in `.env.example`, and never in the server's
// `.env.production`. Deliberately NOT reusing Auth.js's own
// `AUTH_TRUST_HOST` for this: that name reads as a legitimate NextAuth
// deployment setting, which is exactly how it ended up unconditionally in
// production's `.env.production` per OPS_LOG 2026-03-24 — a distinct,
// project-specific name is harder to mistake for something that belongs
// in a real environment file.
//
// What this can never do: even if `E2E_TRUST_HOST` somehow leaked into a
// real server env, it only ever sets `trustHost: true` — it cannot forge
// a session, mint a token, or bypass `authorize()`. The actual damage a
// true `trustHost` enables in production is redirect/callback URLs (and
// the `Secure`-flagged cookies tied to them) being derived from a
// client-controlled `Host`/`X-Forwarded-Host` header instead of the real
// origin — an attacker who can influence that header could point
// sign-in callback links at a host they control, a phishing/credential
// interception vector on a site sitting behind a reverse proxy.
const trustHost = process.env.E2E_TRUST_HOST === "1" ? true : undefined;

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.passwordHash) return null;

        const valid = compareSync(
          credentials.password as string,
          user.passwordHash
        );
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          onboarded: user.onboarded,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/wepacker/login",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
        token.onboarded = (user as { onboarded: boolean }).onboarded;
      }
      // Refresh role/onboarded from the DB when the client calls
      // useSession().update() (e.g. right after finishing onboarding).
      if (trigger === "update" && token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, onboarded: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.onboarded = dbUser.onboarded;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role: string }).role = token.role as string;
        (session.user as { onboarded: boolean }).onboarded =
          token.onboarded as boolean;
      }
      return session;
    },
  },
});
