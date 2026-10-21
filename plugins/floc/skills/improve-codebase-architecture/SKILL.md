---
name: improve-codebase-architecture
description: Find places in the Floc code where one idea is written in many files, or where a file does too many jobs, and write a plain-English report of what to change and why. Then grill the pick and hand it over to tickets or a build. Use when the user says /floc:improve-codebase-architecture, "architecture review", "what should we refactor", "where is the code duplicated", or wants the code easier to change and test.
---

# improve-codebase-architecture

Find the places where the code is harder to change than it needs to be, and
say in plain words what to do about them. The aim: a change to one idea
happens in one file, and a test of that idea goes through one front door.

Adapted from Matt Pocock's `improve-codebase-architecture`, for Floc's
structure, rules and words.

## Words

The report is for Aidan, not for an architect. Use plain words in all text
the user reads. Think in the left column; write the right column.

| Idea | Write |
|---|---|
| Shallow module, pass-through | "a file that only passes the call on" |
| Deep module | "one place that does the whole job" |
| Interface | "what a caller must know to use it" |
| Seam | "where one part plugs into another" (AGENTS.md says *seam*; keep it in file names and code talk) |
| Locality | "a fix in one place reaches every screen" |
| Leverage | "one function, used by N screens" |
| Leak | "X has to know how Y works inside" |

Domain words come from [`floc/CONTEXT.md`](../../../../floc/CONTEXT.md):
**stop**, **day**, **overnight place**, **expense**, **split**,
**settlement**, **notes page**, **Explore trip** (a preset trip), **member**.
Write "the Days page", not "the itinerary feature module". Name a screen as the
user sees it, then the file.

British English, sentence case, short sentences, no filler. Use the
words in AGENTS.md: *rule 3*, *ADR-014*, *`@floc/core`*, *web and phone*,
*parity*. Never "service", "layer", "component boundary", "API surface".

## 1. Choose where to look

Do not scan everything. A change pays back only where the code keeps
changing.

- If the user named an area, look there and skip the rest of this step.
- Otherwise find the hot spots:
  - `git log --oneline -80` and count changed folders
    (`git log -80 --name-only --pretty=format:`).
  - Files on the dated allowlist in `floc/apps/web/eslint.config.mjs`
    (over 600 lines, 120-line functions, complexity 15).
  - Folders near the 20-file cap (`pnpm fitness`).
  - Logic that exists on web *and* phone (`floc/apps/web/src` vs
    `floc/apps/mobile/src`) — it belongs in `@floc/core`.

Read first: AGENTS.md (Invariants, Structure, Code standards),
[`floc/CONTEXT.md`](../../../../floc/CONTEXT.md),
[`learnings.md`](../../../../learnings.md), the
[decision log](../../../../docs/foundation/decisions.html) and the
[architecture page](../../../../docs/engineering/index.html).

## 2. Walk the code

Spawn one `Explore` sub-agent, "very thorough", on the chosen area. Brief it
to report, per finding: the files (with line counts), what the code does now,
the friction with function names and call sites, the tests that exist, and
whether deleting the file would remove complexity or only move it.

What to look for:

- **One idea in many files.** The same rule, constant or loop copied, often
  with a comment like "the same as X" or "keep in step with Y".
- **Copies that already disagree.** The strongest signal: it is a bug, or a
  choice nobody wrote down.
- **A file that only passes the call on.** Deleting it changes nothing.
- **A file that does many jobs.** 500+ lines, 10+ props, a name that needs
  "and".
- **Web and phone write the same logic.** Move it to `@floc/core` (pure) or
  `@floc/editor` (React + Yjs).
- **Logic with no test** because it is tangled with a screen. AGENTS.md
  allows screens without tests, never the logic behind them.

Also list what is already good, so the report does not propose to redo it.

**Check every claim before it goes in the report.** Open the files and grep
for the copies. A sub-agent's report is a lead, not a fact. If two copies
differ on purpose (a code comment or ADR says why), say so, or drop the card.

Each candidate must respect the invariants. If a change would break one,
drop it. If it conflicts with an ADR, include it only when the cost is real,
and say "conflicts with ADR-n, worth reopening because …".

Where code belongs (do not propose to move it anywhere else):

| Kind of code | Home |
|---|---|
| Pure rule, used by web and phone | `floc/packages/floc-core/src/` |
| Notes editor, React + Yjs | `floc/packages/floc-editor/src/` |
| SQL | `floc/apps/web/src/server/` (one file per concept) |
| Browser- or Next-bound helper | `floc/apps/web/src/lib/` |
| Takes data, draws it | `components/` (never fetches) |

How to test the change depends on what the code touches — see
[DEEPENING.md](DEEPENING.md).

## 3. Write the report

One HTML page in the local docs, private and gitignored:
`docs/private/architecture-review-YYYY-MM-DD.html`. It uses the docs
stylesheet, so it reads in Floc's own look, light and dark. Scaffold and
diagram patterns: [REPORT.md](REPORT.md).

Every card has these parts, in this order, and nothing more:

1. **Title** — what it is, at the highest level, in under ten words.
   "Turn an Explore trip's legs into stops in one place."
2. **What happens now** — what the code does today, without jargon. A
   reader who does not code must follow it. Name the screens.
3. **The problem** — why that hurts. Concrete: how many copies, which ones
   disagree, what has no test. Numbers beat adjectives.
4. **The change** — what would be different after. One or two sentences.
   No function signatures yet.
5. **The benefit** — what you get, as short bullets ("a fix to dragging
   reaches all three globes").
6. **Pros and cons** — a two-column table. Cons are honest: files touched,
   risk, time, what gets harder.
7. **Before / after picture** — beside or under the text.
8. **Files** — folded in a `<details>`.

Give each card a rating, in words: **Do this**, **Worth a look** or **Small,
optional**. End the page with **Start here**: one card, one sentence on why.

Open the page for the user with PowerShell:
`Start-Process "docs\private\architecture-review-YYYY-MM-DD.html"`. Tell them
the path. Then ask: **"Which of these would you like to explore?"** Do not
design the code yet.

## 4. Grill the pick

When the user picks a card, run [`/floc:grill`](../grill/SKILL.md) on it:
rounds of 2–4 questions on what goes into the one place, what stays out,
what each caller still has to know, which tests stay and which go.

While you grill:

- **A new name for the one place** that is a domain idea (not a code
  idea) → add it to `floc/CONTEXT.md`. A sharper meaning for a word →
  edit it there.
- **The user rejects a card for a reason that will hold** → offer: "Want me
  to record this as an ADR so the next review does not suggest it again?"
  Add it to the decision log only on a yes, in the shape of the last
  record. Skip reasons that are only "not now".
- **The user wants to compare designs** → [DESIGN-IT-TWICE.md](DESIGN-IT-TWICE.md).

## 5. Hand over

Agreed and small → `/floc:implement-feature`, test-first through
`/floc:tdd`. Agreed and large → `/floc:to-tickets`, then
`/floc:prioritise-tickets`. Docs the change makes untrue → `/floc:sync-docs`
in the same slice.

## Report in chat

After the page is written: the path, then a table of card title and rating,
then the **Start here** pick in one line, then the question. Nothing else.
