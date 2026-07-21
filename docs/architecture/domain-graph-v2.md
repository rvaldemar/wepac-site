# ADR: WEPAC Domain Graph v2

- Status: Accepted
- Date: 2026-07-21
- Scope: WEPACKER product domain, data ownership, relationships, and migration contract
- Supersedes: the `Pack -> Cohort -> CohortMembership` domain hierarchy

## Context

The current platform was built around a delivery hierarchy:

```text
Pack -> Cohort -> CohortMembership
```

That hierarchy conflates four different concepts:

1. a person and their lifelong development;
2. a time-bounded Academy experience;
3. a direct relationship such as mentorship;
4. a real community.

The conflation now causes product and authorization errors. A person can be a
mentee without being enrolled in a cohort, a session attendee without belonging
to a community, and a member of several communities without having several
separate life journeys. Conversely, sharing a cohort must not silently create a
personal relationship or grant access to private development data.

This decision is grounded in the WEPAC Manifesto (`livro.md`, working draft
v0.6) and the following live product decisions:

- a WEPACker is a whole person in lifelong development;
- the Journey runs from 0 to 100 and beyond, and therefore contains Stages;
- the Life Map is the central personal map;
- a person can pursue several Trails throughout life;
- the six Pillars and the learning Arc apply at every scale;
- a Pack is a real community only;
- time-bounded delivery is a Cycle;
- mentorship is a direct, directed relationship;
- Seed, Growth, Signature, and Contribution are not a universal human ladder.

This ADR defines target semantics. It does not authorize a big-bang migration.

## Decision

WEPAC adopts a graph centered on `Person`, presented in the product as a
`WEPACker`. There is no single containment tree for development, relationships,
community, and delivery.

```text
                                  +----------------+
                                  |   Discipline   |
                                  +--------+-------+
                                           |
                                           | optional practice context
                                           v
+-------------+    enrolls in     +--------+-------+
|   Person    |<----------------->|     Cycle      |
| (WEPACker)  |                   +----------------+
+------+------+                           |
       |                                  | optional session context
       |
       | owns / experiences
       v
+------+------+       contains as a whole-life view
| My Journey  |---------------------------------------------+
+------+------+                                             |
       |                                                    |
       +--> Current Stage                                   |
       +--> Life Map                                        |
       +--> Trails                                          |
       +--> Assessments, Tasks, Sessions, Evidence          |
                                                            |
       +----------------------+-----------------------------+
                              |
            +-----------------+------------------+
            |                                    |
            v                                    v
     +------+------+                      +------+------+
     | Person Edges |                      |    Packs    |
     +------+------+                      +------+------+
            |                                    |
            +--> Connection                      +--> Pack Memberships
            +--> directed Mentorship
            +--> Parent / Guardian / Child
            +--> personal labels
```

The edges are independent:

- Cycle Enrollment is not Pack Membership.
- Pack Membership is not a Connection.
- Connection is not Mentorship.
- Mentorship neither requires nor creates a Connection.
- Mentorship is not Cycle Enrollment.
- None of those edges creates a second Journey.
- None of those edges implicitly makes someone a Session attendee.

## Canonical product language

All new product concepts, routes, code identifiers, and domain documentation use
English-first terminology.

| Canonical term | Meaning | Explicitly not |
| --- | --- | --- |
| `Person` | The core domain entity behind an account | A membership record |
| `WEPACker` | Product identity of a Person walking the WEPAC way | A rank or qualification |
| `My Journey` | The Person's single whole-life development view | A database container, paid offering, cohort, or membership |
| `Stage` | Age-calibrated lens within My Journey | A level of merit |
| `Life Map` | The living map answering who I am, where I am, where I am going, why, and what I commit to | A Pack-specific plan |
| `Trail` | A bounded personal transformation pursued by its owner | A Stage or community |
| `Cycle` | A structured Academy experience bounded in time | A Journey or Pack |
| `Cycle Enrollment` | A Person's participation in a Cycle | Pack Membership |
| `Discipline` | A serious practice used to train the six Pillars, such as Arts, Sport, Leadership, or Craft | A seventh Pillar or Pack |
| `Connection` | A consented link between two People | Permission to all personal data |
| `Mentorship` | A directed relationship from Mentor to Mentee | A global user role or inferred cohort link |
| `Pack` | A real community whose members know they belong to it | A Discipline, Cycle, Stage, audience segment, or contact list |
| `Pack Membership` | Accepted belonging to a Pack | Enrollment in an Academy experience |
| `Session` | A scheduled working meeting with explicit attendees | Everyone in a related Pack or Cycle |

`Program`, `Cohort`, and operational uses of `Journey` are retired from the
product language. `Membership` is reserved for Packs; `Enrollment` is reserved
for Cycles.

## Aggregate and entity contracts

### Person / WEPACker

`Person` is the root of the domain graph. Authentication may continue to use the
physical `users` table during migration, but `User` is not the target domain
name.

A Person can simultaneously be a mentee, mentor, parent, guardian, facilitator,
Pack owner, Pack member, and Cycle participant. These are edges and capabilities,
not mutually exclusive identities.

Global account roles are limited to platform operations such as `staff` and
`admin`. A global `mentor` role never proves that one Person may access another
Person's data. In the first v2 slice, an active Mentorship authorizes only the
minimum identity discovery and actions needed to schedule explicit Sessions.
Every other cross-Person capability requires a separately implemented and
explicitly accepted grant.

### My Journey

Every Person has one My Journey from the beginning to the end of life. My Journey
is an application projection, not a persisted membership or parent table. It
aggregates the Person's current Stage, Life Map, Trails, Cycle history,
assessments, tasks, sessions, and evidence across time.

This fixes the semantic order:

```text
My Journey (0 -> 100+)
  -> Stage at a point in life
    -> Trails, Cycles, projects, and Sessions during that period
```

`Basecamp` may remain a dashboard or landing view inside My Journey. It is not a
domain entity.

### Stage

There are exactly three Stages:

| Stage | Default age calibration | Emphasis |
| --- | --- | --- |
| `Easy Peasy` | 0-11 | Discovery |
| `Step Up` | 12-21 | Build |
| `YUP` | 22 and beyond | Transform |

Stage calibrates language, expectations, indicators, and the learning
environment. It never ranks human worth or achievement.

The current Stage is derived from verified date of birth. If date of birth is
unknown, Stage remains unknown and must not be inferred from a Cycle, Pack, or
account role. An exceptional override must be time-bounded, reasoned, and
audited. A published Cycle declares exactly one target Stage.

### Life Map

A Person has zero or one current Life Map and zero or more immutable Life Map
versions. The current Life Map is owned by the Person and spans all Stages,
Cycles, Disciplines, Packs, and Mentorships.

The owner is the only default editor. Mentors, facilitators, Parents, Guardians,
Pack leads, and admins do not receive implicit access. Access is granted
explicitly and can be revoked.

### Trails

A Person owns zero or more Trails. A Trail:

- has one owner;
- can span Stages and Cycles;
- can touch one or more of the six Pillars;
- can reference zero or more Disciplines;
- can optionally record that it began during a Cycle;
- remains part of the Person's Journey after that Cycle ends.

A Trail is never owned by a Pack, Cycle Enrollment, or Mentorship.

### Cycles

A Cycle is a time-bounded Academy delivery unit. A published or active Cycle has:

- exactly one Stage;
- zero or one primary Discipline;
- a start and end date, with the end after the start;
- zero or more Cycle Enrollments;
- zero or more Cycle Facilitator assignments.

Participants use `Cycle Enrollment`; facilitators use a distinct
`Cycle Facilitator` edge. Facilitators are not fake participants and participants
are not Pack members by implication.

A Cycle may expose its participant roster according to Cycle policy, but it does
not become a community merely because people share a schedule. If participants
form or join a real community, that happens through a separate Pack invitation.

### Discipline

A Discipline is a practice through which the six Pillars are exercised. `Arts`
is the first Discipline; `Sport`, `Leadership`, and `Craft` are valid future
examples.

Pillar definitions remain universal. Assessment instruments may be calibrated by
Stage and optionally by Discipline, but every score still resolves to one of the
six Pillars. A Discipline can add qualitative practice observations; it cannot
create a seventh Pillar.

### Connections

A Connection is a consented pair of distinct People. A Person can have any
number of Connections. The same unordered pair has at most one active base
Connection.

Connection requests are explicit and accepted by the recipient. A Pack invite,
Cycle Enrollment, shared Session, matching email domain, name, or family name
never creates a Connection automatically.

Each endpoint may keep a private personal label such as `Friend`, `Family`, or a
custom label. Endpoint-owned labels are not exposed to the other Person unless
the owner deliberately shares them. Structured relationships such as Mentorship
and Parent/Guardian/Child are modeled separately because they carry direction,
consent, and scoped capabilities.

### Mentorship

A Mentorship is directed:

```text
Mentor -> Mentee
```

It joins exactly one Mentor and one different Mentee. A Person can mentor many
People and can have many Mentors. There is at most one active Mentorship for the
same ordered pair.

Activation requires explicit acceptance by both sides. For a minor, the required
Parent or Guardian consent is recorded according to the applicable product and
legal policy. Ending or pausing a Mentorship blocks new mentor-authorized actions
immediately; historical Sessions and audit records remain subject to retention
policy.

Mentorship is an independent structured Person-to-Person edge. Accepting a
Mentorship invitation activates only that Mentorship; it neither requires nor
creates or accepts a generic Connection, Pack Membership, or Cycle Enrollment.

The first enabled Mentorship authorization baseline is deliberately narrow:

- discover the other Person as Mentor or Mentee using only the minimum scheduling
  identity;
- propose and schedule Sessions with that Person;
- manage or view only Sessions where the actor is the organizer or an explicit
  attendee.

An active Mentorship does not authorize Messages, Tasks, Assessments, Life Map,
Trails, self-assessments, private notes, other Mentorships, Packs, Cycle history,
or any other personal artifact. Those capabilities remain disabled through the
Mentorship edge until the corresponding feature has its own explicit,
purpose-bound grant, consent flow, audit trail, and independent privacy gate.

This distinction is permanent at the semantic level: later features may add
grants around a Mentorship, but they must not broaden the default Mentorship
baseline.

### Parent / Guardian / Child

`Guardian` means a responsible adult who has verified authority to consent or act
for a child but is not represented as that child's Parent. It is not a synonym
for mentor, teacher, older relative, emergency contact, or Pack lead.

The domain records a directed Care Connection with an adult role of `parent` or
`guardian`. The UI uses role-aware labels:

- the child sees the adult as `Parent` or `Guardian`;
- the adult sees the minor as `Child`.

The generic noun `Guardianship` is not a navigation item or a role shown to every
user. Verification is never inferred from a surname or invitation alone.
Parent/Guardian capabilities are limited by the child's age, consent policy, and
explicit resource scope. They never include mentor-private notes.

### Packs

A Pack is only a real community: people who recognize their belonging, notice
one another's absence, and share a common good. A Pack has one or more active
members and one or more owners or coordinators.

A Pack can exist in `draft` while its owner invites the first members. It becomes
an active community only after at least two distinct People have accepted
membership. This prevents an empty label or private contact bucket from being
presented as a community.

Pack Membership begins only after an invitation is accepted. A Person can belong
to any number of Packs and can leave them independently of their Journey,
Mentorships, and Cycle Enrollments.

Each onboarded Person may have one personal Pack. The owner sees `My Pack`; other
members see `<Owner name>'s Pack`, for example `Rui's Pack`. A Person may also
create or join other community Packs.

Pack roles authorize community operations only: invitations, membership,
moderation, community content, and Pack settings. They never authorize access to
a member's Life Map, Trails, assessments, Tasks, Mentorships, or private Session
data.

### Sessions and explicit attendees

A Session has exactly one organizer and one or more explicit attendees. Each
attendee is a Person, never a Pack Membership or Cycle Enrollment.

Attendee count determines presentation:

- one attendee: `Individual`;
- two or more attendees: `Group`.

The format is derived from attendee count, not maintained as an independent
source of truth.

A Session can optionally reference a Mentorship, Cycle, Pack, and/or Trail as
context. Those references do not add attendees. Every attendee must be selected
explicitly and authorized through an active Mentorship, a Cycle Facilitator
assignment, a Pack coordination role, or an admin operation.

Session privacy is attendee-specific:

- the organizer can maintain private notes;
- an attendee sees only their own attendance, outcome, and deliberately published
  shared note;
- one attendee never receives another attendee's email, private note, outcome, or
  calendar attachment data;
- ending a related Pack Membership, Cycle Enrollment, or Mentorship does not
  erase valid historical attendance.

No Pack Membership or Cycle Enrollment is required merely to attend or view one's
own Session.

### Tasks, Assessments, Messages, and grants

- A Task belongs to its assignee Person. It can optionally reference a Trail,
  Session, Cycle, or Mentorship for context. Creating or assigning a Task for
  another Person requires a dedicated Task grant; the initial Mentorship slice
  does not provide it.
- An Assessment belongs to its subject Person and uses only the six Pillars. The
  evaluator and assessment type are recorded explicitly. Mentor-authored
  Assessments require a dedicated Assessment grant; the initial Mentorship slice
  does not provide it.
- A Conversation has explicit participants. Messaging and contact discovery are
  enabled only by a dedicated consented messaging capability; Connection,
  Mentorship, Pack Membership, or Cycle Enrollment alone is insufficient.
- An `Artifact Grant` records who granted whom access to which resource, at what
  scope, for what relationship, and until when. Revocation is prospective and
  audited.

### Initial slice and later target capabilities

The v2 domain describes future capability edges, but the first production slice
implements only Mentorship-backed Session discovery and scheduling. It does not
ship generic Artifact Grants, mentor messaging, mentor-assigned Tasks,
mentor-authored Assessments, or Journey artifact sharing.

Later slices may enable those capabilities one at a time only after implementing:

1. a resource-specific grant and acceptance flow;
2. server-side authorization for every read and write;
3. revocation and relationship-end behavior;
4. immutable consent and access audit events;
5. privacy and security tests for that resource.

The presence of target concepts in this ADR must never be interpreted as an
authorization fallback before those gates exist.

## Transversal methodology

The following are transversal dimensions, not parents or membership levels.

### Six Pillars

1. `Physical`
2. `Emotional`
3. `Character`
4. `Spiritual`
5. `Intellectual`
6. `Social`

They form a whole-person checklist. They can be observed in a Life Map, Trail,
Cycle, Session, Task, project, or Assessment without making any of those objects
a child of a Pillar.

### Learning Arc

```text
Explore -> Experiment -> Create -> Share -> Transform
```

The Arc repeats at the scale of a Session, project, Cycle, Stage, and whole life.
It is not a one-way account state machine: a Person may Explore in one Trail while
Sharing in another.

### No universal Seed/Growth ladder

`Seed`, `Growth`, `Signature`, and `Contribution` may exist only as named
milestones in a specific Cycle or Discipline design that deliberately adopts
them. They are not Person levels, WEPACker ranks, Stage subdivisions, or a
prerequisite for access.

## Cardinalities and invariants

| Relationship | Cardinality | Invariant |
| --- | --- | --- |
| Person -> My Journey | `1 -> 1` conceptual view | Never persisted as membership |
| Person -> current Life Map | `1 -> 0..1` | Owner is Person |
| Person -> Life Map versions | `1 -> 0..*` | Append-only |
| Person -> Trails | `1 -> 0..*` | Trail has exactly one owner |
| Person <-> Cycle | `0..* <-> 0..*` through Cycle Enrollment | Enrollment is not membership |
| Person <-> Cycle facilitator | `0..* <-> 0..*` through Cycle Facilitator | Explicit operational assignment |
| Cycle -> Stage | `* -> 1` | Required before publish |
| Cycle -> primary Discipline | `* -> 0..1` | Optional practice focus |
| Person <-> Person | `0..* <-> 0..*` through Connection | Distinct People; explicit acceptance |
| Mentor -> Mentee | `0..* -> 0..*` through directed Mentorship | No self-link; one active ordered pair |
| Adult -> Child | `0..* -> 0..*` through Care Connection | Adult role is Parent or Guardian; verified |
| Person <-> Pack | `0..* <-> 1..*` through Pack Membership | Accepted belonging only; active Pack requires at least two People |
| Person -> personal Pack | `1 -> 0..1` | One owner-facing My Pack |
| Session -> organizer | `* -> 1` | Organizer is explicit |
| Session -> attendees | `1 -> 1..*` | Every attendee is an explicit Person |
| Person -> Tasks | `1 -> 0..*` | Task ownership does not depend on Enrollment |
| Person -> Assessments | `1 -> 0..*` | Every score uses one of six Pillars |

## Authorization contract

Authorization is calculated from the requested resource and an active, explicit
edge. It is never inferred from broad coexistence in the graph.

| Actor edge | Allowed by default | Requires an explicit grant | Never implied |
| --- | --- | --- | --- |
| Resource owner | Manage own Life Map, Trails, Tasks, grants, and own Session view | Sharing with others | Access to another Person |
| Active Mentor | Discover linked Mentee and propose/manage explicit Sessions only | Messages, Tasks, Assessments, Life Map, Trails, self-assessments, and Journey history require separate future grants | Access to every member of a shared Cycle or Pack |
| Cycle Facilitator | Cycle operations, its Enrollments, explicit Cycle Sessions | Personal Journey artifacts | Mentorship or Pack Membership |
| Pack owner/coordinator | Pack settings, invitations, moderation, Pack content | Nothing in a member's Journey | Development-data access |
| Parent/Guardian | Consent and care actions allowed by policy | Child Journey resources outside the policy baseline | Mentor-private notes or unrelated adult data |
| Session organizer | Session workspace and attendee-specific records | Unrelated Journey artifacts | All Pack/Cycle members as attendees |
| Admin | Least-privilege administration; audited break-glass where necessary | Sensitive support access must be reasoned and logged | Routine unrestricted browsing |

Every server action must authorize against the target resource after loading it;
UI filtering is not an authorization boundary. Relationship status, end date,
grant expiry, and revocation are checked on every protected write and sensitive
read.

## Consent, privacy, and lifecycle

1. Connection, Mentorship, Pack Membership, Cycle Enrollment, and Care Connection
   have separate consent records and lifecycles.
2. Accepting one edge never accepts another edge bundled with it. A combined UI
   may present two invitations, but records two clear decisions.
3. Personal relationship labels are private by default. Shared structured roles
   are visible to both endpoints.
4. Data grants are purpose- and resource-scoped, revocable, and auditable.
5. A paused or ended edge cannot authorize new access.
6. Revocation removes future access without corrupting historical attendance,
   authorship, consent, or audit records.
7. Consent and audit records are never cascade-deleted with a Person,
   relationship, or resource. They are retained for the configured policy period
   or anonymized/pseudonymized when identity erasure is required, while preserving
   the event, timestamp, purpose, decision, and integrity of the audit chain.
8. Deletion and retention operate per resource and legal policy; ending a
   relationship is not destructive deletion.
9. Minors require the appropriate Parent or Guardian consent before protected
   participation or sharing. Exact age thresholds and evidence retention are
   policy configuration, not hard-coded assumptions.
10. Private mentor notes, raw transcripts, and draft AI debriefs remain
   mentor/staff-only unless a separate shared artifact is deliberately published.
11. Group Session notifications and calendar invitations are rendered per
    recipient and do not disclose the other attendees' contact data.

## Current-to-target mapping

| Current model or term | Target | Migration rule |
| --- | --- | --- |
| `User` | `Person` / WEPACker | Keep physical auth identity initially; adopt Person domain semantics |
| `User.role = member` | Default authenticated Person | Remove developmental meaning |
| `User.role = mentor` | Staff/facilitator capability plus explicit Mentorship edges | Never use global role alone for mentee access |
| Current `Pack` used as profile/practice (`Pack Artista`) | `Discipline` (`Arts`) | Do not migrate it into a community Pack |
| Current `Pack` that is proven to be a real community | target `Pack` | Manual classification; no name-only inference |
| `Cohort` | `Cycle` | Preserve dates/status; add required Stage and optional Discipline |
| `CohortMembership(role=member)` | `CycleEnrollment` | Preserve status and joined date |
| `CohortMembership(role=mentor)` | `CycleFacilitator` | Do not create a participant Enrollment |
| `CohortMembership.level` / `MemberLevel` | Cycle-specific milestone history where genuinely used | Remove from Person; review legacy `partner` before mapping to `Contribution` |
| `CohortMembership.currentPhase` / `MemberPhase` | Cycle-specific phase history where genuinely used | Never make it a universal Journey state |
| `LifePlan` | `LifeMap` | Preserve one current record per Person |
| `LifePlanVersion` | `LifeMapVersion` | Preserve immutable history |
| `AreaKey` | `PillarKey` | Same six universal dimensions; rename `emotional` display to `Emotional` |
| `Trail` | `Trail` | Keep Person ownership; add optional Discipline/Cycle provenance links |
| `Task.membershipId` | `Task.assigneeId` plus optional context edges | Backfill assignee from legacy membership user |
| `Session.cohortId` | optional `Session.cycleId` | Context only, never attendance authority |
| `Session.mentorId` | `Session.organizerId` plus active relationship/assignment authorization | Preserve original organizer |
| `SessionAttendee.userId` | explicit Session attendee Person | Preserve as the attendance source of truth |
| shared-cohort mentor guard | active Mentorship or Cycle Facilitator guard | Fail closed outside explicit scope |
| shared-cohort messaging discovery | dedicated messaging grants plus explicit Conversation participants | Do not authorize messaging from Connection, Mentorship, Pack, or Cycle edges alone |
| `PACK_INDICATORS[packSlug]` | versioned Stage/Discipline Assessment Instrument | Scores remain restricted to six Pillars |
| application `packSlug` | Cycle application, or Stage/Discipline waitlist interest | Never create Pack Membership implicitly |

The word `Membership` remains valid only in `PackMembership`. The old database
table name may survive temporarily during migration but must not leak into target
domain APIs or UI.

## Migration strategy

Migration follows `expand -> backfill -> dual-read/write -> cutover -> contract`.
No phase may reinterpret production data merely from a label.

### 1. Expand

- Add target structures for Person semantics, Disciplines, Cycles, Cycle
  Enrollments, Cycle Facilitators, community Packs, Pack Memberships,
  Connections, Mentorships, Care Connections, Artifact Grants, Consent Events,
  Audit Events, and explicit context links.
- Keep legacy tables and columns readable.
- Add nullable target foreign keys to Tasks, Sessions, applications, and other
  dependent records.
- Add stable legacy-to-target ID mappings and migration metadata.
- Add target authorization functions behind feature flags before enabling target
  writes.
- Do not reuse the current physical `packs` table for community Packs during this
  phase; its rows still carry legacy discipline/delivery semantics.

Rollback: disable target writes and drop only empty, unreferenced expand objects.

### 2. Backfill

- Classify every legacy Pack row by observed meaning. The existing Artist row
  becomes the `Arts` Discipline. Only rows explicitly verified as communities
  become target Packs.
- Convert each Cohort to a Cycle. `Alpha` becomes a YUP Cycle with Arts as its
  primary Discipline.
- Split member and mentor CohortMembership rows into Cycle Enrollment and Cycle
  Facilitator records.
- Copy Life Plan data and versions to Life Map structures without changing
  ownership or history.
- Backfill Task assignees from `membership.userId`; retain the legacy key until
  reconciliation is complete.
- Preserve Session attendees exactly. Backfill `cycleId` from `cohortId`, but do
  not add attendees from a Cycle roster.
- Do not infer Mentorships from every mentor/member pair in a Cohort. Produce a
  review list; activate only confirmed relationships with recorded consent.
- Do not auto-create Pack Memberships or Connections from Cycle participation.
- Preserve legacy level/phase values as scoped historical metadata. Do not write
  them onto Person.
- Reconcile row counts, ownership, orphan references, duplicate people,
  self-links, statuses, and timestamps before dual reads.

Rollback: delete target backfill rows by migration batch ID; legacy remains the
source of truth.

### 3. Dual-read and dual-write

- Write the target model first and maintain required legacy projections in the
  same transaction where possible.
- Compare old and target reads in shadow mode and record mismatches without
  exposing personal content in logs.
- Enable target reads feature by feature: Life Map, Trails, Sessions, Tasks,
  Cycles, Mentorships, then Packs.
- Authorization uses target edges. Any temporary legacy fallback is restricted
  to an explicit grandfathered-access map, time-bounded, measured, and logged;
  shared Cohort presence is not a generic fallback.
- Enable the Mentorship edge first for Session discovery and scheduling only.
  Messages, Tasks, Assessments, and Journey artifact access remain behind
  disabled feature flags until their resource-specific grant gates are complete.
- Run continuous reconciliation for counts, owner IDs, attendee IDs, status, and
  authorization outcomes.

Rollback: switch reads to legacy and stop target writes through feature flags;
retain target data for diagnosis.

### 4. Cutover

- Make target models and guards authoritative.
- Change UI and API language to My Journey, Stage, Life Map, Trails, Cycle,
  Enrollment, Connection, Mentorship, Pack, and Pack Membership.
- Require explicit attendee rows for every Session and Person ownership for every
  Task.
- Freeze legacy writes and reject new legacy-only references.
- Enforce unique, foreign-key, status, date, non-self, and attendee-count
  invariants.
- Confirm that no active workflow depends on `requireMembership`, shared-Cohort
  mentorship inference, `MemberLevel`, or `MemberPhase`.

Rollback: return reads to dual mode while leaving target writes intact; do not
reverse already accepted consent edges.

### 5. Contract

- Remove Cohort, CohortMembership, MemberLevel, MemberPhase, legacy Pack
  semantics, and pack-scoped authorization helpers.
- Remove legacy columns only after at least one stable release with zero
  reconciliation mismatches and a verified backup/restore path.
- Rename physical tables only after application cutover; product correctness does
  not depend on a risky same-release rename.
- Retain migration maps and immutable audit records for the configured retention
  period. Person or relationship deletion must retain or anonymize/pseudonymize
  consent and audit events; it must never cascade-delete them.

Rollback: restore the pre-contract database backup and deploy the last dual-mode
release. Contract is the only intentionally hard-to-reverse phase and therefore
requires a dedicated release gate.

## Canonical Rui / Alex / Rui's Pack scenario

```text
Rui: Person / WEPACker
Alex: Person / WEPACker

Mentorship:
  Rui (Mentor) -> Alex (Mentee), active and accepted

Rui's personal community:
  Rui owns one personal Pack
  Rui sees: My Pack
  Alex sees: Rui's Pack, only after accepting its Pack invitation

Session:
  organizer = Rui
  attendee = Alex
  mentorship = Rui -> Alex
  cycle = optional
  pack = optional context only
```

The active Mentorship is sufficient for Rui to propose a Session with Alex. Alex
does not need a Cycle Enrollment or Pack Membership to attend or see that
Session. Joining Rui's Pack is a separate act of community belonging. Alex can
also own Alex's personal Pack, belong to other Packs, enroll in other Cycles, and
have other Mentors without creating another Journey.

If Rui mentors several People who do not know one another or share a common
community, the product calls that view `Mentees`; it does not manufacture a Pack.

## Consequences

### Positive

- The model matches the manifesto: one whole person, one lifelong Journey, three
  Stages, plural Trails, and community as a real `WE`.
- Personal mentoring works without fake Cycle or Pack records.
- Community belonging, structured delivery, and private relationships gain
  independent consent and lifecycle.
- Authorization becomes resource-based and least-privilege.
- A Person can be mentor and mentee at the same time.
- Future Disciplines reuse the same six Pillars without multiplying universal
  dimensions.

### Costs and risks

- Current Pack data must be classified manually because its name does not prove
  whether it is a Discipline, delivery construct, or community.
- Authorization migration is security-sensitive; broad legacy fallbacks would
  recreate the existing flaw.
- Tasks remain coupled to CohortMembership until their ownership migration is
  complete.
- Parent/Guardian verification and minor consent require a reviewed operational
  policy before enabling those capabilities.
- English-first terminology requires coordinated route, copy, support, analytics,
  and documentation changes; partial renaming would create a second semantic
  split.

## Acceptance criteria

The v2 cutover is complete only when all of the following are true:

1. Every Person sees one My Journey across all historical Stages and Cycles.
2. No domain object presents a bounded Cycle as a Journey.
3. Every target Pack is demonstrably a community and no Discipline is stored as
   a Pack.
4. Alex can be Rui's Mentee and explicit Session attendee without any Cycle
   Enrollment or Pack Membership.
5. Joining Rui's Pack requires a separate accepted invitation.
6. Sharing a Pack or Cycle grants no implicit access to Life Map, Trails,
   assessments, Tasks, private notes, or Messages.
7. Active Mentorship grants only minimum Session discovery and scheduling in the
   initial slice; Messages, Tasks, Assessments, Life Map, Trails, and other
   personal artifacts require separate future grants.
8. Every Session has explicit Person attendees and attendee-specific privacy.
9. Every Task has a Person assignee independent of Cycle Enrollment.
10. The six Pillars are the only universal assessment dimensions.
11. The learning Arc can repeat independently in any Trail, Session, Cycle, or
    Stage.
12. No Person has a universal Seed/Growth/Signature/Contribution rank.
13. Mentorship and Parent/Guardian access is consented, scoped, revocable, and
    audited.
14. Consent and audit records survive deletion through retention or
    anonymization/pseudonymization rather than cascading removal.
15. All legacy rows are reconciled or explicitly quarantined before contract.
