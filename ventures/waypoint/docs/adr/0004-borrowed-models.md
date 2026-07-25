# 4. What we borrow from Splitwise, Polarsteps and Notion

Date: 2026-07-25

## Status

Proposed

## Context

[0002](0002-product-thesis-and-scope.md) names three products as inspirations.
"Inspired by" is where products go to become a worse version of three other
things. This ADR pins down exactly which mechanic is borrowed, why it works in
the original, and what we deliberately leave behind.

## Decision

### From Splitwise — the ledger, not the wallet

Borrowed:

- **Balances, not transactions, are the interface.** The number a user cares
  about is "you owe Mira £148", never a list of line items.
- **Anyone can record a cost.** Whoever paid, adds it. No approval workflow.
- **Unequal splits are normal** — by share, by person, by "not me, I didn't do
  the diving".
- **Simplify debts**: six people, one settle-up each, not fifteen transfers.

Refused:

- **Holding or moving money.** We are a ledger and a nudge; settlement happens
  in the user's own banking app via a payment link. See
  [0007](0007-money-ledger-not-payments.md).
- **Trip-less expenses.** Every cost hangs off a trip, and where possible off a
  specific booking or day. A cost with no home is a bug, not a feature.

### From Polarsteps — the line

Borrowed:

- **A trip is a route, drawn.** Stops as beads on a line, legs between them,
  the whole shape readable at a glance.
- **The line is the navigation.** Tapping a stop is how you get to its days.
- **The line is also the memento.** After the trip it becomes the thing you show
  people, with no extra work from the user.

Refused:

- **Retrospective-only.** Polarsteps draws where you *went*, from GPS. Our line
  is drawn while it's still an argument: beads for stops with no bed booked yet,
  dotted legs for "somebody said ferry". The plan and the record are the same
  object at different times.
- **Passive tracking as the core loop.** GPS breadcrumbing is a nice-to-have
  during the trip, not the reason the line exists.

### From Notion — editable, structured notes

Borrowed:

- **Free-form blocks** as the default way to capture anything — a paragraph, a
  link, a list, a photo of a menu.
- **Anyone edits, everyone sees, changes are attributed.**
- **Notes attach to things** — a trip, a stop, a day, an hour.

Refused:

- **The blank canvas.** A Notion doc does nothing on its own. Our notes are
  parsed into candidate structure — a place, a date, a cost, a booking — so the
  app can offer to turn "supposedly the pass is closed after 6" into a warning
  on day 3. See [0006](0006-notes-as-the-source-of-truth.md).
- **Database-building as user work.** Users don't configure schemas. They write;
  we infer.

### Also borrowed, from elsewhere

- **Doodle / When2meet** — the availability grid, one of the few genuinely good
  group-decision interfaces ever built. Ours inverts it: mark what you *can't*
  do, because people know their blockers better than their freedom.
- **Duolingo** — the public profile as a light social loop (see
  [0008](0008-accounts-2fa-and-public-profiles.md)), used for *inspiration*, not
  streaks or guilt.
- **Linear** — the "waiting on you" surface. A person should be able to open the
  app and see the two things only they can unblock.

## Consequences

- Three borrowed mechanics means three quality bars set by mature products.
  The ledger in particular must be *correct*, not approximately correct.
- Refusing to hold money removes a revenue line and a regulatory burden at the
  same time. Revisit only with a deliberate ADR.
- Parsing notes into structure is the technically hardest borrowed idea and the
  most differentiating; it is deliberately out of the MVP but the note schema
  must not preclude it.
