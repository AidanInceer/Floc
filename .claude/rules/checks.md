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
- Git hooks are per worktree: `pre-commit` runs side by side the repository rules (plugin copy included), lint, comments and secrets on the staged files, the CI quality lint on the staged lines, and knip when web files change — no tests, which run in CI on the PR; under a minute; `commit-msg` checks the subject. `pnpm workspace:prepare` installs them.
