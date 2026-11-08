---
paths:
  - "scripts/checks/**"
  - ".github/workflows/**"
  - "scripts/workspace/hooks.mjs"
---
# Checks and CI — area rules

Root rules in [`AGENTS.md`](../../AGENTS.md) still apply.

- **One definition:** [`scripts/checks/manifest.mjs`](../../scripts/checks/manifest.mjs), used locally and by CI. Profiles: `pr` on a PR to develop, `release` on develop and on PRs to main; `quick` is for a hand run only, never a gate. Change a check → change the manifest; `ci.yml` only picks the profile.
- A pass is reused only for the same code, base, runtime and settings.
- The three gates and what belongs in each: [AGENTS.md, Guardrail gates](../../AGENTS.md#guardrail-gates). A new check goes in the cheapest gate that catches it.
- Git hooks are per worktree: `pre-commit` checks the plugin copy and repository rules, then lints staged files, runs their related tests, checks comments and scans for secrets — under a minute; `commit-msg` checks the subject. `pnpm workspace:prepare` installs them.
