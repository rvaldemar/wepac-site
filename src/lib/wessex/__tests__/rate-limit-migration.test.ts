import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const schema = readFileSync(join(root, "prisma/schema.prisma"), "utf8");
const migration = readFileSync(
  join(
    root,
    "prisma/migrations/20260825143000_add_wessex_rate_limit_buckets/migration.sql",
  ),
  "utf8",
);

describe("Wessex rate-limit migration contract", () => {
  it("is additive, expirable, and stores only a fixed-length hash key", () => {
    expect(schema).toContain("model WessexRateLimitBucket");
    expect(schema).toContain("keyHash         String   @id @db.Char(64)");
    expect(schema).toContain("@@index([expiresAt])");
    expect(migration).toContain('CREATE TABLE "wessex_rate_limit_buckets"');
    expect(migration).toContain('"keyHash" CHAR(64) NOT NULL');
    expect(migration).toContain('CREATE INDEX "wessex_rate_limit_buckets_expiresAt_idx"');
    expect(migration).not.toMatch(/"(?:ip|address|visitorIp)"/i);
    expect(migration).not.toMatch(/\b(DROP|ALTER)\s+TABLE\b/i);
  });
});
