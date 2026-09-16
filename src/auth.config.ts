import type { NextAuthConfig } from "next-auth";
import {
  deploymentBasePath,
  withDeploymentBasePath,
} from "@/lib/deployment-path";

const stagingCookies: NextAuthConfig["cookies"] = deploymentBasePath
  ? {
      sessionToken: {
        name: "__Secure-authjs.staging.session-token",
        options: {
          httpOnly: true,
          sameSite: "lax",
          path: deploymentBasePath,
          secure: true,
        },
      },
      callbackUrl: {
        name: "__Secure-authjs.staging.callback-url",
        options: {
          sameSite: "lax",
          path: deploymentBasePath,
          secure: true,
        },
      },
      csrfToken: {
        name: "__Secure-authjs.staging.csrf-token",
        options: {
          httpOnly: true,
          sameSite: "lax",
          path: deploymentBasePath,
          secure: true,
        },
      },
    }
  : undefined;

// Edge-safe Auth.js shell used only by middleware. It deliberately contains
// no Prisma, bcrypt, SMTP or Node-only imports; middleware proves presence of
// a signed identity, while server guards perform fresh database authorization.
const authConfig = {
  basePath: `${deploymentBasePath}/api/auth`,
  providers: [],
  session: { strategy: "jwt" },
  pages: { signIn: withDeploymentBasePath("/wepacker/login") },
  cookies: stagingCookies,
} satisfies NextAuthConfig;

export default authConfig;
