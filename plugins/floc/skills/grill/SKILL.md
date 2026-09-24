---
name: grill
description: Grill the user in rounds of 2–4 questions about a Floc plan, idea or `grilling` ticket until every decision is settled, then write the decisions and acceptance criteria into the ticket and hand over to /floc:implement-feature. Use when the user says /floc:grill, "grill me", "stress-test this", or /floc:pickup-ticket reaches a ticket labelled `grilling`.
---

# grill

Interview the user about the plan until you both understand it the same way. Walk the decision tree one branch at a time: settle a decision before the decisions that depend on it. Do not build anything until the user confirms the plan is agreed.

## 1. Read first

Before the first question, find the facts yourself:

- [Mission and values](../../../../docs/mission.html) and the [decision log](../../../../docs/adr/decisions.html). What Floc is for, and what is already decided. Do not ask again what a record already settles.
- The ticket, if there is one: `gh issue view <n> --repo AidanInceer/Floc`.
- `AGENTS.md` (Invariants, Conventions, UI and UX), `floc/CONTEXT.md`, `learnings.md`.
- The `docs/` pages and the code the plan touches.

Never ask something the code, docs or tools can answer — look it up. The *decisions* are the user's. If an option breaks an invariant, say which one by number (`rule 8`). In each `Why:`, name the value or ADR the recommendation rests on, if one does.

## 2. Ask in rounds of 2–4

Ask 2–4 questions per message, numbered so the user can answer by number. Wait for the answers before the next round. Put only questions in a round that do not depend on each other; a question whose options hang on an open answer waits for a later round.

Each question has this shape and nothing more:

```
Q<n>. <The question, one or two lines. For a hard topic, a short example.>

1. <Option> — recommended
2. <Option>
3. <Option>

Why: <one to three lines on why the recommended option wins.>
```

No running summary, no list of settled or open questions between rounds.

If a new term comes up and the user settles what it means, add it to `floc/CONTEXT.md` then and there. Leave the other `docs/` pages to `/floc:sync-docs` at build time — except the two in step 4.

## 3. What you'll see

When the decisions are settled and the plan changes a screen, run one short round:

```
What you'll see
- Web: <one line per screen or flow — what is on it and where>
- App: <the same, or "same as web" / "not on the phone">

Right? Or say what is off.
```

One answer, then move on. For a **new** screen only, offer a quick `/floc:prototype`: 2 variants, one pick. The user may skip it.

## 4. Short-cuts from the user

- **"Choose the recommended options for the rest"** (or similar): take the recommended option for every open question without asking, then go to step 5.
- **"… and implement"**, or the user said `auto`: after step 5, go straight to step 6 without waiting.

## 5. Write it down

When every branch is settled (or taken on recommendation), and there is a ticket:

1. Add `## Decisions` to the ticket body: one line per decision. Mark any decision taken on recommendation without an answer from the user with `(recommended)`.
2. Add `## What you'll see`: the lines from step 3, as agreed.
3. Add `## Acceptance criteria`: checkable lines that `/floc:implement-feature` can test against.
4. **Decision log.** Each decision that outlives this ticket — a rule other features must follow — gets a record in [decisions](../../../../docs/adr/decisions.html): next number, status `Accepted` (or `Proposed` if it still waits on something). Add to [mission and values](../../../../docs/mission.html) only when the user states what Floc is or is not for.
5. Remove the label: `gh issue edit <n> --repo AidanInceer/Floc --remove-label grilling`.

With no ticket, give the decisions and criteria in chat.

**Do not split.** The ticket stays one ticket, however big. Run `/floc:to-tickets` only if the user asks for a split.

## 6. Report, then build

Give a summary report of the shared understanding:

- **What we are building** — two or three lines, in plain words.
- **Decisions** — grouped by topic, one line each; mark `(recommended)` where the user did not answer.
- **What you'll see** — the agreed lines.
- **Out of scope** — what the grill cut.
- **Risks and open points** — anything left to watch during the build.
- **Ticket** — link, and what was written to it. New ADR numbers, if any.

Then stop and wait for the user's go before `/floc:implement-feature` builds the ticket. Skip the wait only when step 4 said to implement.
