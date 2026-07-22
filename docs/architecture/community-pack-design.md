# Community Pack — design de referência (board, 2026-07-22)

> Síntese do board de 4 lentes (member experience, privacy architecture, legacy/data,
> product truth) sobre como construir o Pack como feature de comunidade da WEPAC Society,
> sem dissolver a garantia de privacidade que a plataforma já fez em código e por escrito.
> Não é implementação: é o desenho a partir do qual a slice 1 deve ser construída.

# COMMITTED DESIGN — The Pack (WEPAC Society community)

Worktree of record: `/Users/ruisantos/Documents/code/wepac-site-capela`. Where the lenses disagreed I went back to the code; rulings are marked **RULING** with the evidence.

---

## 1. WHAT A PACK IS

A Pack is a named group of people who belong together, know each other by name, and meet — nothing more.
Inside a Pack you see who else is there and one line each person wrote about themselves *for that Pack*, and you see when the group next gathers and who said they are coming.
A Pack never shows anything from anyone's Life Map, Trails, plan, assessments, tasks or sessions — those stay private exactly as promised today.
Being in a Pack does not let anyone message you: seeing someone and being able to write to them are two separate permissions, and only the first exists.
You join only by accepting an invitation, and you can leave in one click, at which point you disappear from the list — including from past gatherings — and the line you wrote is deleted.

---

## 2. THE GRANT

The grant is split in three, issued and revoked separately (privacy lens's structure, adopted whole). **Slice one issues G1 only.**

| | G1 Roster **(built now)** | G2 Contact (not built) | G3 Pack content (not built) |
|---|---|---|---|
| Meaning | I can see who else is here | I can message them | I can read what they wrote in the Pack |
| Carrier | `PackMembership` reaching `active` | `PackContactGrant` (future, per pair, both-sides opt-in) | `PackPost` (future) |
| Consent | Recipient accepts the invitation against versioned consent text | Separate double opt-in | Author's own act of writing |
| Default | Issued on accept | **Never implied by G1** | Nothing exists |

**RULING (contact):** `src/lib/wepacker/actions/message.ts:127-130` returns `[]` unconditionally, and `src/lib/wepacker/__tests__/message-capability-containment.test.ts` asserts that even Admin gets no inferred contacts. Slice one does not touch either file, and that test must stay green. Membership grants **sight, not contact**.

### What joining makes visible, to whom

Visible **only to other members of that one Pack whose membership is `status = "active"`, `reviewRequired = false`, `joinedAt != null`, `endedAt = null`, and whose Pack is `status = "active"`** — every predicate in the Prisma `where`, never in JS after the fetch (idiom: `mentorship.ts:213-240`):

- `User.name`
- `PackMembership.presentation` — a new per-membership line the person writes **at the moment they accept**, for this audience
- `PackMembership.role` (`owner | moderator | member`)
- month-precision `memberSince`
- their RSVP to a Pack gathering

**Not visible, ever, under G1:** email, phone, `User.bio`, `User.avatarUrl`, `User.role`, exact join date, last-seen or any activity signal, membership of any other Pack, existence of a Mentorship or who the mentor is, `StagePlacement`, `level`/`currentPhase`, application/lead records.

**RULING (`bio` and `avatarUrl`):** `User.bio` is written via `updateMyProfile` (`actions/user.ts:48-58`) under owner-only visibility; republishing it retroactively converts a private field into a peer-facing one. `avatarUrl` has no consent flow either. Both excluded. The new `presentation` column is the entire mitigation and is not optional — skipping it "to save a migration" is the failure mode.

**RULING (admin):** a global admin who is not a member sees **name, slug, status and member count only — no roster, no presentation text**. This preserves *"nem com a equipa"* at `src/app/wepacker/(public)/page.tsx:99` literally. Operationally this costs nothing because **the Pack creator is written as an `owner` membership in the same transaction as the Pack** (legal: there is no `no_self_check` on `pack_memberships`, unlike `mentorships_no_self_check` at `migration.sql:111`), so the founder sees the roster *as a member*. Invitations are issued by owner/moderator members, not by non-member admins.

### Unconditionally private — no grant, no admin, no break-glass, no button

`LifePlan`, `LifePlanVersion`, `StrategicPlan`, `Goal`, `MonthlyAction`, `Trail`, `Evaluation`, `EvaluationScore`, `StrategicMapScore`, `Task`, `Comment`, `Session` and everything hanging off it (attendance, outcomes, private/unpublished notes, transcript, `SessionDebrief`), `Mentorship` (including its existence), `Conversation`/`Message` (including its existence), `Agreement`, `StagePlacement`, `email`, `phone`, `passwordHash`, `CohortMembership`, `Application`/`beta_signups`, `Lead`.

There is **no "share my Trail into the Pack" button**. If artifact sharing is ever wanted it is a fourth grant with its own ADR.

### Leaving

- `leavePack(packId)`: one click, no reason, no owner approval, immediate. Sets `status: "left"`, `endedAt: now`, `presentation: null`. **Always available even when the writes flag is off** — precedent and reasoning at `mentorship.ts:207-210`: consent withdrawal must never depend on an operational flag.
- Declining an invitation: same shape (`status: "left"`, `endedAt` set, `joinedAt` stays `null`). `PackMembershipStatus` (`schema.prisma:94-100`) has no `declined` value and we are **not** adding one — `left` = the person's own choice, `removed` = an owner action. That is the distinction that matters for privacy.
- The leaver disappears from every roster and every RSVP name list **retroactively, past gatherings included**. Counts survive, names do not. No tombstone, no "X saiu do Pack" event, no reason field shown to anyone.
- The `PackMembership` row survives (all FKs are `ON DELETE RESTRICT`, `migration.sql:445-451`) as consent proof. The row is the record of the *decision*; the `presentation` text was *content* and is erased. That split is the whole answer to "without residue".
- Re-invitation is an **UPDATE**, never an INSERT (`@@unique([communityPackId, userId])`, `schema.prisma:461`), and must null `joinedAt` and `endedAt` and re-record `consentVersion`/`consentAcceptedAt`. Bumping `invitedAt` forward without nulling them violates `pack_memberships_joined_after_invite_check` and `pack_memberships_ended_after_invite_check` (`migration.sql:210, 216`). This is the single most likely production 500 in the feature and it gets a test.

---

## 3. SLICE ONE — "Pack Roster + Gatherings" — size **M**

**RULING (no wall, no question, no feed in slice one).** The platform already carries one dead social limb: `getMessagingContacts` returns `[]` while `PlatformSidebar.tsx:42` still renders a Messages item with an unread badge. A roster and a next-gathering date are *correct* at zero activity; an empty feed is visible proof the community is not there. Content (`PackPost` / the Question) is slice two with a named trigger.

**Route naming: `/wepacker/community`, not `/wepacker/packs`.** `src/app/wepacker/(public)/[pack]/` exists at exactly that depth (`intake`, `candidatura`), and "Pack" in a URL in this codebase already means the *legacy* delivery Pack. Product word stays "Pack" in the UI.

### Migration (additive only; touches no legacy table)
- `PackMembership.presentation String?`
- `PackMembership.consentVersion String?`, `PackMembership.consentAcceptedAt DateTime?` (idiom: `Agreement`, `schema.prisma:541-550`)
- `model PackGathering { id, communityPackId, title, startsAt, endsAt?, location String, note String @default(""), createdById, cancelledAt?, createdAt, updatedAt; communityPack onDelete: Restrict; @@index([communityPackId, startsAt]) }`
- `model PackGatheringRsvp { id, gatheringId, userId, response GatheringRsvp(going|not_going), respondedAt, @@unique([gatheringId, userId]) }`

Not reusing `Session`: it carries transcripts, debriefs, private notes, per-attendee outcomes, `cohortId` and `mentorshipId`, and routes through `resolveSessionAttendeeAuthorization` (`guards.ts:147`). A gathering has none of that, and pack-sourced attendees would force every existing Session path to be re-reasoned.

### Guards — new `src/lib/wepacker/pack-guards.ts`
- `resolvePackMembership(actorId, communityPackId)` — the full predicate above, in the `where`.
- `assertActivePackMember(packId)` → throws `"Sem permissão."`. **Admin role is not a bypass** (mirrors `assertMembershipAccess`, `guards.ts:92`).
- `assertPackOwner(packId)` → same plus `role in ["owner","moderator"]`.

### Projection — exactly one place
`packMemberSelect = { role, joinedAt, presentation, user: { select: { id, name } } }`, mapped to `{ userId, name, presentation, packRole, memberSince /* YYYY-MM */ }`. Never copy `getCohorts`/`getMemberships` (`actions/admin.ts:93-112, 178-198`) — they select `user.email` because they are admin projections.

### Actions — new `src/lib/wepacker/actions/community-pack.ts`
- `createCommunityPack({slug,name,description})` — `requireAdmin()`; writes Pack `status: "draft"`, `source: "explicit"`, `reviewRequired: false` (do **not** override the `draft` default the way `createPack` overrides `active` at `admin.ts:56-58`) **plus the creator's `owner` membership with `status: "active"`, `joinedAt: now` in the same transaction** — the only row in the system that legitimately skips `invited`.
- `invitePackMember(packId, userId)` — `assertPackOwner`; `status: "invited"`, `source: "invitation"`, `invitedById`; on `P2002` take the re-invitation UPDATE path.
- `respondToPackInvitation(membershipId, "accept"|"decline", { presentation, consentVersion })` — `updateMany` scoped to `{ id, userId: actor.id, status: "invited", reviewRequired: false }`, fail-closed on `count !== 1` (idiom: `mentorship.ts:213-240`). Accept writes `active`, `joinedAt`, `presentation`, `consentVersion`, `consentAcceptedAt`. **Decline is never flag-gated.**
- On the transition that produces the **second** `active` membership including at least one non-creator: flip `CommunityPack.status = "active"`, `activatedAt = now` (required together by `community_packs_active_status_timestamp_check`, `migration.sql:179`). No DB check enforces the two-person rule — the action is the only place it can live (ADR: *"prevents an empty label or private contact bucket from being presented as a community"*).
- `getMyPacks()`, `getPack(slug)` (roster + next gathering + my RSVP + my presentation), `setPresentation(packId, text)` (≤140 chars, trimmed), `leavePack(packId)`, `createGathering` / `cancelGathering` (owner), `rsvpToGathering`.
- `getSidebarCounts` (`actions/user.ts:60-88`) gains `pendingPackInvitations`, alongside `pendingMentorships`.

### Routes
- `/wepacker/community` — my Packs + pending invitations.
- `/wepacker/community/[slug]/invite` — the consent screen: who is already here (declared names only), the visible/invisible table verbatim, the presentation-line field, Accept and Decline equally prominent. Accept disabled until the line is non-empty.
- `/wepacker/community/[slug]` — roster, next gathering + RSVP, edit my line, and a permanent footer strip "O que o Pack vê de ti" + "Sair do Pack".
- `/wepacker/admin/community` — admin-only; create Pack, appoint owner. **New sidebar entry, sibling of Users / Legacy Delivery / Leads / Settings — never inside `/wepacker/admin/cohorts`**, which is labelled "Legacy Delivery" (`PlatformSidebar.tsx:60`); two different things called "Pack" in one viewport is the visual version of the relabel CLAUDE.md forbids.
- Member sidebar: one item "Pack", **rendered only when the person has ≥1 `active` or `invited` membership**. Do not repeat the Messages mistake.

### Email (`src/lib/email.ts`)
`sendPackInvitationEmail` (shape of `sendMentorshipInvitationEmail`, `:203`) and `sendGatheringAnnouncementEmail` — **rendered once per recipient, carrying no other member's name or address**, same discipline as the one-`.ics`-per-recipient rule. No presentation text, no roster, in any email.

### Flag
`COMMUNITY_PACK_WRITES_ENABLED`, checked exactly like `assertMentorshipWritesEnabled` (`mentorship.ts:19-24`). Gates create/invite/accept. **Decline and leave bypass it.** Ships to production **off**, and is not switched on until the adults-only assertion that currently freezes `MENTORSHIP_WRITES_ENABLED` is made by the founder.

### Acceptance criteria
1. Roster payload for any member contains no `email`, `phone`, `bio`, `avatarUrl` or account `role` — asserted on the **serialized object**, not the select.
2. A non-member and an admin-who-is-not-a-member both fail `getPack`.
3. A member who leaves vanishes from the roster **and from every RSVP name list including past gatherings**, in the same request.
4. A declined invitation is never name-attributed in any owner-facing view.
5. Re-inviting a previously-left person succeeds and violates no DB check (`joinedAt`/`endedAt` nulled, consent re-recorded).
6. A Pack cannot reach `status: "active"` with fewer than two `active` memberships including one non-creator.
7. No action in `community-pack.ts` reads `LifePlan`, `LifePlanVersion`, `StrategicPlan`, `Trail`, `Evaluation`, `Task`, `Comment`, `Session`, `SessionDebrief`, `CohortMembership`, `Mentorship` or `Conversation` — asserted by a Prisma-surface test in the style of `domain-graph-schema.test.ts`.
8. `message-capability-containment.test.ts` still passes unmodified.
9. Landing FAQ gains one entry on what a Pack is, before anyone can join one, in the same release.
10. `deleteUser` (`admin.ts:255-281`) returns a clear "end this person's Pack memberships first" instead of a raw P2003.

Dev/e2e seed: a fresh Pack in `prisma/seed.ts` built from `User` rows (`m1` owner, `u1`/`u2` accepted, `u3` invited, `u4` excluded because he never onboarded) — **never from `cohortAlpha`**. Keep the existing comment at `seed.ts:38-41` intact.

---

## 4. NOT YET

| Excluded | Trigger that pulls it in |
|---|---|
| **G2 contact / any change to `getMessagingContacts`** | Only after G1 has ≥8 accepted members and the founder writes the double-opt-in consent copy. Ships as `PackContactGrant`: knock with **no free text**, recipient must have `contactOpen = true`, 3 pending knocks per Pack per 7 days, auto-decline at 14 days, revocable — and revocation does **not** delete an existing conversation, which must be said in Portuguese before the accept button. |
| **G3 Pack content** — one thread **per gathering**, auto-closed 14 days after the gathering date. Never a general feed. | 8-week gate on slice one, all three: ≥8 invitations accepted, ≥2 gatherings created by the owner unprompted, ≥70% RSVP response on the second gathering. Miss any one and the correct action is to **kill the feature, not add to it**. |
| Sharing Life Map / Trails / Strategic Plan into a Pack | Its own ADR. Not a checkbox, ever. |
| Pack-derived Session attendee authorization | Never in this form; re-couples community to the Session privacy machinery. |
| Avatars in the roster | A deliberate consent flow for `avatarUrl` as a peer-facing field. |
| Any legacy Cohort → Pack mapping, including a "suggested invitees" screen | Never. `pack_memberships_legacy_review_check` + `..._review_quarantine_check` (`migration.sql:222, 225`) hold `legacy_inference` rows out of `active` anyway, and a `joinedAt` derived from `CohortMembership` (`@default(now())`, admin-created at `admin.ts:152-159`) is a fabricated consent timestamp. The founder names the individuals; there is no code path. |
| The ADR's personal `My Pack` per Person (`domain-graph-v2.md:321-323`) | **Rejected, not deferred.** At tens of people it manufactures N communities of one — the exact thing the same ADR paragraph warns against. Recorded as a deliberate divergence from the ADR. |
| `PackConsentEvent` append-only audit table | Slice one records consent as versioned columns on the membership row. The table ships when a second Pack exists or when the legal read on the visibility grant requires it. |
| Member search, "members you may know", export, photos, in-app notifications | Not planned. |

---

## 5. THE DOC CHANGE

One sentence in `/Users/ruisantos/Documents/code/wepac-site-capela/CLAUDE.md` currently forbids this.

**Line 81, current:**
> **Roles:** `member`, `mentor`, `admin` remain account-access implementation values, not Person identities or relationship proof. Only an accepted directed Mentorship authorizes discovery + explicit Sessions in the first slice.

**Replacement:**
> **Roles:** `member`, `mentor`, `admin` remain account-access implementation values, not Person identities or relationship proof. An accepted directed Mentorship authorizes discovery + explicit Sessions. An accepted Pack Membership authorizes the Pack roster projection (`name`, self-authored `presentation`, `PackMembershipRole`, month-precision `memberSince`, RSVPs) inside that one active Pack and nothing else. It is not a Connection, not a Mentorship, and never authorizes Journey access or contact.

**Line 91 (Messaging) is not edited.** It stays literally true because slice one does not touch `message.ts`. Line 79/80 (Target/Legacy architecture) are not edited either — they already forbid relabelling legacy rows and this design does not relabel any.

**Additive, same commit:**
- New Features bullet: *"**Community Packs:** `CommunityPack` + `PackMembership` are the only community records. Three separately-issued grants — roster visibility (shipped), contact capability (not shipped), Pack content (not shipped). Roster visibility never implies contact. A Pack becomes `active` only at two accepted People including one non-creator. No legacy `Pack`/`Cohort`/`CohortMembership` row is ever converted, inferred or backfilled into a Community Pack; `beta_signups.packSlug` never creates a Pack Membership. A non-member Admin sees name, slug, status and member count only."*
- Routes section: add `/wepacker/community`, `/wepacker/community/[slug]`, `/wepacker/admin/community`.
- Env vars section: add `COMMUNITY_PACK_WRITES_ENABLED` — default `false`, gates create/invite/accept; decline and leave are never gated.

**Product copy, same release, not a follow-up:**
- `src/app/wepacker/(public)/page.tsx:99` — sentence stays **verbatim**; append: *"Nos Packs a que pertences, os outros membros veem o teu nome e a apresentação que escreveres para esse Pack — mais nada, e estar num Pack não dá a ninguém a possibilidade de te escrever."*
- `page.tsx:82` — keep *"não é uma rede social"*; append: *"as pessoas que estão contigo num Pack conhecem-te pelo nome, porque foram convidadas uma a uma e tu aceitaste estar lá."*
- One new FAQ entry: what a Pack is, that it is opt-in, what is visible, that it grants no messaging.
- `src/app/(site)/privacidade/page.tsx` §7 — one paragraph on member-to-member visibility inside a Pack and on what survives leaving.

---

## 6. WHAT WOULD MAKE THIS FAIL

**Not a technical condition: there is no real gathering and no named human who already convenes these people.**

A Pack *registers* a rhythm; it does not create one. If WEPAC has no recurring offline gathering for this group today, and no single named person who calls it, then the roster is a list nobody returns to and the gathering block reads "Sem encontro marcado" forever — a second visibly dead social surface next to Messages, and public proof that the community is not there.

**Check before a line is written, and treat a negative answer as a stop:**
1. Name the owner. Not "the founder, for now, plus we'll see" — one person who already convenes this group in person.
2. Name the cadence that exists offline today: frequency and place.
3. Name the individuals for the first Pack, explicitly, not by cohort.

Secondary operational failures, in order of likelihood: scope creep from roster to feed during slice one (hold the 8-week gate numbers); projection creep — one careless `include: { user: true }` in a later PR leaks emails, which is why the assertion is on the serialized payload and `packMemberSelect` lives in exactly one module; and someone proposing to backfill from `CohortMembership` "because those people already know each other", which `schema.prisma:437-439` and two DB check constraints forbid on both policy and structural grounds.

---

## ADENDA — Ownership, decidido pelo Rui (2026-07-22)

O board desenhou `PackMembershipRole` como `owner | moderator | member` mas não tratou a
transferência. O Rui fechou-o assim:

- **Quem cria o Pack é owner.** Continua a ser escrito como membership `owner` na mesma transação
  em que o Pack é criado — o desenho acima depende disso para que a lista nunca seja visível a um
  admin não-membro.
- **Um owner pode delegar sem sair** — passa a haver mais do que um owner ao mesmo tempo, ou
  promove alguém a moderator, mantendo-se owner.
- **Um owner pode sair de owner delegando** — transfere o papel e deixa de o ser, permanecendo ou
  não como membro do Pack.

Consequências para a slice 1, a respeitar na construção:

1. `PackMembershipRole` já suporta os três papéis; o que falta são as ações de promoção,
   despromoção e transferência, e não podem ser um `update` solto — cada uma é uma ação com
   autorização própria (só um owner ativo pode promover ou transferir).
2. **Invariante:** um Pack ativo nunca fica sem nenhum owner ativo. Sair de owner exige que outro
   membro seja promovido na mesma transação; sair do Pack sendo o último owner é recusado com uma
   mensagem que diz porquê. Isto tem de ter teste, e o teste tem de ser falsificado.
3. A saída livre desenhada acima (`leavePack`, um clique, nunca bloqueada por flag) mantém-se para
   quem não é o último owner. O último owner é a única excepção, e é uma excepção de integridade
   do grupo, não de consentimento: ninguém fica preso — delega e sai.
4. Quem convoca os encontros é um owner ou moderator; a transferência de ownership é, na prática,
   a passagem de quem convoca. É por isso que esta adenda responde à condição operacional do §6.
