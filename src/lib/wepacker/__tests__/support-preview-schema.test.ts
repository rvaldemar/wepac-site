import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const schema = readFileSync(join(process.cwd(), "prisma/schema.prisma"), "utf8");
const migration = readFileSync(
  join(
    process.cwd(),
    "prisma/migrations/20260722150000_support_preview_capability/migration.sql",
  ),
  "utf8",
);
const seed = readFileSync(join(process.cwd(), "prisma/seed.ts"), "utf8");

describe("Support Preview persistence boundary", () => {
  it("stores one scoped grant and a separate content-free audit", () => {
    const auditModel = schema.match(
      /model SupportPreviewAuditEvent \{[\s\S]*?\n\}/,
    )?.[0];
    expect(schema).toContain("model SupportPreviewGrant");
    expect(schema).toContain("model SupportPreviewAuditEvent");
    expect(schema).toMatch(/model SupportPreviewGrant[\s\S]*sessionId\s+String/);
    expect(schema).toMatch(
      /model SupportPreviewGrant[\s\S]*targetUserId\s+String/,
    );
    expect(schema).toMatch(
      /model SupportPreviewGrant[\s\S]*reauthenticatedAt\s+DateTime/,
    );
    expect(schema).toMatch(/reasonCode\s+SupportPreviewReasonCode/);
    expect(schema).toContain("ticketReferenceDigest");
    expect(schema).not.toMatch(/^\s+reason\s+String/m);
    expect(schema).not.toMatch(/^\s+ticketReference\s+String/m);
    expect(auditModel).toBeTruthy();
    expect(auditModel).not.toMatch(
      /\b(?:name|email|notes|transcript|debrief|payload|reason)\b\s+String/,
    );
  });

  it("uses Restrict relationships and a retention-aware immutable trigger", () => {
    const auditModel = schema.match(
      /model SupportPreviewAuditEvent \{[\s\S]*?\n\}/,
    )?.[0];
    expect(auditModel).toBeTruthy();
    expect(auditModel).not.toContain("onDelete: Cascade");
    expect(auditModel?.match(/onDelete: Restrict/g)).toHaveLength(4);
    expect(migration).toContain("BEFORE UPDATE OR DELETE");
    expect(migration).toContain("support_preview_audit_events are append-only");
    expect(migration).toContain("wepac.support_preview_seed_reset");
    expect(migration).toContain("wepac.support_preview_retention_maintenance");
  });

  it("enforces the 15-minute maximum and ticket digest invariant", () => {
    expect(migration).toContain("INTERVAL '15 minutes'");
    expect(migration).toContain("support_preview_grants_ticket_digest_check");
    expect(migration).toContain("support_preview_grants_ticket_redaction_check");
    expect(migration).not.toMatch(/"reason"\s+TEXT|"ticketReference"\s+TEXT/);
  });

  it("resets protected rows in dependency order only in the guarded seed", () => {
    const auditDelete = seed.indexOf("supportPreviewAuditEvent.deleteMany()");
    const grantDelete = seed.indexOf("supportPreviewGrant.deleteMany()");
    const outboxDelete = seed.indexOf("emailOutbox.deleteMany()");
    const notificationDelete = seed.indexOf("notification.deleteMany()");
    const sessionDelete = seed.indexOf("session.deleteMany()");
    const userDelete = seed.indexOf("user.deleteMany()");

    expect(seed).toContain(
      "set_config('wepac.support_preview_seed_reset', 'on', true)",
    );
    expect(auditDelete).toBeGreaterThan(-1);
    expect(auditDelete).toBeLessThan(grantDelete);
    expect(grantDelete).toBeLessThan(sessionDelete);
    expect(sessionDelete).toBeLessThan(userDelete);
    expect(outboxDelete).toBeLessThan(notificationDelete);
    expect(notificationDelete).toBeLessThan(userDelete);
  });
});
