#!/usr/bin/env bash
# ==============================================================================
# Release A deploy for WEPAC.
#
# This script deliberately does not execute the destructive Release B SQL. It
# builds one immutable release, proves a quiesced pre-migration backup/restore,
# applies only Prisma migrations, atomically swaps the application symlink and
# rolls the application back on every failure after quiesce.
# ==============================================================================

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${PROJECT_DIR}"

SERVER="deploy@77.42.82.10"
APP_DIR="/var/www/wepac"
DOMAIN="wepac.pt"
PRISMA_VERSION="6.19.2"
SSH_OPTIONS=(-o ServerAliveInterval=30 -o ServerAliveCountMax=20)

for command_name in git npm rsync ssh shasum; do
  if ! command -v "${command_name}" >/dev/null 2>&1; then
    echo "Required command is missing: ${command_name}" >&2
    exit 1
  fi
done

if [[ -n "$(git status --porcelain --untracked-files=all)" ]]; then
  echo "Refusing deployment from a dirty worktree." >&2
  exit 1
fi

BRANCH="$(git branch --show-current)"
if [[ "${BRANCH}" != "main" ]]; then
  echo "Refusing production deployment from branch '${BRANCH:-detached}'. Merge to main first." >&2
  exit 1
fi

GIT_SHA="$(git rev-parse --verify 'HEAD^{commit}')"
if [[ ! "${GIT_SHA}" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Could not resolve an exact Git commit." >&2
  exit 1
fi

UPSTREAM_REMOTE="$(git config --get branch.main.remote || true)"
if [[ -z "${UPSTREAM_REMOTE}" || "${UPSTREAM_REMOTE}" = . ]]; then
  echo "Refusing deployment because main has no fetchable upstream remote." >&2
  exit 1
fi
git fetch --quiet --no-tags "${UPSTREAM_REMOTE}"

if ! UPSTREAM_SHA="$(git rev-parse --verify '@{upstream}^{commit}' 2>/dev/null)"; then
  echo "Refusing deployment because main has no configured upstream." >&2
  exit 1
fi
if [[ "${GIT_SHA}" != "${UPSTREAM_SHA}" ]]; then
  echo "Refusing deployment because main does not equal its configured upstream." >&2
  exit 1
fi

# Release B must remain an attended, separately approved operation. Its SQL is
# packaged for later checksum review, but it must never enter Prisma history.
if find prisma/migrations -type f -name 'drop_legacy_domain.sql' -print -quit | grep -q .; then
  echo "Release B SQL was found under prisma/migrations; refusing deployment." >&2
  exit 1
fi
test -f prisma/release-b/drop_legacy_domain.sql
test -f deploy/nginx.conf

# Bearer credentials exist in invite paths and reset query strings. The WEPAC
# virtual host must use the path/query-free access format before any release is
# allowed to reach production.
test "$(grep -Ec '^[[:space:]]*access_log[[:space:]]+/var/log/nginx/wepac_access\.log[[:space:]]+wepac_safe;' deploy/nginx.conf)" -eq 3
test "$(grep -Ec '^[[:space:]]*error_log[[:space:]]+/dev/null[[:space:]]+crit;' deploy/nginx.conf)" -eq 3
test "$(grep -Ec '^[[:space:]]*proxy_set_header[[:space:]]+Host[[:space:]]+wepac\.pt;' deploy/nginx.conf)" -eq 1
# The regular expression intentionally matches literal Nginx variables.
# shellcheck disable=SC2016
if sed -n '/^log_format wepac_safe/,/;/p' deploy/nginx.conf | \
  grep -Eq '\$(request_uri|args|http_referer|http_authorization)([^_[:alnum:]]|$)|\$request([^_[:alnum:]]|$)'; then
  echo "WEPAC Nginx config can log a bearer credential." >&2
  exit 1
fi
if grep -Fq '/var/log/nginx/wepac_error.log' deploy/nginx.conf; then
  echo "WEPAC Nginx config still references the unsafe error log." >&2
  exit 1
fi

SHORT_SHA="${GIT_SHA:0:12}"
BUILD_CREATED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RELEASE_DIR="${APP_DIR}/releases/${TIMESTAMP}-${SHORT_SHA}"
REMOTE_STAGE_DIR="${APP_DIR}/releases/.staging-${TIMESTAMP}-${SHORT_SHA}-$$"
DEPLOY_STAGE="$(mktemp -d "${TMPDIR:-/tmp}/wepac-deploy.XXXXXX")"
cleanup_local_stage() {
  rm -rf -- "${DEPLOY_STAGE}"
}
trap cleanup_local_stage EXIT

echo "=== Building clean Release A artifact ==="
rm -rf -- "${PROJECT_DIR}/.next"
NEXT_PUBLIC_STRIP_MOCK=true npm run build

test -f .next/BUILD_ID
BUILD_ID="$(tr -d '\r\n' < .next/BUILD_ID)"
if [[ -z "${BUILD_ID}" || "${BUILD_ID}" == *[!A-Za-z0-9_-]* ]]; then
  echo "Next.js BUILD_ID is missing or malformed." >&2
  exit 1
fi

echo "=== Preparing immutable release package ==="
cp -R .next/standalone/. "${DEPLOY_STAGE}/"
mkdir -p "${DEPLOY_STAGE}/.next/static"
cp -R .next/static/. "${DEPLOY_STAGE}/.next/static/"
rm -rf -- "${DEPLOY_STAGE}/public"
cp -R public "${DEPLOY_STAGE}/public"
# Next.js standalone output tracing already copies a partial prisma/ directory
# (whatever the runtime imports touch). Replace it wholesale with the
# repository's full prisma/ so schema.prisma lands at DEPLOY_STAGE/prisma/
# instead of nesting under DEPLOY_STAGE/prisma/prisma/.
rm -rf -- "${DEPLOY_STAGE}/prisma"
cp -R prisma "${DEPLOY_STAGE}/prisma"
mkdir -p "${DEPLOY_STAGE}/deploy"
cp deploy/nginx.conf "${DEPLOY_STAGE}/deploy/nginx.conf"

test "$(tr -d '\r\n' < "${DEPLOY_STAGE}/.next/BUILD_ID")" = "${BUILD_ID}"

RELEASE_B_SQL_SHA256="$(shasum -a 256 prisma/release-b/drop_legacy_domain.sql | awk '{print $1}')"
NGINX_CONFIG_SHA256="$(shasum -a 256 deploy/nginx.conf | awk '{print $1}')"
cat > "${DEPLOY_STAGE}/RELEASE_MANIFEST" <<EOF
git_sha=${GIT_SHA}
build_id=${BUILD_ID}
built_at_utc=${BUILD_CREATED_AT}
prisma_version=${PRISMA_VERSION}
account_role_contract=target-member-admin
release_b_sql_sha256=${RELEASE_B_SQL_SHA256}
nginx_config_sha256=${NGINX_CONFIG_SHA256}
EOF
printf '%s\n' "${GIT_SHA}" > "${DEPLOY_STAGE}/RELEASE_GIT_SHA"
printf '%s\n' "${BUILD_ID}" > "${DEPLOY_STAGE}/RELEASE_BUILD_ID"

# A generated target client cannot expose retired Prisma models. This is a
# package-level capability gate; runtime smokes and row-count parity below add
# the execution evidence.
if grep -Eq '^[[:space:]]*model[[:space:]]+(Cohort|CohortMembership|Comment|Evaluation|EvaluationScore|MonthlyAction|StrategicMapScore|Task)[[:space:]]*\{' prisma/schema.prisma; then
  echo "Target Prisma schema still exposes a retired model." >&2
  exit 1
fi
if grep -Eq '@@map\("(cohort_memberships|cohorts|comments|evaluation_scores|evaluations|monthly_actions|packs|strategic_map_scores|tasks)"\)' prisma/schema.prisma; then
  echo "Target Prisma schema still maps a retired table." >&2
  exit 1
fi

echo "=== Uploading immutable release ${SHORT_SHA} ==="
# All interpolated values are locally derived, validated release identifiers
# and fixed paths, not user input.
# shellcheck disable=SC2029
ssh "${SSH_OPTIONS[@]}" "${SERVER}" \
  "set -euo pipefail; test ! -e '${RELEASE_DIR}'; test ! -e '${REMOTE_STAGE_DIR}'; install -d -m 755 '${APP_DIR}/releases'; install -d -m 755 '${REMOTE_STAGE_DIR}'"

rsync -az --delete \
  -e "ssh -o ServerAliveInterval=30 -o ServerAliveCountMax=20" \
  "${DEPLOY_STAGE}/" "${SERVER}:${REMOTE_STAGE_DIR}/"

# Generate the platform-specific Prisma client before downtime. This command
# consumes no application secret and cannot change the database. Only after it
# succeeds is the staging directory atomically promoted to the final immutable
# release path.
# shellcheck disable=SC2029
ssh "${SSH_OPTIONS[@]}" "${SERVER}" \
  "set -euo pipefail
   test \"\$(cat '${REMOTE_STAGE_DIR}/RELEASE_GIT_SHA')\" = '${GIT_SHA}'
   test \"\$(cat '${REMOTE_STAGE_DIR}/RELEASE_BUILD_ID')\" = '${BUILD_ID}'
   test \"\$(cat '${REMOTE_STAGE_DIR}/.next/BUILD_ID')\" = '${BUILD_ID}'
   cd '${REMOTE_STAGE_DIR}'
   npx prisma@${PRISMA_VERSION} generate >/dev/null
   CLIENT_SCHEMA=\"\$(find node_modules -path '*/.prisma/client/schema.prisma' -type f -print -quit)\"
   test -n \"\${CLIENT_SCHEMA}\"
   if grep -Eq '^[[:space:]]*model[[:space:]]+(Cohort|CohortMembership|Comment|Evaluation|EvaluationScore|MonthlyAction|StrategicMapScore|Task)[[:space:]]*\\{' \"\${CLIENT_SCHEMA}\"; then
     echo 'Generated Prisma client still exposes a retired model.' >&2
     exit 1
   fi
   printf 'generated_prisma_schema_sha256=%s\\n' \"\$(sha256sum \"\${CLIENT_SCHEMA}\" | awk '{print \$1}')\" >> RELEASE_MANIFEST
   cd '${APP_DIR}/releases'
   test ! -e '${RELEASE_DIR}'
   mv '${REMOTE_STAGE_DIR}' '${RELEASE_DIR}'"

echo "=== Quiesced backup, migration, cutover and smoke ==="
# Fixed/validated release metadata is passed as positional data to the quoted
# remote script.
# shellcheck disable=SC2029
ssh "${SSH_OPTIONS[@]}" "${SERVER}" \
  "bash -s -- '${APP_DIR}' '${RELEASE_DIR}' '${GIT_SHA}' '${BUILD_ID}' '${DOMAIN}' '${PRISMA_VERSION}'" <<'REMOTE_RELEASE_A'
set -Eeuo pipefail
umask 077

APP_DIR="$1"
RELEASE_DIR="$2"
EXPECTED_GIT_SHA="$3"
EXPECTED_BUILD_ID="$4"
DOMAIN="$5"
PRISMA_VERSION="$6"

SERVICE="wepac.service"
BACKUP_SERVICE="rvs-backup@wepac.service"
BACKUP_TIMER="rvs-backup@wepac.timer"
APP_ENV_FILE="${APP_DIR}/shared/.env.production"
RELEASE_NAME="$(basename "${RELEASE_DIR}")"
EVIDENCE_DIR="/var/backups/wepac/release-a/${RELEASE_NAME}"
PREVIOUS_RELEASE=""
PREVIOUS_ACCOUNT_ROLE_CONTRACT=""
MAINTENANCE_STARTED=0
SERVICE_STOPPED=0
MIGRATION_ATTEMPTED=0
CUTOVER_DONE=0
DB_ENV_LOADED=0

atomic_current_link() {
  local target="$1"
  local next_link="${APP_DIR}/.current-${RELEASE_NAME}-$$"
  rm -f -- "${next_link}"
  ln -s "${target}" "${next_link}"
  mv -Tf "${next_link}" "${APP_DIR}/current"
}

detect_account_role_contract() {
  local release_dir="$1" client_schema declared_contract observed_contract

  client_schema="$(find "${release_dir}/node_modules" \
    -path '*/.prisma/client/schema.prisma' -type f -print -quit 2>/dev/null || true)"
  if [[ -z "${client_schema}" && -f "${release_dir}/prisma/schema.prisma" ]]; then
    client_schema="${release_dir}/prisma/schema.prisma"
  fi
  test -n "${client_schema}"
  grep -Eq '^[[:space:]]*enum[[:space:]]+UserRole[[:space:]]*\{' \
    "${client_schema}"

  if awk '
    $1 == "enum" && $2 == "UserRole" { in_role = 1; next }
    in_role && $1 == "}" { exit(found_mentor ? 0 : 1) }
    in_role && $1 == "mentor" { found_mentor = 1 }
    END { if (in_role) exit(found_mentor ? 0 : 1); exit 2 }
  ' "${client_schema}"; then
    observed_contract="legacy-member-mentor-admin"
  else
    observed_contract="target-member-admin"
  fi

  declared_contract=""
  if [[ -f "${release_dir}/RELEASE_MANIFEST" ]]; then
    declared_contract="$(awk -F= \
      '$1 == "account_role_contract" { print $2 }' \
      "${release_dir}/RELEASE_MANIFEST")"
  fi
  if [[ -n "${declared_contract}" ]]; then
    case "${declared_contract}" in
      legacy-member-mentor-admin|target-member-admin) ;;
      *) echo "Unknown account-role contract in previous release." >&2; return 1 ;;
    esac
    test "${declared_contract}" = "${observed_contract}"
  fi

  printf '%s\n' "${observed_contract}"
}

restore_marked_mentor_roles() {
  # The hidden marker exists solely to make the Release A data normalization
  # reversible for the still-physical old runtime. It is not in target Prisma.
  psql "${DATABASE_URL}" -X --set=ON_ERROR_STOP=on >/dev/null <<'SQL'
DO $restore_marked_mentor_roles$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = '_legacyMentorAccountRole'
  ) THEN
    UPDATE public.users
    SET role = 'mentor'
    WHERE "_legacyMentorAccountRole" = true
      AND role::text = 'member';
  END IF;
END
$restore_marked_mentor_roles$;
SQL
}

normalize_marked_mentor_roles() {
  # Required on every attempt: a previous rollback may have restored the role
  # after Prisma recorded the migration, so migrate deploy will not rerun it.
  psql "${DATABASE_URL}" -X --set=ON_ERROR_STOP=on >/dev/null <<'SQL'
DO $normalize_marked_mentor_roles$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = '_legacyMentorAccountRole'
  ) THEN
    RAISE EXCEPTION 'Release A mentor rollback marker is missing';
  END IF;

  UPDATE public.users
  SET role = 'member'
  WHERE "_legacyMentorAccountRole" = true
    AND role::text = 'mentor';

  IF EXISTS (SELECT 1 FROM public.users WHERE role::text = 'mentor') THEN
    RAISE EXCEPTION 'Retired mentor account-role rows remain after normalization';
  END IF;
END
$normalize_marked_mentor_roles$;
SQL
}

on_exit() {
  local exit_code=$?
  local rollback_ready=1
  trap - EXIT
  set +e

  if [[ "${exit_code}" -ne 0 && "${SERVICE_STOPPED}" -eq 1 ]]; then
    echo "Release A failed after quiesce; restoring the previous runtime." >&2
    sudo systemctl stop "${SERVICE}" >/dev/null 2>&1 || true

    # Restore the physical role value only for an actual legacy runtime. A
    # previous target Release A client deliberately cannot decode `mentor`.
    if [[ "${MIGRATION_ATTEMPTED}" -eq 1 && \
          "${PREVIOUS_ACCOUNT_ROLE_CONTRACT}" = legacy-member-mentor-admin ]]; then
      if [[ "${DB_ENV_LOADED}" -ne 1 ]] || ! restore_marked_mentor_roles; then
        rollback_ready=0
      fi
    fi

    if [[ "${CUTOVER_DONE}" -eq 1 ]]; then
      if [[ -n "${PREVIOUS_RELEASE}" && -d "${PREVIOUS_RELEASE}" ]]; then
        atomic_current_link "${PREVIOUS_RELEASE}" || rollback_ready=0
      else
        rollback_ready=0
      fi
    fi

    # Never restart either writer if the exact data+symlink rollback failed.
    if [[ "${rollback_ready}" -eq 1 && \
          "$(readlink -f "${APP_DIR}/current" 2>/dev/null)" = "${PREVIOUS_RELEASE}" ]]; then
      sudo systemctl restart "${SERVICE}" || rollback_ready=0
      sudo systemctl is-active --quiet "${SERVICE}" || rollback_ready=0
    else
      rollback_ready=0
    fi

    if [[ "${rollback_ready}" -eq 1 ]]; then
      sudo systemctl start "${BACKUP_TIMER}" >/dev/null 2>&1 || rollback_ready=0
    fi

    if [[ "${rollback_ready}" -ne 1 ]]; then
      echo "Automatic rollback did not prove an exact safe state; application and backup timer remain stopped." >&2
      sudo systemctl stop "${SERVICE}" >/dev/null 2>&1 || true
      sudo systemctl stop "${BACKUP_TIMER}" >/dev/null 2>&1 || true
      exit_code=1
    fi
  elif [[ "${exit_code}" -ne 0 && "${MAINTENANCE_STARTED}" -eq 1 ]]; then
    # Failure after pausing the timer but before a proven service stop: the
    # database and current symlink are untouched, so only restore the timer.
    sudo systemctl start "${BACKUP_TIMER}" >/dev/null 2>&1 || exit_code=1
  fi

  if [[ "${DB_ENV_LOADED}" -eq 1 ]]; then
    unset DATABASE_URL
  fi
  exit "${exit_code}"
}
trap on_exit EXIT

for command_name in curl find grep npx pg_restore psql sha256sum; do
  command -v "${command_name}" >/dev/null 2>&1 || {
    echo "Required server command is missing: ${command_name}" >&2
    false
  }
done

test -d "${RELEASE_DIR}"
test -f "${RELEASE_DIR}/RELEASE_MANIFEST"
test -f "${RELEASE_DIR}/RELEASE_GIT_SHA"
test -f "${RELEASE_DIR}/RELEASE_BUILD_ID"
test -f "${RELEASE_DIR}/.next/BUILD_ID"
test -f "${RELEASE_DIR}/prisma/release-b/drop_legacy_domain.sql"
test -f "${RELEASE_DIR}/deploy/nginx.conf"
test "$(cat "${RELEASE_DIR}/RELEASE_GIT_SHA")" = "${EXPECTED_GIT_SHA}"
test "$(cat "${RELEASE_DIR}/RELEASE_BUILD_ID")" = "${EXPECTED_BUILD_ID}"
test "$(cat "${RELEASE_DIR}/.next/BUILD_ID")" = "${EXPECTED_BUILD_ID}"
test "$(awk -F= '$1 == "account_role_contract" { print $2 }' \
  "${RELEASE_DIR}/RELEASE_MANIFEST")" = target-member-admin

if find "${RELEASE_DIR}/prisma/migrations" -type f \
  -name 'drop_legacy_domain.sql' -print -quit | grep -q .; then
  echo "Release B SQL is inside Prisma migration history." >&2
  false
fi

PREVIOUS_RELEASE="$(readlink -f "${APP_DIR}/current")"
case "${PREVIOUS_RELEASE}" in
  "${APP_DIR}"/releases/*) ;;
  *) echo "Current release is outside the approved releases directory." >&2; false ;;
esac
test -d "${PREVIOUS_RELEASE}"
test "${PREVIOUS_RELEASE}" != "${RELEASE_DIR}"
PREVIOUS_ACCOUNT_ROLE_CONTRACT="$(detect_account_role_contract \
  "${PREVIOUS_RELEASE}")"
case "${PREVIOUS_ACCOUNT_ROLE_CONTRACT}" in
  legacy-member-mentor-admin|target-member-admin) ;;
  *) echo "Previous release role contract could not be proven." >&2; false ;;
esac

sudo systemctl is-active --quiet "${SERVICE}"
sudo systemctl is-active --quiet "${BACKUP_TIMER}"
test "$(sudo systemctl is-active "${BACKUP_SERVICE}" 2>/dev/null || true)" != active
test -r "${APP_ENV_FILE}"
grep -q '^DATABASE_URL=' "${APP_ENV_FILE}"

install -d -m 700 "${EVIDENCE_DIR}"
cat > "${EVIDENCE_DIR}/release.txt" <<EOF
git_sha=${EXPECTED_GIT_SHA}
build_id=${EXPECTED_BUILD_ID}
release_dir=${RELEASE_DIR}
previous_release=${PREVIOUS_RELEASE}
previous_account_role_contract=${PREVIOUS_ACCOUNT_ROLE_CONTRACT}
started_at_utc=$(date -u +%Y-%m-%dT%H:%M:%SZ)
EOF
chmod 600 "${EVIDENCE_DIR}/release.txt"

# Install the reviewed path/query-free WEPAC virtual host before any token can
# be issued by the new release. The previous config is retained as attended
# evidence. A validation or reload failure restores it immediately; after a
# successful reload the safer logging config deliberately survives app rollback.
NGINX_SITE="/etc/nginx/sites-available/wepac"
NGINX_ENABLED="/etc/nginx/sites-enabled/wepac"
NGINX_CANDIDATE="${NGINX_SITE}.release-a-${RELEASE_NAME}"
test "$(readlink -f "${NGINX_ENABLED}")" = "${NGINX_SITE}"
sudo test -f "${NGINX_SITE}"
sudo cp --preserve=mode,timestamps -- "${NGINX_SITE}" \
  "${EVIDENCE_DIR}/nginx.before.conf"
sudo install -o root -g root -m 644 \
  "${RELEASE_DIR}/deploy/nginx.conf" "${NGINX_CANDIDATE}"
sudo mv -f -- "${NGINX_CANDIDATE}" "${NGINX_SITE}"
if ! sudo nginx -t; then
  sudo cp -- "${EVIDENCE_DIR}/nginx.before.conf" "${NGINX_SITE}"
  sudo nginx -t
  false
fi
if ! sudo systemctl reload nginx; then
  sudo cp -- "${EVIDENCE_DIR}/nginx.before.conf" "${NGINX_SITE}"
  sudo nginx -t
  sudo systemctl reload nginx
  false
fi
sudo systemctl is-active --quiet nginx
sudo cmp --silent "${RELEASE_DIR}/deploy/nginx.conf" "${NGINX_SITE}"
sudo nginx -T > "${EVIDENCE_DIR}/nginx.live.txt" 2>&1
sudo chmod 600 "${EVIDENCE_DIR}/nginx.before.conf"
chmod 600 "${EVIDENCE_DIR}/nginx.live.txt"
grep -Fq 'log_format wepac_safe' "${EVIDENCE_DIR}/nginx.live.txt"
test "$(grep -Ec '^[[:space:]]*access_log[[:space:]]+/var/log/nginx/wepac_access\.log[[:space:]]+wepac_safe;' "${EVIDENCE_DIR}/nginx.live.txt")" -eq 3
test "$(grep -Ec '^[[:space:]]*error_log[[:space:]]+/dev/null[[:space:]]+crit;' "${EVIDENCE_DIR}/nginx.live.txt")" -eq 3
test "$(grep -Ec '^[[:space:]]*proxy_set_header[[:space:]]+Host[[:space:]]+wepac\.pt;' "${EVIDENCE_DIR}/nginx.live.txt")" -eq 1
# The regular expression intentionally matches literal Nginx variables.
# shellcheck disable=SC2016
if sed -n '/^log_format wepac_safe/,/;/p' "${NGINX_SITE}" | \
  grep -Eq '\$(request_uri|args|http_referer|http_authorization)([^_[:alnum:]]|$)|\$request([^_[:alnum:]]|$)'; then
  echo "Live WEPAC Nginx config can log a bearer credential." >&2
  false
fi
if grep -Fq '/var/log/nginx/wepac_error.log' "${NGINX_SITE}"; then
  echo "Live WEPAC Nginx config still references the unsafe error log." >&2
  false
fi

# Load the existing production environment without printing any value. Only
# DATABASE_URL is used by this procedure.
set -a
# shellcheck disable=SC1090
source "${APP_ENV_FILE}"
set +a
: "${DATABASE_URL:?DATABASE_URL is required}"
DB_ENV_LOADED=1

# Safe release flags are part of the production contract. Verify names and
# expected states without printing any environment value.
test "${DEBRIEF_ENGINE:-}" = disabled
test "${SESSION_TRANSCRIPT_WRITES_ENABLED:-false}" != true
test "${CALCOM_SESSION_INGEST_ENABLED:-false}" != true
test "${NOTIFICATION_OUTBOX_WORKER_ENABLED:-}" = true
test "${SUPPORT_PREVIEW_RETENTION_WORKER_ENABLED:-}" = true
test "${AUTH_URL:-}" = "https://${DOMAIN}"

# Quiesce all application writers before the exact pre-migration backup. The
# timer is paused so its scheduled invocation cannot race the attended run.
MAINTENANCE_STARTED=1
sudo systemctl stop "${BACKUP_TIMER}"
SERVICE_STOPPED=1
sudo systemctl stop "${SERVICE}"
test "$(sudo systemctl is-active "${SERVICE}" 2>/dev/null || true)" = inactive

OTHER_DB_CONNECTIONS="$(psql "${DATABASE_URL}" -X -At \
  --set=ON_ERROR_STOP=on -c \
  'SELECT count(*) FROM pg_stat_activity WHERE datname = current_database() AND pid <> pg_backend_pid()')"
test "${OTHER_DB_CONNECTIONS}" = 0

snapshot_named_table_counts() {
  local table_list="$1" destination="$2" table_name row_count
  : > "${destination}"
  while IFS= read -r table_name; do
    [[ "${table_name}" =~ ^[a-z0-9_]+$ ]]
    row_count="$(psql "${DATABASE_URL}" -X -At --set=ON_ERROR_STOP=on \
      -c "SELECT count(*) FROM public.\"${table_name}\"")"
    printf '%s\t%s\n' "${table_name}" "${row_count}" >> "${destination}"
  done < "${table_list}"
}

# Every physical table that exists before Release A (except Prisma's own
# append-only migration ledger) must preserve its exact row count. New target
# tables are inventoried separately after migration.
psql "${DATABASE_URL}" -X -At --set=ON_ERROR_STOP=on -c \
  "SELECT tablename
     FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename <> '_prisma_migrations'
    ORDER BY tablename" \
  > "${EVIDENCE_DIR}/pre-migration-table-list.txt"
test -s "${EVIDENCE_DIR}/pre-migration-table-list.txt"
snapshot_named_table_counts \
  "${EVIDENCE_DIR}/pre-migration-table-list.txt" \
  "${EVIDENCE_DIR}/pre-migration-table-counts.tsv"
psql "${DATABASE_URL}" -X -At --set=ON_ERROR_STOP=on -c \
  "SELECT count(*)
     FROM \"_prisma_migrations\"
    WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL" \
  > "${EVIDENCE_DIR}/pre-migration-history-count.txt"

touch "${EVIDENCE_DIR}/pre-backup.marker"
BACKUP_STARTED_AT="$(date -u --iso-8601=seconds)"
sudo systemctl reset-failed "${BACKUP_SERVICE}" >/dev/null 2>&1 || true
sudo systemctl start "${BACKUP_SERVICE}"
test "$(sudo systemctl show "${BACKUP_SERVICE}" --property=Result --value)" = success
sudo journalctl -u "${BACKUP_SERVICE}" --since "${BACKUP_STARTED_AT}" --no-pager \
  > "${EVIDENCE_DIR}/pre-backup-journal.txt"
chmod 600 "${EVIDENCE_DIR}/pre-backup-journal.txt"
grep -Fq '[backup:wepac] SUCCESS' "${EVIDENCE_DIR}/pre-backup-journal.txt"
grep -Fq 'restore-drill OK:' "${EVIDENCE_DIR}/pre-backup-journal.txt"

mapfile -d '' -t PRE_BACKUP_CANDIDATES < <(
  find /var/backups/wepac/daily -maxdepth 1 -type f \
    -name 'wepac_production_*.dump*' \
    -newer "${EVIDENCE_DIR}/pre-backup.marker" -print0
)
test "${#PRE_BACKUP_CANDIDATES[@]}" = 1
PRE_BACKUP_SOURCE="${PRE_BACKUP_CANDIDATES[0]}"
PRE_BACKUP_HOLD="${EVIDENCE_DIR}/$(basename "${PRE_BACKUP_SOURCE}")"
cp --reflink=auto --preserve=mode,timestamps -- \
  "${PRE_BACKUP_SOURCE}" "${PRE_BACKUP_HOLD}"
chmod 600 "${PRE_BACKUP_HOLD}"
cmp --silent "${PRE_BACKUP_SOURCE}" "${PRE_BACKUP_HOLD}"
PRE_BACKUP_SHA256="$(sha256sum "${PRE_BACKUP_HOLD}" | awk '{print $1}')"
printf '%s  %s\n' "${PRE_BACKUP_SHA256}" "${PRE_BACKUP_HOLD}" \
  > "${EVIDENCE_DIR}/pre-migration-artifact.sha256"
sha256sum --check "${EVIDENCE_DIR}/pre-migration-artifact.sha256" >/dev/null

# The automated backup proved the plaintext dump before optional encryption.
# For Release A we additionally require the held rollback artifact itself to be
# directly listable. If encryption is later enabled, add an attended decrypt
# proof to this release procedure before weakening this fail-closed gate.
case "${PRE_BACKUP_HOLD}" in
  *.dump) pg_restore --list "${PRE_BACKUP_HOLD}" >/dev/null ;;
  *)
    echo "Held backup is encrypted; exact at-rest restore proof is required before Release A." >&2
    false
    ;;
esac

MIGRATION_STARTED_AT="$(date -u --iso-8601=seconds)"
MIGRATION_ATTEMPTED=1
(
  cd "${RELEASE_DIR}"
  npx "prisma@${PRISMA_VERSION}" migrate deploy
) > "${EVIDENCE_DIR}/migrate-deploy.txt" 2>&1
chmod 600 "${EVIDENCE_DIR}/migrate-deploy.txt"

# This must happen while the old service is still stopped and on every retry.
normalize_marked_mentor_roles

TARGET_TABLES=(
  actions calcom_booking_references cycles disciplines email_outbox notifications
  support_preview_audit_events support_preview_grants
)
RETIRED_TABLES=(
  cohort_memberships cohorts comments evaluation_scores evaluations
  monthly_actions packs strategic_map_scores tasks
)
: > "${EVIDENCE_DIR}/post-migration-target-table-counts.tsv"
for table_name in "${TARGET_TABLES[@]}"; do
  test "$(psql "${DATABASE_URL}" -X -At --set=ON_ERROR_STOP=on \
    -v table_name="${table_name}" -c \
    "SELECT count(*) FROM pg_tables WHERE schemaname = 'public' AND tablename = :'table_name'")" = 1
  target_row_count="$(psql "${DATABASE_URL}" -X -At \
    --set=ON_ERROR_STOP=on \
    -c "SELECT count(*) FROM public.\"${table_name}\"")"
  printf '%s\t%s\n' "${table_name}" "${target_row_count}" \
    >> "${EVIDENCE_DIR}/post-migration-target-table-counts.tsv"
done
for table_name in "${RETIRED_TABLES[@]}"; do
  test "$(psql "${DATABASE_URL}" -X -At --set=ON_ERROR_STOP=on \
    -v table_name="${table_name}" -c \
    "SELECT count(*) FROM pg_tables WHERE schemaname = 'public' AND tablename = :'table_name'")" = 1
done

snapshot_named_table_counts \
  "${EVIDENCE_DIR}/pre-migration-table-list.txt" \
  "${EVIDENCE_DIR}/post-migration-table-counts.tsv"
diff -u "${EVIDENCE_DIR}/pre-migration-table-counts.tsv" \
  "${EVIDENCE_DIR}/post-migration-table-counts.tsv" \
  > "${EVIDENCE_DIR}/release-a-row-count-parity.diff"

EXPECTED_MIGRATION_COUNT="$(find "${RELEASE_DIR}/prisma/migrations" \
  -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')"
APPLIED_MIGRATION_COUNT="$(psql "${DATABASE_URL}" -X -At \
  --set=ON_ERROR_STOP=on -c \
  "SELECT count(*) FROM \"_prisma_migrations\"
    WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL")"
FAILED_MIGRATION_COUNT="$(psql "${DATABASE_URL}" -X -At \
  --set=ON_ERROR_STOP=on -c \
  "SELECT count(*) FROM \"_prisma_migrations\"
    WHERE finished_at IS NULL AND rolled_back_at IS NULL")"
test "${APPLIED_MIGRATION_COUNT}" = "${EXPECTED_MIGRATION_COUNT}"
test "${FAILED_MIGRATION_COUNT}" = 0
printf 'expected=%s\napplied=%s\nfailed=%s\n' \
  "${EXPECTED_MIGRATION_COUNT}" "${APPLIED_MIGRATION_COUNT}" \
  "${FAILED_MIGRATION_COUNT}" \
  > "${EVIDENCE_DIR}/post-migration-history-counts.txt"

legacy_count_manifest() {
  local destination="$1" table_name row_count
  : > "${destination}"
  for table_name in "${RETIRED_TABLES[@]}"; do
    row_count="$(psql "${DATABASE_URL}" -X -At --set=ON_ERROR_STOP=on \
      -c "SELECT count(*) FROM public.\"${table_name}\"")"
    printf '%s\t%s\n' "${table_name}" "${row_count}" >> "${destination}"
  done
}
legacy_count_manifest "${EVIDENCE_DIR}/pre-smoke-legacy-counts.tsv"

atomic_current_link "${RELEASE_DIR}"
CUTOVER_DONE=1
RESTART_STARTED_AT="$(date -u --iso-8601=seconds)"
sudo systemctl restart "${SERVICE}"

for _attempt in $(seq 1 30); do
  if sudo systemctl is-active --quiet "${SERVICE}" && \
    curl -fsS -o /dev/null \
      -H "Host: ${DOMAIN}" -H 'X-Forwarded-Proto: https' \
      http://127.0.0.1:3003/; then
    break
  fi
  sleep 1
done
sudo systemctl is-active --quiet "${SERVICE}"

for path_name in / /wepacker /wepacker/intake /api/auth/session; do
  response_code="$(curl -sS -o /dev/null -w '%{http_code}' \
    -H "Host: ${DOMAIN}" -H 'X-Forwarded-Proto: https' \
    "http://127.0.0.1:3003${path_name}")"
  printf '%s\t%s\n' "${path_name}" "${response_code}" \
    >> "${EVIDENCE_DIR}/http-smoke.tsv"
  test "${response_code}" = 200
done

protected_code="$(curl -sS -o /dev/null -w '%{http_code}' \
  -H "Host: ${DOMAIN}" -H 'X-Forwarded-Proto: https' \
  http://127.0.0.1:3003/wepacker/dashboard)"
printf '/wepacker/dashboard (anonymous)\t%s\n' "${protected_code}" \
  >> "${EVIDENCE_DIR}/http-smoke.tsv"
case "${protected_code}" in 302|303|307|308) ;; *) false ;; esac

for path_name in / /wepacker /wepacker/intake /api/auth/session; do
  response_code="$(curl -sS -o /dev/null -w '%{http_code}' \
    "https://${DOMAIN}${path_name}")"
  printf 'external:%s\t%s\n' "${path_name}" "${response_code}" \
    >> "${EVIDENCE_DIR}/http-smoke.tsv"
  test "${response_code}" = 200
done
chmod 600 "${EVIDENCE_DIR}/http-smoke.tsv"

legacy_count_manifest "${EVIDENCE_DIR}/post-smoke-legacy-counts.tsv"
diff -u "${EVIDENCE_DIR}/pre-smoke-legacy-counts.tsv" \
  "${EVIDENCE_DIR}/post-smoke-legacy-counts.tsv" \
  > "${EVIDENCE_DIR}/legacy-write-smoke.diff"

sudo journalctl -u "${SERVICE}" --since "${RESTART_STARTED_AT}" --no-pager \
  > "${EVIDENCE_DIR}/release-journal.txt"
chmod 600 "${EVIDENCE_DIR}/release-journal.txt"
if grep -Eiq \
  'PrismaClient|P20[0-9]{2}|does not exist|unknown (column|field)|unhandled|panic|fatal|\] cycle failed' \
  "${EVIDENCE_DIR}/release-journal.txt"; then
  echo "Release journal gate failed; inspect protected evidence on the server." >&2
  false
fi
grep -Fq '[wepacker:notification-outbox-worker] started' \
  "${EVIDENCE_DIR}/release-journal.txt"
grep -Fq '[wepacker:support-preview-retention] started' \
  "${EVIDENCE_DIR}/release-journal.txt"

test "$(readlink -f "${APP_DIR}/current")" = "${RELEASE_DIR}"
test "$(cat "${APP_DIR}/current/RELEASE_GIT_SHA")" = "${EXPECTED_GIT_SHA}"
test "$(cat "${APP_DIR}/current/.next/BUILD_ID")" = "${EXPECTED_BUILD_ID}"

sudo systemctl start "${BACKUP_TIMER}"
sudo systemctl is-active --quiet "${BACKUP_TIMER}"

cat >> "${EVIDENCE_DIR}/release.txt" <<EOF
completed_at_utc=$(date -u +%Y-%m-%dT%H:%M:%SZ)
migration_started_at_utc=${MIGRATION_STARTED_AT}
result=automated_cutover_passed_pending_authenticated_smoke
EOF

SERVICE_STOPPED=0
MAINTENANCE_STARTED=0
unset DATABASE_URL
DB_ENV_LOADED=0

echo "Release A automated cutover passed: ${RELEASE_DIR}"
echo "Git SHA: ${EXPECTED_GIT_SHA}"
echo "BUILD_ID: ${EXPECTED_BUILD_ID}"
echo "Evidence: ${EVIDENCE_DIR}"
echo "Release remains gated on the approved authenticated read-only smoke."
REMOTE_RELEASE_A

echo "=== Release A automated cutover passed; authenticated smoke still required ==="
echo "Site: https://${DOMAIN}"
echo "Git SHA: ${GIT_SHA}"
echo "BUILD_ID: ${BUILD_ID}"
echo "Release: ${RELEASE_DIR}"
