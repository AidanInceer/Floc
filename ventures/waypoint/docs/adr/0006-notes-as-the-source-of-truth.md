# 6. Notes are the source of truth; the AI drafts, the group decides

Date: 2026-07-25

## Status

Proposed

## Context

The brief asks for Notion-adjacent editable notes, and for AI to build a route
from those notes. This is the venture's most distinctive idea and its biggest
risk. Two failure modes are easy to walk into:

1. **The AI is a toy.** A "generate my itinerary" button produces a generic
   seven-day Puglia plan indistinguishable from a blog post. Nobody uses it
   twice, because it doesn't know that Priya can't do 5am flights and that
   somebody already booked the masseria.
2. **The AI is a liar.** It invents opening times, distances, and ferries that
   don't run in September, and the group finds out at the pier.

What makes this product's version different is the input: by the time a group
reaches stage 5, the app already holds their real constraints — who's coming,
the locked week, the budget band, the blocks people cast, the ground rules, and
a pile of notes people wrote in their own words.

## Decision

**Notes are the primary capture surface, and the route is a derived artefact
the group can accept, edit or ignore.**

- Every note is a block attached to a scope: trip, stop, day, or slot. Free-form
  text, links, images, checklists.
- A background pass extracts **candidate entities** from notes — places, times,
  costs, booking references, warnings — and offers them as suggestions. Nothing
  is silently promoted: a suggestion is a card the user accepts, edits or
  dismisses.
- **Route drafting is a proposal, never an overwrite.** The AI reads notes +
  constraints (dates, party size, budget band, ground rules, existing bookings)
  and proposes a stop order with nights and drive times. It arrives as a
  *draft alongside* the current route, diffed, with each choice traceable to the
  note or constraint that caused it ("3 nights in Ullapool — Alex's note: ferry
  day needs a base").
- **Anything factual is sourced or hedged.** Distances and drive times come from
  a routing API, weather from a weather API, opening hours from the place's own
  listing. The model composes; it does not assert facts it cannot cite. If a
  fact has no source, it is shown as "worth checking", not as a fact.
- **The group decides.** A proposed route enters the normal vote/block flow like
  any human suggestion. The AI gets no special authority and no vote.

## Consequences

- The notes schema must be designed for extraction from day one, even though
  extraction ships later: stable block IDs, scope references, author, timestamp.
- Proposals must be cheap to reject. If accepting is a one-way door, people
  won't press the button.
- Cost control matters: drafting runs on demand, not on every keystroke.
- Privacy: notes are trip-private by default and are the most sensitive content
  in the product. They must never enter a public trip copy without an explicit
  export step. See [0008](0008-accounts-2fa-and-public-profiles.md).
- This is deliberately **out of the MVP** ([0010](0010-feature-backlog-and-mvp-cut.md))
  — but the note model that makes it possible is in.
