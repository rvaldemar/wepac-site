import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const schema = readFileSync(resolve(process.cwd(), "prisma/schema.prisma"), "utf8");
const migration = readFileSync(
  resolve(
    process.cwd(),
    "prisma/migrations/20260722140000_target_notification_email_outbox/migration.sql",
  ),
  "utf8",
);
const concurrencyMigration = readFileSync(
  resolve(
    process.cwd(),
    "prisma/migrations/20260722200000_notification_concurrency_guards/migration.sql",
  ),
  "utf8",
);

function modelBlock(name: string): string {
  const match = schema.match(new RegExp(`model ${name} \\{([\\s\\S]*?)\\n\\}`));
  if (!match) throw new Error(`Missing ${name} model`);
  return match[1];
}

describe("target notification persistence", () => {
  it("persists recipient-specific events and a durable retryable outbox", () => {
    expect(schema).toMatch(
      /enum NotificationType \{[\s\S]*pack_invited[\s\S]*pack_accepted[\s\S]*connection_requested[\s\S]*connection_accepted[\s\S]*mentorship_invited[\s\S]*mentorship_accepted[\s\S]*session_scheduled[\s\S]*session_updated[\s\S]*session_cancelled[\s\S]*session_followup_updated[\s\S]*new_message[\s\S]*\}/,
    );
    expect(schema).toMatch(/enum EmailOutboxStatus \{[\s\S]*superseded[\s\S]*\}/);
    expect(modelBlock("Notification")).toMatch(/recipientId\s+String/);
    expect(modelBlock("Notification")).toMatch(/resourceVersion\s+Int\?/);
    expect(modelBlock("Session")).toMatch(/calendarRevision\s+Int/);
    expect(modelBlock("Message")).toMatch(
      /@@index\(\[conversationId, userId, createdAt\]\)/,
    );
    expect(modelBlock("Notification")).toMatch(/dedupeKey\s+String\s+@unique/);
    expect(modelBlock("EmailOutbox")).toMatch(/notificationId\s+String\s+@unique/);
    expect(modelBlock("EmailOutbox")).toContain("nextAttemptAt");
    expect(migration).toContain('CREATE TABLE "notifications"');
    expect(migration).toContain('CREATE TABLE "email_outbox"');
    expect(migration).toContain("email_outbox_processing_lock_check");
    expect(migration).toContain("'mentorship_invited'");
    expect(migration).toContain("'session_cancelled'");
    expect(migration).toContain("'session_followup_updated'");
    expect(migration).toContain('"followupRevision" INTEGER NOT NULL DEFAULT 0');
    expect(migration).toContain('"resourceVersion" INTEGER');
    expect(migration).toContain("'new_message'");
    expect(concurrencyMigration).toContain(
      '"calendarRevision" INTEGER NOT NULL DEFAULT 0',
    );
    expect(concurrencyMigration).toContain(
      "sessions_calendarRevision_nonnegative_check",
    );
    expect(concurrencyMigration).toContain(
      'CREATE INDEX "messages_conversationId_userId_createdAt_idx"',
    );
  });

  it("contains no names, addresses or rendered relationship content", () => {
    for (const block of [modelBlock("Notification"), modelBlock("EmailOutbox")]) {
      expect(block).not.toMatch(
        /^\s*(body|payload|email|emailAddress|recipientName|actorName|relationshipType|packName)\s+/m,
      );
    }
    expect(migration).not.toMatch(/task_assigned|cohort|legacy/i);
  });
});
