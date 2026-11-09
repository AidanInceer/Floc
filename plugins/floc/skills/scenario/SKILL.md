---
name: scenario
description: Drop Aidan straight into a Floc moment that is hard to reach from the dev account — a new sign-up, the first-trip walkthrough, an invite link, a guest who signs up, a dead link, the "keep these countries?" question after being removed. Resets a dev database, starts the web server and opens a link that signs in as the right person on the right page. Use when the user says /floc:scenario, "set up a scenario", "let me test the walkthrough / invite / guest flow", or wants to see a one-time moment again.
---

In Codex, read [Codex runtime](../../CODEX.md) before following this workflow.

# scenario

Web only. Each run wipes one dev database, so it never runs on the main
checkout's `local.db`.

## 1. Ask which

Always show this list, then wait for a number:

| # | Scenario | You land |
|---|---|---|
| 1 | `new-user` | Signed out on `/signup`. Sign up yourself; you reach an empty My trips with the welcome. |
| 2 | `walkthrough` | As Alex Newman, a fresh account, on the Overview of their only trip, with the first-trip walkthrough open. |
| 3 | `join-link` | Signed out on Portugal's invite link, three ideas to vote on. Join as a guest or with an account. |
| 4 | `guest-account` | As guest Sam on Portugal's invite page, with votes and three free days. Sign up: the answers move to the new account and you join the trip. |
| 5 | `dead-link` | Signed out on Portugal's old invite link, after the admin reset it: "This link no longer works". |
| 6 | `map-question` | As you (the dev account), removed from Krakow by Mei, on `/profile` with "Keep the countries from Krakow?". |

A number or name already given after `/floc:scenario` still gets the list shown
once, with that row picked.

## 2. Pick the checkout

- **Inside a task worktree** (path under `.claude\worktrees\`, not `scenario`):
  use it, so the branch's own code is what you test.
- **Anywhere else:** use `C:\dev\Floc\.claude\worktrees\scenario`.
  - Missing → from the main checkout, `pnpm workspace:new scenario`.
  - Present → bring it to the newest `develop` (it never has commits of its own):

    ```powershell
    cd C:\dev\Floc\.claude\worktrees\scenario; git fetch origin develop; git merge --ff-only origin/develop; pnpm install --frozen-lockfile; pnpm --filter floc-web db:migrate
    ```

    `merge --ff-only` fails → the worktree has local changes. Stop and tell Aidan; never reset it.

Every command below runs in that checkout.

## 3. Web server up

`pnpm workspace:status` gives the `url`. If `<url>/api/health` does not answer
200, run `pnpm workspace:start web` in the background and wait until it does.

## 4. Build the scenario

```powershell
pnpm --filter floc-web db:scenario <name>
```

It wipes the worktree's database and files, loads seeds A and B, adds the
scenario's rows, and prints the dev link as JSON on the last line:
`{"scenario":"…","link":"/api/dev/enter?…"}`.

`no such column` / `no such table` → run `pnpm --filter floc-web db:migrate` and try again.
`Refusing` → the database is not a local file. Stop; never edit the guard.

## 5. Drop Aidan in

Open `<url><link>` with `preview_start` (`url`). The link signs in as the
scenario's person (or signs out) and redirects to the start page. It answers
404 when the dev sign-in is shut, and always in production.

Take a screenshot to check you landed where the table says. If the page is not
that one, say so; do not report it as ready.

## 6. Report

Two lines: the scenario and the full link, so it can open in Chrome too. Then
one line on what to try first, from the table.
