---
name: push
description: Ship the current task worktree to develop — one commit through the pre-commit gate, a PR to develop that merges itself when CI is green, a ci-watch agent that reports red or merged, then docs, worktree close and a summary after the merge. Use when the user says /floc:push, "push this", "ship it", or "get this on develop".
---

In Codex, read [Codex runtime](../../CODEX.md) before following this workflow.

# push

Task worktree → PR to `develop` → merged → docs and clean-up. The flow is fixed
([AGENTS.md, Guardrail gates](../../../../AGENTS.md#guardrail-gates)); do not add steps to it.
Never push when the user asked for local review only.

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
  without a record for that change.
- **Docs:** run `/floc:sync-docs` now and keep the list of pages it changed.
  They are pushed after the merge, in step 5.
- **Schema** → the new `drizzle/*.sql` is applied to this worktree's database.
  **API procedure** → its `scripts/parity/parity.json` line (`pnpm parity --fix`
  writes the boring half). **Plugin** → run `pnpm plugins:sync`;
  publish bumps the version.

Do not run `pnpm checks` here. The pre-commit hook is the local gate; CI is the real one.

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
pnpm delivery publish --message-file <path>
```

In order: removes worktrees that already landed, commits (the pre-commit hook runs: staged lint,
comments, secrets, repository rules; no tests), merges the latest `develop` in, pushes,
opens the PR to `develop` and turns on auto-merge. It takes seconds, not minutes.

- **Pre-commit fails** → fix the cause, publish again. Never `--no-verify`.
- **A code conflict** → it names the files. Resolve them here, keeping both
  intents. If you cannot tell which intent wins, ask. Commit, publish again.

## 4. Watch CI

Start the `floc:ci-watch` agent **in the background** with the PR number, then end the turn.
It reports one of:

- **red** → fix the cause in this worktree, test-first. Never weaken a check. Publish again
  with a `fix` message, start ci-watch again. At most three rounds, then stop and report.
- **conflict** → publish again (it merges develop in), start ci-watch again.
- **merged** → step 5.

## 5. Finish

From the main checkout, so the worktree folder is free:

```bash
cd C:/dev/Floc; pnpm delivery finish --pr <n> --docs <page> <page>
```

Leave out `--docs` when no page changed. It labels the tickets `on-develop` and pops them off
the Priority stack, pushes only your doc pages to `floc-docs`, and removes this worktree and its
branch. `docsAlsoCarry` in the result names pages that went out with another branch's unpushed
edits on them: name those pages and branches in the report.

## 6. Report

PR link, commit subject, how many CI rounds it took, doc pages pushed, worktree closed or kept
(and why). UI change → the light and dark screenshots of each surface. If you fixed something
outside the task to get green, say so.

End with the report format in [AGENTS.md](../../../../AGENTS.md#working-and-reporting).
