# CLAUDE.md

## Project

WEPAC — Companhia de Artes. This repository contains the institutional site,
WEPACKER and ticketing. The canonical WEPACKER source is
`docs/architecture/domain-graph.md`: one Person/WEPACker, one lifelong My
Journey and independent relationship, community and Academy edges.

Read `docs/architecture/legacy-contract-removal.md` before changing the data
model or production release process. Do not reintroduce retired delivery
containers, compatibility routes, authorization fallbacks or inferred target
records.

## Stack

- Next.js 16.1.6, React 19.2.3 and TypeScript
- Tailwind CSS v4 and Framer Motion
- NextAuth v5 beta.30, Credentials provider and JWT Sessions
- PostgreSQL 16 and Prisma 6.19.2
- Nodemailer
- Anthropic SDK for Wessex chat only
- Agents Hub seam for Session Debrief, disabled until W01 v3 certification

## Development

```bash
npm ci
npx prisma migrate dev
WEPACKER_SEED_ALLOW_DB_RESET=1 \
  WEPACKER_SEED_DATABASE_NAME=wepac_local_dev \
  npx prisma db seed
npm run dev
npm test
npx tsc --noEmit
npm run lint
npm run build
npm run test:e2e:build
```

The seed and Playwright suite reset WEPACKER fixtures. The seed itself requires
an explicit reset capability, a loopback host and a disposable database name;
manual runs also require the exact database-name confirmation. Never weaken
this executable guard or point it at staging/production.

After integrating a Prisma migration from a worktree, run `npx prisma generate`
again in the receiving worktree.

## Environment

See `.env.example`.

- `DATABASE_URL`, `NEXTAUTH_SECRET`, `AUTH_URL`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, `APP_URL`
- `UPLOAD_DIR` for persistent ticketing uploads
- `MEETING_BASE_URL` for generated Session rooms
- `CALCOM_WEBHOOK_SECRET` for the timing-safe Cal.com capability
- `NOTIFICATION_OUTBOX_WORKER_ENABLED` and interval/batch size; enable only on
  the single long-lived Node runtime after the notification migration and
  smoke gate in `docs/operations/notifications.md`
- `MENTORSHIP_WRITES_ENABLED`; keep false until the minor-consent gate is ready
- `DEBRIEF_ENGINE`; keep `disabled` until certified Hub cutover
- `SUPPORT_PREVIEW_RETENTION_WORKER_ENABLED` and interval; disabled by default,
  enable only on the single long-lived Node runtime after the migration and
  smoke gate in `docs/architecture/support-preview-audit-plan.md`
- Session media/Jitsi JWT flags are dark by default. Raw recording,
  transcription and private Debrief access is exact-organizer-only; an exact
  attendee sees only an explicitly published Result Document. Follow
  `docs/operations/session-media-private-recording.md` for migration, callback,
  retention, reinvite and staged-enablement gates.

W01 uses Claude Subscription inside Agents Hub. WEPACKER must never use an
`ANTHROPIC_API_KEY` for Session Debrief. After Hub certification, its dedicated
runtime references are `HUB_API_URL`, `HUB_DEBRIEF_API_KEY`,
`HUB_DEBRIEF_PLAYBOOK_ID` and `HUB_DEBRIEF_CONTRACT_VERSION`.

The public Wessex chat has a separate existing `direct|hub` engine seam. Do not
confuse its generic Hub credential with the release-bound W01 credential.

## WEPACKER routes

- Public: `/wepacker`, `/wepacker/intake`, login, reset and invite
- Onboarding: welcome, agreement
- My Journey: dashboard, Basecamp, Life Map, Strategic Plan, Trails, Goals,
  Actions and Sessions
- Relationships: Mentorships and explicit Messages
- Mentor workspace: Mentees and organizer-owned Sessions
- Admin: People, Leads and audited Support Preview

The generic intake creates only a `BetaSignup`. It accepts no Pack, Cycle,
Discipline, Stage or relationship authority.

## Domain and authorization rules

- `User` remains the physical authentication identity; the product subject is a
  Person/WEPACker.
- Global `member|admin` values are account capabilities, not relationship
  proof. Mentor and Mentee exist only on an explicit Mentorship edge.
- My Journey is a projection, not a table, offering or community.
- Stages are exactly Easy Peasy, Step Up and YUP.
- The Six Pillars are exactly Physical, Emotional, Character, Spiritual,
  Intellectual and Social.
- Arts is a Discipline, never a Pillar or Pack.
- Pack means community only. Membership is reserved for Packs.
- Cycle is a time-bounded Academy experience. Enrollment is reserved for Cycles.
- Mentorship is directed and explicitly accepted. Its initial baseline grants
  linked-person discovery and explicit Session operations only.
- Actions are Person-owned. Current writes are self-only.
- Sessions use an explicit organizer and explicit attendees. Format is derived
  from attendee count; Cycle or Mentorship context never adds attendees.
- Raw Transcripts, private notes and draft Debriefs are organizer-only.
- Messages require explicit Conversation participation; no graph edge implies
  contact or read permission.
- Every sensitive server action authorizes the exact resource. UI filtering is
  not a security boundary.
- `Preview attendee view` is read-only and Session-scoped. It never swaps JWT,
  role or actor identity. The exact organizer needs no account-role bypass;
  Admin support requires a short-lived, audited, resource-scoped cookie grant
  and never receives the meeting URL.
- No target Assessment write flow exists. A future instrument must be versioned
  by Stage/Discipline, use only the Six Pillars and have its own grant.
- Session Debrief is W01 v3, Individual-only, generation-only and proposal-only.
  It never writes Actions, sends email or delivers content to a member.

## Release contract

Prisma migrations run before the application symlink changes. Release A must
remain compatible with the previously running process while removing every
retired runtime dependency. Physical contraction is a separately reviewed
Release B operation after backup/restore proof. Do not move
`prisma/release-b/drop_legacy_domain.sql` into `prisma/migrations` prematurely.

Before production diagnosis or deployment, consult `OPS_LOG.md`. Any deploy
touching auth, onboarding, Sessions, Debrief or public intake requires the full
build E2E gate. Preserve unrelated Ticketing, Leads, Users, consent and target
domain data.

`/var/www` remains on the root disk in production. Docker and containerd use
the attached volume at `/mnt/HC_Volume_104391672`; before any container
operation, follow `docs/operations/plano-unificacao-discos.md`.

## Conventions

- Canonical product/domain terms are English; supporting UI prose may be PT-PT.
- Colours: black `#000`, white `#FFF`, accent `#DEE0DB`.
- Typography: Barlow Bold headings, Inter body.
- Code, comments and commits are English.
