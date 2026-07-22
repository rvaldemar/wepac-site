import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const source = execFileSync(
  "rg",
  [
    "--files",
    "src",
    "-g",
    "*.ts",
    "-g",
    "*.tsx",
    "-g",
    "!**/__tests__/**",
  ],
  { encoding: "utf8" },
)
  .trim()
  .split("\n")
  .map((path) => readFileSync(path, "utf8"))
  .join("\n");

describe("email transport security", () => {
  it("never disables TLS certificate verification", () => {
    expect(source).not.toContain("rejectUnauthorized: false");
  });

  it("logs only scrubbed delivery metadata", () => {
    expect(source).not.toContain(
      'console.error("Failed to send lead notification email:", error)',
    );
    expect(readFileSync("src/lib/email.ts", "utf8")).toContain(
      "logSafeError(error)",
    );
  });
});
