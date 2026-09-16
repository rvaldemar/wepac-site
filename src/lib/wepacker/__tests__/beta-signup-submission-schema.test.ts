import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const schema = readFileSync(join(root, "prisma/schema.prisma"), "utf8");
const migration = readFileSync(
  join(
    root,
    "prisma/migrations/20260825120000_add_beta_signup_submission_history/migration.sql",
  ),
  "utf8",
);

function model(name: string) {
  return schema.match(new RegExp(`model ${name} \\{([\\s\\S]*?)\\n\\}`))?.[1] ?? "";
}

describe("BetaSignup submission history schema", () => {
  it("keeps email as the canonical unique identity", () => {
    expect(model("BetaSignup")).toMatch(/email\s+String\s+@unique/);
  });

  it("stores typed append-only snapshots and cascades GDPR deletion", () => {
    const submission = model("BetaSignupSubmission");

    expect(submission).toContain("submittedAt");
    expect(submission).toContain("createdAt");
    expect(submission).toContain("BetaSignupSubmissionSource");
    expect(submission).toContain("BetaSignupSubmissionState");
    expect(submission).toContain("onDelete: Cascade");
    expect(submission).not.toContain("updatedAt");
    expect(migration).toContain("ON DELETE CASCADE");
    expect(migration).toContain("beta_signup_submissions_append_only");
    expect(migration).toContain("TG_OP = 'UPDATE'");
    expect(migration).not.toMatch(/INSERT INTO\s+"beta_signup_submissions"/i);
  });
});
