# Session media release reconciliation

## Base and lineage

- Feature branch: `feat/session-media-private-share`
- Required base: `origin/main` at `1da82ed`
- Reconciled product line: `feat/arte-a-capela-base` at `46a88e9`
- Common ancestor: `6054535`
- Release B contraction remains outside `prisma/migrations` and was not run.

The Society line was merged with a real merge commit so the production lineage
is explicit. Product changes that are independent from the retired delivery
domain were retained: Society and campaign pages, Arte à Capela, ticketing
hardening, public-page E2E coverage, the WEPACKER-to-login redirect, and the
test-only Auth.js host signal.

## Conflict resolutions

Release A remained authoritative for all target-domain and security boundaries:

- `prisma/schema.prisma`, `prisma/seed.ts`,
  `src/lib/wepacker/actions/application.ts` and
  `src/lib/wepacker/actions/invite.ts` kept the Release A versions.
- The Society-line `BetaSignup(email, packSlug)` migration and its legacy
  Pack-specific application tests were excluded. Release A's generic intake
  creates only a `BetaSignup` and must not recreate retired Pack delivery
  semantics.
- The deleted `/wepacker/[pack]/intake` compatibility route stayed deleted.
- `src/lib/auth.ts` kept Release A's session-version and authorization
  callbacks, then incorporated only the Society line's
  `E2E_TRUST_HOST === "1"` test-runner capability.
- `src/app/wepacker/(public)/page.tsx` retained the production Society decision:
  `/wepacker` is the member door and redirects to `/wepacker/login`;
  `/society` is the public entrance.
- `OPS_LOG.md` kept Release A as the current release contract. Historical
  Society commits remain preserved by the merge ancestry and this record.

No source or untracked file from the dirty primary checkout was copied into this
worktree.
