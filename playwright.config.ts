import { defineConfig, devices } from "@playwright/test";
import "dotenv/config";

const useBuild = process.env.E2E_SERVER === "build";
const e2ePort = Number(process.env.E2E_PORT ?? "3105");

if (!Number.isInteger(e2ePort) || e2ePort < 1024 || e2ePort > 65_535) {
  throw new Error("E2E_PORT must be an integer between 1024 and 65535");
}

const e2eBaseUrl = `http://127.0.0.1:${e2ePort}`;

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
    baseURL: e2eBaseUrl,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: useBuild
      ? `AUTH_URL=${e2eBaseUrl} npm run build && AUTH_URL=${e2eBaseUrl} PORT=${e2ePort} HOSTNAME=127.0.0.1 npm run start`
      : `AUTH_URL=${e2eBaseUrl} npm run dev -- --hostname 127.0.0.1 --port ${e2ePort}`,
    url: e2eBaseUrl,
    // Never attach the destructive reset-enabled suite to a server from a
    // different checkout or environment that happens to own the same port.
    reuseExistingServer: false,
    timeout: useBuild ? 180_000 : 60_000,
  },
});
