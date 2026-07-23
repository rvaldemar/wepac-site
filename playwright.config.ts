import { defineConfig, devices } from "@playwright/test";
import "dotenv/config";

const useBuild = process.env.E2E_SERVER === "build";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // The suite shares one Postgres dev DB across specs — serial execution
  // avoids cross-spec races (e.g. seed mutations, session creation).
  workers: 1,
  reporter: [["html", { open: "never" }], ["list"]],
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: useBuild ? "npm run build && npm run start" : "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: useBuild ? 180_000 : 60_000,
    // Playwright's `env`, when set, REPLACES the child's environment
    // instead of extending `process.env` (it's only a default, not a
    // merge) — so this must spread the parent env explicitly or the
    // server loses DATABASE_URL/NEXTAUTH_SECRET/PATH/etc. entirely.
    // E2E_TRUST_HOST itself is scoped to this one child process only —
    // never exported to the shell, never in .env*, never read by
    // deploy/deploy.sh. See the long comment on `trustHost` in
    // src/lib/auth.ts for the full threat-model justification of why
    // this exists and why it can't affect a real deploy.
    env: { ...process.env, E2E_TRUST_HOST: "1" } as Record<string, string>,
  },
});
