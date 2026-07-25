# 10. Feature backlog, and the MVP cut

Date: 2026-07-25

## Status

Proposed

## Context

The brief asks to capture broadly first and refine later. This ADR is
deliberately two documents in one: an **expansive catalogue** of everything
worth considering, and then a **hard cut** of what the first shippable product
contains. Keeping them adjacent is the point — the cut only means something
next to the list it was cut from.

## Decision — the catalogue

Nothing here is committed. Ideas are grouped by the stage they serve
([0005](0005-trip-lifecycle-stages.md)).

### Gather (stage 1)

- Invite by link, QR, or contact; join without an account
- RSVP with a confidence level: in / probably / can't
- **Deposit-to-commit** — a refundable "I'm actually in" stake that stops the
  perpetual maybes
- Group size cap and a waitlist for the friend-of-a-friend problem
- Roles: who's the money person, who's the driver, who books
- Sub-groups — the four who want the hike, the three who want the beach

### Decide (stage 2)

- Idea board: place, rough cost, photos, link, who suggested it
- Vote up / don't mind / **block** — a block is cheap and must be explained
- Trip-style axes rather than destinations: beach ↔ city, plan ↔ drift,
  hostel ↔ hotel, party ↔ quiet, ≤3h flight ↔ anywhere
- **Anonymous budget ceiling** — everyone gives a number, only the band shows.
  Removes the single worst conversation in group travel
- Ground rules agreed once and shown everywhere ("no flights before 8am")
- Constraint capture: passports, visas, dietary, mobility, allergies, pets
- Shortlist → head-to-head → decision, with a deadline and an auto-close
- "Surprise me" — the app proposes three destinations fitting every constraint
- Carbon comparison per option; a train-first flag for the ideologically firm

### Date (stage 3)

- Availability grid: mark what you *can't* do
- Calendar import so it fills itself in
- Auto-suggested windows ranked by attendance, price and weather
- School-holiday and bank-holiday overlays; price-by-week heat strip
- Poll deadline, auto-nudge, auto-lock when unanimous

### Travel (stage 4)

- Everyone's origin airport/station — the group leaves from five cities
- Indicative fares per origin for the locked window, deep link to book
- **Arrivals board** — who lands when, at which terminal, who shares a transfer
- Price watch on the chosen route with an alert
- Ground transport: hire car with named drivers, transfers, rail passes
- Paste-a-link / forward-a-confirmation import (see
  [0009](0009-third-party-integrations.md))
- Visa, passport-validity and vaccination checks by nationality

### Shape (stage 5)

- Stops with nights each, auto drive/train times between
- Accommodation options with votes, then a booking
- **Room and bed assignment** — the awkward one, made mechanical
- Budget envelope: target per person vs. committed vs. spent
- Packing list, shared and personal, seeded by destination and season
- Trip templates: road trip, city break, ski week, festival, wedding abroad

### Days (stage 6)

- Day list with a headline, drive time, weather, and cost per day
- Weather forecast inside range; climate normals beyond it
- Pace warnings: three long drives in a row, no rest day in nine
- Opening-hours and closed-day checks (the Monday-museum problem)
- Sunrise/sunset, golden hour, tide times for coastal stops

### Detail (stage 7)

- Hour-by-hour plan with optional and fixed items
- **Free-form notes on any object**, edited by anyone, attributed
- Inline annotations on a plan line, threaded replies, reactions
- Split-the-group moments: who's doing the walk, who's going to the shops
- Bookings attached to their slot, with references and door codes
- Offline pack: days, map, codes and tickets cached on the phone
- Live day view: what's next, where everyone is, who has the keys

### Money (stage 8)

- Shared ledger with unequal splits and multi-currency
  ([0007](0007-money-ledger-not-payments.md))
- Cost attached to booking / day / stop
- Balances, simplified settle-up, payment deep links
- Receipt photos; scan-to-split a restaurant bill
- Pre-trip pot: who has paid their share of the villa deposit
- Per-person spend vs. their stated budget band, privately

### Route (stage 9)

- The line: stops as beads, legs typed by transport mode
- Booked / unbooked shown on the line itself
- Live position during the trip; distance travelled
- Elevation and drive-time profile for road trips
- After: the line becomes a shareable memento; auto photo book

### Chase (stage 10)

- One "waiting on you" list across every trip
- Nudge a person, a group, or everyone who hasn't voted
- Deadlines with auto-escalation; digest rather than per-event notifications
- Quiet hours and a per-trip notification budget

### Cross-cutting

- Solo mode (group-of-one), with voting surfaces hidden
- Public profile and trip copying ([0008](0008-accounts-2fa-and-public-profiles.md))
- Trip journal that becomes a printable book
- Emergency card: insurance numbers, embassy, next of kin, allergies
- Accessibility filters on stops and stays
- Translation of notes for mixed-language groups
- Export everything; import from Splitwise, TripIt, Google Sheets
- Desktop for planning, mobile for travelling — genuinely different layouts

## Decision — the MVP cut

The MVP exists to prove **one claim**: *a group that would otherwise die in the
chat gets to a booked, dated trip.* Everything that doesn't serve that claim is
out, however good it is.

**In:**

1. Create a trip; invite by link; **join and vote without an account**
2. Idea board with up / don't mind / block, and a deadline
3. Availability grid → lock a window
4. Stops with nights, drive times, and a route line
5. Day list with a headline per day, and free-form notes on trip / stop / day
6. Shared ledger: add a cost, split it, see balances, simplified settle-up
7. "Waiting on you" plus one-tap nudge
8. Passkey/email accounts, private by default
9. Mobile web first, installable; offline read of the current trip

**Out of v1, in roughly this order afterwards:**

flight search and arrivals board · weather and climate · calendar sync ·
paste-a-link and email import · public profiles and trip copying ·
AI route drafting from notes ([0006](0006-notes-as-the-source-of-truth.md)) ·
room assignment · packing lists · live position · photo book · deposit-to-commit ·
sub-groups · native apps

**Explicitly never, without a new ADR:** holding funds, selling inventory,
public-by-default anything, live location shared outside the trip.

## Consequences

- The MVP is roughly Splitwise + a decision tool + a route sketch. That is
  narrower than the pitch and much likelier to ship.
- Weather and flights are the two most-requested cuts. They are cheap to add
  once the trip object exists, which is why they're first out and first back.
- The catalogue is a capture, not a roadmap. Anything promoted from it needs a
  stage, a claim, and a place in the cut order.
