# Transactional notifications and email

WEPACKER uses one recipient-specific, content-free `Notification` ledger and a
durable `EmailOutbox`. Every supported event stages the in-app row and email
intent in the same database transaction as its domain transition. Email is
attempted only after commit; the worker recovers pending, failed and stale
processing rows with bounded retries.

## Coverage matrix

| Event | Actor -> recipients | In-app | Email | Trigger and delivery rule |
| --- | --- | --- | --- | --- |
| `pack_invited` | personal Pack owner -> invitee | Yes | Yes | Explicit invitation; re-checks owner, inviter, recipient and `invited` status. A target decline is terminal and suppresses both retry and future re-invitation. |
| `pack_accepted` | accepting Person -> personal Pack owner | Yes | Yes | Explicit acceptance; re-checks active Membership and both endpoints. |
| `connection_requested` | requester -> other endpoint | Yes | Yes | Explicit request; re-checks both People and pending consent. A target decline writes a terminal block and cannot be reopened by the requester. |
| `connection_accepted` | accepting Person -> original requester | Yes | Yes | Explicit acceptance; re-checks both People and active consent. |
| `mentorship_invited` | Mentor -> invited Mentee | Yes | Yes | Exact-email invitation with a non-enumerating response; re-checks directed pending consent. |
| `mentorship_accepted` | accepting Mentee -> Mentor | Yes | Yes | Both acceptances and activation must still exist. Decline/revocation sends no new event. |
| `session_scheduled` | organizer -> organizer and explicit attendees | Yes | Yes + private ICS | Created through the UI or signed Cal.com `BOOKING_CREATED`. |
| `session_updated` | organizer -> organizer and explicit attendees | Yes | Yes + private ICS | Schedule, duration, kind, meeting link, or signed `BOOKING_RESCHEDULED` change. |
| `session_cancelled` | organizer -> organizer and explicit attendees | Yes | Yes + private ICS | UI or signed Cal.com `BOOKING_CANCELLED`. |
| `session_followup_updated` | organizer -> exact attendee | Yes | Yes | First publication, edit while published, visibility transition, or outcome change. `privateNote` and `attended` never notify. |
| `new_message` | author -> every other explicit Conversation participant | Yes | Yes | First message in a rolling 30-minute author/Conversation burst. The debounce applies to both channels. |

Session calendar email is generated separately for each recipient. Its ICS
contains only that Person, never the organizer or another attendee.

## Security and consistency contract

- Ledger and outbox rows contain identifiers, event type, route, hashes,
  resource version and delivery metadata only. They never contain message
  bodies, notes, names, email addresses or rendered templates.
- Delivery re-reads the exact resource and relationship immediately before
  rendering. Account `role` never substitutes for Pack, Connection,
  Mentorship, Session or Conversation authority.
- Session calendar changes and attendee follow-up revisions are
  latest-transition-wins for email. A newer transition atomically supersedes
  older pending, processing or failed intents; old in-app history remains.
- Every calendar-affecting transition increments `Session.calendarRevision`
  in the domain transaction and copies it to `Notification.resourceVersion`
  and ICS `SEQUENCE`. Delivery rejects any intent whose revision is no longer
  current, so transaction-start timestamp ties or reversed commit order cannot
  make a calendar client ignore a later REQUEST/CANCEL.
- Session and follow-up writes lock the exact row before comparing state.
  Message burst detection takes a transaction-scoped author/Conversation
  advisory lock, checks for the prior burst before inserting the current row,
  and uses PostgreSQL `clock_timestamp()` rather than transaction-start time.
- A claimed row is marked sent with a compare-and-set on its processing lock.
  If a newer transition supersedes it during delivery, the old row remains
  superseded and is never retried.
- SMTP is an external system and cannot commit atomically with PostgreSQL. A
  state transition that races after the final authorization read may occur
  after SMTP has accepted the older email; the durable row still remains
  superseded and the latest transition is delivered normally.

## Operations

Immediate post-commit dispatch is best effort. Enable the recovery worker only
on the single long-lived Node runtime:

```text
NOTIFICATION_OUTBOX_WORKER_ENABLED=true
NOTIFICATION_OUTBOX_WORKER_INTERVAL_MS=60000
NOTIFICATION_OUTBOX_WORKER_BATCH_SIZE=25
```

The batch size is clamped to 1-100. An authenticated Admin can also invoke
`POST /api/wepacker/notifications/dispatch` for bounded recovery. Inspect only
content-free status, attempt, error-kind and SMTP-code metadata; never add
domain content to worker logs.

Before enabling in production, apply the notification migration, restart the
single current runtime, create one synthetic event of each enabled class, and
confirm both the recipient's in-app ledger and email. For Session tests, also
confirm one-recipient ICS isolation, reschedule idempotency and cancellation.
