import { compareSync } from "bcryptjs";
import { prisma } from "@/lib/db";
import {
  getVisitorIpFromHeaders,
  VisitorRateLimiter,
} from "@/lib/wessex/rate-limit";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 320;
const MAX_PASSWORD_BYTES = 72;
const DUMMY_PASSWORD_HASH =
  "$2b$10$R9wlSGqnhWAPItdmvA/FxOvmGb97bzf/xxrHaeFLgEYeyTxcJVxNO";
const ipRateLimiter = new VisitorRateLimiter();
const accountRateLimiter = new VisitorRateLimiter();

type CredentialUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string | null;
  role: string;
  onboarded: boolean;
  sessionVersion: number;
};

type CredentialsAuthDependencies = {
  findUserByEmail: (email: string) => Promise<CredentialUser | null>;
  comparePassword: (password: string, hash: string) => boolean;
  ipLimiter: VisitorRateLimiter;
  accountLimiter: VisitorRateLimiter;
  accountKeySecret: () => string;
};

const defaultDependencies: CredentialsAuthDependencies = {
  findUserByEmail: (email) =>
    prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
        role: true,
        onboarded: true,
        sessionVersion: true,
      },
    }),
  comparePassword: compareSync,
  ipLimiter: ipRateLimiter,
  accountLimiter: accountRateLimiter,
  accountKeySecret: () =>
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "wepac-credentials-rate-limit-v1",
};

async function accountRateLimitKey(
  emailCandidate: string,
  secret: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await globalThis.crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(emailCandidate),
  );
  return Array.from(new Uint8Array(signature), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export function createWepackerCredentialsAuthorizer(
  overrides: Partial<CredentialsAuthDependencies> = {},
) {
  const dependencies = { ...defaultDependencies, ...overrides };

  return async function authorizeCredentials(
    credentials: unknown,
    request: { headers: Pick<Headers, "get"> },
  ) {
    const record =
      typeof credentials === "object" &&
      credentials !== null &&
      !Array.isArray(credentials)
        ? (credentials as Record<string, unknown>)
        : {};
    const rawEmail = typeof record.email === "string" ? record.email : "";
    const rawPassword =
      typeof record.password === "string" ? record.password : "";
    const email = rawEmail.trim().toLowerCase();
    const emailCandidate = email.slice(0, MAX_EMAIL_LENGTH + 1);

    const ipLimit = dependencies.ipLimiter.check(
      getVisitorIpFromHeaders(request.headers),
    );
    const accountLimit = dependencies.accountLimiter.check(
      await accountRateLimitKey(
        emailCandidate || "invalid",
        dependencies.accountKeySecret(),
      ),
    );
    if (!ipLimit.allowed || !accountLimit.allowed) return null;

    const passwordWithinLimit =
      rawPassword.length > 0 &&
      Buffer.byteLength(rawPassword, "utf8") <= MAX_PASSWORD_BYTES;
    const validEmail =
      email.length > 0 &&
      email.length <= MAX_EMAIL_LENGTH &&
      EMAIL_PATTERN.test(email);

    const user = validEmail
      ? await dependencies.findUserByEmail(email)
      : null;
    const candidatePassword = passwordWithinLimit
      ? rawPassword
      : "wepac-invalid-credential";
    const passwordHash = user?.passwordHash || DUMMY_PASSWORD_HASH;
    let passwordMatches = false;
    try {
      passwordMatches = dependencies.comparePassword(
        candidatePassword,
        passwordHash,
      );
    } catch {
      // A malformed stored hash is an authentication failure, never a 500.
      passwordMatches = false;
    }

    if (
      !validEmail ||
      !passwordWithinLimit ||
      !user?.passwordHash ||
      !passwordMatches
    ) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      onboarded: user.onboarded,
      sessionVersion: user.sessionVersion,
    };
  };
}

export const authorizeWepackerCredentials =
  createWepackerCredentialsAuthorizer();
