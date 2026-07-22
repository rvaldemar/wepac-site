# WEPAC cross-repo coordination

The canonical tool-neutral WEPAC ↔ Agents Hub channel is:

- WEPAC outbox: `~/Documents/code/.rvs/handoffs/wepac-agents-hub/wepac-to-hub.md`
- Hub response inbox: `~/Documents/code/.rvs/handoffs/wepac-agents-hub/hub-to-wepac.md`

WEPAC writes only to the outbox. The Hub team writes only to the response
inbox. This avoids conflicting edits and keeps one chronological source of
truth for cross-repo decisions.

The older Claude-named files under `agents/docs/coordination/` remain historical
context and contain a pointer to this channel; new traffic belongs here.

## Rules

- Never place API keys, tokens, transcript content, prompts, model output or
  personal data in coordination files.
- Secret handoffs contain only presence checks or an opaque reference to an
  approved secure delivery mechanism.
- Every request states ownership, acceptance evidence and the response format.
- Runtime claims must be revalidated against the relevant production system;
  old channel entries are historical context, not current proof.

The active WEPAC-side tracker for the Session Debrief cutover is
[`hub-debrief-cutover.md`](hub-debrief-cutover.md).
