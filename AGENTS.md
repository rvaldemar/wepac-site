# RVS AI Project Instructions — wepac-site

This project inherits the universal RVS AI operating contract from:

`~/Documents/code/.rvs/operating-contract.md`

Tool adapters:
- Codex: `~/Documents/code/.rvs/adapters/codex.md`
- Claude CLI: `~/Documents/code/.rvs/adapters/claude-cli.md`
- RVS CLI: `~/Documents/code/.rvs/adapters/rvs-cli.md`

## Local Context

- Read `CLAUDE.md` in this directory as project context before meaningful work.
- Local `CLAUDE.md` is context, not a replacement for the universal RVS contract.
- Preserve existing user/agent changes. Inspect `git status` and relevant diffs before edits.
- Use subagents/cloud when they accelerate analysis, implementation, review, or QA.
- Use the local repo as the final source of truth for diff, tests, and integration.
- Apply product, technical, security/data, operations, cost, UX, tests, diff, and release gates proportional to risk.
- Do not read or expose secret values. Use existing environment secrets blindly when needed.

## Communication

Work silently by default. Report concise results, validations, risks, blockers, and next actions.
