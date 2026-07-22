# ADR: WEPAC Domain Graph

- Status: Accepted
- Date: 2026-07-22
- Scope: WEPACKER product language, ownership, relationships and authorization
- Source: WEPAC Manifesto plus the product decisions recorded in this ADR

## Decision

WEPAC is centred on one whole `Person`, presented in the product as a
`WEPACker`. Development, relationships, community and Academy participation are
independent parts of a graph. They are not levels in one delivery hierarchy.

```text
Person / WEPACker
|
+-- My Journey                         one lifelong view
|   +-- current Stage                  Easy Peasy | Step Up | YUP
|   +-- Life Map
|   +-- Trails
|   +-- Goals
|   +-- Actions
|   +-- explicit Session attendance
|
+-- Relationships
|   +-- Connection
|   +-- directed Mentorship            Mentor -> Mentee
|   +-- Parent / Guardian relation     future policy-bound capability
|
+-- Communities
|   +-- Pack Membership -> Pack
|
+-- Academy
    +-- Cycle Enrollment -> Cycle
    +-- Cycle Facilitation -> Cycle
                              +-- optional Discipline
```

The Six Pillars and the Learning Arc are transversal lenses. They do not own
people or records and they are not extra levels in this graph.

## Canonical product language

New product concepts, domain identifiers and navigation use English terms.

| Term | Meaning | It is not |
| --- | --- | --- |
| `Person` | Core domain subject behind an account | A participation record |
| `WEPACker` | Product identity of a Person walking the WEPAC way | A rank |
| `My Journey` | One whole-life projection for a Person | A database container or offering |
| `Stage` | Age-calibrated lens within My Journey | A merit level |
| `Life Map` | Living personal map of identity, direction and commitment | A community plan |
| `Trail` | A bounded personal transformation owned by a Person | A Stage or Cycle |
| `Goal` | A desired personal outcome | A community assignment |
| `Action` | A concrete commitment owned by its assignee | A membership-scoped Task |
| `Academy` | Product surface for structured learning experiences | A persisted parent aggregate |
| `Cycle` | A structured Academy experience bounded in time | A Journey or Pack |
| `Cycle Enrollment` | A Person participating in a Cycle | Pack Membership |
| `Discipline` | A serious practice through which the Pillars are trained | A seventh Pillar |
| `Connection` | A consented link between two People | Permission to personal artifacts |
| `Mentorship` | A directed relationship from Mentor to Mentee | A global access role |
| `Pack` | A real community whose members know they belong | A Discipline or offering |
| `Pack Membership` | Accepted belonging to a Pack | Cycle Enrollment |
| `Session` | A working meeting with explicit attendees | A container roster |

`Program` and `Cohort` are not WEPACKER domain concepts. `Membership` is
reserved for Packs. `Enrollment` is reserved for Cycles. `Journey` is larger
than a Stage: a Person has one lifelong My Journey and moves through Stages
within it.

## My Journey

Every Person has one My Journey from the beginning to the end of life. My
Journey is an application projection, not a table or a paid offering. It brings
together the Person's Stage, Life Map, Trails, Goals, Actions and Sessions
without transferring ownership to a Pack, Cycle or Mentorship.

```text
My Journey (0 -> 100+)
  -> Stage at a point in life
     -> Trails, Cycles, projects and Sessions during that period
```

`Basecamp` can remain a dashboard metaphor. It is not a domain entity.

### Stages

There are exactly three lifelong Stages:

| Stage | Default age calibration | Emphasis |
| --- | --- | --- |
| `Easy Peasy` | 0-11 | Discovery |
| `Step Up` | 12-21 | Build |
| `YUP` | 22+ | Transform |

A Stage calibrates language, expectations and learning context. It never ranks
human worth or professional achievement. A published Cycle identifies one
Stage. A Person's Stage is never inferred from a Pack, Cycle or account role.

### Life Map

A Person has zero or one current Life Map and zero or more immutable versions.
It answers who I am, where I am, where I am going, why and what I commit to.
It spans all Stages, Cycles, Disciplines, Packs and Mentorships.

The Person is the only default editor. No relationship or administrative role
implicitly grants access.

### Trails, Goals and Actions

A Person can own many Trails throughout life. Each Trail has one owner and can
touch one or more of the Six Pillars. It remains part of My Journey after any
related Cycle or Mentorship ends.

Goals belong to a Person through their Strategic Plan. An Action belongs
directly to its assignee Person and may optionally reference a Goal, Trail,
Session, Cycle or Mentorship for context. Those references do not change
ownership or authorization.

The current production slice allows self-owned Actions only. A Debrief can
propose Actions but cannot create or assign them. Cross-Person assignment stays
disabled until a dedicated proposal, acceptance, revocation and audit flow is
implemented.

## Academy, Cycles and Disciplines

`Academy` is the product area where WEPAC offers structured learning. Its
persisted delivery unit is a `Cycle`.

A published or active Cycle has:

- exactly one Stage;
- zero or one primary Discipline;
- a valid start and end date;
- explicit Cycle Enrollments;
- separate Cycle Facilitator assignments.

Facilitators are not fake participants. Participants are not community members
by implication. Sharing a schedule does not create a Pack or personal
relationship.

A Discipline is a serious practice through which all Six Pillars are trained.
`Arts` is the first Discipline. Sport, Leadership or Craft can be added later
without changing the universal Pillars.

## Relationships

### Connections

A Connection is an explicitly requested and accepted relationship between two
different People. Labels such as Friend, Family, Partner, Professional or
Collaborator describe the relationship; they do not grant access to Journey
artifacts.

An invitation to a Pack, a Cycle Enrollment, a shared Session, matching names
or a shared email domain never creates a Connection automatically.

A Person who declines a Connection request creates a durable terminal block for
that Person pair. The requester cannot reopen it or generate another invitation
or email. A future unblock, if introduced, must be an explicit action controlled
by the Person who declined. By contrast, either endpoint may end an accepted
Connection; that voluntary end may later receive a fresh consent request.

### Mentorship

A Mentorship is directed:

```text
Mentor -> Mentee
```

A Person may mentor several People and have several Mentors. Activation is
explicit and relationship-specific. Mentorship requires neither Pack Membership
nor Cycle Enrollment.

The current default capability is deliberately narrow:

- discover the linked Person using the minimum scheduling identity;
- propose and manage Sessions with that Person;
- access only Sessions where the actor is organizer or explicit attendee.

Mentorship alone does not grant Messages, Life Map, Trails, Goals, Actions,
private notes or any other personal artifact. Each future capability needs its
own purpose-bound consent and server-side authorization.

### Parent and Guardian

`Guardian` means a verified responsible adult authorized to consent or act for a
child when that adult is not represented as the child's Parent. It is not a
synonym for Mentor, teacher, relative, emergency contact or Pack lead.

The product should use a directed Parent/Guardian relationship, not a generic
`Guardianship` area shown to everyone. It remains disabled until age,
verification, consent, evidence, retention and revocation policies are
implemented. It never grants access to mentor-private notes.

## Packs are communities only

A Pack is a real community: people who recognize their belonging, notice one
another's absence and share a common good. A Pack is never a Discipline, Cycle,
Stage, audience segment, contact list or development package.

Pack Membership is invited and accepted independently from every other edge. A
Person can belong to many Packs and can leave one without changing My Journey,
Mentorships or Cycle Enrollments.

Declining an invitation is a durable, target-controlled terminal state for that
Person and Pack. The Pack owner cannot re-invite the Person or trigger another
invitation email. It is stored as rollback-compatible `Removed` plus a
`declinedAt` marker. `Left` is different: it records a voluntary exit after an
accepted Membership and may later receive a fresh invitation.

A Person may create a personal community Pack:

- its owner sees `My Pack`;
- other accepted members see `<Owner name>'s Pack`, for example `Rui's Pack`.

That same Person can belong to other development or interest communities. Pack
roles authorize community operations only. They never authorize another
member's Life Map, Trails, Goals, Actions, Mentorships or private Session data.

## Sessions use explicit attendance

A Session has one organizer and one or more explicit Person attendees.
Attendee count determines its presentation:

- one attendee: `Individual`;
- two or more attendees: `Group`.

Format is derived, never stored independently. A Session may reference a Cycle
or Mentorship as optional context, but context never adds attendees. No Pack
Membership or Cycle Enrollment is required merely to attend or view one's own
Session.

Privacy is attendee-specific:

- the organizer can maintain private working material;
- an attendee sees only their own attendance, outcome and deliberately shared
  note;
- no attendee receives another attendee's contact or private data;
- calendar invitations are rendered once per recipient;
- raw Transcripts and draft AI Debriefs remain organizer-only;
- replacing or deleting a Transcript invalidates its derived Debrief.

`Preview attendee view` is a read-only projection, not impersonation. It cannot
change the real actor's session, cookies, role or owner-scoped actions. A broad
Person-wide support preview requires reason, short expiry, a content-free audit
trail and resource-specific authorization before it can be enabled. The current
database trigger prevents mutation through normal application operations; it is
not forensic non-repudiation because the runtime database owner can bypass it.

## Six Pillars and Learning Arc

The universal Pillars are exactly:

1. `Physical`
2. `Emotional`
3. `Character`
4. `Spiritual`
5. `Intellectual`
6. `Social`

Arts is a Discipline, not a seventh Pillar. A future Assessment must use a
versioned Stage/Discipline instrument, preserve these six keys and have a
resource-specific grant. Assessment is not an onboarding gate and no target
Assessment write flow exists today.

The Learning Arc repeats at every scale:

```text
Explore -> Experiment -> Create -> Share -> Transform
```

It can repeat independently in a Session, Trail, project, Cycle, Stage and
whole life. It is not an account status machine.

`Seed`, `Growth`, `Signature` and `Contribution` are not universal Person
levels. A specific Cycle may use named milestones internally, but they cannot
become WEPACker ranks or access gates.

## Core invariants

| Relationship | Invariant |
| --- | --- |
| Person -> My Journey | Exactly one conceptual whole-life view |
| Person -> Life Map | Zero or one current map; versions are append-only |
| Person -> Trails | Every Trail has exactly one owner |
| Person -> Actions | Every Action has exactly one assignee |
| Person <-> Cycle | Participation exists only through Cycle Enrollment |
| Person <-> Pack | Belonging exists only through Pack Membership |
| Mentor -> Mentee | Directed, explicit and non-self Mentorship |
| Session -> organizer | Exactly one explicit organizer |
| Session -> attendees | One or more explicit People |
| Cycle -> Stage | Required before publication |
| Cycle -> Discipline | Zero or one primary practice context |

None of these edges creates another edge implicitly.

## Authorization baseline

Authorization starts from the requested resource and an explicit active edge.
It is never inferred from coexistence in a Pack or Cycle.

| Actor | Allowed by default | Not implied |
| --- | --- | --- |
| Resource owner | Manage own Life Map, Trails, Goals, Actions and own Session view | Access to another Person |
| Active Mentor | Relationship discovery and explicit Mentorship Sessions | Other Journey artifacts |
| Cycle Facilitator | Cycle operations and explicitly scoped Cycle Sessions | Mentorship or community access |
| Pack owner/moderator | Community settings, invitations and moderation | Development-data access |
| Session organizer | Own Session workspace and attendee-specific records | Every Pack/Cycle member as attendee |
| Admin | Least-privilege operations and separately controlled support access | Routine unrestricted impersonation |

UI filtering is never an authorization boundary. Every protected server read
and write validates the resource owner or exact relationship edge. Paused,
ended, declined or revoked edges cannot authorize new access.

## Canonical Rui and Alex scenario

```text
Rui: Person / WEPACker
Alex: Person / WEPACker

Mentorship:
  Rui (Mentor) -> Alex (Mentee), explicitly accepted

Community:
  Rui owns a personal Pack
  Rui sees: My Pack
  Alex sees: Rui's Pack only after accepting a separate Pack invitation

Session:
  organizer = Rui
  attendee = Alex
  mentorship = Rui -> Alex
  cycle = optional context
```

Alex does not need Pack Membership or Cycle Enrollment to participate in that
Session. Alex can own a personal Pack, join other Packs, enroll in other Cycles
and have other Mentors without creating another Journey.

If Rui mentors several People who do not share community belonging, the product
calls that view `Mentees`; it does not manufacture a Pack.

## Removal and release contract

No record from the retired delivery hierarchy is relabelled, inferred or
backfilled into this graph. Historic application data for that hierarchy is
disposable, but unrelated and target data is not.

The application cutover and physical database contraction are separate releases
because migrations run before the new application process replaces the old one:

1. Release A removes every old runtime read, write, route and authorization
   fallback while leaving the retired physical structures temporarily present.
2. Release B drops only the reviewed retired tables, columns and enums after a
   verified backup/restore gate.

The authoritative deletion inventory and operational gates live in
`legacy-contract-removal.md`.

## Acceptance criteria

The target contract is complete when:

1. Every Person sees one My Journey across Stages and Cycles.
2. A Cycle is never presented as a Journey or Pack.
3. A Pack is demonstrably a community and never a Discipline or offering.
4. Alex can be Rui's Mentee and Session attendee without Pack Membership or
   Cycle Enrollment.
5. Joining Rui's Pack requires separate acceptance.
6. Every Session has explicit People as attendees and preserves attendee-level
   privacy.
7. Every Action has a Person assignee and no cross-Person assignment occurs
   without explicit acceptance.
8. Exactly Six Pillars exist and Arts remains a Discipline.
9. No Person has a universal Seed/Growth/Signature/Contribution rank.
10. No retired delivery term, route, guard, query or write remains in the
    product runtime.
