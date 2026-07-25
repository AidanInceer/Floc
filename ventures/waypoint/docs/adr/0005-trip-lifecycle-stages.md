# 5. The trip lifecycle — ten stages, one object

Date: 2026-07-25

## Status

Proposed

## Context

A trip is not a document; it's a process with phases, and the phase determines
what the group needs on screen. During ideation, a map is noise. During the
trip, a vote is noise. Products that show everything at once (Notion) or a fixed
form (booking sites) both fail here.

The phases are also *where trips die*: between "we should go" and "dates
agreed", and between "dates agreed" and "someone actually books". Anything that
reduces death at those two junctions is the product's real value.

## Decision

Model a trip as a **single object moving through ten stages**. The stage drives
what the trip's home screen shows; earlier stages stay reachable but recede.

| # | Stage | The question | Primary surface | Done when |
|---|---|---|---|---|
| 1 | **Gather** | Who's coming? | Invite link, RSVP list | Enough people to decide |
| 2 | **Decide** | Where, and what kind of trip? | Idea board with votes and blocks | One destination chosen |
| 3 | **Date** | When can everyone go? | Availability grid | A window locked |
| 4 | **Travel** | How do we get there? | Flight/train options, deep links out | Everyone's arrival known |
| 5 | **Shape** | What's the rough plan? | Stops, nights per stop, budget | Stops and beds agreed |
| 6 | **Days** | What does each day hold? | Day list with weather and drive times | Every day has a headline |
| 7 | **Detail** | What are we doing at 2pm? | Day plan with notes and annotations | Bookings attached |
| 8 | **Money** | Who's paid what? | Shared ledger, balances | Balances settle |
| 9 | **Route** | Where are we, on a map? | The line | Continuous throughout |
| 10 | **Chase** | What's outstanding? | "Waiting on you" + nudges | Continuous throughout |

Notes on the model:

- **9 and 10 are not stages, they're always-on views.** The route exists from
  stage 2 (one bead) and grows. The chase surface exists whenever anything is
  blocked on a person. They are numbered here only because the brief listed them.
- **Stages are advisory, not gates.** A group that already knows where it's going
  starts at 3. Skipping is one click, and the skipped stage stays available —
  people add trip ideas *after* booking, and that's fine.
- **A trip carries its stage in the UI as a quiet progress spine**, not a wizard.
  Wizards imply a single driver; this product has six.
- **The day view is the product after departure.** From the morning of day one,
  the app opens on today: plan, weather, who's driving, what's unpaid, what's
  still undecided today.
- **Post-trip is stage 11 and matters more than it looks**: settle up, the route
  becomes a memento, notes become a public trip other groups can copy. That's
  the growth loop.

## Consequences

- The data model needs a `stage` on the trip, with stage transitions logged —
  useful product analytics for free ("where do trips die?").
- Every feature must answer "which stage is this for?", which kills a lot of
  ideas early.
- Solo trips run the same ten stages with stages 1, 2 and 10 collapsed.
- Risk: a group that jumps around makes the stage indicator lie. Mitigate by
  deriving stage from state (dates locked? beds booked?) rather than a manual
  setting.
