# Private Session recording, transcription and document sharing

## Authority

- The exact `Session.organizerId` is the only human allowed to read/download a
  recording, Transcript or private Debrief. Admin, Support Preview, role and
  Mentorship do not bypass this boundary.
- An exact attendee receives only an immutable WEPAC-rendered Result Document,
  after the organizer previews and explicitly publishes that exact version.
  The organizer may revoke it.
- Capacity verification is Admin-only, content-free and opaque. It does not
  grant artifact access. Guardian consent is fail-closed until a real
  relationship/grant model exists.

## Consent and call behaviour

`recording`, `transcription` and `ai_debrief` are three append-only consent
purposes. Both exact participants need current adult capacity and current
grants. Refusal never blocks the call; it only blocks media/AI. Withdrawal
requests immediate IFrame `stopRecording`, deletes the corresponding local raw
artifact and erases the Hub resource.

All call links point to `/wepacker/sessions/:id/call`. That page authorizes the
exact organizer/attendee and mints a fresh room-bound JWT. Never put a JWT or
the direct Jitsi room in email, ICS or a participant-facing link.

## Dark launch order

1. Apply the additive Prisma migration; keep every flag false.
2. Provision secrets by name without printing values. Verify `JWT sub` is the
   internal Jitsi virtual host (`meet.jitsi`), while the public base remains
   `https://meet.rvs.solutions`.
3. Start Jibri/callback worker and Hub STT; verify their health and hard
   90-minute/128-MiB limits.
4. Enable `SESSION_MEDIA_ENABLED` + `JITSI_JWT_ENABLED`; smoke exact organizer,
   exact attendee and denied nonparticipant join.
   Re-stage a `session_updated` notification for each future Session whose
   earlier ICS/email contained the direct room; the replacement contains only
   the authenticated WEPAC join URL.
5. Enable recording and transcription together. Run a short synthetic call,
   verify two private assets, Hub content hash, acknowledgement/deletion and
   organizer-only downloads.
6. Enable document publication, preview, exact-attendee view and revocation.

If Jibri/STT fails, keep the call running and show recording unavailable. Do
not enable only one of recording/transcription.

## Retention and recovery

Enable `SESSION_MEDIA_RETENTION_WORKER_ENABLED` only on the single long-lived
WEPAC process. The worker deletes the recording directory before committing
its tombstones, uses aggregate logs only, expires presence/preview capabilities
and erases private Debrief content independently from immutable published
documents.

Set the WEPAC raw-recording retention to 7 days and the Meet host hard-delete
window to 8 days, so WEPAC normally records the tombstone before the
infrastructure safety-net purge. In the current Meet layout,
`SESSION_RECORDING_STORAGE_ROOT=/opt/rvs-meet/jitsi-cfg` is the parent of
`recordings/`; verify that mount and ownership on the target host before
enabling either recording or the retention worker.

Rollback is flags-off first. Do not roll back the additive migration while any
artifact exists. Jibri callbacks are acknowledged with exactly
`{"accepted":true}` only after local persistence and durable Hub acceptance.
