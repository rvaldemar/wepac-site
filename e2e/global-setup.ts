import { execSync } from "node:child_process";

// Runs once before the whole suite. Resets the local dev Postgres to a
// known, deterministic state so every spec starts from the same fixtures
// — never against a second, separate test DB, per the repo's own dev
// setup (there is only one local Postgres).
//
// Deliberately does NOT call `prisma migrate reset` — besides being far
// more destructive than needed here (drops and recreates the whole
// database), it is also refused outright when invoked by an AI agent
// without a human's literal, explicit consent captured in
// PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION. `prisma/seed.ts` already
// deleteMany()s and recreates every platform table it owns (leads,
// beta_signups and the bilheteira tables are left untouched), which is
// exactly the determinism this suite needs — so a plain `prisma db seed`
// is both sufficient and far less destructive.
export default function globalSetup() {
  const url = process.env.DATABASE_URL ?? "";
  const isLocal = /(localhost|127\.0\.0\.1)/.test(url);
  if (!isLocal) {
    throw new Error(
      "DATABASE_URL does not point at localhost — refusing to reseed. " +
        "Point .env at your local dev Postgres before running the E2E suite."
    );
  }
  if (process.env.E2E_ALLOW_DB_RESET !== "1") {
    throw new Error(
      "E2E_ALLOW_DB_RESET=1 is not set — this wipes and reseeds the WEPACKER " +
        "platform tables in your local dev DB. Set the env var explicitly to " +
        "confirm this is safe (the npm scripts do this for you)."
    );
  }
  execSync("npx prisma db seed", { stdio: "inherit" });
}
