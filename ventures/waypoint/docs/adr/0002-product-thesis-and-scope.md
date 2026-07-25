# 2. Product thesis — one app for the whole trip, group-first

Date: 2026-07-25

## Status

Proposed

## Context

Planning a trip with other people is spread across a group chat, a spreadsheet,
Splitwise, four booking confirmations in four inboxes, a Google Doc nobody
opens, and a map link somebody sent in March. Every one of those tools is
competent alone. The pain is the seams between them: the decision made in the
chat never reaches the doc, the payment never reaches the ledger, the ledger
never knows what was booked.

Solo travel has the same seams minus the arguing — one person still holds route,
budget, bookings and notes in four places.

Existing products each own one slice:

| Product | Owns | Doesn't |
|---|---|---|
| Splitwise | the shared ledger | anything about the trip itself |
| Polarsteps | the route, mostly retrospectively | deciding, money, group input |
| Notion / Docs | free-form notes | structure, votes, money, maps |
| TripIt | confirmations | group decisions, ideation |
| WhatsApp | the arguing | memory |

## Decision

Build a **single trip workspace** that carries a trip from "we should go
somewhere" to "here's Tuesday" to "settle up", with **the group as a
first-class object, not a share button**.

Three explicit inheritances, and what we refuse from each:

- **From Splitwise** — the shared ledger, balances, "who owes whom", settle-up
  maths. *We refuse* being a standalone money app: money is always attached to
  something in the trip (a bed, a ferry, a dinner).
- **From Polarsteps** — the route drawn as a line on a map, stops as beads.
  *We refuse* making it retrospective. Our line is the **plan**, which then
  becomes the record.
- **From Notion** — trip notes are free-form, editable, collaborative blocks.
  *We refuse* being a blank canvas: the notes have a schema underneath so the
  app can act on them (see [0006](0006-notes-as-the-source-of-truth.md)).

Two modes, one product: **group** and **solo**. Solo is group-of-one with the
voting and nudging surfaces hidden, not a separate app.

The unit everything hangs off is a **trip**; the unit the user reads is a
**day**. The day view is the product's home in-flight (see
[0005](0005-trip-lifecycle-stages.md)).

## Consequences

- The competitive claim is integration, not any single feature. Each slice must
  be *good enough* that people stop using the incumbent, which is a high bar for
  money in particular — a half-Splitwise is worse than no Splitwise.
- "Super-app" is a strategy, not a v1. It forces a ruthless MVP cut
  ([0010](0010-feature-backlog-and-mvp-cut.md)) so the first release is a
  coherent thin slice rather than ten shallow features.
- Group-first shapes the data model from day one: every object needs an author,
  a visibility, and a decision state. Retrofitting that is much worse than
  paying for it now.
- We will lose the users who only want one slice. Accepted.
