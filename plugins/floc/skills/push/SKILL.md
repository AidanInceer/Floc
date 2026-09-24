---
name: push
description: Take finished local work to the develop branch — verify green, one commit with the right version and subject, pushed, ticket tagged and popped, CI watched. Use when the user says /floc:push, "push this", "ship it", or "get this on develop".
---

# push

Local work → `develop`, in one commit, with `verify` green. There is **no
pre-push hook**, so nothing else catches what this skill misses. The rules for
commits and ticket state live **here**, not in `CLAUDE.md`.

`scripts/push.mjs` does the mechanical half. This file covers what a script
cannot judge: an unexpected diff, the commit message, and the issue number.

## 1. Preflight

Dev servers **stay up** — verify builds into `.next-verify`, never the `.next`
that `next dev` owns.

```bash
pnpm push:preflight <feat|fix|docs|refactor|chore|test>
```

The script, in order:

1. Refuses unless on `develop`.
2. Fetches, and refuses if `origin/develop` moved. Fix:
   `git pull --rebase --autostash origin develop`, then preflight again.
3. Warns `!!` on local commits not yet pushed. One commit per ticket — say so
   and ask before squashing.
4. Prints the changed files.
5. Refuses if anything under `plugins/floc/` changed and the plugin `version`
   did not.
6. Flags a schema or `floc-api` change.
7. Bumps `floc/apps/web/package.json`.
8. Runs `pnpm verify`.

**Read the file list.** A file the user did not ask you to touch → stop and
say what it is.

Act on the `!!` warnings yourself:

- **Schema.** Run the new `drizzle/*.sql` against `local.db` in this slice, or
  dev dies on `no such column`.
- **API procedure.** Needs a line in `scripts/parity/parity.json`.
  `pnpm parity --fix` writes the boring half. Draft the `why` from the ticket
  and name it in the report — do not stop to ask.
- **Plugin.** Preflight refuses a skill edit without a `version` bump in
  `plugins/floc/.claude-plugin/plugin.json`. Bump it, run
  `claude plugin update floc@floc --scope project`, and tell the user to
  restart the session to load it.

Red verify is a fix, never `--no-verify`. Fix, then preflight again — the bump
is kept. Never skip hooks or signing.

## 2. Pick the type and the issue

| Type | When | Bump |
|---|---|---|
| `feat` | new behaviour a user can see | minor |
| `fix` | something was broken | patch |
| `refactor` | same behaviour, better shape | patch |
| `docs` | `AGENTS.md`, skills text only (`docs/` is gitignored) | patch |
| `chore` | tooling, deps, config, scripts | patch |
| `test` | tests only | patch |

A `type:refinement` ticket ships as `feat` if a user sees new behaviour,
otherwise `refactor`.

The issue number comes **only** from:

- the ticket this session picked up (`/floc:pickup-ticket`), or
- a number the user gave in chat.

Not from a branch name, an old commit, or a guess. None → `#no-ticket`.

## 3. Land

Write the message to a file in the scratchpad, then:

```bash
pnpm push:land --message-file <path>
```

```
<version> #<issue>: <type>: <description>

<why, in a few lines — not a list of files>

Closes AidanInceer/Floc#<issue>
```

- Description: lowercase start, present tense, says what a user or developer
  now gets. `0.4.0 #93: feat: split the profile`.
- `#no-ticket` → no `Closes` line at all.

Before it commits, `land` refuses when the issue does not exist, is closed, is
the `Priority` issue, or is already `on-develop`. The `commit-msg` hook also
refuses a `Closes` that does not match the subject. Do not work around either —
the number is wrong.

After the push, `land` labels the issue `on-develop` and pops its line off the
`Priority` stack, renumbering the rest. `Closes` fires only when `develop`
reaches `main` (`/floc:release`), so the issue stays open until then. A `!!`
from this step means do that part by hand with the command it prints.

## 4. Babysit CI

`land` prints the pushed SHA. Spawn the babysitter **in the background, in its
own worktree**, and carry on — do not wait for it:

```
Agent({
  subagent_type: "floc:ci-babysit",
  description: "Babysit CI for <short sha>",
  prompt: "<full sha>",
  isolation: "worktree",
  run_in_background: true
})
```

On red it fixes the cause on `develop`, pushes and watches again (at most three
tries). Pass on its report: what failed, what it fixed, or why it stopped.
Your local `develop` is now behind — the next preflight pulls it.

**Sonar is silent here.** SonarQube Cloud Free analyses `main` and pull
requests only, so a `develop` push never runs the gate — the bill arrives at
`/floc:release`, measured over everything since the last release. Once a push
lands, look at what is already waiting:

```bash
node scripts/sonar-gate.mjs main
```

Exit `1` → report the issues in the files this commit touched, so they are
fixed here rather than found at release time. Exit `0` or `2` → say nothing.

## Report

Version, subject line, `verify` result, pushed SHA, ticket state, and that CI
is being watched. UI change → the light and dark screenshots of each surface,
sent with `SendUserFile`. If you fixed something to get verify green that was not part
of the work, say so. Nothing else.

## Gotchas

- **Push rejected** after preflight passed: someone pushed in between.
  `git pull --rebase origin develop`, then preflight again.
- **A `.github/workflows/` check job changed** → `scripts/verify.sh` changes in
  the same commit. `sync-develop.yml` has no check and moves alone.
- **A red audit is still a red verify.** Pin the floor forward in **both**
  `pnpm-workspace.yaml` and the root `package.json` (pnpm 9 reads one, pnpm 10
  the other). Never weaken `--audit-level`. Say so in the report.
- **`.next` poisoned** (`EINVAL: readlink`, bad chunks):
  `pnpm --filter floc-web run clean:next`, then restart `floc-web`.
- **`develop` → `main` is `/floc:release`.** This skill never touches `main`.
