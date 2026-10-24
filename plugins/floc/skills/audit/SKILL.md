---
name: audit
description: Walk the whole running Floc website as a signed-in member and report what is wrong or missing — bugs, pages that say something untrue, two pages that disagree, broken house rules, and product gaps measured against the mission, the decision log and the backlog. Reports only; files nothing unless asked. Use when the user says /floc:audit, "review the website", "audit the site", "find what's off", or wants a product review of the live build.
---

# audit

Find what makes the website less helpful than it should be. You look; the user
decides. Do not fix and do not file during the audit.

Not this skill: the user lists what *they* saw → `/floc:feedback`. Code structure
→ `/floc:improve-codebase-architecture`.

## 1. Read the bar

Before you open a page, read what the site is measured against:

- [Mission and values](../../../../docs/foundation/mission.html) — the values, and
  "What we still have to prove".
- [Decision log](../../../../docs/foundation/decisions.html) — ADR titles, and the
  body of any ADR a finding touches.
- `AGENTS.md` — the Invariants and the UI and UX rules.
- The open backlog: `gh issue list --state open --limit 150 --json number,title,labels`.
  A gap that already has a ticket is not a new finding; cite the ticket instead.

## 2. Bring the site up

- `preview_list` first. Use a running `floc-web`; else `preview_start {name: "floc-web"}`.
- Data: seeded scenarios A and B (`/floc:seed-dev-db`). Never reset without asking.
- Sign in as a seeded person who is in a trip that is **happening now**, one
  **ahead**, and one **past**. Each state shows different pages.
- If a page renders blank with `PageNotFoundError` or `Failed to read source`,
  reload once. A dev cache error is not a finding.

## 3. Walk every surface

Do each route at **1280** and at **375** (`resize_window`; reset to `desktop` after).
Use `get_page_text` for words and numbers, screenshots for layout.

| Area | Routes |
|---|---|
| Front door | `/`, `/explore`, `/explore/<slug>`, `/invite/<token>` signed out, `/login`, `/signup`, `/privacy`, `/terms` |
| Home | `/trips`, `/trips/archived`, new-trip dialog, `/friends`, `/inbox`, `/profile`, `/settings`, `/packing-lists` |
| Trip | `/trip/<id>/` `overview`, `ideas`, `dates`, `days`, `money`, `packing`, `notes`, `files` |

For each page, ask:

1. **Is it true?** Every number and date agrees with the page that owns it
   (nights on Overview = Dates; totals on Overview = Money). Nothing is hidden
   that changes what a person would do (a currency left out of a total).
2. **Does it fit the moment?** The page reads the trip's state from its data
   (rule 4): a trip that has started does not ask for availability; a past trip
   does not ask anyone to book.
3. **Does it keep the house rules?** No placeholder text, no emoji, colours
   from tokens, status in words, no heading over a heading, no caption that
   explains the design. Grep the code for the rule too (for example
   `placeholder=` in `floc/apps/web/src`), so you can say how many places break it.
4. **Is the next step obvious?** Within one look, a member can tell what is
   left for them to do. Count the clicks for the main jobs: start a trip,
   invite, agree dates, add an expense, settle up.
5. **Does it fit on a phone?** At 375 the main controls are visible and can
   be reached. A tab bar that hides Money is a finding.
6. **Does it serve the mission?** Name the value, ADR or "still to prove" line
   that the page helps or hurts. A gap with no rule to stand on is a question
   for the user, not a finding.

Read the console and server logs (`read_console_messages`, `preview_logs`) on
each page. A real error is a finding.

## 4. Check before you claim

Every finding needs proof that you saw yourself: the page text, a screenshot,
or the line of code that causes it (`path:line`). If you could not confirm it,
leave it out. Do not report a guess as a fact.

## Report

Group the findings in this order, most important first. Each finding is one or
two lines: what you saw, where it is, and the rule or ADR it breaks.

1. **Untrue** — wrong numbers, pages that disagree, hidden facts.
2. **Bugs** — errors, broken flows.
3. **Rule breaks** — house rules and invariants, with a count.
4. **Streamline or remove** — noise, text that repeats, controls that do nothing.
5. **Phone** — what fails at 375.
6. **Gaps** — what to add, each tied to the mission. Cite an open ticket where
   one exists.

End with one line that asks which findings to file as tickets or fix now.
