# 12. Visual direction — four prototypes, one structure

Date: 2026-07-25

## Status

Proposed — direction not yet chosen

## Context

The product's tone is unusually load-bearing. This app sits between friends
during an activity that produces real friction — money, someone's blocked
destination, who didn't pay Rae back. A visual language that reads as
*corporate* makes a nudge feel like an invoice. One that reads as *toy* makes the
ledger untrustworthy. The interface has to hold both a £888 balance and a note
saying "the fire takes an hour to get going".

Rather than argue in the abstract, four prototypes were built at the same
fidelity, sharing identical structure and content so only the visual language
differs.

## Decision

Keep **one structural system** across all variants:

- Five pages — landing, my trips, group deciding, route, days — switched
  client-side. No anchors, so nothing jumps or scrolls unexpectedly.
- The same signature object in every variant: **a trip is a line with stops on
  it**, and that line doubles as progress bar, wayfinder and status board.
  Filled bead = booked, hollow = open, marked bead = where you are.
- The same three-state colour semantics, whatever the palette: one accent for
  *agreed*, one for *still open*, one reserved for *someone must act*. No fourth.
- Light by default in every variant; dark is opt-in, never inherited from the OS
  — a plan read in a pub at 9pm should look the way the person who made it saw it.

The four variants, all in [`../../wireframe/`](../../wireframe/):

| File | Direction | Bet |
|---|---|---|
| [`index.html`](../../wireframe/index.html) | **Sand** — sun-warmed neutral ground, petrol ink, marine + apricot accents, geometric display face | Warm and calm; the trip is the colour, the UI isn't |
| [`glossy.html`](../../wireframe/glossy.html) | **Glossy** — sleek and professional; deep-contrast surfaces, tight grid, precise mono data, restrained gloss | Trust. The money and the bookings read as serious infrastructure |
| [`paper.html`](../../wireframe/paper.html) | **Paper** — a relaxed journal; ruled sheets, handwriting-adjacent accents, marginalia, tape and stamps | Warmth and ownership. The trip feels like a shared notebook |
| [`island.html`](../../wireframe/island.html) | **Island** — summer holiday; sea and sun, generous curves, soft depth | Anticipation. The app sells the feeling of going |

Three further variants were added later, as alternatives to hold in reserve
once the hybrid in [0013](0013-hybrid-visual-direction.md) was chosen:

| File | Direction | Bet |
|---|---|---|
| [`atlas.html`](../../wireframe/atlas.html) | **Atlas** — a mid-century survey sheet; graticule grid, contour banding, condensed grotesque, scale bars and grid references | Authority. The plan reads as a surveyed document |
| [`transit.html`](../../wireframe/transit.html) | **Transit** — European rail wayfinding; octolinear route diagram, signage sans, departure-board rows, ticket-stub cards | Legibility at a glance, under time pressure |
| [`dusk.html`](../../wireframe/dusk.html) | **Dusk** — soft mobile-first consumer app; large radii, one restrained dusk gradient, a day ribbon shaded by sun position | Feeling. A day's shape is readable before a word is |

Selection criteria, in priority order:

1. **Does the ledger look credible?** Test the money screen first, not the hero.
2. **Does a nudge read as friendly?** The same screen must work when it's your
   turn to pay.
3. **Does it survive density?** Nine people, eight days, forty costs.
4. **Does it survive a phone in sunlight?** Contrast and hit targets.
5. **Is it distinguishable from every other travel app** at a glance?

## Consequences

- Four prototypes is more up-front cost than one, but the comparison is
  concrete: same screens, same content, only the language changes.
- Because structure is shared, the winner is a token-and-type swap rather than a
  rebuild, and a losing variant can donate individual ideas.
- A hybrid is a legitimate outcome — e.g. Glossy for money and bookings, Paper
  for notes and days — but only as a deliberate decision recorded here, not as
  drift.
- Whichever wins, the accessibility floor is fixed: visible focus, contrast
  ratios met in both themes, motion optional, everything reachable by keyboard.
