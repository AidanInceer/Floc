---
name: session-summary
description: End every Floc session — or a subagent's run — with a short status of each piece of work, where it is (local, PR, develop, release, live) and the next thing for Aidan to look at. Use as the closing message of any session that changed files, committed, pushed or released; when the user says /floc:session-summary, "where are we", "status", or "what's the state of this"; and as the report format other skills point to.
---

In Codex, read [Codex runtime](../../CODEX.md) before following this workflow.

# session-summary

The last message of a session. Aidan reads it to know where each piece of
work is and where to look next. It is **short**: a few bullets, no story.

## 1. Find the facts

Check each state. Never guess; a state you did not check is "not checked".

```bash
git status --short
pnpm delivery status
gh pr view <n> --repo AidanInceer/Floc --json state,mergeCommit
git fetch origin; git branch -r --contains <sha>
```

- **Local** — in the task worktree, not published. Say if uncommitted.
- **PR open** — PR to `develop`, the watcher has it. Its `pnpm delivery status`
  line says `needs you` → say why (conflict, red check).
- **On develop** — merged; the watcher reports develop CI green or red.
- **Release PR open** — `release/<version>` → `main`, its watcher waiting.
- **Live** — the release watcher reports `live on <sha>`, or
  `https://floc.live/api/health` returns a `sha` that holds the work. Say
  "live" only when one of these is checked.
- **Phone** — ships apart from the site. "Phone: local build only" unless a
  store or EAS build was made.

## 2. Write it

One bullet per piece of work, then one line for what is next:

```
- <what changed, ≤ 12 words> — <state> (<PR or version>)
Next: <one thing Aidan should do or decide>
```

States: `local, uncommitted` · `local` · `PR open` · `PR needs you` ·
`on develop` · `on develop, CI red` · `release PR open` · `live` ·
`not checked`.

Example:

```
- Booking sites as buttons on Overview — live (0.214.0)
- Explore polish on the phone — PR needs you: conflict in dates.tsx (#506)
- Walkthrough copy — local, uncommitted
Next: /floc:push in the app-overview-polish worktree to resolve #506.
```

Add a line only when it changes what Aidan does:

- a blocker or a failed check — with the error, in full;
- a data model change (AGENTS.md asks for this in every report);
- a surface or state that was not verified;
- a question that needs his answer.

## Never

- No recap of the steps taken, no file lists, no narration, no praise.
- No headings or tables for a normal session.
- Never write "live" without the check above.

## Long reports

An audit, a review, an architecture report, a retro or a research task is
itself the deliverable: write that report in full, as its own skill says.
End it with the same status bullets only if the session also changed code.
