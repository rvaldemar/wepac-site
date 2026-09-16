# Session Support Preview security and retention contract

- Status: Implemented for Release A; production migration and smoke gate pending
- Date: 2026-07-22
- Scope: Organizer and Admin read-only projection of one explicit Session attendee
- Parent architecture: [`domain-graph.md`](domain-graph.md)

## Boundary

`Preview attendee view` is a Session-scoped projection, never impersonation.
The authenticated actor, JWT, role, cookies and mutation authority do not
change. The route renders only fields already selected by the attendee-safe
Session read:

- Session time, duration, derived Individual/Group format, kind and status;
- organizer name;
- that attendee's outcome;
- that attendee's deliberately published shared note.

The projection never selects another attendee's identity, discussion points,
private note, raw Transcript, Debrief draft or organizer-only data. The normal
organizer preview may show the attendee's Session meeting URL because the
attendee can already see it. Admin support deliberately omits the meeting URL
as a stricter scope.

## Organizer capability

The exact `Session.organizerId` may preview only a Person represented by an
explicit `SessionAttendee` row on that Session. Account role, Admin status,
Mentorship, Pack Membership, Cycle Enrollment and Cycle Facilitation never
substitute for organizer ownership or explicit attendance.

Organizer reads emit a content-free operational event. They do not create an
Admin grant and expose no target mutation.

## Admin support gate

An Admin who is not the Session organizer must pass all of these checks:

1. the current account role is re-read as Admin;
2. a structured reason code is selected;
3. a syntactically bounded external ticket reference is supplied;
4. the current local password is re-authenticated server-side;
5. the target remains an explicit attendee of the named Session;
6. a maximum 15-minute, actor/Session/attendee-bound grant is created;
7. a signed `HttpOnly`, `SameSite=Strict`, resource-path-scoped cookie presents
   that exact grant on each read.

The password and raw ticket reference never leave request memory. The durable
grant stores only a keyed digest of the normalized ticket reference. The grant
identifier never appears in a URL, form or log. OAuth-only Admin accounts fail
closed until a provider-specific fresh re-authentication design exists.

Five password failures in 15 minutes block additional attempts for the rest of
that window. Counting, password verification, denial audit and grant creation
are serialized per actor with a PostgreSQL transaction advisory lock. Denials
record no password, raw ticket, target content or request payload.

Expiry, revocation, role change, attendee removal and every actor/resource
mismatch fail closed. `Exit Preview` revokes only the current Admin's exact
cookie-bound grant; it does not mutate the attendee or Session.

## Append-only audit

`SupportPreviewAuditEvent` contains only optional grant, actor, target Person
and Session identifiers, a structured reason code, event type and timestamp.
It stores no name, email, phone, note, Transcript, Debrief, URL or projection
payload.

A database trigger rejects ordinary `UPDATE` and `DELETE`. Foreign keys use
`Restrict`; target records cannot silently cascade away the access history.
Only two reviewed transaction-local maintenance settings can bypass the
trigger:

- disposable guarded fixture seed: audit `DELETE` only;
- retention or Person erasure: the minimum detach/delete operations below.

## Retention and erasure

Retention is executable:

- ticket digests are redacted on the first cycle after the 15-minute grant
  expiry;
- expired grants are deleted after 30 days, after their optional audit link is
  detached;
- content-free audit events are deleted after 365 days.

`npm run support-preview:retention` is dry-run/no-write by default.
`npm run support-preview:retention -- --execute` applies the policy in one
transaction. A failed maintenance-boundary setup aborts before any mutation.

The opt-in in-process worker starts in `src/instrumentation.ts`, runs once on
Node startup and then daily, skips overlapping cycles and logs only aggregate
counts or the error kind:

```dotenv
SUPPORT_PREVIEW_RETENTION_WORKER_ENABLED=true
SUPPORT_PREVIEW_RETENTION_WORKER_INTERVAL_MS=86400000
```

It is disabled by default and is intended only for the current single
long-lived Node process. Its interval is clamped between one hour and seven
days. Disable the flag and restart to roll back the worker; the manual command
remains available for explicit recovery.

Before deleting a Person, the same database transaction removes active grants
touching that Person or one of their organized Sessions and anonymizes the
corresponding audit references. Event identity, timestamp, structured purpose
and type survive. If anonymization or the subsequent Person deletion fails,
the whole transaction rolls back.

## Release gates

- apply migration `20260722150000_support_preview_capability`;
- prove fresh migration replay and upgrade from the pre-migration schema;
- prove the guarded seed can run twice;
- enable the retention worker only on the single persistent Node runtime;
- smoke organizer preview, Admin re-auth, expiry, revoke and no-cache headers;
- inspect the rendered/Admin query shapes for meeting URL, private note,
  Transcript, Debrief and other-attendee leakage;
- verify Person erasure rollback and anonymization behavior;
- keep the two support tables in the Release B preserved-table inventory.
