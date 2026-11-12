---
name: analytics
description: Collect fresh Floc numbers into the private metrics board (C:\dev\Floc\metrics), serve it on http://localhost:4200 and open it in the browser pane, then say what it shows. Counts and hashed ids only, no PII. Use when the user says /floc:analytics, "run analytics", "show me the metrics", "open the metrics board", or wants to see how many people use Floc. Add --local to read the seeded local.db instead of production.
---

In Codex, read [Codex runtime](../../CODEX.md) before following this workflow.

# analytics

Collect, serve, open, report. The board lives in its own private repo,
`AidanInceer/floc-metrics`, cloned at `C:\dev\Floc\metrics`. It is not part of
the Floc app: no worktree, no develop, no release.

`--local` in the arguments → use `collect:local` and `serve:local` below, and
expect the stamp "Local test data". Otherwise production, stamp "Production".

## Process

### 1. Check the clone

`C:\dev\Floc\metrics` must exist with `node_modules` and a `.env`. No clone →
stop and tell the user to clone `AidanInceer/floc-metrics` there and run
`pnpm install`. No `.env` (production only) → stop: it needs
`TURSO_DATABASE_URL` and a **read-only** `TURSO_READ_TOKEN`. Never read, print
or repeat the token.

### 2. Collect

Run in a terminal tab, so the user sees the progress lines:

`mcp__terminal__run_in_terminal` with `pnpm collect` (or `pnpm collect:local`),
cwd `C:\dev\Floc\metrics`. Read it with `read_terminal` and
`wait_for_output_ms` until the prompt comes back. A cold production read takes
about a minute; the Railway step is the slow one.

- Exit code 1 with "Read broken" → a Floc schema change broke one query. The
  board still opens with the last good copy and names the query. Report it.
- "Railway" errors → the Railway CLI is not signed in. The rest still collects.

### 3. Serve

The server reads its store on every request, so after a collect a running
server needs no restart — only a change to the metrics code does.

Probe first: `curl -s http://127.0.0.1:4200/data.json`.

- No answer → `run_in_terminal` with `pnpm serve` (or `pnpm serve:local`) in a
  new tab, cwd `C:\dev\Floc\metrics`. Wait for "Floc metrics (…) on
  http://localhost:4200".
- Answers, and `meta.source` is the one you want → reuse it.
- Answers with the other source → the two share port 4200. Stop that tab with
  `stop_terminal_tab` if you started it; if it is the user's own tab, ask
  before you stop it.

### 4. Open

`preview_start {url: "http://localhost:4200"}`, or `navigate` the existing tab
there and reload. Check:

- the stamp reads "Production, collected <today> …" (or "Local test data");
- `read_console_messages` with `onlyErrors` is empty;
- no red "Read broken" line, or name it.

### 5. Report

Lead with the board's top sentence, then the one or two findings that changed
or matter, and any broken read. Then the address. No tables of every figure;
the board is the place for those.

## Gotchas

- **Never run `turso db tokens invalidate`.** It cancels every token for the
  database, the live site's too.
- **Read-only token only.** Never put the full-access token in the metrics
  `.env`.
- **No PII.** The collector reads counts, days and keyed-hash ids. Never add a
  query that reads email, name, trip content, sessions or tokens.
- **Port 4200 in use** is not a failure: something already serves the board.
  Check its source before you reuse it.
- **"Seen" may undercount phone users**, and the Railway log read is capped at
  5000 lines a run. Say so if a number looks low.
- **Dev servers go in terminal tabs**, never through Bash.
