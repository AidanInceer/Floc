# 11. The landing page teaches by walking one real trip

Date: 2026-07-25

## Status

Proposed

## Context

The product does ten things. A feature grid listing ten things communicates
nothing — a visitor cannot tell what it is *like* to use, and "all-in-one trip
planner" is a claim every competitor makes.

The brief asks for the new-customer page to walk a user through a plan using one
holiday as the example, with flight or train arrows carrying the eye between
scrolled sections.

## Decision

**One trip, told start to finish, as the entire marketing page.** Not features —
a story with screens.

- Pick **one specific, real-feeling trip** and use it everywhere: the same six
  people, the same dates, the same disagreement. The wireframes use a North Coast
  500 road trip and a Puglia group-of-nine; the site should commit to one.
- Each scroll section is **one stage** from [0005](0005-trip-lifecycle-stages.md),
  shown as an actual screen with real content, plus one sentence of what just
  happened. "Tash blocked Split. Nobody had to argue about it."
- **The connector between sections is the transport itself.** A dotted arc with
  a plane at its head between two sections that cross a country; a rail line
  where the group takes a train; a road with a van for the driving legs. The
  connector's type matches what the trip actually does at that point, so the page
  is itself a route — the product's core metaphor, used as page furniture.
- The connector **draws itself on scroll** and respects `prefers-reduced-motion`
  (static line, no animation). It must never be the only thing carrying meaning.
- **End on the artefact, not the CTA**: the finished route line and a day page,
  then "start yours". The last thing a visitor sees should be what they'd get.
- Secondary path for the sceptic: a single "see a live example trip" link into a
  read-only real trip. No signup wall.

## Consequences

- The page needs real, written trip content of publishable quality — this is
  copywriting work, not lorem, and it has to be redone if the example trip
  changes. Budget for it.
- The scroll narrative is a bespoke build with an animation budget and a
  reduced-motion fallback; it is not a template landing page.
- Strong reuse: the same example trip becomes the onboarding demo, the empty
  state ("or start from this one"), and the public-profile seed content.
- Risk: a road-trip example implies road trips. Mitigate by making the arrow
  types visibly varied — a flight, then a train, then a van — so the page
  demonstrates modes rather than committing to one.
