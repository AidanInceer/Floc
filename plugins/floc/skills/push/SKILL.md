---
name: push
description: Publish the current task worktree to develop — quick checks, one commit, its doc pages, a PR to develop that merges itself when green, and a watcher that removes the worktree once develop CI passes. Use when the user says /floc:push, "push this", "ship it", or "get this on develop".
---

In Codex, read [Codex runtime](../../CODEX.md) before following this workflow.

# push

Task worktree → PR to `develop`. One script does the mechanics; this skill
covers what a script cannot judge. Never publish when the user asked for local
review only.

## 1. Check the work

- Run it from the task's worktree (`.claude/worktrees/<name>`, branch
  `feature/…`, `fix/…`, `chore/…` or `hotfix/…`). In the main checkout or on
  `develop` → stop: the work belongs in `pnpm workspace:new <name>`.
- Read `git status` and `git diff --stat`. A file the user did not ask you to
  touch → stop and say what it is.
- **UI in the diff** (components, routes, CSS, phone screens) → the
  `floc:design-review` agent reviews it with screenshots, its findings are
  fixed, and the review is recorded:
  `pnpm delivery review --evidence-file <json>`. Publish refuses a UI diff
  without a record for that exact diff.
- **Docs:** run `/floc:sync-docs`. Keep the list of pages it changed.
- **Schema** → the new `drizzle/*.sql` is applied to this worktree's database.
  **API procedure** → its `scripts/parity/parity.json` line (`pnpm parity --fix`
  writes the boring half). **Plugin** → bump `version` in
  `plugins/floc/.claude-plugin/plugin.json` and run `pnpm plugins:sync`.

## 2. Write the message

Write it to a file in the scratchpad:

```
#<issue>: <type>: <description>

<why, in a few lines — not a list of files>

Closes AidanInceer/Floc#<issue>
```

- Type: `feat` (new behaviour a user sees), `fix`, `refactor`, `docs`,
  `chore`, `test`. A `type:refinement` ticket is `feat` if a user sees it,
  else `refactor`.
- The issue comes only from the ticket this session picked up or a number the
  user gave. None → `#no-ticket` and no `Closes` line.
- No version in the subject: the version is set once, at release.

## 3. Publish

```bash
pnpm delivery publish --message-file <path> --docs <page> <page>
```

Leave out `--docs` when no page changed. The script, in order: removes
worktrees that have already landed, commits, merges the latest `develop` in
(lockfile conflicts settle themselves), runs the quick checks the diff needs,
commits and pushes only your doc pages to `floc-docs`, pushes the branch, opens
the PR to `develop` with auto-merge, and starts the watcher.

- **A code conflict** → it stops and names the files. Resolve them in this
  worktree, keeping both intents. If you cannot tell which intent wins, ask.
  Commit, then publish again.
- **A red check** → it prints the check and its log path. Read that log only,
  fix the cause, publish again. Never weaken a check.
- Run it again after any fix; it reuses the PR and restarts the watcher.

**Prototype tag.** For each prototype this work builds, set its `wf-status` to
`Chosen: <key>, on develop <first 7 of the published sha>` in the main
checkout's `floc/wireframe/`. Rules: [prototype](../prototype/SKILL.md#the-tag-follows-the-work).

## 4. Report and stop

PR link, commit subject, quick-check result, doc pages pushed, and that the
watcher has it. UI change → the light and dark screenshots of each surface. If
you fixed something outside the task to get green, say so. Nothing else.

Then end the turn. Do not wait on CI. The watcher is a plain script, not an
agent: it merges when GitHub has not, waits for `develop` CI, then removes this
worktree and its branch. A conflict or a red check stops it with a Windows
notification; `pnpm delivery status` shows every watcher.
