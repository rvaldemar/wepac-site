# Session Debrief: WEPAC → Agents Hub cutover

Status: `waiting_for_hub_handoff`

Last WEPAC verification: 2026-07-22

## Incident and decision

WEPAC production attempted Session Debrief through the direct Anthropic SDK and
received HTTP 400 because the API credit balance was exhausted. Rui confirmed
that this workload must use the Claude Subscription path provided by Agents Hub,
not an `ANTHROPIC_API_KEY` billed per API request.

## WEPAC readiness

- Branch: `fix/hub-debrief-cutover`
- Commit: `fa73886` (`fix: route session debrief through Hub safely`)
- Hub is now the default engine; direct Anthropic requires explicit selection.
- Unknown engines and incomplete Hub configuration fail closed.
- The W01 mapper accepts canonical `AreaKey` plus compatible PT/EN titles.
- Expected engine failures return a persisted safe failed view instead of an
  opaque production Server Components digest.
- Validation: full unit `223/223`, focused `18/18`, TypeScript, focused ESLint,
  production build and independent review all pass.

## Current WEPAC production state

Read-only inspection confirmed that `wepac.service` is active, but all of these
remain absent from both `/var/www/wepac/shared/.env.production` and the effective
process environment:

- `DEBRIEF_ENGINE`
- `HUB_API_URL`
- `HUB_API_KEY`
- `HUB_DEBRIEF_PLAYBOOK_ID`

Production therefore remains on the previously deployed direct Anthropic
default until the WEPAC patch is landed.

## Required Hub handoff

The Hub team owns provisioning and proving:

1. A live subscription-backed Claude route for the WEPAC organization, without
   upstream Anthropic API-key billing or silent fallback.
2. A runnable/published `wepac-session-debrief` (W01) playbook compatible with
   `POST /api/v1/playbooks/:id/run` and
   `GET /api/v1/playbook_runs/:id`.
3. An organization-scoped Hub credential for WEPAC. This is a Hub Bearer key,
   not an Anthropic key.
4. `gdpr_restricted` enforcement, Anthropic-only provider policy, learning
   opt-out and tenant isolation for this sensitive workload.
5. A synthetic-only end-to-end proof. No real Session Transcript may be used or
   copied into Hub coordination logs.

The Hub response must be written to
`~/Documents/code/.rvs/handoffs/wepac-agents-hub/hub-to-wepac.md`, replying to
request `WEPAC-HUB-20260722-001` with the contract defined in the shared WEPAC
outbox. Secret values must be delivered separately through an approved secure
mechanism.

## WEPAC actions after the Hub response is `status: resolved`

1. Install the three `HUB_*` values blindly and set `DEBRIEF_ENGINE=hub`.
2. Probe Hub authentication and W01 availability without sensitive content.
3. Run one synthetic debrief through the exact production route.
4. Merge, push and deploy the WEPAC patch.
5. Verify the runtime engine, service, logs and mentor-facing error/result state.

WEPAC does not modify Hub code or Hub production; Hub does not modify WEPAC code.
