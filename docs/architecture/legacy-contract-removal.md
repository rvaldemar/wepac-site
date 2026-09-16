# ADR: Remove the legacy delivery contract

- Status: Accepted
- Date: 2026-07-22
- Scope: WEPACKER legacy data model, runtime compatibility, and production contraction
- Decision owner: Rui Santos
- Parent architecture: `domain-graph.md`

## Decision

WEPACKER will remove the complete legacy delivery contract and its production
data. Legacy records will not be backfilled, relabelled, inferred, or preserved
as target domain records.

The deleted contract is:

```text
legacy Pack -> Cohort -> CohortMembership
                         -> Task
```

The old Assessment instrument and `StrategicMapScore` are part of the same
retired delivery model and are deleted as well.

This decision does not authorize deletion of target Person data, authentication,
Mentorships, explicit Session attendance, Life Map, Trails, Strategic Plans,
Goals, community Packs, Leads, applications, Messages, Ticketing, Payments,
consent, or audit records.

## Target model

The replacement is a graph, not another containment hierarchy:

```text
Person
  -> Life Map
  -> Trails
  -> Goals
  -> Actions
  -> explicit Session attendance

Person -> Mentorship -> Person
Person -> Pack Membership -> Pack
Person -> Cycle Enrollment -> Cycle -> optional Discipline
Person -> Cycle Facilitator -> Cycle
```

Rules:

- `Pack` means community only.
- `Membership` means Pack Membership only.
- `Cycle` is a time-bounded delivery experience.
- `Discipline` is a practice lens such as Arts.
- `Action` belongs directly to its assignee Person. It never belongs to a Pack
  Membership, Cycle Enrollment, or Mentorship.
- Cross-Person Action assignment remains disabled until WEPACKER implements an
  explicit Action grant and acceptance flow.
- A Session derives Individual or Group presentation from explicit attendee
  count. Pack, Cycle, or Mentorship context never adds attendees.
- No shared Pack or Cycle relationship grants access to Journey artifacts.
- A future Assessment requires a versioned Stage/Discipline instrument and a
  resource-specific grant. No Assessment is an onboarding gate.

## Objects removed

Application and schema contraction removes:

- legacy `Pack`, `Cohort`, and `CohortMembership`;
- `MemberLevel`, `MemberPhase`, `CohortStatus`, `MembershipRole`, and
  `MembershipStatus`;
- legacy `Task`, Task-only Comments, and Task notifications;
- `Evaluation`, `EvaluationScore`, `EvaluationType`, and `EvaluationMoment`;
- `StrategicMapScore`;
- Session `cohortId`, stored `sessionType`, deprecated shared `notes`, and
  `notesPublished`;
- legacy Pack/Cohort authorization and candidate-discovery fallbacks;
- the global `mentor` account-role value; Mentor and Mentee are expressed only
  by an explicitly accepted `Mentorship` edge;
- Pack-scoped Assessment instruments and routes;
- Pack/Cohort/Membership administration;
- `BetaSignup.packSlug` and dynamic Pack application routing.
- pre-v3 `SessionDebrief` rows, which have no trustworthy target contract
  discriminator;
- the old Debrief payload columns `internalEvaluation` and
  `resultDocumentHtml`; v3 uses validated `internalSynthesis` JSON and never
  stores model-authored HTML.

Historic migrations remain immutable evidence of previously deployed schemas.
No applied migration is rewritten.

## Objects retained or replaced

- The existing `community_packs` table becomes the canonical Prisma `Pack`.
- A real `Discipline` and `Cycle` are introduced.
- `CycleEnrollment` and `CycleFacilitator` point to `Cycle`, never Cohort.
- `Action` replaces both legacy Task and the overlapping Monthly Action concept.
- Life Plan is presented and addressed in code as Life Map while its physical
  table can be renamed in a later, non-semantic migration.
- `PillarKey` replaces the technical `AreaKey` name while retaining exactly the
  six universal Pillars.
- Session organizer semantics replace mentor-as-container semantics.
- Public WEPACKER intake remains generic. A future application to a specific
  Cycle must use a separate `CycleApplication` contract.

## No-backfill rule

Production legacy data is deliberately disposable for this contraction. The
migration must still preserve every out-of-scope table and must detach target
Session records before dropping legacy foreign keys. In particular:

- do not cascade-delete Sessions through Cohort;
- do not delete Session Attendees or a v3 Session Debrief merely because legacy
  context existed; pre-v3 Debriefs are deleted only by the explicit version
  allowlist above;
- purge dangling Task notification/outbox intents before dropping Tasks;
- never cascade-delete consent or audit records;
- do not reset, reseed, or recreate the shared production database.

## Two-release production contract

The deployment script applies migrations before switching the application
symlink. A destructive migration therefore cannot be shipped in the same first
release that removes runtime reads.

### Release A: runtime cutover

Operator procedure: [`Release A target-runtime cutover runbook`](../operations/release-a-runtime-cutover.md).

- Introduce target Discipline, Cycle, and Action structures with a forward-safe
  migration.
- Remove every runtime read, write, guard, UI route, and authorization fallback
  that depends on the legacy model.
- Convert existing `users.role = 'mentor'` rows to the neutral `member`
  account capability while recording them in the temporary physical
  `_legacyMentorAccountRole` rollback marker. Keep the enum value and marker
  temporarily so the previous runtime can be restored without inference.
- Leave the physical legacy tables and contract columns present but unused.
- Keep all AI processing disabled and do not publish or cut over W01.
- Verify the running release produces no legacy-table queries or writes.
- Complete a fresh backup and restore drill.

### Release B: physical contraction

Operator procedure: [`Release B legacy-domain contraction runbook`](../operations/release-b-legacy-contraction.md).

- Update backup spot-check tables before contraction.
- Preserve a verified pre-contract database artifact outside short rotation.
- Apply one explicit transactional migration that drops only the inventoried
  legacy objects and columns.
- Rebuild `UserRole` as exactly `member|admin` after proving no `mentor` rows
  remain, then remove the Release A rollback marker.
- Prove row-count parity for every preserved table.
- Run a fresh post-contract backup/restore check.

Release B rollback requires restoring the pre-contract database backup and the
Release A application. A symlink rollback alone is insufficient.

## Hub and W01 boundary

This domain contraction does not activate Agents Hub.

The unpublished Debrief v2 contract is retired because it contains legacy
`tasks` and `pack_context`. The WEPAC-owned Playbook must use the versioned v3
contract:

- `actions`, never Tasks;
- optional `discipline_context`, never legacy Pack context;
- `internal_synthesis.pillar_observations`, never the removed Assessment model;
- generation-only proposals;
- no Action creation, WEPAC write, approval, email, notification, or member
  delivery in Hub.

No W01 publication or runtime cutover occurs until the v3 contract is validated
with synthetic data and Hub later proves its service-principal, Claude
Subscription, tenant isolation, retention, and production E2E gates.

## Release gates

Both releases require:

- an exact deletion allowlist and preserved-table denylist;
- no runtime references to the legacy contract;
- Prisma validation and generation;
- full migration replay from an empty database;
- an upgrade test from the current production schema in a disposable database;
- preserved-table row-count parity;
- idempotent seed against a disposable local database only;
- unit tests, TypeScript, lint, build, and production-build E2E;
- independent Product, Architecture, Security/Data, and Operations votes;
- production smoke tests and a content-safe journal scan.

The contract is complete only when the physical legacy objects are absent,
target runtime paths are green, backups remain green, and no product surface
uses the word `Legacy`.
