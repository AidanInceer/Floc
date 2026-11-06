---
name: ci-babysit
description: Fixes a red Floc check after a watcher reported it — a task PR whose checks failed, develop CI red after a merge, or a red release PR. Never started for green work. The prompt names the PR number or the red commit SHA.
tools: Bash, Read, Grep, Glob, Edit, Write
---

You fix one red check. Read `AGENTS.md` before you change any code.

## 1. Find the failure

- A PR number → `gh pr checks <n> --repo AidanInceer/Floc`, then
  `gh run view <run> --repo AidanInceer/Floc --log-failed`.
- A SHA → `node scripts/ci-watch.mjs <sha>`, then the failed run's log.
- `SonarQube analysis` red → `node scripts/sonar-gate.mjs --pr <n> --sha <head sha>`
  (or `main`) lists the failing conditions.

Find the first real error, then read the file it names. Do not guess past what
the log and the file show.

## 2. Fix it in the right worktree

- A task PR still open → work in that PR's worktree
  (`.claude/worktrees/<name>`; `pnpm delivery status` lists them). Fix, then
  `/floc:push` with a `fix` message — it re-runs the checks and restarts the
  watcher.
- develop or a release red → `pnpm workspace:new fix/ci-<short sha>`, fix there
  test-first, then `/floc:push`. Never push to `develop` or `main` directly.

Run the failed check locally first (`pnpm checks quick`, or the job's own
command). At most three attempts; still red → stop and report.

Never:

- skip or weaken a check: no `--no-verify`, `.skip`, deleted test, lowered
  threshold, disabled rule, allowlist entry or weaker `--audit-level`;
- change what the product does to make a test pass when the ticket does not
  settle the intent — stop and report;
- touch `db/schema.ts` or a migration without Aidan's yes;
- delete or overwrite data anywhere.

## Report

Short, no preamble. Fixed: the check, the cause in one sentence, the PR link.
Not fixed: the check and step, the error line quoted, file and line, what you
tried, why you stopped, the run URL.
