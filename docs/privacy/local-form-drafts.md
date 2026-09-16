# Local form drafts

Critical public forms keep a best-effort browser draft so a deployment between
page load and submission does not destroy what the visitor typed.

- Keys are versioned under `wepac:form-draft:v1`.
- Intake and contact drafts can contain PII. They expire after 24 hours and are
  deleted when read after expiry or immediately after a successful submission.
- Drafts remain after validation, network, server, or stale-deployment errors.
  A stale Server Action reload gets a fresh bundle and restores the draft.
- Each surface uses an explicit field allowlist. Passwords, honeypots, payment
  details, authentication data, and other especially sensitive values are never
  stored.
- Wessex stores only the pending prompt, not consent or conversation history,
  and removes it only after a complete successful response.
- Storage access is guarded because SSR, privacy modes, browser policy, and
  quota limits can make `localStorage` unavailable.
