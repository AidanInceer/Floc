---
name: release
description: Batch develop into main for AidanInceer/Floc — PR with a merge commit, merged once checks are green (asks only on a ticket that will not close or a schema migration), then check tickets closed, develop synced and Railway deployed. Use when the user says /floc:release, "release", "ship to main", or "deploy".
---

# release

`develop` → `main` as one PR, merged with a **merge commit**. A merge to `main`
deploys production on Railway. The user's standing yes: merge as soon as the PR
checks are green — do not stop to ask.

## 1. Is there anything to release

```bash
git fetch origin
git log --oneline origin/main..origin/develop
```

Empty → say so and stop. Local `develop` ahead of `origin/develop` → stop; that
work is not pushed (`/floc:push`).

## 2. `develop` is green

```bash
git rev-parse origin/develop
node scripts/ci-watch.mjs <sha>
```

Exit `2` → run again. Exit `1` → stop and report the failure. Never release red.

Sonar does not run on `develop` — SonarQube Cloud Free analyses only `main` and
pull requests — so the gate is first seen on the PR in step 6, and again on
`main` in step 7. Its new-code window on `main` is *since the last release*,
which is wider than the PR diff: a PR can pass while `main` fails on issues
that piled up. Both are checked.

## 3. What it closes

```bash
git log origin/main..origin/develop --format=%B | grep -oE "Closes AidanInceer/Floc#[0-9]+"
gh issue list --repo AidanInceer/Floc --state open --label on-develop --json number,title
```

Compare the two lists and say plainly:

- in a `Closes` line but not `on-develop` → label drifted; add it.
- `on-develop` with a `## Split into` section in its body → a split parent. No commit closes it. Close it in step 7 once every child is closed.
- `on-develop` but no `Closes` line and no `## Split into` → it will **not** close. Ask the user.

## 4. The PR

Reuse an open one if it exists:

```bash
gh pr list --repo AidanInceer/Floc --base main --head develop --state open --json number,url
```

Otherwise write the body to a scratchpad file and create it:

```bash
gh pr create --repo AidanInceer/Floc --base main --head develop --title "Release <version>" --body-file <path>
```

`<version>` is `version` in `floc/apps/web/package.json` on `origin/develop`.

Body:

```
## Tickets
- #<n> <title>

## Other commits
- <subject of each #no-ticket commit>

## Checks
- Schema migrations: <yes, list drizzle files | none>
```

Find migrations with
`git diff --name-only origin/main origin/develop -- floc/apps/web/drizzle`.
Railway runs them before it starts the app — call them out, they touch
production data.

## 5. PR checks

```bash
gh pr checks <n> --repo AidanInceer/Floc --watch --fail-fast
```

Red → stop and report. Do not merge.

## 6. Merge

Checks green → merge. No need to ask; the user has said a green PR may go to
`main`. Stop and ask only if step 3 found an issue that will not close, or the
release ships a schema migration.

```bash
gh pr merge <n> --repo AidanInceer/Floc --merge
```

**Only `--merge`.** Never `--squash`, `--rebase`, `--admin` or `--auto`.

Before merging, the Sonar gate on the PR branch:

```bash
node scripts/sonar-gate.mjs <pr head branch>
```

Exit `1` → fix the issues it lists and push again; do not merge. Exit `2` →
the analysis has not landed yet; wait and run it again.

## 7. After the merge

Merge SHA: `gh pr view <n> --repo AidanInceer/Floc --json mergeCommit --jq .mergeCommit.oid`.

1. **CI and sync.** Spawn the watcher in the background for the merge SHA —
   `Agent({ subagent_type: "floc:ci-watch", prompt: "<merge sha>", run_in_background: true })`.
   It covers `Sync develop`, which merges `main` back into `develop`. A red
   sync means a conflict to resolve by hand. It also covers
   `SonarQube analysis`, whose gate on `main` measures a wider new-code window
   than the PR did. Once CI reports, confirm it yourself:

   ```bash
   node scripts/sonar-gate.mjs main
   ```

   Exit `1` → the release is on `main` but the gate is red. Fix the listed
   issues as the next commit on `develop`; do not leave it red.
2. **Tickets.** Each number from step 3 → `gh issue view <n> --repo AidanInceer/Floc --json state`.
   Still open → say which.
   Split parents from step 3: if every `## Split into` child is closed →
   `gh issue close <n> --repo AidanInceer/Floc --reason completed --comment "All split tickets shipped."`.
   Any child still open → leave the parent open and say which child.
3. **Deploy.** Railway reports to GitHub deployments:

   ```bash
   gh api "repos/AidanInceer/Floc/deployments?sha=<merge sha>" --jq ".[0].id"
   gh api "repos/AidanInceer/Floc/deployments/<id>/statuses" --jq ".[0].state"
   ```

   No deployment yet → check again in a minute, a few times. Want `success`.
   `failure` → tell the user to open Railway's deploy log; this skill cannot
   read it.

## Report

Version, PR URL, merge SHA, tickets closed (and any still open), migrations
shipped, deploy state, CI being watched.

## Never

- Merge while any check is red or pending.
- Push to `main` directly — that is a hotfix, and a separate decision.
- Close issues by hand; `Closes` does it. Only exception: split parents in step 7.
