const POSITIVE_INTEGER = /^[1-9]\d*$/;

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required while Session media is enabled.`);
  return value;
}

function requiredDays(name: string): number {
  const raw = required(name);
  if (!POSITIVE_INTEGER.test(raw)) {
    throw new Error(`${name} must be a positive integer.`);
  }
  const days = Number(raw);
  if (!Number.isSafeInteger(days) || days > 3_650) {
    throw new Error(`${name} is outside the supported retention range.`);
  }
  return days;
}

export function sessionMediaEnabled(): boolean {
  return process.env.SESSION_MEDIA_ENABLED === "true";
}

export function sessionRecordingEnabled(): boolean {
  return (
    sessionMediaEnabled() &&
    process.env.SESSION_RECORDING_ENABLED === "true"
  );
}

export function sessionTranscriptionEnabled(): boolean {
  return (
    sessionMediaEnabled() &&
    process.env.SESSION_TRANSCRIPTION_ENABLED === "true"
  );
}

export function sessionDocumentPublicationEnabled(): boolean {
  return (
    sessionMediaEnabled() &&
    process.env.SESSION_RESULT_DOCUMENT_PUBLICATION_ENABLED === "true"
  );
}

export function jitsiJwtEnabled(): boolean {
  return sessionMediaEnabled() && process.env.JITSI_JWT_ENABLED === "true";
}

export function consentPolicyVersion(): string {
  return required("SESSION_MEDIA_CONSENT_POLICY_VERSION");
}

export function retentionDeadline(
  kind: "recording" | "transcript" | "document",
  from = new Date(),
): Date {
  const variable = {
    recording: "SESSION_RECORDING_RETENTION_DAYS",
    transcript: "SESSION_TRANSCRIPT_RETENTION_DAYS",
    document: "SESSION_RESULT_DOCUMENT_RETENTION_DAYS",
  }[kind];
  const deadline = new Date(from);
  deadline.setUTCDate(deadline.getUTCDate() + requiredDays(variable));
  return deadline;
}

export function recordingStorageRoot(): string {
  return required("SESSION_RECORDING_STORAGE_ROOT");
}

export function recordingControlConfig(): {
  url: string;
  token: string;
} {
  return {
    url: required("SESSION_RECORDING_CONTROL_URL"),
    token: required("SESSION_RECORDING_CONTROL_TOKEN"),
  };
}

export function hubTranscriptionConfig(): {
  url: string;
  apiKey: string;
  workflowId: string;
  contractVersion: string;
} {
  return {
    url: required("HUB_TRANSCRIPTION_API_URL"),
    apiKey: required("HUB_TRANSCRIPTION_API_KEY"),
    workflowId: required("HUB_TRANSCRIPTION_WORKFLOW_ID"),
    contractVersion: required("HUB_TRANSCRIPTION_CONTRACT_VERSION"),
  };
}

export function jitsiJwtConfig(): {
  appId: string;
  secret: string;
  issuer: string;
  audience: string;
  baseUrl: string;
} {
  return {
    appId: required("JITSI_JWT_APP_ID"),
    secret: required("JITSI_JWT_SECRET"),
    issuer: process.env.JITSI_JWT_ISSUER?.trim() || "wepac",
    audience: process.env.JITSI_JWT_AUDIENCE?.trim() || "jitsi",
    baseUrl: required("MEETING_BASE_URL"),
  };
}

export function callbackSecret(
  source: "jibri" | "hub_transcription",
): string {
  return required(
    source === "jibri"
      ? "JIBRI_CALLBACK_SECRET"
      : "HUB_TRANSCRIPTION_CALLBACK_SECRET",
  );
}

export function callbackMaxSkewSeconds(): number {
  const raw = process.env.SESSION_MEDIA_CALLBACK_MAX_SKEW_SECONDS?.trim() || "300";
  if (!POSITIVE_INTEGER.test(raw)) {
    throw new Error("SESSION_MEDIA_CALLBACK_MAX_SKEW_SECONDS is invalid.");
  }
  return Math.min(Number(raw), 900);
}
