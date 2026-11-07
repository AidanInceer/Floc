---
paths:
  - "scripts/checks/**"
  - ".github/workflows/**"
  - "scripts/workspace/hooks.mjs"
---
# Checks and CI — area rules

Root rules in [`AGENTS.md`](../../AGENTS.md) still apply.

- **One definition:** [`scripts/checks/manifest.mjs`](../../scripts/checks/manifest.mjs), used locally and by CI. Profiles: `quick` before a push, `pr` on a PR to develop, `release` on develop and on PRs to main. Change a check → change the manifest; `ci.yml` only picks the profile.
- A pass is reused only for the same code, base, runtime and settings.
- Git hooks are per worktree: `pre-commit` lints staged files, checks comments and scans for secrets; `commit-msg` checks the subject. `pnpm workspace:prepare` installs them.
