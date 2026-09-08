---
name: push
description: Take finished local work to the develop branch — servers down, verify green, one commit with the right version and subject, pushed, ticket tagged and popped. Use when the user says /push, "push this", "ship it", or "get this on develop".
---

# push

Local work → `develop`, in one commit, with `verify` green. There is **no
pre-push hook**, so nothing else catches what this skill misses.

## Guards — check before anything else

Stop and ask if any of these is true:

- **Not on `develop`.** `git branch --show-current`. A feature never lands on
  `main` (hotfixes are the user's call, not this skill's).
- **Nothing staged or unstaged.** Nothing to push.
- **The working tree has changes the user did not ask for.** Read
  `git status --short` and `git diff --stat` and say what is going.

## Process

### 1. Servers down

`verify` writes `.next`, which `next dev` owns. Building over a live dev server
corrupts chunks.

- `preview_list` → `preview_stop` each server **Claude** started. Not `ps`.
- If the user started them outside Claude: `pnpm run:stop`.
- If `.next` is already poisoned (`EINVAL: readlink`, bad chunks):
  `pnpm --filter floc-web run clean:next`.

### 2. The two things `verify` cannot know

- **A schema change is not done until `local.db` has it.** `db:generate` writes
  the migration; nothing applies it. Run the new `drizzle/*.sql` against
  `local.db` in this same slice or dev dies on `no such column`.
- **A new API procedure needs a line in `scripts/parity/parity.json`.**
  `pnpm parity --fix` writes the boring half — the `why` is the user's, so ask
  for it rather than inventing one.

### 3. Version bump — same commit

Bump `floc/apps/web/package.json`:

| Type | Bump |
|---|---|
| `feat` | minor |
| `fix`, `refinement`, `chore`, `docs`, `refactor`, `test` | patch |

The new version is the first word of the commit subject, so this happens
**before** the commit, not after.

### 4. Verify

```bash
pnpm verify
```

Green or it does not go. A failure is a fix, not a `--no-verify`. Never skip
hooks or signing.

### 5. One commit

Subject: `<version> #<issue>: <type>: <description>`

```
0.96.0 #93: feat: split the profile
```

- Types: `feat|fix|docs|refactor|chore|test`.
- Body says *why*, then ends `Closes AidanInceer/Floc#<n>`.
- **No ticket** → literal `#no-ticket` in the subject, and **no** `Closes`
  line.
- **Never invent or borrow an issue number.** A wrong `Closes` shuts someone
  else's issue. If the number is not known, ask or use `#no-ticket`.

One commit per ticket. If the work is already several commits, say so and ask
before squashing.

### 6. Push

```bash
git push origin develop
```

### 7. Ticket state

`Closes` only fires on `main`, so the issue stays open until the batch merges.
The moment the commit is pushed:

```bash
gh issue edit <n> --repo AidanInceer/Floc --add-label "on-develop"
```

Then remove that ticket's line from the `Priority` stack issue body and
renumber the rest. A ticket leaves the stack when it is tagged `on-develop`.

Skip this whole step for `#no-ticket` work.

### 8. Put back what you took down

If servers were running when this started, bring them back with
`preview_start` (`floc-web`, `floc-metro`). Do not leave the user with a dead
loop.

## Report

Version, subject line, `verify` result, the pushed SHA, and the ticket state.
Nothing else.

## Gotchas

- **`develop` may have moved.** If the push is rejected, `git pull --rebase
  origin develop`, then run `verify` **again** — someone else's commit is now
  under yours.
- **A `.github/workflows/` check job changed** → `scripts/verify.sh` changes in
  the same commit, or CI and local stop agreeing. `sync-develop.yml` has no
  check and moves alone.
- **`develop` → `main` is a separate job** — a batch PR with a **merge
  commit**, never squash or rebase. This skill does not do it.
