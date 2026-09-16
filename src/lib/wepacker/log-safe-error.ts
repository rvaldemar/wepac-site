// SMTP rejections routinely embed the recipient address in the server
// response line, so raw err.message must never reach the logs (GDPR).
// Log only the error class and, when present, the SMTP response code.
// Shared by every best-effort email fan-out (session calendar invites,
// shared-note/message member notifications) so the scrubbing rule
// lives in exactly one place.
export function logSafeError(err: unknown): { kind: string; smtpCode: number | null } {
  return {
    kind: err instanceof Error ? err.name : "unknown",
    smtpCode:
      typeof (err as { responseCode?: unknown })?.responseCode === "number"
        ? ((err as { responseCode: number }).responseCode)
        : null,
  };
}
