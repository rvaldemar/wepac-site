# Release B legacy-domain contraction runbook

This is the production procedure for the destructive Release B operation
defined by [`legacy-contract-removal.md`](../architecture/legacy-contract-removal.md).
It does not authorize a production run by itself. Release B may run only after
the change record has explicit Product, Architecture, Security/Data and
Operations approval and every gate below is green.

The application remains on the Release A runtime throughout this operation.
Release B changes only the physical PostgreSQL contract. Never put
`prisma/release-b/drop_legacy_domain.sql` under `prisma/migrations`, never run
the seed against production and never run the E2E suite against production.

## Stop conditions

Stop without applying the contraction if any of these is true:

- Release A is not the currently running, approved and stable release.
- A deploy, worker, webhook consumer or other application writer cannot be
  quiesced for the whole maintenance window.
- The deployed contraction file does not match the SHA-256 approved in the
  Release B change record.
- The exact Release A table inventory differs from this runbook.
- Any `legacy_inference` or `reviewRequired = true` count is non-zero.
- Any `users.role = 'mentor'` row remains after Release A.
- The live deletion counts have not been reviewed and accepted in the change
  record.
- The external `rvs-backups` source config and the server config still name a
  retired table.
- The quiesced pre-contract artifact is not outside automatic rotation, does
  not have a recorded checksum, or has no successful restore proof.
- The Release A application directory or the pre-contract database artifact is
  unavailable for rollback.

If the SQL client fails before `COMMIT`, its transaction must roll back; do not
blindly rerun it. Recheck the Release A inventory and preserved counts first.
After a successful `COMMIT`, rollback is always a database restore plus the
Release A application. A symlink change alone cannot restore the old physical
contract.

## Approved destructive inventory

Only the following destruction is authorized. Any proposed change to this list
requires a new SQL review, checksum and change-record approval.

| Kind | Exact objects or rows |
| --- | --- |
| Rows | `session_debriefs` rows whose `contractVersion` is null or is not exactly `wepac-session-debrief-v3` |
| Columns on retained tables | `beta_signups.packSlug`; `users._legacyMentorAccountRole`; `session_debriefs.internalEvaluation`, `session_debriefs.resultDocumentHtml`; `sessions.cohortId`, `sessions.notes`, `sessions.notesPublished`, `sessions.sessionType`; `reviewRequired` on `community_packs`, `cycle_enrollments`, `cycle_facilitators`, `mentorships`, `pack_memberships`, `person_connections` and `stage_placements` |
| Tables | `cohort_memberships`, `cohorts`, `comments`, `evaluation_scores`, `evaluations`, `monthly_actions`, `packs`, `strategic_map_scores`, `tasks` |
| Enum types | `CohortStatus`, `EvaluationMoment`, `EvaluationType`, `MemberLevel`, `MemberPhase`, `MembershipRole`, `MembershipStatus`, `SessionType`, `TaskOrigin`, `TaskStatus` |
| Enum values | `legacy_inference` is removed by rebuilding `DomainRecordSource`; the eight affected columns are rewritten and keep the default `explicit`. `mentor` is removed by rebuilding `UserRole`; `users.role` keeps the default `member` |
| Review constraints | `person_connections_legacy_review_check`, `person_connections_review_quarantine_check`, `mentorships_legacy_review_check`, `mentorships_review_quarantine_check`, `community_packs_legacy_review_check`, `community_packs_review_quarantine_check`, `pack_memberships_legacy_review_check`, `pack_memberships_review_quarantine_check`, `cycle_enrollments_legacy_review_check`, `cycle_enrollments_review_quarantine_check`, `cycle_facilitators_legacy_review_check`, `cycle_facilitators_review_quarantine_check`, `stage_placements_legacy_review_check`, `stage_placements_review_quarantine_check` |
| Retired foreign keys | `cohort_memberships_cohortId_fkey`, `cohort_memberships_userId_fkey`, `cohorts_packId_fkey`, `comments_taskId_fkey`, `comments_userId_fkey`, `evaluation_scores_evaluationId_fkey`, `evaluations_evaluatorId_fkey`, `evaluations_userId_fkey`, `monthly_actions_goalId_fkey`, `monthly_actions_strategicPlanId_fkey`, `sessions_cohortId_fkey`, `strategic_map_scores_evaluatorId_fkey`, `strategic_map_scores_userId_fkey`, `tasks_assignedById_fkey`, `tasks_goalId_fkey`, `tasks_membershipId_fkey`, `tasks_sourceSessionId_fkey` |

Dropping a table also drops its remaining table-owned primary keys, indexes and
constraints. The script additionally makes
`session_debriefs.contractVersion` non-null after deleting pre-v3 rows. No
other table, row, column, enum or constraint is authorized for deletion.

## Release A and backup preconditions

Before scheduling the window, attach evidence for all of the following to the
change record:

1. The exact Release A Git SHA, server release directory and Next.js `BUILD_ID`.
2. Release A's full test, TypeScript, lint, build and production-build E2E
   gates, plus a clean migration replay and production-schema upgrade test in a
   disposable PostgreSQL database.
3. A completed Release A stability observation interval that includes at least
   one scheduled backup cycle, green public and authenticated read-only smokes,
   no retired runtime reads or writes and no relevant Prisma/schema errors in
   the service journal. W01 remains disabled.
4. The Release A directory is still present under `/var/www/wepac/releases/`
   and deployments are frozen until Release B is closed or rolled back.
5. Free database and backup-volume capacity is sufficient for a scratch restore
   and a durable copy of the pre-contract artifact.

### Update the external backup contract first

`rvs-backups` is a separate source of truth and is outside this repository.
Before Release B, a separately reviewed change must replace its legacy
`SPOT_CHECK_TABLES` value in both
`tenants/wepac/backup.env.example` and deployed
`/etc/rvs-backups/wepac.env` with this exact, space-separated value:

```text
_prisma_migrations actions agreements beta_signups brands calcom_booking_references community_packs conversation_participants conversations cycle_enrollments cycle_facilitators cycles departments disciplines email_outbox events goals leads life_plan_versions life_plans messages mentorships notifications pack_memberships password_reset_tokens payments person_connections sem_nome_tickets session_attendees session_debriefs sessions stage_placements strategic_plans support_preview_audit_events support_preview_grants ticket_check_logs ticket_tiers ticketing_admins tickets trails users
```

This removes the retired `cohort_memberships` and `evaluations` checks and makes
the backup restore drill cover every preserved table. Do not print or copy the
rest of `/etc/rvs-backups/wepac.env`; it contains backup credentials. Verify
only this safe field before the window:

```bash
ssh deploy@77.42.82.10 \
  "sudo bash -c '. /etc/rvs-backups/wepac.env; printf \"%s\\n\" \"\$SPOT_CHECK_TABLES\"'"
```

The output must match the block above byte for byte. The external-repository
commit and the server-config change are mandatory Release B evidence; this
runbook does not make either change.

## Begin the maintenance window

Use one attended Bash session on the production host. Never enable shell
tracing and never echo `DATABASE_URL`.

```bash
ssh deploy@77.42.82.10
bash
set -euo pipefail
umask 077

RUN_ID="$(date -u +%Y%m%dT%H%M%SZ)"
WINDOW_STARTED_AT="$(date -u --iso-8601=seconds)"
EVIDENCE_DIR="/var/backups/wepac/release-b/${RUN_ID}"
install -d -m 700 "$EVIDENCE_DIR"
touch "$EVIDENCE_DIR/window-start.marker"

RELEASE_A_DIR="$(readlink -f /var/www/wepac/current)"
CONTRACT_SQL="$RELEASE_A_DIR/prisma/release-b/drop_legacy_domain.sql"
test -d "$RELEASE_A_DIR"
test -f "$RELEASE_A_DIR/.next/BUILD_ID"
test -f "$RELEASE_A_DIR/RELEASE_GIT_SHA"
test -f "$RELEASE_A_DIR/RELEASE_BUILD_ID"
test -f "$RELEASE_A_DIR/RELEASE_MANIFEST"
test -f "$CONTRACT_SQL"

APPROVED_RELEASE_A_GIT_SHA='<40 lowercase hex characters from approved Release A>'
[[ "$APPROVED_RELEASE_A_GIT_SHA" =~ ^[0-9a-f]{40}$ ]]
test "$(cat "$RELEASE_A_DIR/RELEASE_GIT_SHA")" = \
  "$APPROVED_RELEASE_A_GIT_SHA"
test "$(cat "$RELEASE_A_DIR/RELEASE_BUILD_ID")" = \
  "$(cat "$RELEASE_A_DIR/.next/BUILD_ID")"
test "$(awk -F= '$1 == "git_sha" { print $2 }' \
  "$RELEASE_A_DIR/RELEASE_MANIFEST")" = "$APPROVED_RELEASE_A_GIT_SHA"

APP_ENV_FILE=/var/www/wepac/shared/.env.production
_raw_line="$(grep -E '^DATABASE_URL=' "$APP_ENV_FILE" | tail -n1)"
test -n "$_raw_line"
DATABASE_URL="${_raw_line#DATABASE_URL=}"
DATABASE_URL="${DATABASE_URL%\"}"; DATABASE_URL="${DATABASE_URL#\"}"
DATABASE_URL="${DATABASE_URL%\'}"; DATABASE_URL="${DATABASE_URL#\'}"
unset _raw_line
export DATABASE_URL

{
  printf 'run_id=%s\n' "$RUN_ID"
  printf 'window_started_at=%s\n' "$WINDOW_STARTED_AT"
  printf 'release_a_dir=%s\n' "$RELEASE_A_DIR"
  printf 'git_sha=%s\n' "$APPROVED_RELEASE_A_GIT_SHA"
  printf 'build_id=%s\n' "$(cat "$RELEASE_A_DIR/.next/BUILD_ID")"
} > "$EVIDENCE_DIR/release-a.txt"
```

The Git SHA and `BUILD_ID` must agree across the approved change record, the
immutable release evidence and the live standalone build. Never infer either
value from the directory timestamp.

Freeze deployments, disable the backup timer for the bounded window, stop the
application and prove there are no other connections to its database:

```bash
sudo systemctl stop rvs-backup@wepac.timer
test "$(sudo systemctl is-active rvs-backup@wepac.service || true)" != active

sudo systemctl stop wepac.service
test "$(sudo systemctl is-active wepac.service || true)" = inactive

OTHER_DB_CONNECTIONS="$(psql "$DATABASE_URL" -X -At \
  --set=ON_ERROR_STOP=on \
  -c "SELECT count(*) FROM pg_stat_activity WHERE datname = current_database() AND pid <> pg_backend_pid()")"
test "$OTHER_DB_CONNECTIONS" = 0
```

If the last assertion fails, inspect connection metadata without printing SQL
text, identify the writer and stop. Do not terminate an unexplained session:

```bash
psql "$DATABASE_URL" -X --set=ON_ERROR_STOP=on -P pager=off -c \
  "SELECT pid, usename, application_name, client_addr, state, xact_start, query_start
     FROM pg_stat_activity
    WHERE datname = current_database() AND pid <> pg_backend_pid()
    ORDER BY pid"
```

### Pin the approved SQL checksum and timeout contract

Set `APPROVED_SQL_SHA256` from the reviewed Release B change record, not from
the server being checked. The exact deployed file must match it.

```bash
APPROVED_SQL_SHA256='<64 lowercase hex characters from approved review>'
[[ "$APPROVED_SQL_SHA256" =~ ^[0-9a-f]{64}$ ]]

DEPLOYED_SQL_SHA256="$(sha256sum "$CONTRACT_SQL" | awk '{print $1}')"
test "$DEPLOYED_SQL_SHA256" = "$APPROVED_SQL_SHA256"
test "$(awk -F= '$1 == "release_b_sql_sha256" { print $2 }' \
  "$RELEASE_A_DIR/RELEASE_MANIFEST")" = "$APPROVED_SQL_SHA256"
printf '%s  %s\n' "$DEPLOYED_SQL_SHA256" "$CONTRACT_SQL" \
  > "$EVIDENCE_DIR/contraction-sql.sha256"

grep -Fx "BEGIN;" "$CONTRACT_SQL"
grep -Fx "SET LOCAL lock_timeout = '5s';" "$CONTRACT_SQL"
grep -Fx "SET LOCAL statement_timeout = '5min';" "$CONTRACT_SQL"
grep -Fx "COMMIT;" "$CONTRACT_SQL"
```

The file owns one transaction, a 5-second lock timeout and a 5-minute statement
timeout. The apply command below adds a 7-minute client-side ceiling. Do not
remove or relax any of these limits during the window.

## Capture the exact pre-contract state

Define the only allowed table sets. `_prisma_migrations` is data too and is
therefore included in the preserved manifest.

```bash
PRESERVED_TABLES=(
  _prisma_migrations actions agreements beta_signups brands
  calcom_booking_references community_packs
  conversation_participants conversations cycle_enrollments cycle_facilitators
  cycles departments disciplines email_outbox events goals leads
  life_plan_versions life_plans messages mentorships notifications
  pack_memberships password_reset_tokens payments person_connections
  sem_nome_tickets session_attendees session_debriefs sessions stage_placements
  strategic_plans support_preview_audit_events support_preview_grants
  ticket_check_logs ticket_tiers ticketing_admins tickets trails users
)

RETIRED_TABLES=(
  cohort_memberships cohorts comments evaluation_scores evaluations
  monthly_actions packs strategic_map_scores tasks
)

snapshot_table_names() {
  psql "$DATABASE_URL" -X -At --set=ON_ERROR_STOP=on -c \
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
}

compare_table_set() {
  local phase="$1"; shift
  printf '%s\n' "$@" | LC_ALL=C sort > "$EVIDENCE_DIR/${phase}-expected-tables.txt"
  snapshot_table_names > "$EVIDENCE_DIR/${phase}-actual-tables.txt"
  diff -u "$EVIDENCE_DIR/${phase}-expected-tables.txt" \
    "$EVIDENCE_DIR/${phase}-actual-tables.txt"
}

compare_table_set pre "${PRESERVED_TABLES[@]}" "${RETIRED_TABLES[@]}"
```

An empty `diff` is required. This is the exact Release A physical table
inventory; an extra or missing table is a stop condition.

### Zero-count gates

Capture each source count and require the aggregate to be zero:

```bash
psql "$DATABASE_URL" -X --csv --set=ON_ERROR_STOP=on <<'SQL' \
  > "$EVIDENCE_DIR/pre-legacy-inference.csv"
SELECT * FROM (
  SELECT 'person_connections' AS table_name, count(*) AS row_count FROM person_connections WHERE source = 'legacy_inference'
  UNION ALL SELECT 'mentorships', count(*) FROM mentorships WHERE source = 'legacy_inference'
  UNION ALL SELECT 'community_packs', count(*) FROM community_packs WHERE source = 'legacy_inference'
  UNION ALL SELECT 'pack_memberships', count(*) FROM pack_memberships WHERE source = 'legacy_inference'
  UNION ALL SELECT 'cycles', count(*) FROM cycles WHERE source = 'legacy_inference'
  UNION ALL SELECT 'cycle_enrollments', count(*) FROM cycle_enrollments WHERE source = 'legacy_inference'
  UNION ALL SELECT 'cycle_facilitators', count(*) FROM cycle_facilitators WHERE source = 'legacy_inference'
  UNION ALL SELECT 'stage_placements', count(*) FROM stage_placements WHERE source = 'legacy_inference'
) AS counts ORDER BY table_name;
SQL

LEGACY_INFERENCE_TOTAL="$(psql "$DATABASE_URL" -X -At --set=ON_ERROR_STOP=on -c "
  SELECT
    (SELECT count(*) FROM person_connections WHERE source = 'legacy_inference') +
    (SELECT count(*) FROM mentorships WHERE source = 'legacy_inference') +
    (SELECT count(*) FROM community_packs WHERE source = 'legacy_inference') +
    (SELECT count(*) FROM pack_memberships WHERE source = 'legacy_inference') +
    (SELECT count(*) FROM cycles WHERE source = 'legacy_inference') +
    (SELECT count(*) FROM cycle_enrollments WHERE source = 'legacy_inference') +
    (SELECT count(*) FROM cycle_facilitators WHERE source = 'legacy_inference') +
    (SELECT count(*) FROM stage_placements WHERE source = 'legacy_inference')")"
test "$LEGACY_INFERENCE_TOTAL" = 0

psql "$DATABASE_URL" -X --csv --set=ON_ERROR_STOP=on <<'SQL' \
  > "$EVIDENCE_DIR/pre-review-required.csv"
SELECT * FROM (
  SELECT 'person_connections' AS table_name, count(*) AS row_count FROM person_connections WHERE "reviewRequired" = true
  UNION ALL SELECT 'mentorships', count(*) FROM mentorships WHERE "reviewRequired" = true
  UNION ALL SELECT 'community_packs', count(*) FROM community_packs WHERE "reviewRequired" = true
  UNION ALL SELECT 'pack_memberships', count(*) FROM pack_memberships WHERE "reviewRequired" = true
  UNION ALL SELECT 'cycle_enrollments', count(*) FROM cycle_enrollments WHERE "reviewRequired" = true
  UNION ALL SELECT 'cycle_facilitators', count(*) FROM cycle_facilitators WHERE "reviewRequired" = true
  UNION ALL SELECT 'stage_placements', count(*) FROM stage_placements WHERE "reviewRequired" = true
) AS counts ORDER BY table_name;
SQL

REVIEW_REQUIRED_TOTAL="$(psql "$DATABASE_URL" -X -At --set=ON_ERROR_STOP=on -c "
  SELECT
    (SELECT count(*) FROM person_connections WHERE \"reviewRequired\" = true) +
    (SELECT count(*) FROM mentorships WHERE \"reviewRequired\" = true) +
    (SELECT count(*) FROM community_packs WHERE \"reviewRequired\" = true) +
    (SELECT count(*) FROM pack_memberships WHERE \"reviewRequired\" = true) +
    (SELECT count(*) FROM cycle_enrollments WHERE \"reviewRequired\" = true) +
    (SELECT count(*) FROM cycle_facilitators WHERE \"reviewRequired\" = true) +
    (SELECT count(*) FROM stage_placements WHERE \"reviewRequired\" = true)")"
test "$REVIEW_REQUIRED_TOTAL" = 0
```

Both assertions must print no error and both CSV files must show only zeroes.
There is no automatic relabelling, activation or deletion path for a non-zero
result; it requires a separate explicit data decision.

Release A must also have converted the retired account-role value without
changing any Person or Mentorship edge:

```bash
MENTOR_ACCOUNT_ROLE_TOTAL="$(psql "$DATABASE_URL" -X -At \
  --set=ON_ERROR_STOP=on -c \
  "SELECT count(*) FROM users WHERE role::text = 'mentor'")"
test "$MENTOR_ACCOUNT_ROLE_TOTAL" = 0

MARKED_INVALID_ROLE_TOTAL="$(psql "$DATABASE_URL" -X -At \
  --set=ON_ERROR_STOP=on -c \
  "SELECT count(*) FROM users
    WHERE \"_legacyMentorAccountRole\" = true
      AND role::text NOT IN ('member', 'admin')")"
test "$MARKED_INVALID_ROLE_TOTAL" = 0
```

A marker-qualified account may legitimately have been promoted to `admin`
during Release A. That promotion is preserved: neither the Release A rollback
nor Release B may demote it. The marker records historical rollback provenance,
not permanent account authority.

### Live deletion manifest

Capture the exact rows and populated old columns that Release B will discard:

```bash
psql "$DATABASE_URL" -X --csv --set=ON_ERROR_STOP=on <<'SQL' \
  > "$EVIDENCE_DIR/pre-destructive-counts.csv"
SELECT * FROM (
  SELECT 'table.cohort_memberships' AS object, count(*) AS affected_rows FROM cohort_memberships
  UNION ALL SELECT 'table.cohorts', count(*) FROM cohorts
  UNION ALL SELECT 'table.comments', count(*) FROM comments
  UNION ALL SELECT 'table.evaluation_scores', count(*) FROM evaluation_scores
  UNION ALL SELECT 'table.evaluations', count(*) FROM evaluations
  UNION ALL SELECT 'table.monthly_actions', count(*) FROM monthly_actions
  UNION ALL SELECT 'table.packs', count(*) FROM packs
  UNION ALL SELECT 'table.strategic_map_scores', count(*) FROM strategic_map_scores
  UNION ALL SELECT 'table.tasks', count(*) FROM tasks
  UNION ALL SELECT 'row.session_debriefs.pre_v3', count(*) FROM session_debriefs WHERE "contractVersion" IS DISTINCT FROM 'wepac-session-debrief-v3'
  UNION ALL SELECT 'row.session_debriefs.retained_v3', count(*) FROM session_debriefs WHERE "contractVersion" = 'wepac-session-debrief-v3'
  UNION ALL SELECT 'column.beta_signups.packSlug.non_null', count(*) FROM beta_signups WHERE "packSlug" IS NOT NULL
  UNION ALL SELECT 'column.users.role.member', count(*) FROM users WHERE role::text = 'member'
  UNION ALL SELECT 'column.users.role.admin', count(*) FROM users WHERE role::text = 'admin'
  UNION ALL SELECT 'column.users.role.mentor', count(*) FROM users WHERE role::text = 'mentor'
  UNION ALL SELECT 'column.users._legacyMentorAccountRole.true', count(*) FROM users WHERE "_legacyMentorAccountRole" = true
  UNION ALL SELECT 'column.session_debriefs.internalEvaluation.non_null', count(*) FROM session_debriefs WHERE "internalEvaluation" IS NOT NULL
  UNION ALL SELECT 'column.session_debriefs.resultDocumentHtml.non_null', count(*) FROM session_debriefs WHERE "resultDocumentHtml" IS NOT NULL
  UNION ALL SELECT 'column.sessions.cohortId.non_null', count(*) FROM sessions WHERE "cohortId" IS NOT NULL
  UNION ALL SELECT 'column.sessions.notes.non_null', count(*) FROM sessions WHERE notes IS NOT NULL
  UNION ALL SELECT 'column.sessions.notesPublished.true', count(*) FROM sessions WHERE "notesPublished" = true
  UNION ALL SELECT 'column.sessions.sessionType.non_null', count(*) FROM sessions WHERE "sessionType" IS NOT NULL
) AS counts ORDER BY object;
SQL
```

The Product/Data approver must accept these exact counts in the change record,
including the full account-role distribution and the marker-qualified rollback
population. A count being larger or smaller than an earlier estimate is a stop
condition, not permission to continue.

If any gate stops the operation before the contraction is applied, leave the
database unchanged, start the recorded Release A application and backup timer,
repeat the HTTP smoke below and close the maintenance window as an aborted
Release B attempt. Keep its evidence directory for review.

### Preserved-table count manifests

Capture both raw pre-contract counts and the expected post-contract counts. The
only authorized row-count delta in a retained table is the explicit deletion of
pre-v3 `session_debriefs`, so its expected post count is the number of exact v3
rows. Every other preserved table must have strict parity.

```bash
make_preserved_manifest() {
  local mode="$1" destination="$2" table count
  : > "$destination"
  for table in "${PRESERVED_TABLES[@]}"; do
    if [ "$mode" = expected-post ] && [ "$table" = session_debriefs ]; then
      count="$(psql "$DATABASE_URL" -X -At --set=ON_ERROR_STOP=on -c \
        "SELECT count(*) FROM public.\"session_debriefs\" WHERE \"contractVersion\" = 'wepac-session-debrief-v3'")"
    else
      count="$(psql "$DATABASE_URL" -X -At --set=ON_ERROR_STOP=on -c \
        "SELECT count(*) FROM public.\"${table}\"")"
    fi
    printf '%s\t%s\n' "$table" "$count" >> "$destination"
  done
}

make_preserved_manifest raw \
  "$EVIDENCE_DIR/pre-preserved-counts.tsv"
make_preserved_manifest expected-post \
  "$EVIDENCE_DIR/expected-post-preserved-counts.tsv"
```

## Create and prove the durable pre-contract backup

The application is still stopped, so this artifact and the manifests describe
one quiesced state. Start one manual `rvs-backups` run while its timer remains
stopped. Its updated spot-check list must restore and compare all preserved
tables.

```bash
PRE_BACKUP_STARTED_AT="$(date -u --iso-8601=seconds)"
touch "$EVIDENCE_DIR/pre-backup.marker"

sudo systemctl start rvs-backup@wepac.service
test "$(sudo systemctl show rvs-backup@wepac.service --property=Result --value)" = success

sudo journalctl -u rvs-backup@wepac.service \
  --since "$PRE_BACKUP_STARTED_AT" --no-pager \
  > "$EVIDENCE_DIR/pre-backup-journal.txt"
grep -F '[backup:wepac] SUCCESS' "$EVIDENCE_DIR/pre-backup-journal.txt"
grep -F 'restore-drill OK:' "$EVIDENCE_DIR/pre-backup-journal.txt"

mapfile -t PRE_BACKUP_CANDIDATES < <(
  find /var/backups/wepac/daily -maxdepth 1 -type f \
    -name 'wepac_production_*.dump*' \
    -newer "$EVIDENCE_DIR/pre-backup.marker" -print
)
test "${#PRE_BACKUP_CANDIDATES[@]}" = 1
PRE_BACKUP_SOURCE="${PRE_BACKUP_CANDIDATES[0]}"
PRE_BACKUP_HOLD="$EVIDENCE_DIR/$(basename "$PRE_BACKUP_SOURCE")"

cp --reflink=auto --preserve=mode,timestamps -- \
  "$PRE_BACKUP_SOURCE" "$PRE_BACKUP_HOLD"
chmod 600 "$PRE_BACKUP_HOLD"
cmp --silent "$PRE_BACKUP_SOURCE" "$PRE_BACKUP_HOLD"
PRE_BACKUP_SOURCE_SHA256="$(sha256sum "$PRE_BACKUP_SOURCE" | awk '{print $1}')"
PRE_BACKUP_HOLD_SHA256="$(sha256sum "$PRE_BACKUP_HOLD" | awk '{print $1}')"
test "$PRE_BACKUP_SOURCE_SHA256" = "$PRE_BACKUP_HOLD_SHA256"
printf 'source_sha256=%s\nheld_sha256=%s\n' \
  "$PRE_BACKUP_SOURCE_SHA256" "$PRE_BACKUP_HOLD_SHA256" \
  > "$EVIDENCE_DIR/pre-contract-copy-proof.txt"
printf '%s  %s\n' "$PRE_BACKUP_HOLD_SHA256" "$PRE_BACKUP_HOLD" \
  > "$EVIDENCE_DIR/pre-contract-artifact.sha256"
sha256sum --check "$EVIDENCE_DIR/pre-contract-artifact.sha256"
pg_restore --list "$PRE_BACKUP_HOLD" >/dev/null 2>&1 || \
  test "${PRE_BACKUP_HOLD##*.}" = age
```

`$PRE_BACKUP_HOLD` is outside `daily/` and `weekly/` and is therefore outside
the automatic 7-daily/4-weekly pruning path. Do not delete it during this
procedure or after success; retention ends only by a separate, dated decision
after the rollback horizon.

The backup journal is the restore-and-count-parity proof for the exact source
artifact, and `cmp` plus SHA-256 proves the held copy is byte-identical. If the
held artifact ends in `.age`, additionally prove that exact at-rest copy can be
decrypted and restored before applying Release B:

```bash
# Rui/operator supplies the ephemeral private-key file directly. Never display,
# paste into the shell command, or store it in the evidence directory.
EPHEMERAL_KEY_FILE=/tmp/ephemeral-wepac-release-b-key.txt
/opt/rvs-backups/manual/restore_manual_verify.sh \
  wepac "$PRE_BACKUP_HOLD" "$EPHEMERAL_KEY_FILE" \
  | tee "$EVIDENCE_DIR/pre-contract-encrypted-restore-proof.txt"
grep -F '[manual-verify] SUCCESS:' \
  "$EVIDENCE_DIR/pre-contract-encrypted-restore-proof.txt"
test ! -e "$EPHEMERAL_KEY_FILE"
unset EPHEMERAL_KEY_FILE
```

The manual verifier deletes the ephemeral key and scratch database. If key
custody cannot supply a tested key when encryption is enabled, Release B is
blocked.

## Apply the contraction

Run the reviewed file once. `pipefail`, `ON_ERROR_STOP`, the SQL transaction and
the outer timeout are all load-bearing.

```bash
APPLY_STARTED_AT="$(date -u --iso-8601=seconds)"

timeout --signal=INT --kill-after=30s 7m \
  psql "$DATABASE_URL" -X --echo-errors --set=ON_ERROR_STOP=on \
  --file="$CONTRACT_SQL" 2>&1 \
  | tee "$EVIDENCE_DIR/contraction-apply.txt"

APPLY_FINISHED_AT="$(date -u --iso-8601=seconds)"
printf 'apply_started_at=%s\napply_finished_at=%s\n' \
  "$APPLY_STARTED_AT" "$APPLY_FINISHED_AT" \
  > "$EVIDENCE_DIR/contraction-timing.txt"
```

Any non-zero exit is a stop. Keep the application and backup timer stopped.
Because the file commits only at the end, first run the pre table-set and raw
manifest checks again. If both still match, the failed transaction rolled back
and no database restore is needed. If either differs, treat the outcome as an
unknown committed state and use the full restore procedure below.

## Post-contract gates before reopening traffic

### Physical inventory and count parity

```bash
compare_table_set post "${PRESERVED_TABLES[@]}"

make_preserved_manifest raw \
  "$EVIDENCE_DIR/post-preserved-counts.tsv"
diff -u "$EVIDENCE_DIR/expected-post-preserved-counts.tsv" \
  "$EVIDENCE_DIR/post-preserved-counts.tsv"
```

Both diffs must be empty. Then verify the intentional contract details:

```bash
psql "$DATABASE_URL" -X --set=ON_ERROR_STOP=on -P pager=off <<'SQL' \
  > "$EVIDENCE_DIR/post-contract-assertions.txt"
SELECT count(*) AS retired_tables_still_present
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = ANY (ARRAY[
    'cohort_memberships','cohorts','comments','evaluation_scores','evaluations',
    'monthly_actions','packs','strategic_map_scores','tasks'
  ]);

SELECT count(*) AS retired_columns_still_present
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (table_name, column_name) IN (
    ('beta_signups','packSlug'),
    ('users','_legacyMentorAccountRole'),
    ('session_debriefs','internalEvaluation'),
    ('session_debriefs','resultDocumentHtml'),
    ('sessions','cohortId'),
    ('sessions','notes'),
    ('sessions','notesPublished'),
    ('sessions','sessionType'),
    ('community_packs','reviewRequired'),
    ('cycle_enrollments','reviewRequired'),
    ('cycle_facilitators','reviewRequired'),
    ('mentorships','reviewRequired'),
    ('pack_memberships','reviewRequired'),
    ('person_connections','reviewRequired'),
    ('stage_placements','reviewRequired')
  );

SELECT count(*) AS retired_types_still_present
FROM pg_type
WHERE typnamespace = 'public'::regnamespace
  AND typname = ANY (ARRAY[
    'CohortStatus','EvaluationMoment','EvaluationType','MemberLevel','MemberPhase',
    'MembershipRole','MembershipStatus','SessionType','TaskOrigin','TaskStatus',
    'DomainRecordSource_old','DomainRecordSource_new','UserRole_old','UserRole_new'
  ]);

SELECT enumlabel, enumsortorder
FROM pg_enum
WHERE enumtypid = 'public."DomainRecordSource"'::regtype
ORDER BY enumsortorder;

SELECT enumlabel, enumsortorder
FROM pg_enum
WHERE enumtypid = 'public."UserRole"'::regtype
ORDER BY enumsortorder;

SELECT count(*) AS pre_v3_debriefs_remaining
FROM session_debriefs
WHERE "contractVersion" IS DISTINCT FROM 'wepac-session-debrief-v3';

SELECT is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'session_debriefs'
  AND column_name = 'contractVersion';
SQL

cat "$EVIDENCE_DIR/post-contract-assertions.txt"
```

The three `*_still_present`/`*_remaining` counts must be `0`;
`DomainRecordSource` must be exactly `explicit`, `invitation`, `admin`, `system`
in that order; `UserRole` must be exactly `member`, `admin` in that order; and
`contractVersion.is_nullable` must be `NO`.

### Prisma structural diff

Release B is intentionally not in Prisma migration history, so `migrate
status` alone cannot prove the contraction. The live database-to-datamodel diff
is the decisive Prisma gate:

```bash
cd "$RELEASE_A_DIR"
NO_COLOR=1 npx prisma@6.19.2 migrate diff --exit-code \
  --from-url "$DATABASE_URL" \
  --to-schema-datamodel prisma/schema.prisma \
  > "$EVIDENCE_DIR/post-prisma-diff.txt" 2>&1
cat "$EVIDENCE_DIR/post-prisma-diff.txt"
```

Exit code `0` and an empty diff are required. Exit code `2` means schema drift
and requires rollback; do not hand-edit production to make the diff disappear.

### Fresh post-contract backup and restore proof

Keep the application stopped and run the now-updated backup contract again:

```bash
POST_BACKUP_STARTED_AT="$(date -u --iso-8601=seconds)"
sudo systemctl start rvs-backup@wepac.service
test "$(sudo systemctl show rvs-backup@wepac.service --property=Result --value)" = success

sudo journalctl -u rvs-backup@wepac.service \
  --since "$POST_BACKUP_STARTED_AT" --no-pager \
  > "$EVIDENCE_DIR/post-backup-journal.txt"
grep -F '[backup:wepac] SUCCESS' "$EVIDENCE_DIR/post-backup-journal.txt"
grep -F 'restore-drill OK:' "$EVIDENCE_DIR/post-backup-journal.txt"
```

The `restore-drill OK` line must show all 41 preserved tables with identical
source/restored counts. Any missing table, `ERR` or mismatch is a rollback
condition.

## Start Release A and smoke

The symlink must still identify the recorded Release A directory. Start that
same application and run public, auth-boundary and authenticated read-only
smokes.

```bash
test "$(readlink -f /var/www/wepac/current)" = "$RELEASE_A_DIR"
sudo systemctl start wepac.service
test "$(sudo systemctl is-active wepac.service)" = active

for path in / /wepacker /wepacker/intake /api/auth/session; do
  code="$(curl -sS -o /dev/null -w '%{http_code}' "https://wepac.pt${path}")"
  printf '%s\t%s\n' "$path" "$code" | tee -a "$EVIDENCE_DIR/http-smoke.tsv"
  test "$code" = 200
done

protected_code="$(curl -sS -o /dev/null -w '%{http_code}' \
  https://wepac.pt/wepacker/dashboard)"
printf '/wepacker/dashboard (anonymous)\t%s\n' "$protected_code" \
  | tee -a "$EVIDENCE_DIR/http-smoke.tsv"
case "$protected_code" in 302|303|307|308) ;; *) false ;; esac
```

Using an existing approved test/operator account, make no writes and verify in
the browser that login, Dashboard, Life Map, Strategic Plan, Trails, Actions and
Sessions render. Verify the admin Users and Leads lists if the account has the
capability. Record only pass/fail and the account identifier; do not copy
participant content into the change record.

Scan the bounded service journal for errors without treating a clean HTTP 200
as sufficient proof:

```bash
sudo journalctl -u wepac.service --since "$APPLY_FINISHED_AT" --no-pager \
  > "$EVIDENCE_DIR/post-app-journal.txt"

if grep -Eai \
  'PrismaClient|P20[0-9]{2}|does not exist|unknown (column|field)|unhandled|panic|fatal' \
  "$EVIDENCE_DIR/post-app-journal.txt"; then
  echo 'Release B journal gate failed' >&2
  false
fi
```

Only after every database, backup and application gate is green:

```bash
sudo systemctl start rvs-backup@wepac.timer
test "$(sudo systemctl is-active rvs-backup@wepac.timer)" = active
sudo systemctl list-timers rvs-backup@wepac.timer --no-pager
unset DATABASE_URL
```

Attach the evidence directory inventory and checksums to the change record
without attaching database contents or secrets. Keep the durable pre-contract
artifact protected on the server.

## Rollback after a committed contraction

Rollback is destructive and attended. Use it if any post-contract count,
Prisma, backup, journal or smoke gate fails. Keep the application and backup
timer stopped until the Release A database and application are both restored.

1. Select the held artifact recorded in
   `pre-contract-artifact.sha256`; never substitute a newer scheduled backup.
2. Re-run its checksum check. For `.age`, use the attended verifier with one
   ephemeral key copy, then supply a second ephemeral key copy to decrypt the
   artifact for the actual restore. The verifier deliberately deletes its key
   and plaintext scratch data.
3. Recreate `wepac_production`, restore the pre-contract dump, point the symlink
   at the recorded Release A directory, prove raw count parity, then start the
   app.

```bash
set -euo pipefail
umask 077
sudo systemctl stop rvs-backup@wepac.timer
sudo systemctl stop wepac.service

PRE_BACKUP_HOLD="$(awk 'NR == 1 { print $2 }' \
  "$EVIDENCE_DIR/pre-contract-artifact.sha256")"
test -f "$PRE_BACKUP_HOLD"
sha256sum --check "$EVIDENCE_DIR/pre-contract-artifact.sha256"
RESTORE_ARTIFACT="$PRE_BACKUP_HOLD"
RESTORE_TMP=''
EPHEMERAL_KEY_FILE=''

cleanup_rollback_material() {
  if [ -n "${EPHEMERAL_KEY_FILE:-}" ] && [ -f "$EPHEMERAL_KEY_FILE" ]; then
    if command -v shred >/dev/null 2>&1; then
      shred -u "$EPHEMERAL_KEY_FILE"
    else
      rm -f "$EPHEMERAL_KEY_FILE"
    fi
  fi
  if [ -n "${RESTORE_TMP:-}" ] && [ -d "$RESTORE_TMP" ]; then
    rm -f -- "$RESTORE_TMP/pre-contract.dump"
    rmdir -- "$RESTORE_TMP" 2>/dev/null || true
  fi
}
trap cleanup_rollback_material EXIT

if [[ "$PRE_BACKUP_HOLD" = *.age ]]; then
  # First run restore_manual_verify.sh with an ephemeral key as documented
  # above. Then Rui/operator supplies a fresh ephemeral key file directly for
  # this decryption; never print or persist its contents.
  EPHEMERAL_KEY_FILE=/tmp/ephemeral-wepac-release-b-restore-key.txt
  RESTORE_TMP="$(mktemp -d /var/backups/wepac/release-b/restore.XXXXXX)"
  chmod 700 "$RESTORE_TMP"
  RESTORE_ARTIFACT="$RESTORE_TMP/pre-contract.dump"
  age -d -i "$EPHEMERAL_KEY_FILE" -o "$RESTORE_ARTIFACT" "$PRE_BACKUP_HOLD"
  chmod 600 "$RESTORE_ARTIFACT"
  if command -v shred >/dev/null 2>&1; then
    shred -u "$EPHEMERAL_KEY_FILE"
  else
    rm -f "$EPHEMERAL_KEY_FILE"
  fi
  unset EPHEMERAL_KEY_FILE
fi

pg_restore --list "$RESTORE_ARTIFACT" >/dev/null

psql -U deploy -d postgres -v ON_ERROR_STOP=1 -c \
  "SELECT pg_terminate_backend(pid)
     FROM pg_stat_activity
    WHERE datname = 'wepac_production' AND pid <> pg_backend_pid()"
psql -U deploy -d postgres -v ON_ERROR_STOP=1 -c \
  'DROP DATABASE IF EXISTS "wepac_production"'
psql -U deploy -d postgres -v ON_ERROR_STOP=1 -c \
  'CREATE DATABASE "wepac_production" OWNER "wepac"'
pg_restore --exit-on-error --no-owner --role=wepac \
  -U deploy -d wepac_production "$RESTORE_ARTIFACT"

sudo ln -snf "$RELEASE_A_DIR" /var/www/wepac/current
test "$(readlink -f /var/www/wepac/current)" = "$RELEASE_A_DIR"

make_preserved_manifest raw \
  "$EVIDENCE_DIR/rollback-preserved-counts.tsv"
diff -u "$EVIDENCE_DIR/pre-preserved-counts.tsv" \
  "$EVIDENCE_DIR/rollback-preserved-counts.tsv"
compare_table_set rollback "${PRESERVED_TABLES[@]}" "${RETIRED_TABLES[@]}"

cd "$RELEASE_A_DIR"
NO_COLOR=1 npx prisma@6.19.2 migrate status \
  > "$EVIDENCE_DIR/rollback-migrate-status.txt" 2>&1

# Prove the restored database is itself backuppable before reopening traffic.
ROLLBACK_BACKUP_STARTED_AT="$(date -u --iso-8601=seconds)"
sudo systemctl start rvs-backup@wepac.service
test "$(sudo systemctl show rvs-backup@wepac.service --property=Result --value)" = success
sudo journalctl -u rvs-backup@wepac.service \
  --since "$ROLLBACK_BACKUP_STARTED_AT" --no-pager \
  > "$EVIDENCE_DIR/rollback-backup-journal.txt"
grep -F '[backup:wepac] SUCCESS' "$EVIDENCE_DIR/rollback-backup-journal.txt"
grep -F 'restore-drill OK:' "$EVIDENCE_DIR/rollback-backup-journal.txt"

sudo systemctl start wepac.service
test "$(sudo systemctl is-active wepac.service)" = active
sudo systemctl start rvs-backup@wepac.timer
test "$(sudo systemctl is-active rvs-backup@wepac.timer)" = active

if [ -n "$RESTORE_TMP" ]; then
  rm -f -- "$RESTORE_ARTIFACT"
  rmdir -- "$RESTORE_TMP"
fi
trap - EXIT
unset DATABASE_URL
```

Repeat the public, auth-boundary, authenticated read-only and journal smokes
from the previous section. If restore, count parity, migration status, backup
proof or smoke fails, leave `wepac.service` stopped, keep the artifact intact
and escalate; do not attempt an improvised data repair in production.

## Evidence checklist

Release B is complete only when the change record contains or references:

- Release A Git SHA, release directory, `BUILD_ID` and stability evidence;
- approved and deployed contraction SQL SHA-256;
- external `rvs-backups` commit plus deployed spot-check confirmation;
- exact pre table set, zero-count gate CSVs, zero retired account roles and
  accepted deletion counts;
- raw pre and expected-post preserved-table manifests;
- durable pre-contract artifact path, checksum and restore proof;
- successful transactional apply log and timestamps;
- exact post table set, preserved-count parity and contract assertions;
- empty Prisma database-to-datamodel diff;
- successful post-contract backup/restore journal;
- public, auth-boundary and authenticated read-only smoke results;
- content-safe journal review and re-enabled backup timer; and
- the explicit decision to close or execute rollback.
