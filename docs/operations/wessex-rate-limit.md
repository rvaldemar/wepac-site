# Wessex chat rate limit

The public Wessex chat uses PostgreSQL fixed-window buckets before selecting or
calling an AI engine. This is a cost boundary shared by every application
process and it survives restarts and release cutovers. Redis is not required.

## Data and concurrency

The bucket key is an HMAC-SHA-256 digest scoped to `wessex-chat`; raw visitor IP
addresses are never stored. `WESSEX_RATE_LIMIT_HASH_SECRET` should be a stable,
private random value. The runtime falls back to `AUTH_SECRET` or
`NEXTAUTH_SECRET`, but fails closed if none is available.

Each request uses one PostgreSQL `INSERT ... ON CONFLICT DO UPDATE ... RETURNING`
statement. PostgreSQL serializes conflicting updates, so concurrent processes
cannot admit more than the configured limit. Every 100 checks, the requesting
process deletes at most 100 expired rows. Cleanup failure is conservative and
fails that chat request closed.

## Configuration

```text
WESSEX_RATE_LIMIT_HASH_SECRET=<stable private random value>
WESSEX_RATE_LIMIT_WINDOW_SECONDS=600
WESSEX_RATE_LIMIT_WINDOW_MAX=10
WESSEX_RATE_LIMIT_DAY_SECONDS=86400
WESSEX_RATE_LIMIT_DAY_MAX=30
```

Missing or invalid numeric values use the shown defaults, preserving the
previous 10 requests per 10 minutes and 30 requests per 24 hours policy. A
configuration or database failure returns a temporary `503` response with
`Retry-After: 60` and does not call the AI provider. A normal exhausted bucket
returns `429` with the exact fixed-window retry interval. The rest of the site
continues serving normally in either case.

## Deployment and checks

Apply `prisma migrate deploy` before switching the application release, then
keep the HMAC secret unchanged across releases. The additive table is safe for
the previously running application. After cutover:

1. Send a Wessex chat request and confirm a row exists in
   `wessex_rate_limit_buckets` without any raw IP column or value.
2. Confirm the configured short-window boundary returns `429` and a positive
   `Retry-After` without an upstream AI request.
3. During a planned database-unavailable check, confirm only the chat request
   returns the typed temporary `503`; public site pages must remain available.
