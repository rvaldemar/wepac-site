# WEPAC — Companhia de Artes

Institutional site and **WEPACKER** whole-person development platform. The
canonical product and authorization model is the Person-centred graph in
[`docs/architecture/domain-graph.md`](docs/architecture/domain-graph.md).

## Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS v4, Framer Motion |
| Auth | NextAuth v5 with JWT Sessions |
| Database | PostgreSQL 16, Prisma ORM |
| AI | Anthropic SDK for Wessex chat; Agents Hub seam for Session Debrief |
| Email | Nodemailer |

## Local setup

```bash
npm ci
cp .env.example .env.local
npx prisma migrate dev
WEPACKER_SEED_ALLOW_DB_RESET=1 \
  WEPACKER_SEED_DATABASE_NAME=wepac_local_dev \
  npx prisma db seed
npm run dev
```

The application runs at `http://localhost:3000`.

The seed deletes and rebuilds WEPACKER fixtures. Run it only against a
disposable local or E2E database, never staging or production.

## Repository

```text
src/
├── app/
│   ├── (site)/          public WEPAC site
│   ├── wepacker/        WEPACKER product
│   ├── api/             auth and integration routes
│   └── bilheteira/      ticketing product
├── components/
└── lib/
prisma/
├── schema.prisma
├── seed.ts
├── migrations/          immutable deployed migration history
└── release-b/           reviewed physical contraction artifact
deploy/
└── deploy.sh
```

## WEPACKER domain

- **Person / WEPACker** is the centre of the graph.
- **My Journey** is one whole-life view containing Stage, Life Map, Trails,
  Goals, Actions and explicit Session attendance.
- **Stage** is exactly Easy Peasy, Step Up or YUP.
- **Action** belongs directly to its assignee Person; cross-Person assignment is
  disabled until an explicit acceptance flow exists.
- **Mentorship** is a directed relationship and initially authorizes only the
  minimum identity discovery and explicit Sessions.
- **Pack** means a real community only; Pack Membership never grants private
  Journey access.
- **Cycle** is a time-bounded Academy experience with separate Enrollment and
  Facilitation edges and an optional Discipline.
- **Session** has one organizer and explicit Person attendees. Individual or
  Group presentation is derived from attendee count.
- **Support Preview** is a read-only projection of one explicit attendee's
  Session view. Exact organizers use their resource capability; Admin support
  requires fresh password re-authentication and a 15-minute audited grant. It
  never impersonates the Person or exposes the Admin to the meeting URL.
- **Six Pillars** are Physical, Emotional, Character, Spiritual, Intellectual
  and Social. Arts is a Discipline, not a seventh Pillar.
- **Session Transcript** is organizer-private text. The original attached file
  is not retained, and replacing it invalidates its derived Debrief.
- **Session Debrief** is disabled until the WEPAC-owned W01 v3 Playbook passes
  Hub certification. There is no direct-model fallback.

Public WEPACKER intake is generic at `/wepacker/intake`. It creates an
application only; it never creates Pack Membership, Cycle Enrollment or
Mentorship.

## Validation

```bash
npx prisma validate
npx prisma generate
npm test
npx tsc --noEmit
npm run lint
npm run build
npm run test:e2e:build
```

The E2E suite reseeds its configured database. `E2E_ALLOW_DB_RESET=1` must never
be used with a non-disposable database.

## Releases

`deploy/deploy.sh` builds locally, uploads an immutable release and runs Prisma
migrations before switching the live application. The retired physical delivery
contract is therefore removed in two operational releases:

1. Release A ships the target runtime with no retired reads, writes, routes or
   authorization fallbacks.
2. Release B runs the reviewed contraction only after the Release A stability
   gate and a verified backup/restore drill.

See [`legacy-contract-removal.md`](docs/architecture/legacy-contract-removal.md)
for the deletion allowlist and gates. Consult `OPS_LOG.md` before production
diagnosis or deployment. The Support Preview audit, retention and erasure
boundary is documented in
[`support-preview-audit-plan.md`](docs/architecture/support-preview-audit-plan.md).
Transactional in-app and email coverage, authorization and worker operations
are documented in
[`notifications.md`](docs/operations/notifications.md).

## Conventions

- Canonical product and domain terms are English; supporting prose may be PT-PT.
- Colours: `#000`, `#FFF`, `#DEE0DB`.
- Typography: Barlow Bold for headings, Inter for body copy.
- Code, comments and commits are English.
