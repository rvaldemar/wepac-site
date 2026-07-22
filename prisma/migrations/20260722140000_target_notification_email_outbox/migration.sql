-- Target-domain, recipient-specific notifications and transactional email
-- outbox. Rows contain identifiers and delivery metadata only; names, email
-- addresses and relationship content are re-read after resource authorization.

CREATE TYPE "NotificationType" AS ENUM (
    'pack_invited',
    'pack_accepted',
    'connection_requested',
    'connection_accepted',
    'mentorship_invited',
    'mentorship_accepted',
    'session_scheduled',
    'session_updated',
    'session_cancelled',
    'session_followup_updated',
    'new_message'
);

-- Monotonic, content-free version for attendee-visible Session follow-up
-- transitions. The previous runtime ignores this additive column.
ALTER TABLE "session_attendees"
    ADD COLUMN "followupRevision" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "session_attendees"
    ADD CONSTRAINT "session_attendees_followupRevision_nonnegative_check"
    CHECK ("followupRevision" >= 0);

CREATE TYPE "EmailOutboxStatus" AS ENUM (
    'pending',
    'processing',
    'sent',
    'failed',
    'superseded'
);

CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "actorId" TEXT,
    "type" "NotificationType" NOT NULL,
    "resourceId" TEXT NOT NULL,
    "resourceVersion" INTEGER,
    "href" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "email_outbox" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "status" "EmailOutboxStatus" NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "lastErrorKind" TEXT,
    "lastSmtpCode" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_outbox_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "email_outbox_attempts_nonnegative_check" CHECK ("attempts" >= 0),
    CONSTRAINT "email_outbox_processing_lock_check" CHECK (
        "status" <> 'processing' OR "lockedAt" IS NOT NULL
    ),
    CONSTRAINT "email_outbox_sent_timestamp_check" CHECK (
        "status" <> 'sent' OR "sentAt" IS NOT NULL
    )
);

CREATE UNIQUE INDEX "notifications_dedupeKey_key"
    ON "notifications"("dedupeKey");
CREATE INDEX "notifications_recipientId_readAt_createdAt_idx"
    ON "notifications"("recipientId", "readAt", "createdAt");
CREATE INDEX "notifications_resourceId_type_idx"
    ON "notifications"("resourceId", "type");

CREATE UNIQUE INDEX "email_outbox_notificationId_key"
    ON "email_outbox"("notificationId");
CREATE UNIQUE INDEX "email_outbox_dedupeKey_key"
    ON "email_outbox"("dedupeKey");
CREATE INDEX "email_outbox_status_nextAttemptAt_idx"
    ON "email_outbox"("status", "nextAttemptAt");
CREATE INDEX "email_outbox_recipientId_status_createdAt_idx"
    ON "email_outbox"("recipientId", "status", "createdAt");

ALTER TABLE "notifications"
    ADD CONSTRAINT "notifications_recipientId_fkey"
    FOREIGN KEY ("recipientId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notifications"
    ADD CONSTRAINT "notifications_actorId_fkey"
    FOREIGN KEY ("actorId") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "email_outbox"
    ADD CONSTRAINT "email_outbox_notificationId_fkey"
    FOREIGN KEY ("notificationId") REFERENCES "notifications"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "email_outbox"
    ADD CONSTRAINT "email_outbox_recipientId_fkey"
    FOREIGN KEY ("recipientId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
