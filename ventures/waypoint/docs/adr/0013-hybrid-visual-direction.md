# 13. Hybrid visual direction — Paper structure, Wanderlog mechanics

Date: 2026-07-25

## Status

Proposed — supersedes the open question in
[0012](0012-visual-direction-and-prototypes.md) about which single prototype wins

## Context

[0012](0012-visual-direction-and-prototypes.md) built four prototypes and
explicitly allowed a hybrid, provided it was recorded here rather than arrived
at by drift. Building the MVP cut for real forced the question, because the two
halves of this product want different things:

- The **planning surfaces** — route, days, ledger — are a working tool used
  under pressure, often on a phone, sometimes by nine people at once. Wanderlog
  has already solved the shape of this: a sticky map beside a scrolling
  itinerary, numbered pins that mean the same thing in both, white cards on a
  calm ground, pill navigation, an interface sans that survives 12px.
- The **social surfaces** — ideas, votes, blocks, notes, nudges — are where the
  friction lives, and a clinical treatment makes a nudge read as an invoice.
  That was the whole bet of the Paper prototype.

Picking one wholesale loses the other half.

## Decision

**Wanderlog for the mechanics, Paper for the voice.**

From Wanderlog:

- White-ish cards on a calm ground, 12px radius, soft shadow, hover lift.
- A **sticky map beside a scrolling itinerary**, and the numbered teardrop pin
  is the same object in both places — filled when a bed is booked, hollow when
  it isn't.
- Pill navigation in a sticky top bar, with a count badge on what's waiting.
- Inter for the interface, at the sizes an interface is actually read at.

From Paper:

- The ground is **cream, not grey**. `#f4efe4`, not `#f7f7f8`.
- **Ruled paper and the red margin survive, but only on writing surfaces** —
  the `.ruled` class, used where people leave notes. Everywhere else it would
  be wallpaper.
- **Petrona** for anything a person wrote: headings, place names, note titles.
- **Caveat** for marginalia and for the note composer itself — a field addressed
  to the group looks handwritten, not typed.
- Tape where a card is holding something down, an ink stamp on a settled trip.
- IBM Plex Mono for every figure, so money aligns in a column.

The three-state colour semantics from [0012](0012-visual-direction-and-prototypes.md)
are unchanged and non-negotiable: **pen blue = agreed**, **amber = still open**,
**red = someone must act**. A fourth colour, warm orange, is admitted **only**
as the primary call to action on the landing page, and appears nowhere inside
the app.

## Consequences

- The implementation is [`apps/prototype`](../../apps/prototype/). The four
  single-file wireframes stay as a record and are no longer the reference.
- The seam is legible and therefore maintainable: tokens and layout are
  Wanderlog's, type and the note surfaces are Paper's. A future change should
  be able to say which side it's on.
- The risk is the middle ground — warm-but-clean is exactly where a lot of
  travel software lands. The defence is that the handwriting, the ruled note
  surfaces and the ink stamp are load-bearing, not decorative: they mark
  *whose words these are*, which is the thing this app is actually about.
- Density is the open test. Nine people, eight days and forty costs still needs
  checking against criterion 3 in [0012](0012-visual-direction-and-prototypes.md).
