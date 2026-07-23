-- Additive Session media, consent, transcript and published-result contract.
-- Release B contraction is deliberately not part of this migration.

CREATE TYPE "SessionConsentPurpose" AS ENUM (
  'recording',
  'transcription',
  'ai_debrief'
);

CREATE TYPE "SessionConsentDecision" AS ENUM (
  'granted',
  'denied',
  'withdrawn'
);

CREATE TYPE "ConsentCapacityStatus" AS ENUM (
  'unknown',
  'adult_verified',
  'guardian_verified'
);

CREATE TYPE "SessionRecordingStatus" AS ENUM (
  'requested',
  'recording',
  'finalizing',
  'ready',
  'failed',
  'deleted'
);

CREATE TYPE "RecordingAssetStatus" AS ENUM (
  'pending',
  'ready',
  'failed',
  'deleted'
);

CREATE TYPE "TranscriptArtifactSource" AS ENUM ('manual', 'recording');

CREATE TYPE "TranscriptArtifactStatus" AS ENUM (
  'pending',
  'processing',
  'ready',
  'failed',
  'deleted'
);

CREATE TYPE "SessionMediaCallbackSource" AS ENUM (
  'jibri',
  'hub_transcription'
);

CREATE TYPE "SessionArtifactAuditType" AS ENUM (
  'consent_recorded',
  'recording_requested',
  'recording_started',
  'recording_stopped',
  'recording_ready',
  'recording_failed',
  'recording_downloaded',
  'transcript_requested',
  'transcript_ready',
  'transcript_failed',
  'transcript_viewed',
  'transcript_downloaded',
  'debrief_generated',
  'document_previewed',
  'document_published',
  'document_viewed',
  'document_downloaded',
  'document_revoked',
  'artifact_erased',
  'callback_rejected'
);

ALTER TYPE "NotificationType" ADD VALUE 'session_result_published';

CREATE TABLE "session_consent_capacity_assurances" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "subjectUserId" TEXT,
  "status" "ConsentCapacityStatus" NOT NULL,
  "evidenceRef" TEXT,
  "policyVersion" TEXT NOT NULL,
  "verifiedAt" TIMESTAMP(3) NOT NULL,
  "verifiedByUserId" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "session_consent_capacity_assurances_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "session_capacity_evidence_contract_check" CHECK (
    length("policyVersion") BETWEEN 1 AND 100
    AND (
      ("status" = 'unknown' AND "evidenceRef" IS NULL)
      OR (
        "status" = 'adult_verified'
        AND "evidenceRef" IS NOT NULL
        AND length("evidenceRef") BETWEEN 8 AND 200
        AND "evidenceRef" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]+$'
      )
    )
    AND length("idempotencyKey") BETWEEN 1 AND 200
    AND "idempotencyKey" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$'
  )
);

CREATE UNIQUE INDEX "session_consent_capacity_assurances_idempotencyKey_key"
  ON "session_consent_capacity_assurances"("idempotencyKey");
CREATE INDEX "session_capacity_session_subject_verified_idx"
  ON "session_consent_capacity_assurances"("sessionId", "subjectUserId", "verifiedAt");

CREATE TABLE "session_consent_events" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "subjectUserId" TEXT,
  "actorUserId" TEXT,
  "purpose" "SessionConsentPurpose" NOT NULL,
  "decision" "SessionConsentDecision" NOT NULL,
  "policyVersion" TEXT NOT NULL,
  "capacityAssuranceId" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "session_consent_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "session_consent_policy_contract_check" CHECK (
    length("policyVersion") BETWEEN 1 AND 100
    AND length("idempotencyKey") BETWEEN 1 AND 200
    AND "idempotencyKey" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$'
  )
);

CREATE UNIQUE INDEX "session_consent_events_idempotencyKey_key"
  ON "session_consent_events"("idempotencyKey");
CREATE INDEX "session_consent_events_current_idx"
  ON "session_consent_events"("sessionId", "subjectUserId", "purpose", "occurredAt");

CREATE TABLE "session_recordings" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "recordingId" TEXT NOT NULL,
  "canonicalRoom" TEXT NOT NULL,
  "status" "SessionRecordingStatus" NOT NULL DEFAULT 'requested',
  "requestedById" TEXT,
  "requestIdempotencyKey" TEXT NOT NULL,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "startedAt" TIMESTAMP(3),
  "stoppedAt" TIMESTAMP(3),
  "readyAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  "failureCode" TEXT,
  "lastEventAt" TIMESTAMP(3),
  "lastSequence" INTEGER NOT NULL DEFAULT 0,
  "retainUntil" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "session_recordings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "session_recording_identity_check" CHECK (
    "recordingId" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$'
    AND "canonicalRoom" ~ '^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$'
    AND length("requestIdempotencyKey") BETWEEN 1 AND 200
    AND "requestIdempotencyKey" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$'
    AND ("failureCode" IS NULL OR length("failureCode") <= 100)
    AND "lastSequence" >= 0
  )
);

CREATE UNIQUE INDEX "session_recordings_recordingId_key"
  ON "session_recordings"("recordingId");
CREATE UNIQUE INDEX "session_recordings_requestIdempotencyKey_key"
  ON "session_recordings"("requestIdempotencyKey");
CREATE INDEX "session_recordings_session_status_created_idx"
  ON "session_recordings"("sessionId", "status", "createdAt");

CREATE TABLE "recording_consent_evidence" (
  "id" TEXT NOT NULL,
  "recordingId" TEXT NOT NULL,
  "consentEventId" TEXT NOT NULL,
  CONSTRAINT "recording_consent_evidence_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "recording_consent_evidence_recording_consent_key"
  ON "recording_consent_evidence"("recordingId", "consentEventId");

CREATE TABLE "recording_assets" (
  "id" TEXT NOT NULL,
  "recordingId" TEXT NOT NULL,
  "status" "RecordingAssetStatus" NOT NULL DEFAULT 'pending',
  "objectKey" TEXT,
  "sha256" TEXT,
  "bytes" BIGINT,
  "durationSeconds" INTEGER,
  "mimeType" TEXT,
  "readyAt" TIMESTAMP(3),
  "retainUntil" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "recording_assets_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "recording_asset_private_key_check" CHECK (
    "objectKey" IS NULL OR (
      length("objectKey") BETWEEN 1 AND 1024
      AND "objectKey" !~ '(^/|^[A-Za-z][A-Za-z0-9+.-]*://|(^|/)\.\.(/|$)|\\)'
      AND position(chr(0) in "objectKey") = 0
    )
  ),
  CONSTRAINT "recording_asset_integrity_check" CHECK (
    ("sha256" IS NULL OR "sha256" ~ '^[0-9a-f]{64}$')
    AND ("bytes" IS NULL OR "bytes" >= 0)
    AND ("durationSeconds" IS NULL OR "durationSeconds" >= 0)
    AND ("mimeType" IS NULL OR length("mimeType") BETWEEN 1 AND 100)
    AND (
      "status" <> 'ready'
      OR (
        "objectKey" IS NOT NULL
        AND "sha256" IS NOT NULL
        AND "bytes" IS NOT NULL
        AND "mimeType" IS NOT NULL
        AND "readyAt" IS NOT NULL
      )
    )
  )
);

CREATE UNIQUE INDEX "recording_assets_objectKey_key"
  ON "recording_assets"("objectKey");
CREATE INDEX "recording_assets_recording_status_idx"
  ON "recording_assets"("recordingId", "status");

CREATE TABLE "transcript_artifacts" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "recordingAssetId" TEXT,
  "providerTranscriptId" TEXT,
  "source" "TranscriptArtifactSource" NOT NULL,
  "status" "TranscriptArtifactStatus" NOT NULL DEFAULT 'pending',
  "revision" INTEGER NOT NULL,
  "text" TEXT,
  "language" TEXT,
  "createdById" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "readyAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  "failureCode" TEXT,
  "sourceSha256" TEXT,
  "lastEventAt" TIMESTAMP(3),
  "lastSequence" INTEGER NOT NULL DEFAULT 0,
  "retainUntil" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "transcript_artifacts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "transcript_artifact_lifecycle_check" CHECK (
    "revision" > 0
    AND "lastSequence" >= 0
    AND length("idempotencyKey") BETWEEN 1 AND 200
    AND "idempotencyKey" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$'
    AND (
      "providerTranscriptId" IS NULL
      OR "providerTranscriptId" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$'
    )
    AND ("sourceSha256" IS NULL OR "sourceSha256" ~ '^[0-9a-f]{64}$')
    AND ("failureCode" IS NULL OR length("failureCode") <= 100)
    AND ("language" IS NULL OR length("language") <= 35)
    AND (
      "status" <> 'ready'
      OR ("text" IS NOT NULL AND "readyAt" IS NOT NULL)
    )
    AND (
      "source" <> 'recording'
      OR "recordingAssetId" IS NOT NULL
    )
  )
);

CREATE UNIQUE INDEX "transcript_artifacts_providerTranscriptId_key"
  ON "transcript_artifacts"("providerTranscriptId");
CREATE UNIQUE INDEX "transcript_artifacts_idempotencyKey_key"
  ON "transcript_artifacts"("idempotencyKey");
CREATE UNIQUE INDEX "transcript_artifacts_session_revision_key"
  ON "transcript_artifacts"("sessionId", "revision");
CREATE INDEX "transcript_artifacts_session_status_created_idx"
  ON "transcript_artifacts"("sessionId", "status", "createdAt");

CREATE TABLE "session_result_documents" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "attendeeId" TEXT NOT NULL,
  "sourceDebriefId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "rendererVersion" TEXT NOT NULL,
  "contentHtml" TEXT,
  "contentSha256" TEXT NOT NULL,
  "publishedById" TEXT,
  "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt" TIMESTAMP(3),
  "erasedAt" TIMESTAMP(3),
  "retainUntil" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "session_result_documents_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "session_result_document_snapshot_check" CHECK (
    "version" > 0
    AND length("rendererVersion") BETWEEN 1 AND 100
    AND "contentSha256" ~ '^[0-9a-f]{64}$'
    AND ("revokedAt" IS NULL OR "revokedAt" >= "publishedAt")
    AND ("erasedAt" IS NULL OR "erasedAt" >= "publishedAt")
    AND (
      ("erasedAt" IS NULL AND "contentHtml" IS NOT NULL)
      OR ("erasedAt" IS NOT NULL AND "contentHtml" IS NULL)
    )
  )
);

CREATE UNIQUE INDEX "session_result_documents_session_attendee_version_key"
  ON "session_result_documents"("sessionId", "attendeeId", "version");
CREATE UNIQUE INDEX "session_result_documents_session_attendee_hash_key"
  ON "session_result_documents"("sessionId", "attendeeId", "contentSha256");
CREATE INDEX "session_result_documents_attendee_published_idx"
  ON "session_result_documents"("attendeeId", "publishedAt");

CREATE TABLE "session_media_callback_events" (
  "id" TEXT NOT NULL,
  "source" "SessionMediaCallbackSource" NOT NULL,
  "eventId" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "bodySha256" TEXT NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "session_media_callback_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "session_media_callback_digest_check" CHECK (
    "bodySha256" ~ '^[0-9a-f]{64}$'
    AND length("eventId") BETWEEN 1 AND 200
    AND "eventId" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$'
    AND length("idempotencyKey") BETWEEN 1 AND 200
    AND "idempotencyKey" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$'
  )
);

CREATE UNIQUE INDEX "session_media_callback_events_idempotencyKey_key"
  ON "session_media_callback_events"("idempotencyKey");
CREATE UNIQUE INDEX "session_media_callback_events_source_event_key"
  ON "session_media_callback_events"("source", "eventId");
CREATE INDEX "session_media_callback_events_source_occurred_idx"
  ON "session_media_callback_events"("source", "occurredAt");

CREATE TABLE "session_artifact_audit_events" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "actorUserId" TEXT,
  "subjectUserId" TEXT,
  "type" "SessionArtifactAuditType" NOT NULL,
  "resourceId" TEXT NOT NULL,
  "resourceVersion" INTEGER,
  "reasonCode" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "session_artifact_audit_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "session_artifact_audit_content_free_check" CHECK (
    length("resourceId") BETWEEN 1 AND 200
    AND "resourceId" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$'
    AND (
      "reasonCode" IS NULL
      OR (
        length("reasonCode") BETWEEN 1 AND 100
        AND "reasonCode" ~ '^[a-z][a-z0-9_:-]{0,99}$'
      )
    )
    AND ("resourceVersion" IS NULL OR "resourceVersion" > 0)
  )
);

CREATE INDEX "session_artifact_audit_session_occurred_idx"
  ON "session_artifact_audit_events"("sessionId", "occurredAt");
CREATE INDEX "session_artifact_audit_actor_occurred_idx"
  ON "session_artifact_audit_events"("actorUserId", "occurredAt");

ALTER TABLE "session_consent_capacity_assurances"
  ADD CONSTRAINT "session_capacity_session_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "session_capacity_subject_fkey"
  FOREIGN KEY ("subjectUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "session_capacity_verifier_fkey"
  FOREIGN KEY ("verifiedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "session_consent_events"
  ADD CONSTRAINT "session_consent_session_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "session_consent_subject_fkey"
  FOREIGN KEY ("subjectUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "session_consent_actor_fkey"
  FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "session_consent_capacity_fkey"
  FOREIGN KEY ("capacityAssuranceId") REFERENCES "session_consent_capacity_assurances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "session_recordings"
  ADD CONSTRAINT "session_recording_session_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "session_recording_requester_fkey"
  FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "recording_consent_evidence"
  ADD CONSTRAINT "recording_consent_recording_fkey"
  FOREIGN KEY ("recordingId") REFERENCES "session_recordings"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "recording_consent_event_fkey"
  FOREIGN KEY ("consentEventId") REFERENCES "session_consent_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "recording_assets"
  ADD CONSTRAINT "recording_asset_recording_fkey"
  FOREIGN KEY ("recordingId") REFERENCES "session_recordings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "transcript_artifacts"
  ADD CONSTRAINT "transcript_artifact_session_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "transcript_artifact_recording_asset_fkey"
  FOREIGN KEY ("recordingAssetId") REFERENCES "recording_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "transcript_artifact_creator_fkey"
  FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "session_result_documents"
  ADD CONSTRAINT "session_result_document_session_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "session_result_document_attendee_fkey"
  FOREIGN KEY ("attendeeId") REFERENCES "session_attendees"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "session_result_document_debrief_fkey"
  FOREIGN KEY ("sourceDebriefId") REFERENCES "session_debriefs"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "session_result_document_publisher_fkey"
  FOREIGN KEY ("publishedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "session_artifact_audit_events"
  ADD CONSTRAINT "session_artifact_audit_session_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "session_artifact_audit_actor_fkey"
  FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "session_artifact_audit_subject_fkey"
  FOREIGN KEY ("subjectUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION "wepac_prevent_append_only_mutation"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND current_setting('wepac.session_media_erasure_maintenance', true) = 'on'
     AND (
       (
         TG_TABLE_NAME = 'session_consent_capacity_assurances'
         AND OLD."id" IS NOT DISTINCT FROM NEW."id"
         AND OLD."sessionId" IS NOT DISTINCT FROM NEW."sessionId"
         AND (NEW."subjectUserId" IS NULL OR OLD."subjectUserId" IS NOT DISTINCT FROM NEW."subjectUserId")
         AND OLD."status" IS NOT DISTINCT FROM NEW."status"
         AND OLD."evidenceRef" IS NOT DISTINCT FROM NEW."evidenceRef"
         AND OLD."policyVersion" IS NOT DISTINCT FROM NEW."policyVersion"
         AND OLD."verifiedAt" IS NOT DISTINCT FROM NEW."verifiedAt"
         AND (NEW."verifiedByUserId" IS NULL OR OLD."verifiedByUserId" IS NOT DISTINCT FROM NEW."verifiedByUserId")
         AND OLD."idempotencyKey" IS NOT DISTINCT FROM NEW."idempotencyKey"
         AND OLD."createdAt" IS NOT DISTINCT FROM NEW."createdAt"
       )
       OR (
         TG_TABLE_NAME = 'session_consent_events'
         AND OLD."id" IS NOT DISTINCT FROM NEW."id"
         AND OLD."sessionId" IS NOT DISTINCT FROM NEW."sessionId"
         AND (NEW."subjectUserId" IS NULL OR OLD."subjectUserId" IS NOT DISTINCT FROM NEW."subjectUserId")
         AND (NEW."actorUserId" IS NULL OR OLD."actorUserId" IS NOT DISTINCT FROM NEW."actorUserId")
         AND OLD."purpose" IS NOT DISTINCT FROM NEW."purpose"
         AND OLD."decision" IS NOT DISTINCT FROM NEW."decision"
         AND OLD."policyVersion" IS NOT DISTINCT FROM NEW."policyVersion"
         AND OLD."capacityAssuranceId" IS NOT DISTINCT FROM NEW."capacityAssuranceId"
         AND OLD."idempotencyKey" IS NOT DISTINCT FROM NEW."idempotencyKey"
         AND OLD."occurredAt" IS NOT DISTINCT FROM NEW."occurredAt"
         AND OLD."createdAt" IS NOT DISTINCT FROM NEW."createdAt"
       )
       OR (
         TG_TABLE_NAME = 'session_artifact_audit_events'
         AND OLD."id" IS NOT DISTINCT FROM NEW."id"
         AND OLD."sessionId" IS NOT DISTINCT FROM NEW."sessionId"
         AND (NEW."actorUserId" IS NULL OR OLD."actorUserId" IS NOT DISTINCT FROM NEW."actorUserId")
         AND (NEW."subjectUserId" IS NULL OR OLD."subjectUserId" IS NOT DISTINCT FROM NEW."subjectUserId")
         AND OLD."type" IS NOT DISTINCT FROM NEW."type"
         AND OLD."resourceId" IS NOT DISTINCT FROM NEW."resourceId"
         AND OLD."resourceVersion" IS NOT DISTINCT FROM NEW."resourceVersion"
         AND OLD."reasonCode" IS NOT DISTINCT FROM NEW."reasonCode"
         AND OLD."occurredAt" IS NOT DISTINCT FROM NEW."occurredAt"
         AND OLD."createdAt" IS NOT DISTINCT FROM NEW."createdAt"
       )
     ) THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION '% is append-only', TG_TABLE_NAME;
END;
$$;

CREATE TRIGGER "session_capacity_append_only"
  BEFORE UPDATE OR DELETE ON "session_consent_capacity_assurances"
  FOR EACH ROW EXECUTE FUNCTION "wepac_prevent_append_only_mutation"();

CREATE TRIGGER "session_consent_append_only"
  BEFORE UPDATE OR DELETE ON "session_consent_events"
  FOR EACH ROW EXECUTE FUNCTION "wepac_prevent_append_only_mutation"();

CREATE TRIGGER "session_media_callback_append_only"
  BEFORE UPDATE OR DELETE ON "session_media_callback_events"
  FOR EACH ROW EXECUTE FUNCTION "wepac_prevent_append_only_mutation"();

CREATE TRIGGER "session_artifact_audit_append_only"
  BEFORE UPDATE OR DELETE ON "session_artifact_audit_events"
  FOR EACH ROW EXECUTE FUNCTION "wepac_prevent_append_only_mutation"();

CREATE OR REPLACE FUNCTION "wepac_validate_session_consent_capacity"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  capacity RECORD;
BEGIN
  IF NEW."subjectUserId" IS NULL OR NEW."actorUserId" IS NULL THEN
    RAISE EXCEPTION 'Session consent actor and subject are required';
  END IF;
  IF NEW."actorUserId" <> NEW."subjectUserId" THEN
    RAISE EXCEPTION 'guardian consent is not enabled';
  END IF;
  SELECT "sessionId", "subjectUserId", "status", "policyVersion"
    INTO capacity
    FROM "session_consent_capacity_assurances"
    WHERE "id" = NEW."capacityAssuranceId";
  IF capacity IS NULL
     OR capacity."sessionId" <> NEW."sessionId"
     OR capacity."subjectUserId" <> NEW."subjectUserId"
     OR capacity."status" <> 'adult_verified'
     OR capacity."policyVersion" <> NEW."policyVersion" THEN
    RAISE EXCEPTION 'invalid Session consent capacity evidence';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "session_consent_capacity_match"
  BEFORE INSERT ON "session_consent_events"
  FOR EACH ROW EXECUTE FUNCTION "wepac_validate_session_consent_capacity"();

CREATE OR REPLACE FUNCTION "wepac_validate_session_capacity_insert"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW."subjectUserId" IS NULL OR NEW."verifiedByUserId" IS NULL THEN
    RAISE EXCEPTION 'Session capacity subject and verifier are required';
  END IF;
  IF NEW."status" = 'guardian_verified' THEN
    RAISE EXCEPTION 'guardian capacity is not enabled';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "session_capacity_insert_contract"
  BEFORE INSERT ON "session_consent_capacity_assurances"
  FOR EACH ROW EXECUTE FUNCTION "wepac_validate_session_capacity_insert"();

CREATE OR REPLACE FUNCTION "wepac_validate_session_result_document_links"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  attendee_session TEXT;
  debrief_session TEXT;
  organizer_id TEXT;
BEGIN
  IF NEW."publishedById" IS NULL THEN
    RAISE EXCEPTION 'Session Result Document publisher is required';
  END IF;
  SELECT "sessionId" INTO attendee_session
    FROM "session_attendees" WHERE "id" = NEW."attendeeId";
  SELECT "sessionId" INTO debrief_session
    FROM "session_debriefs" WHERE "id" = NEW."sourceDebriefId";
  SELECT "mentorId" INTO organizer_id
    FROM "sessions" WHERE "id" = NEW."sessionId";
  IF attendee_session IS NULL
     OR attendee_session <> NEW."sessionId"
     OR debrief_session IS NULL
     OR debrief_session <> NEW."sessionId"
     OR organizer_id IS NULL
     OR organizer_id <> NEW."publishedById" THEN
    RAISE EXCEPTION 'invalid Session Result Document ownership links';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "session_result_document_link_contract"
  BEFORE INSERT ON "session_result_documents"
  FOR EACH ROW EXECUTE FUNCTION "wepac_validate_session_result_document_links"();

CREATE OR REPLACE FUNCTION "wepac_protect_session_result_document"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF current_setting('wepac.session_media_erasure_maintenance', true) = 'on'
     AND OLD."publishedById" IS NOT NULL
     AND NEW."publishedById" IS NULL
     AND OLD."sessionId" IS NOT DISTINCT FROM NEW."sessionId"
     AND OLD."attendeeId" IS NOT DISTINCT FROM NEW."attendeeId"
     AND OLD."sourceDebriefId" IS NOT DISTINCT FROM NEW."sourceDebriefId"
     AND OLD."version" IS NOT DISTINCT FROM NEW."version"
     AND OLD."rendererVersion" IS NOT DISTINCT FROM NEW."rendererVersion"
     AND OLD."contentHtml" IS NOT DISTINCT FROM NEW."contentHtml"
     AND OLD."contentSha256" IS NOT DISTINCT FROM NEW."contentSha256"
     AND OLD."publishedAt" IS NOT DISTINCT FROM NEW."publishedAt"
     AND OLD."revokedAt" IS NOT DISTINCT FROM NEW."revokedAt"
     AND OLD."erasedAt" IS NOT DISTINCT FROM NEW."erasedAt"
     AND OLD."retainUntil" IS NOT DISTINCT FROM NEW."retainUntil"
     AND OLD."createdAt" IS NOT DISTINCT FROM NEW."createdAt" THEN
    RETURN NEW;
  END IF;

  IF OLD."sessionId" IS DISTINCT FROM NEW."sessionId"
     OR OLD."attendeeId" IS DISTINCT FROM NEW."attendeeId"
     OR OLD."sourceDebriefId" IS DISTINCT FROM NEW."sourceDebriefId"
     OR OLD."version" IS DISTINCT FROM NEW."version"
     OR OLD."rendererVersion" IS DISTINCT FROM NEW."rendererVersion"
     OR OLD."contentSha256" IS DISTINCT FROM NEW."contentSha256"
     OR OLD."publishedById" IS DISTINCT FROM NEW."publishedById"
     OR OLD."publishedAt" IS DISTINCT FROM NEW."publishedAt"
     OR OLD."retainUntil" IS DISTINCT FROM NEW."retainUntil"
     OR OLD."createdAt" IS DISTINCT FROM NEW."createdAt" THEN
    RAISE EXCEPTION 'published Session Result Document is immutable';
  END IF;

  IF (OLD."revokedAt" IS NOT NULL AND OLD."revokedAt" IS DISTINCT FROM NEW."revokedAt")
     OR (OLD."erasedAt" IS NOT NULL AND OLD."erasedAt" IS DISTINCT FROM NEW."erasedAt")
     OR (OLD."revokedAt" IS NULL AND NEW."revokedAt" IS NOT NULL AND NEW."revokedAt" < OLD."publishedAt")
     OR (OLD."erasedAt" IS NULL AND NEW."erasedAt" IS NOT NULL AND NEW."erasedAt" < OLD."publishedAt") THEN
    RAISE EXCEPTION 'Session Result Document tombstones are set-once';
  END IF;

  IF OLD."contentHtml" IS DISTINCT FROM NEW."contentHtml"
     AND NOT (
       OLD."erasedAt" IS NULL
       AND NEW."erasedAt" IS NOT NULL
       AND NEW."contentHtml" IS NULL
     ) THEN
    RAISE EXCEPTION 'published Session Result Document content is immutable';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "session_result_document_immutable"
  BEFORE UPDATE ON "session_result_documents"
  FOR EACH ROW EXECUTE FUNCTION "wepac_protect_session_result_document"();
