---
name: release
description: Release develop to main for AidanInceer/Floc — one version for the batch, a release PR that merges itself once the full checks and Sonar pass, then a watcher that confirms production serves it and closes the tickets. Use when the user says /floc:release, "release", "ship to main", "deploy", or "get this live".
---

In Codex, read [Codex runtime](../../CODEX.md) before following this workflow.

# release

`develop` → `main`. A merge to `main` deploys production on Railway. The user's
standing yes: merge as soon as the checks are green. Run it from any checkout.

## 1. Local work first

If this session has unpublished work in a task worktree, run
[`/floc:push`](../push/SKILL.md) for it first. A release takes only what is on
`develop`; a feature still in a PR goes in the next one.

## 2. Release

```bash
pnpm delivery release
```

The script sets one version (minor if any change is a `feat`, else patch),
pushes `release/<version>` from `develop`, opens the PR to `main` with the
tickets, other commits and migrations in its body, turns on auto-merge, and
starts the watcher.

- `nothing to release` → say so and stop.
- `needs approval` → the release ships a schema migration. Name the files and
  stop. After Aidan says yes for that exact commit:
  `pnpm delivery release --approve-schema <sha>`.
- An open release PR already → the script reuses it.

## 3. Report and stop

Version, PR link, tickets, migrations, and that the watcher has it. End the
turn; do not wait on CI.

End with the status bullets from [session-summary](../session-summary/SKILL.md).

The watcher merges once `Release checks`, Sonar and the security checks pass,
then waits until `https://floc.live/api/health` reports the merge commit and the
homepage loads. Then it closes split parents whose children all closed, moves
shipped prototype tags, and sends a notification. A red check or a deploy that
does not appear within 45 minutes stops it with a notification.

## A hotfix

Production broken and `develop` not ready to ship: `pnpm workspace:new
hotfix/<name>` (starts from `main`), fix it test-first, then `/floc:push`. Its
PR targets `main`, takes the next patch version, and the watcher verifies the
deploy. `Sync develop` merges `main` back into `develop`.

## Never

- Merge with a red, cancelled or missing required check.
- Push to `main` or `develop` directly.
- Close issues by hand; `Closes` does it. The watcher closes only split parents.
