---
name: prioritise-tickets
description: Order and tag every unprioritised open issue in AidanInceer/Waypoint, prefix each title with its feature category, and write the result to the Priority stack issue. Use when the user wants to prioritise the backlog, groom ticket order, or fix ticket labels and titles.
---

# prioritise-tickets

Put every open Waypoint issue into one ordered stack, and make sure each one carries the right labels.

The order lives in a single GitHub issue titled **`Priority`** in `AidanInceer/Waypoint`. Its body is the stack — **top line = next ticket to pick up**.

## The stack issue

Find it:

```bash
gh issue list --repo AidanInceer/Waypoint --state open --search "Priority in:title" --json number,title
```

If it does not exist, create it once:

```bash
gh issue create --repo AidanInceer/Waypoint --title "Priority" --label future-work \
  --body "## Priority stack

Top = next to pick up. Maintained by \`/prioritise-tickets\`. Consumed by \`/pickup-ticket\`.

1. _(empty)_"
```

Body format — one line per ticket, highest priority first:

```
1. #123 — money: Short title  `type:feat`
2. #98  — map: Short title  `type:fix` (blocked by #123)
```

## Title categories

Every ticket title is prefixed with its **feature category**: `<category>: <title>`. Do this **agentically** — derive the category from the ticket body, apply it, and only ask the user when a ticket genuinely fits two categories equally.

Categories come from the app's own routes and server modules (`ventures/waypoint/apps/web/src/app/trip/[id]/*`, `src/server/*`). Current set:

| Category | Covers |
|---|---|
| `trips` | creating, listing, sharing, archiving a trip |
| `itinerary` | days, events, scheduling, timing, feasibility |
| `map` | places, routes, travel time, live location |
| `money` | costs, splits, settle-up, currency, budgets |
| `packing` | packing lists and kits |
| `notes` | trip notes and their contents |
| `files` | uploaded documents attached to a trip, day or event |
| `media` | photos and video |
| `chat` | group messaging |
| `roster` | members, roles, invites, availability, arrivals |
| `profile` | one traveller's own details |
| `friends` | the friend graph outside a trip |
| `explore` | pre-trip discovery — guides, ideas, inspiration |
| `ai` | anything the model generates or suggests |
| `billing` | tiers, limits, entitlements, payment |
| `auth` | sign-in, sessions, accounts |
| `platform` | cross-cutting: offline, concurrency, mobile, audit, infrastructure |
| `docs` | the `docs/` site, no app code |

Add a category only if a ticket fits none — and say so when you do. Apply with:

```bash
gh issue edit <n> --repo AidanInceer/Waypoint --title "<category>: <title>"
```

Never double-prefix. If a title already starts with `<something>: `, replace that prefix rather than stacking another on top. Strip it and re-derive.

## Labels

Every prioritised ticket must end up with exactly one **type** label, plus any state labels that apply.

| Label | Meaning |
|---|---|
| `type:feat` | new behaviour |
| `type:fix` | something is broken |
| `type:refinement` | reshape or polish existing behaviour |
| `wayfinder:grilling` | needs the user grilled before it can be built — **does not affect priority** |
| `future-work` | parked on purpose — **not** in the stack |
| `on-develop` | built, merged to `develop`, waiting on the batch to `main` — **not** in the stack |

Blocked-by edges live in the issue **body** under `## Blocked by`, written as `#<n>` — not as a label. Read them from there.

**Grilling is orthogonal to priority.** A ticket that needs grilling sits in the stack on its own merit, alongside build-ready tickets. Never demote a ticket because it carries `wayfinder:grilling`, and never mention the label as a reason to move it. `/pickup-ticket` deals with the grilling when the ticket reaches the top.

Create any missing type label once:

```bash
gh label create "type:feat" --repo AidanInceer/Waypoint --color 1d76db --description "New behaviour"
gh label create "type:fix" --repo AidanInceer/Waypoint --color d73a4a --description "Something is broken"
gh label create "type:refinement" --repo AidanInceer/Waypoint --color fbca04 --description "Reshape or polish existing behaviour"
```

## Process

### 1. Work out what is unprioritised

```bash
gh issue list --repo AidanInceer/Waypoint --state open --limit 200 --json number,title,labels,body
```

Read the `Priority` issue body. A ticket is **unprioritised** if it is open, is not the `Priority` issue itself, is not labelled `future-work` or `on-develop`, and does not already appear in the stack.

Report the count before starting. If zero, say so and stop.

### 2. Categorise every title first

Before any ordering, prefix every unprioritised ticket's title with its category. No questions — derive and apply. Report the mapping as a table when done, so the user can correct any that look wrong.

Use the **categorised** titles in every question that follows.

### 3. Propose the whole order, then take edits

**Show the full stack as one numbered table. Do not walk it position by position.**

The user thinks about the backlog as a shape, not as a sequence of yes/no gates. Given the full list they will reply with the handful of moves they want ("264, then 253, then 252, then 237, then 265, rest as shown") in a single message. A one-question-per-position walk makes them answer thirty questions to say that.

**Step A — resolve ambiguity first, in one batch.**

Before proposing anything, scan the request for references you cannot resolve to a ticket number — "the app refinement ticket", "the onboarding one". Ask about **all** of them in a single message, naming the two or three candidates each, and wait. Never carry an unresolved reference into the draft and never surface it mid-way.

**Step B — show the full ordered table.**

One table, every unprioritised ticket plus every ticket already in the stack, in your proposed order:

| # | Ticket | Type | Notes |
|---|---|---|---|
| 1 | **#264** platform: Rename the product | refinement | new |
| 2 | #253 money: Multi-currency | refinement | |

Mark new tickets in bold, carry blocking edges in Notes, and flag any ticket missing a type label. Below the table, give a short reason for the positions you actually made a judgement call on — not one line per row.

Say plainly that it is a draft and nothing is written yet.

**Existing order is the default.** Tickets already in the stack keep their relative order unless the user moves them or a blocking edge forces it. Slot the new tickets in around them; do not re-derive the whole backlog from scratch.

Then ask once:

```
Reply with any moves you want, or `accept` to write this to #263.
```

**Step C — apply the edits and write.**

Take the user's moves, apply them, re-check blocking edges, and write the stack. If their instruction covers only the top ("264, 253, 252, then the rest as shown"), that is a complete answer — fill the tail from your draft and write it. Do not go back for confirmation of the tail.

Only fall back to walking position by position if the user asks for that explicitly.

**Never** use `AskUserQuestion` — every question is plain text in the response body.

### 4. Fix the labels as you go

Every ticket in the stack carries exactly one type label. A `wayfinder:*` label is **not** a type label — a research or prototype ticket still needs `type:feat` / `type:fix` / `type:refinement` on top of it.

Derive the type yourself and apply it. Only ask when a ticket genuinely reads as two types at once, and then ask about every such ticket in the same message as the Step A ambiguity questions — never one at a time:

```bash
gh issue edit <n> --repo AidanInceer/Waypoint --add-label "type:feat"
```

If the user says a ticket should be parked instead, label it `future-work` and leave it out of the stack.

### 5. Respect blocking edges

A ticket must never sit **above** a ticket it is blocked by. After every insert, check the stack for a violation. If one appears, tell the user and offer to move the blocker up rather than silently reordering.

### 6. Write the stack back

Rewrite the whole `Priority` issue body once, at the end:

```bash
gh issue edit <priority-issue-number> --repo AidanInceer/Waypoint --body-file <file>
```

### 7. Report back

- How many titles were recategorised.
- How many tickets were placed, and how many were parked.
- The top 5 of the new stack.
- Which positions the user confirmed, and which are still your draft.
- Any labels changed.
- Any blocking violations you flagged.

## Constraints

- Never remove a ticket from the stack here — that is `/pickup-ticket`'s job.
- Never invent priority. Every position comes from a user answer or from a blocking edge.
- The `Priority` issue is never closed and never picked up as work.
- Never use `AskUserQuestion` here — every question is plain text in the response body.
- Never walk the stack one position at a time unless the user asks for it. Show the whole order and take edits in one reply.
- Tickets already in the stack keep their relative order by default.
- Never let `wayfinder:grilling` push a ticket down. Grilling is a state, not a priority.
- Category prefixes are applied agentically, never one question per ticket.
