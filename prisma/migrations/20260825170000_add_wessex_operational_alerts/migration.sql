-- Content-free durable outbox for classified Wessex chat failures. The unique
-- window key is the concurrency boundary; no request, visitor or prompt data is
-- accepted by this table.
CREATE TABLE "wessex_operational_alerts" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "windowStartedAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveryStartedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "lastErrorKind" TEXT,
    "lastSmtpCode" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wessex_operational_alerts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "wessex_operational_alerts_code_check" CHECK ("code" IN ('configuration', 'upstream_auth', 'upstream_unavailable', 'invalid_response', 'stream_failed')),
    CONSTRAINT "wessex_operational_alerts_status_check" CHECK ("status" IN ('pending', 'sending', 'failed', 'sent')),
    CONSTRAINT "wessex_operational_alerts_attempts_check" CHECK ("attempts" >= 0 AND "attempts" <= 4)
);

CREATE UNIQUE INDEX "wessex_operational_alerts_code_key"
    ON "wessex_operational_alerts"("code");

CREATE INDEX "wessex_operational_alerts_status_nextAttemptAt_idx"
    ON "wessex_operational_alerts"("status", "nextAttemptAt");
