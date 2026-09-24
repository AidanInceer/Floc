---
name: feedback
description: Turn what the user noticed in the built product — "that's not what I meant", something off, something missing — into tickets in AidanInceer/Floc, each traced to why it drifted, and fix the mission page or decision log so it does not happen again. Use when the user says /floc:feedback, reviews a build or release and lists what is wrong, or says a feature does not match what they asked for.
---

# feedback

The user reviews what was built and says what is off. This skill turns each
point into a ticket, finds where the gap between intent and build came from,
and closes that gap at the source.

## 1. Collect

Take every point from the user's message. One point = one thing on one screen
or flow. Do not ask for more detail yet.

## 2. Look before you ask

For each point, find the facts yourself:

- The screen or code it is about. Open it in the Browser pane or on the
  emulator if the dev loop is up.
- The ticket that built it: `git log --grep`, then `gh issue view <n>`. Read
  its `## Decisions`, `## What you'll see` and `## Acceptance criteria`.
- [Mission and values](../../../../docs/mission.html) and the
  [decision log](../../../../docs/adr/decisions.html).

## 3. Name the cause

Give each point one cause:

| Cause | Meaning | Fix at the source |
|---|---|---|
| **Bug** | The ticket was clear; the build did not follow it. | None — the ticket is the fix. |
| **Unsaid** | Nothing written covered it; the builder guessed. | Add a value to the mission page, or an ADR. |
| **Wrong call** | A decision was made and followed, but it is wrong. | New ADR that replaces the old one. |
| **Changed mind** | It was right then; the user wants something else now. | New ADR if it outlives the ticket. |

Only ask when the cause or the wanted result is unclear. Use the
`/floc:grill` question shape, 2–4 questions per round.

## 4. File

One ticket per point, unless two points are one change. Follow the
`/floc:to-tickets` issue shape and rules (category-prefixed title, exactly one
type label: `type:fix` for **Bug**, else `type:refinement`). Add to the body:

```
## Feedback

<what the user saw, in their words>

Cause: <Bug | Unsaid | Wrong call | Changed mind> — <one line>
Built by: #<ticket> (<commit short sha>)
```

Then run `/floc:prioritise-tickets` so they enter the stack.

## 5. Fix the source

For every cause except **Bug**, edit
[mission and values](../../../../docs/mission.html) or the
[decision log](../../../../docs/adr/decisions.html) now, as the table says.
Show the user the new rule or record in one line each.

## Report

A table: point, cause, ticket. Then each mission or ADR change in one line.
Nothing else.
