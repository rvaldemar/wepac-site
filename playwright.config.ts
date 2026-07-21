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
  },
});
