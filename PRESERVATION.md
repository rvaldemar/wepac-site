# WEPAC server working-tree preservation — NOT FOR DEPLOYMENT

This independent root snapshot preserves local source, migrations, tests and
documentation from `/home/hitman/wepac`. It is NOT a merge candidate as-is and
must never replace main or a production release wholesale.

## Provenance and ownership

- Requested branch: `preserve/server-worktree-20260916`.
- Original checkout branch: `main`, HEAD
  `921291dde572b2a0c2fd9222f9706611842804c7`.
- Remote: `rvaldemar/wepac-site`.
- Remote main observed before preservation:
  `ac4b61e2c97226cd704651e825922c89e0fa95db`.
- Published hotfixes `4b58420` (covers) and `ac4b61e` (tier archive)
  remain on main/live. This snapshot is based on the older dirty checkout;
  it does NOT incorporate or supersede those hotfixes.
- Coordinator: `ses_f565f3bcaffeuUTA036BfcXhwv`.
- Infrastructure/disk coordination: `ses_f5a006540ffe7P7DAjMx67Nnt1`.
- Historical residual audit: `ses_f9d6aa06affeEQruh0RR9Z2flj`.
- Historical execution: `ses_f9d19a322ffe5KfzEgHPbyoDAR`; no closure verified.

## Contents and integrity

`PRESERVATION-MANIFEST.json` records source base, actual UTC capture time,
SHA-256 of original status, every included source path, its SHA-256/size and
classification (unchanged, modified, untracked), and each omission/reason.
The manifest covers captured source files, not itself or this added document.

- Revalidated source status: 86 tracked modifications and 55 untracked status
  entries (directories included). Expanding directories yields 63 untracked files.
- Preserved: 471 files; 85 modified tracked, 63 untracked, 323 unchanged tracked.
- Preserved deltas include source/UI/auth/security, deployment scripts,
  dependency lockfile, docs, tests, schema, and five untracked migration files.
- Five migrations cover submission history, Wessex rate limiting/alerts,
  message idempotency and unverified-submission deletion. None were executed.
- Existing tests: 103 test/spec files, of which 31 are modified or untracked.

## Deliberate omissions

- All environment files, including `.env.example`, excluded without reading.
  `.env.example` is the ONLY omitted locally modified/untracked path; preserve
  or reconstruct its variable-name documentation in a separately reviewed task.
- Local tool configurations `.claude/settings.json` and `.mcp.json` excluded.
- 68 versioned binary/static assets omitted conservatively; their unchanged
  originals are recoverable from the base Git revision. See manifest for paths.
- No runtime storage/uploads, dumps, backups, credentials, dependencies, build
  output or ignored runtime files were copied. The selection was limited to
  Git-tracked and Git-visible nonignored untracked paths, then filtered.

## Security and validation limits

Gitleaks `ghcr.io/gitleaks/gitleaks:v8.24.3` scanned the isolated directory
with `--redact=100`, default rules and container networking disabled: zero
findings. No allowlists or suppressions were added. This is a secret scan,
not proof that every possible sensitive value is detectable.

Source-byte hashes and original Git status were verified for preservation.
Diff whitespace check found one pre-existing blank line at EOF in the historical
`20260720120000_wepacker_platform_rebuild` migration. It was preserved unchanged;
archival must not modify historical migration bytes/checksums for formatting.
Tests/build/E2E were NOT run: this mandate is archival, not integration or QA.
Do not inherit the previous hotfix's 457-test PASS as validation of this snapshot.
The preserved GitHub workflow only runs on pushes to main or pull requests;
this preservation push is not an instruction to run its migrations or jobs.

## Safe future integration

Start from current main, compare the preserved deltas against the recorded
base, and selectively reconcile them with both published hotfixes. Review
migrations, dependencies, security and outbound effects before any tests or
deployment. Never force-push this independent root over main. The original
dirty checkout, main, live release and database were not changed by this task.
