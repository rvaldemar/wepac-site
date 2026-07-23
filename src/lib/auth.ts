import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import authConfig from "@/auth.config";
import { prisma } from "@/lib/db";
import { authorizeWepackerCredentials } from "@/lib/wepacker/credentials-auth";

// `next start` uses production Auth.js defaults, so the production-build E2E
// server needs one test-runner-scoped signal. This variable is set only by
// playwright.config.ts and is intentionally distinct from AUTH_TRUST_HOST.
const trustHost = process.env.E2E_TRUST_HOST === "1" ? true : undefined;

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  trustHost,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        return authorizeWepackerCredentials(credentials, request);
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
        token.onboarded = (user as { onboarded: boolean }).onboarded;
        token.sessionVersion = (user as { sessionVersion: number }).sessionVersion;
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
        session.user.sessionVersion = token.sessionVersion as number;
      }
      return session;
    },
  },
});
