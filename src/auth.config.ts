import type { NextAuthConfig } from "next-auth";

// Edge-safe Auth.js shell used only by middleware. It deliberately contains
// no Prisma, bcrypt, SMTP or Node-only imports; middleware proves presence of
// a signed identity, while server guards perform fresh database authorization.
const authConfig = {
  providers: [],
  session: { strategy: "jwt" },
  pages: { signIn: "/wepacker/login" },
} satisfies NextAuthConfig;

export default authConfig;
