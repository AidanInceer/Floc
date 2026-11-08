---
name: release
description: Release develop to main for AidanInceer/Floc — one version for the batch, a release PR that merges itself once the full checks and Sonar pass, a ci-watch agent that reports red or merged, then a finish step that confirms production serves it and closes the tickets. Use when the user says /floc:release, "release", "ship to main", "deploy", or "get this live".
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
tickets, other commits and migrations in its body, and turns on auto-merge.

- `nothing to release` → say so and stop.
- `needs approval` → the release ships a schema migration. Name the files and
  stop. After Aidan says yes for that exact commit:
  `pnpm delivery release --approve-schema <sha>`.
- An open release PR already → the script reuses it.

## 3. Watch CI

Start the `floc:ci-watch` agent **in the background** with the PR number, then end the turn.
These are the most extensive checks: `Release checks` (every check, e2e journeys, mobile
bundles, audit), Sonar and the security scans.

- **red** → `pnpm workspace:new fix/ci-<short sha>`, fix there test-first, `/floc:push` it to
  develop, then `pnpm delivery release` again (it reuses the PR).
- **merged** → step 4.

## 4. Finish

```bash
pnpm delivery finish --pr <n>
```

Run it in the background: it waits until `https://floc.live/api/health` reports the merge
commit and the homepage loads (at most 45 minutes). Then it closes split parents whose children
all closed and moves shipped prototype tags. `needs you` → name the reason and stop.

## 5. Report

Version, PR link, tickets, migrations, and `live` only once finish says so.

End with the report format in [AGENTS.md](../../../../AGENTS.md#working-and-reporting).

## A hotfix

Production broken and `develop` not ready to ship: `pnpm workspace:new
hotfix/<name>` (starts from `main`), fix it test-first, then `/floc:push`. Its
PR targets `main` and takes the next patch version; after the merge,
`pnpm delivery finish --pr <n>` verifies the deploy. `Sync develop` merges `main` back into `develop`.

## Never

- Merge with a red, cancelled or missing required check.
- Push to `main` or `develop` directly.
- Close issues by hand; `Closes` does it. Finish closes only split parents.
