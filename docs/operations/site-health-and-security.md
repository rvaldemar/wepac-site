# Site health and browser security

## Local and external checks

All checks are read-only. They do not seed/reset a database, submit forms, log
in, create Stripe sessions or send a Wessex chat prompt.

```bash
BASE_URL=https://wepac.pt npm run healthcheck
BASE_URL=https://wepac.pt npm run audit:site
BASE_URL=http://127.0.0.1:3000 npm run test:http
```

`healthcheck` requests the homepage and ticket office with `GET`. It probes the
chat route only with `OPTIONS`; this is handled by Next and does not select a
chat engine or call Anthropic/Hub. Page checks validate expected content and
reject streamed Server Component error digests, including errors that Next may
return after an initial HTTP 200. Set `HEALTHCHECK_TIMEOUT_MS` to change the
per-request timeout. The probe never submits a chat message and therefore never
consumes Anthropic or Hub capacity.

## Healthcheck alerting

Alerting is optional. Set `HEALTHCHECK_ALERT_EMAIL` in the healthcheck process
environment to send an outage email after exactly two consecutive failed runs
and one recovery email after the next successful run. A single failure causes a
non-zero exit but no email. SMTP delivery uses the shared `SMTP_*` settings.

State is content-free and contains only counters, delivery state and timestamps.
It never contains SMTP credentials, URLs, response bodies, request headers or
other secrets. `HEALTHCHECK_STATE_FILE` must be an absolute persistent path
outside the release checkout; production uses
`/var/lib/wepac-healthcheck/state.json`. Writes use a same-directory temporary
file, `fsync`, atomic rename and final mode `0600`. Known SMTP failures retry
after 15 minutes, 1 hour and then 6 hours, without repeated recovery messages.
Manual runs default to `$XDG_STATE_HOME/wepac/healthcheck.json`, or
`~/.local/state/wepac/healthcheck.json` when `XDG_STATE_HOME` is unset.

The templates in `deploy/systemd/wepac-healthcheck.service` and
`deploy/systemd/wepac-healthcheck.timer` run the read-only script every five
minutes. They are templates only: repository changes do not install, enable or
start either unit.

Deployment procedure:

1. Copy both templates to `/etc/systemd/system/` and review `User`, `Group`,
   `WorkingDirectory`, `BASE_URL` and the paths for the target host.
2. Create `/etc/wepac/healthcheck.env` owned by root with mode `0600`. Put only
   `HEALTHCHECK_ALERT_EMAIL` and required `SMTP_*` values there. Do not put
   secrets in a unit file or repository.
3. Run `systemd-analyze verify /etc/systemd/system/wepac-healthcheck.service
   /etc/systemd/system/wepac-healthcheck.timer` and then `systemctl daemon-reload`.
4. Manually run `systemctl start wepac-healthcheck.service`; inspect
   `systemctl status wepac-healthcheck.service` and
   `journalctl -u wepac-healthcheck.service`.
5. Confirm `/var/lib/wepac-healthcheck/state.json` is owned by `deploy`, mode
   `0600`, and contains no configuration or response data.
6. Only after the manual smoke test, explicitly run
   `systemctl enable --now wepac-healthcheck.timer` and verify
   `systemctl list-timers wepac-healthcheck.timer`.

Incident handling:

1. Treat the email as detection, not authorization to restart or roll back.
2. Check `systemctl status wepac nginx`, recent safe journals and upstream
   provider status. Do not paste credentials, prompts or visitor data into logs.
3. Run `BASE_URL=https://wepac.pt npm run healthcheck` from an independent host
   if the local network path may be the cause.
4. After remediation, leave the timer running. The first healthy run sends one
   recovery email and resets the incident state.
5. If alert SMTP fails, inspect safe `delivery_failed` metadata in the journal.
   Do not delete state merely to force an email; fix SMTP and allow the bounded
   retry schedule to run.

## Wessex chat operational alerts

The real public chat path schedules a durable operational email for classified
`configuration`, `upstream_auth`, `upstream_unavailable`, `invalid_response` and
`stream_failed` failures. `rate_limited` and invalid visitor request bodies do
not alert. There is no diagnostic endpoint and no synthetic prompt: upstream
coverage comes from actual visitor traffic without adding Anthropic usage.

Set `WESSEX_ALERT_EMAIL`; it falls back to `SMTP_FROM`, then `info@wepac.pt`.
The `wessex_operational_alerts` table stores only the allowlisted code, delivery
state, bounded attempt count, timestamps and safe SMTP classification. It has no
prompt, IP, recipient, credential, exception message or stack fields.

One row per code plus a PostgreSQL advisory transaction lock deduplicates
concurrent failures. Delivery claim is an atomic conditional update, so multiple
application processes cannot send the same intent. A successful or ambiguous
SMTP attempt starts a rolling six-hour cooldown. Confirmed delivery failures
retry after 5 minutes, 30 minutes and 2 hours, up to four total attempts; the
Node instrumentation worker recovers due rows every five minutes after a
restart. Alert persistence and SMTP run asynchronously and never delay the
visitor's public error response.

Operational procedure:

1. Apply `20260825170000_add_wessex_operational_alerts` before switching the
   application release, following the normal additive migration gate.
2. Configure and validate `WESSEX_ALERT_EMAIL` and shared `SMTP_*` values without
   placing credentials in the repository or journal.
3. Trigger no production prompt merely to test alerting. Verify migration state,
   worker startup and SMTP independently; use a classified failure only in a
   controlled non-production environment.
4. On an alert, use the code to choose configuration, credential, provider or
   response-contract diagnosis. Read safe service logs; never add prompts,
   visitor identifiers, API keys or raw exceptions to the email or logs.
5. If `delivery_failed` appears, fix SMTP and allow the durable schedule to
   retry. A row left in `sending` means delivery acknowledgement was ambiguous;
   do not reset it before the six-hour cooldown, because that can duplicate mail.

The Playwright audit covers key Portuguese and English public pages at mobile
and desktop widths. It records navigation/request/console failures, title and
H1 contracts, horizontal overflow, tap targets (24 px minimum and 44 px ideal),
form autocomplete, reduced-motion behaviour and internal-link status. Output
defaults to `audit-results/site-audit.json`.

Configuration:

- `BASE_URL`: target origin; defaults to `http://127.0.0.1:3000`.
- `AUDIT_PATHS`: comma-separated path override.
- `AUDIT_OUTPUT`: JSON output path.
- `AUDIT_STRICT=1`: fail when the audit finds errors or broken internal links.

Do not point the existing `npm run test:e2e*` commands at production. Those
commands explicitly reset local WEPACKER fixtures. `audit:site`, `test:http` and
`healthcheck` are the non-destructive production-safe checks.

## Header rollout

The application and nginx templates share the same browser-security contract.
HSTS, Permissions-Policy, X-Frame-Options, `nosniff` and Referrer-Policy are
enforced. CSP starts as `Content-Security-Policy-Report-Only` to collect browser
violations without breaking Next.js, Google Fonts, ticket scanning or Stripe.
`X-XSS-Protection` is intentionally absent because modern browsers have removed
the auditor and CSP is its replacement.

Before changing CSP to enforcing mode:

1. Collect representative reports for public PT/EN, WEPACKER, ticket purchase,
   ticket scanning/admin and error pages.
2. Classify each blocked origin and remove unused allowances rather than adding
   broad wildcards.
3. Replace `'unsafe-eval'` and ideally `'unsafe-inline'` with a tested Next.js
   nonce/hash strategy.
4. Verify Stripe checkout redirects and any embedded Stripe surfaces.
5. Change both `src/lib/security-headers.ts` and every nginx template; run
   `npm test`, `npm run test:http` and `nginx -t` before reload.

Production nginx deliberately omits request targets, referrers and authorization
values from access logs and disables URI-bearing error logs because invite,
reset, verification and ticket URLs can contain bearer credentials. Do not
replace `wepac_safe` with combined logging during incident diagnosis.

## Operations

The checked-in timer is not active until an operator follows the deployment
procedure above. A failure means at least one expected status/content contract
was not observed; it never triggers an automatic restart, deploy or rollback.
