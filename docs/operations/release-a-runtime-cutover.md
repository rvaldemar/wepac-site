# Release A target-runtime cutover

This is the operational contract for the first half of the legacy-domain
removal. Release A deploys the target runtime and additive/backward-compatible
Prisma migrations. It does **not** execute
`prisma/release-b/drop_legacy_domain.sql`, remove a legacy table or activate W01.

The canonical implementation is `deploy/deploy.sh`. The script is fail-closed:
it accepts only a clean `main` checkout at its configured upstream commit,
builds from a clean `.next`, uses a unique release directory and stops at the
first failed backup, migration, runtime, journal or evidence assertion.

## Preconditions

Attach these gates to the Release A change record before running the script:

1. Full unit, TypeScript, lint, clean production build and production-build E2E
   results for the exact Git SHA.
2. Fresh migration replay and upgrade from the currently deployed schema in a
   disposable PostgreSQL 16 database.
3. Independent Product, Architecture, Security/Data and Operations `ship`
   votes.
4. `DEBRIEF_ENGINE=disabled`; the W01 Hub references are not cut over.
5. `MENTORSHIP_WRITES_ENABLED` remains false until its consent gate is approved.
6. `SESSION_TRANSCRIPT_WRITES_ENABLED` remains false until its consent and
   retention gate is approved.
7. `CALCOM_SESSION_INGEST_ENABLED` is absent or false; Cal.com ingestion stays
   disabled until its relationship grant and attendee-confirmation gate exists.
8. `NOTIFICATION_OUTBOX_WORKER_ENABLED=true` and
   `SUPPORT_PREVIEW_RETENTION_WORKER_ENABLED=true` are explicitly present for
   the one long-lived Node runtime.
9. `AUTH_URL=https://wepac.pt` is explicitly present and matches the canonical
   production host enforced by the deploy script.
10. `wepac.service`, `rvs-backup@wepac.timer` and the existing backup/restore
   drill are green.

Do not deploy the new 41-table `SPOT_CHECK_TABLES` server value before Release A
migrations exist: several target tables do not exist in the old schema and the
pre-migration restore drill would correctly fail. The tracked `rvs-backups`
example may land first, but `/etc/rvs-backups/wepac.env` changes only after
Release A is running and before its required scheduled-backup stability proof.

## Automated cutover

From the clean, up-to-date `main` checkout:

```bash
./deploy/deploy.sh
```

The script performs this sequence:

1. Clean build and package-level denial of retired Prisma models/table maps.
2. Record exact Git SHA, Next.js `BUILD_ID`, Prisma version, Release B SQL
   checksum and generated-client schema checksum in the release.
3. Generate the Linux Prisma client in a staging directory, then atomically
   promote it to a unique immutable release path. Existing release paths are
   never overwritten or automatically pruned.
4. Install the reviewed path/query/referrer-free Nginx configuration, validate
   and reload it, and prove the live virtual host uses the safe access format,
   suppresses bearer-bearing error URLs and pins the canonical upstream Host.
   A validation or reload failure restores the previous configuration.
5. Record the exact previous symlink, stop the backup timer and application,
   prove no other connection remains to the WEPAC database and keep the service
   quiesced through backup and migrations.
6. Run one fresh `rvs-backups` job, require both `SUCCESS` and
   `restore-drill OK`, hold its exact artifact outside daily/weekly rotation,
   checksum it and prove the held plaintext artifact is structurally listable.
   The current procedure stops if the held artifact is encrypted because the
   exact at-rest copy then needs an attended offline-key restore proof.
7. Apply only `prisma migrate deploy`; the Release B SQL is explicitly required
   to remain outside `prisma/migrations`.
8. Idempotently normalize every marked legacy mentor account role while the
   service is stopped. This is required on a retry because Prisma will not rerun
   an already-recorded migration after an application rollback.
9. Assert target tables exist and all nine retired tables remain physical;
   require exact pre/post row-count parity for every table that existed before
   Release A except Prisma's append-only migration ledger, then prove the
   ledger has exactly the repository's successful migration set.
10. Record target and retired-table counts, atomically swap `current`, restart,
   run local and external public/auth-boundary smokes, resnapshot retired counts
   and require exact parity.
11. Require a content-safe service journal with no Prisma/schema/fatal or worker
    cycle-failure marker, prove both background workers started, verify the live
    SHA and `BUILD_ID`, then re-enable the backup timer.

Protected evidence is written under:

```text
/var/backups/wepac/release-a/<timestamp>-<short-sha>/
```

The evidence contains metadata, checksums, counts and protected journals, not
application secrets or participant content.

## Exact application rollback

All Release A migrations must remain backward-compatible with the previous
runtime. The intentional account-role normalization is made reversible by the
hidden physical `users._legacyMentorAccountRole` marker.

Every release manifest declares its account-role contract, and the deploy also
verifies that declaration against the generated Prisma schema of the previous
release. On every failure after the application stop begins, the deploy
script's remote `EXIT` trap performs this exact order while traffic is still
quiesced:

1. stop the target service if it started;
2. only when the previous release is proven to use the legacy
   `member|mentor|admin` contract, restore `role = 'mentor'` where
   `_legacyMentorAccountRole = true AND role = 'member'`; never write `mentor`
   before restarting a target `member|admin` client;
3. atomically restore the recorded previous application symlink;
4. restart and assert the old service;
5. restart the backup timer.

If role restoration or symlink restoration cannot be proven, the trap starts
neither the application nor the backup timer. It leaves both stopped for
attended recovery instead of starting a mismatched code/data pair.

Do not roll Prisma migrations back during this application rollback. Their
physical changes are Release-A-compatible with the old process. Do not clear
the marker: it is the exact, non-inferred rollback set.

For a later manual rollback while Release A is still the physical database
contract, first stop `wepac.service`, prove the destination release's generated
Prisma `UserRole` contract, use the marker-qualified update only for a legacy
destination, switch to the exact recorded release and only then restart. A
rollback after Release B requires the full database restore in the Release B
runbook; the marker and old physical contract no longer exist.

## Post-cutover stability gate

The deploy script reports `automated_cutover_passed_pending_authenticated_smoke`;
it does not describe Release A as complete. Before the cutover is approved, and
before Release B can be scheduled:

- run authenticated, read-only browser smokes for Dashboard, Life Map,
  Strategic Plan, Trails, Goals, Actions, Sessions, Notifications, Messages and
  the authorized admin lists;
- run the retired-runtime contract test and retain the generated-client proof;
  together they prove the shipped ORM cannot name a retired model/table;
- confirm the target smokes caused no retired-table row-count change and inspect
  the bounded service journal for schema/query errors;
- change only the safe deployed `SPOT_CHECK_TABLES` field to the exact 41-table
  value in the Release B runbook, then complete at least one scheduled backup
  cycle whose restore drill reports all 41 tables with equal counts;
- verify W01 remains disabled and observe Release A through the agreed stability
  interval.

Any authenticated path error, legacy count delta, missing backup table, restore
mismatch, relevant journal error or SHA/`BUILD_ID` mismatch is a blocking veto.
Release B remains a separately attended and approved maintenance operation.
