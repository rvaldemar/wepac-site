import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const schema = readFileSync("prisma/schema.prisma", "utf8");
const migration = readFileSync(
  "prisma/migrations/20260722180000_auth_token_and_agreement_integrity/migration.sql",
  "utf8",
);

describe("authentication and consent schema integrity", () => {
  it("enforces one Agreement evidence row per Person and version", () => {
    expect(schema).toContain("@@unique([userId, version])");
    expect(migration).toContain("$agreements_must_be_unique$");
    expect(migration).toContain('"agreements_userId_version_key"');
    expect(migration).not.toMatch(/DELETE\s+FROM\s+"agreements"/i);
  });

  it("tracks atomic password-reset consumption and revocation", () => {
    expect(schema).toMatch(/\busedAt\s+DateTime\?/);
    expect(schema).toMatch(/\brevokedAt\s+DateTime\?/);
    expect(schema).toContain("@@index([userId, createdAt])");
    expect(migration).toContain('ADD COLUMN "usedAt"');
    expect(migration).toContain('ADD COLUMN "revokedAt"');
  });
});
