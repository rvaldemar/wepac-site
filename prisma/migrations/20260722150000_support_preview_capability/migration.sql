-- Session-scoped, read-only Support Preview capability.
--
-- This migration is additive and remains compatible with the previously
-- running Release A process. It stores no projected Session content, raw
-- support reason, password, or raw ticket reference.

CREATE TYPE "SupportPreviewAuditEventType" AS ENUM (
    'reauth_denied',
    'reauth_rate_limited',
    'grant_created',
    'projection_accessed',
    'grant_revoked'
);

CREATE TYPE "SupportPreviewReasonCode" AS ENUM (
    'reported_issue',
    'incident_response',
    'data_correction',
    'quality_assurance'
);

CREATE TABLE "support_preview_grants" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "reasonCode" "SupportPreviewReasonCode" NOT NULL,
    "ticketReferenceDigest" CHAR(64),
    "ticketReferenceRedactedAt" TIMESTAMP(3),
    "reauthenticatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_preview_grants_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "support_preview_grants_expiry_check" CHECK (
        "expiresAt" > "createdAt"
        AND "expiresAt" <= "createdAt" + INTERVAL '15 minutes'
    ),
    CONSTRAINT "support_preview_grants_ticket_digest_check" CHECK (
        "ticketReferenceDigest" IS NULL
        OR "ticketReferenceDigest" ~ '^[0-9a-f]{64}$'
    ),
    CONSTRAINT "support_preview_grants_ticket_redaction_check" CHECK (
        (
            "ticketReferenceDigest" IS NOT NULL
            AND "ticketReferenceRedactedAt" IS NULL
        )
        OR (
            "ticketReferenceDigest" IS NULL
            AND "ticketReferenceRedactedAt" IS NOT NULL
        )
    )
);

CREATE TABLE "support_preview_audit_events" (
    "id" TEXT NOT NULL,
    "grantId" TEXT,
    "actorId" TEXT,
    "targetUserId" TEXT,
    "sessionId" TEXT,
    "reasonCode" "SupportPreviewReasonCode" NOT NULL,
    "type" "SupportPreviewAuditEventType" NOT NULL,
    "anonymizedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_preview_audit_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "support_preview_grants_actorId_expiresAt_idx"
    ON "support_preview_grants"("actorId", "expiresAt");
CREATE INDEX "support_preview_grants_sessionId_targetUserId_expiresAt_idx"
    ON "support_preview_grants"("sessionId", "targetUserId", "expiresAt");
CREATE INDEX "support_preview_grants_expiresAt_idx"
    ON "support_preview_grants"("expiresAt");

CREATE INDEX "support_preview_audit_events_grantId_createdAt_idx"
    ON "support_preview_audit_events"("grantId", "createdAt");
CREATE INDEX "support_preview_audit_events_actorId_createdAt_idx"
    ON "support_preview_audit_events"("actorId", "createdAt");
CREATE INDEX "support_preview_audit_events_actorId_type_createdAt_idx"
    ON "support_preview_audit_events"("actorId", "type", "createdAt");
CREATE INDEX "support_preview_audit_session_target_created_idx"
    ON "support_preview_audit_events"("sessionId", "targetUserId", "createdAt");
CREATE INDEX "support_preview_audit_events_createdAt_idx"
    ON "support_preview_audit_events"("createdAt");

ALTER TABLE "support_preview_grants"
    ADD CONSTRAINT "support_preview_grants_actorId_fkey"
    FOREIGN KEY ("actorId") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "support_preview_grants"
    ADD CONSTRAINT "support_preview_grants_targetUserId_fkey"
    FOREIGN KEY ("targetUserId") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "support_preview_grants"
    ADD CONSTRAINT "support_preview_grants_sessionId_fkey"
    FOREIGN KEY ("sessionId") REFERENCES "sessions"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "support_preview_audit_events"
    ADD CONSTRAINT "support_preview_audit_events_grantId_fkey"
    FOREIGN KEY ("grantId") REFERENCES "support_preview_grants"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "support_preview_audit_events"
    ADD CONSTRAINT "support_preview_audit_events_actorId_fkey"
    FOREIGN KEY ("actorId") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "support_preview_audit_events"
    ADD CONSTRAINT "support_preview_audit_events_targetUserId_fkey"
    FOREIGN KEY ("targetUserId") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "support_preview_audit_events"
    ADD CONSTRAINT "support_preview_audit_events_sessionId_fkey"
    FOREIGN KEY ("sessionId") REFERENCES "sessions"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Application requests may append events only. The two transaction-local
-- flags are narrowly scoped to the reviewed fixture reset and retention /
-- erasure functions. They cannot grant access to a Session projection.
CREATE FUNCTION prevent_support_preview_audit_event_mutation()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE'
       AND current_setting('wepac.support_preview_seed_reset', true) = 'on'
    THEN
        RETURN OLD;
    END IF;

    IF current_setting(
        'wepac.support_preview_retention_maintenance', true
    ) = 'on'
    THEN
        IF TG_OP = 'DELETE' THEN
            RETURN OLD;
        END IF;
        RETURN NEW;
    END IF;

    RAISE EXCEPTION 'support_preview_audit_events are append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER support_preview_audit_events_immutable
BEFORE UPDATE OR DELETE ON "support_preview_audit_events"
FOR EACH ROW EXECUTE FUNCTION prevent_support_preview_audit_event_mutation();
