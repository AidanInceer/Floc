---
name: push
description: Take finished local work to the develop branch — servers down, verify green, one commit with the right version and subject, pushed, ticket tagged and popped. Use when the user says /push, "push this", "ship it", or "get this on develop".
---

# push

Local work → `develop`, in one commit, with `verify` green. There is **no
pre-push hook**, so nothing else catches what this skill misses.

`scripts/push.mjs` does the mechanical half — branch guard, version bump,
`verify`, subject check, commit, push. This file covers the half a script
cannot have an opinion about: an unexpected diff, the commit message, and the
ticket.

## 1. Servers down

`verify` writes `.next`, which `next dev` owns. Building over a live dev server
corrupts chunks. The script cannot do this — `preview_stop` is a Claude tool.

- `preview_list` → `preview_stop` each server **Claude** started. Not `ps`.
- Started outside Claude: `pnpm run:stop`.
- `.next` already poisoned (`EINVAL: readlink`, bad chunks):
  `pnpm --filter floc-web run clean:next`.

## 2. Preflight

```bash
pnpm push:preflight <feat|fix|docs|refactor|chore|test>
```

It refuses unless on `develop` with something to push, prints the changed
files, flags a schema or `floc-api` change, bumps
`floc/apps/web/package.json` (`feat` minor, everything else patch), then runs
`pnpm verify`.

**Read the file list it prints.** A file the user did not ask you to touch is
the one thing the script cannot judge — stop and say what is going.

Act on the two `!!` warnings yourself:

- **Schema.** `db:generate` writes the migration; nothing applies it. Run the
  new `drizzle/*.sql` against `local.db` in this same slice or dev dies on
  `no such column`.
- **A new API procedure** needs a line in `scripts/parity/parity.json`.
  `pnpm parity --fix` writes the boring half — the `why` is the user's, so ask
  rather than invent one.

Red verify is a fix, never a `--no-verify`. Fix it and run preflight again —
the bump is kept, so it will not double-bump. Never skip hooks or signing.

## 3. Land

Write the message to a file, then:

```bash
pnpm push:land --message-file <path>
```

Subject: `<version> #<issue>: <type>: <description>` — the script rejects
anything else, and rejects a version that is not the one it just bumped to.

- Body says *why*, then ends `Closes AidanInceer/Floc#<n>`.
- **No ticket** → literal `#no-ticket` in the subject and **no** `Closes` line.
- **Never invent or borrow an issue number.** A wrong `Closes` shuts someone
  else's issue. Not known → ask, or `#no-ticket`.

One commit per ticket. Already several commits → say so and ask before
squashing.

## 4. Ticket state

`Closes` only fires on `main`, so the issue stays open until the batch merges.
The script prints the number when there is one:

```bash
gh issue edit <n> --repo AidanInceer/Floc --add-label "on-develop"
```

Then remove that ticket's line from the `Priority` stack issue body and
renumber the rest. Skip the whole step for `#no-ticket`.

## 5. Put back what you took down

Servers running when this started → `preview_start` `floc-web` and
`floc-metro`. Do not leave the user with a dead loop.

## Report

Version, subject line, `verify` result, the pushed SHA, the ticket state. If
you fixed something to get verify green that was not part of the work, say so.
Nothing else.

## Gotchas

- **`develop` may have moved.** The script tells you when the push is
  rejected: `git pull --rebase origin develop`, then run **preflight again** —
  someone else's commit is now under yours.
- **A `.github/workflows/` check job changed** → `scripts/verify.sh` changes in
  the same commit, or CI and local stop agreeing. `sync-develop.yml` has no
  check and moves alone.
- **A red audit is still a red verify.** Advisories arrive on their own
  schedule, so a gate can fail on something the slice never touched. Pin the
  floor forward in **both** `pnpm-workspace.yaml` and the root `package.json`
  (pnpm 9 reads one, pnpm 10 the other) — never weaken `--audit-level`. Say in
  the report that you did it.
- **`develop` → `main` is a separate job** — a batch PR with a **merge
  commit**, never squash or rebase. This skill does not do it.
