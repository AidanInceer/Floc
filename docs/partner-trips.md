# Waypoint — partner trip listings

**Decided, 2026-07-26 ([v0.2 map, ticket 03](../../../.scratch/waypoint-v0.2/issues/03-explore-commercial-stance.md)):
deferred, not rejected.** Explore ships v0.2 as **self-made/editorial listings
only** — no partner deal, no fee, no operator relationship. Everything below
remains the thinking for *if* partner listings are ever revisited as a later
effort; none of it is scheduled.

## The idea

A group opens Waypoint with nowhere in mind. Today that's a blank trip and an
empty idea board. **Explore** puts ready-made itineraries in front of them —
something concrete to react to, which is a much easier starting point than a
blank page.

Two sources of listing, and they must stay visibly distinct:

1. **Editorial** — itineraries Waypoint writes itself. No money involved. These
   are the reason the page is worth visiting at all.
2. **Partner** — itineraries supplied by someone in the travel trade: tour
   operators (G Adventures, Intrepid, Exodus), package holiday companies (TUI,
   Jet2holidays), destination management companies, specialist small operators,
   and independent travel agents.

## The tension with monetisation.md

[`monetisation.md`](monetisation.md) explicitly rejects **booking commission**
and **advertising**, on the grounds that a recommendation which is bought
destroys the trust the product runs on. A paid partner listing is close enough
to both that this document cannot pretend it's a new question.

The distinction being tested here is *where* the paid content sits:

- **Rejected, still**: a paid listing appearing inside a group's own planning —
  a sponsored hotel in the Route tab, a promoted idea on the idea board.
- **Possibly defensible**: a clearly labelled, self-contained browsing surface
  the group visits deliberately, before a trip exists, that never reaches into
  a trip they're already planning.

That may still be the wrong call. It is not resolved, and `/explore` shipping as
a mockup does not resolve it.

## What a listing is

The mockup's `PresetTrip` type is the straw man:

| Field | Notes |
|---|---|
| `title`, `summary` | British English, sentence case, concrete. |
| `operator`, `editorial` | Who it came from, and whether money was involved. Always shown on the card. |
| `region`, `country` | The only filter in the mockup. |
| `nights`, `groupSize` | Group size matters more than it does for solo travel products. |
| `priceFromMinor`, `currency` | Integer minor units (CLAUDE.md rule 1). "From … each" — a per-person indication, never a quote. |
| `highlights` | Three or four lines. This is the bit a group actually reads. |
| `bestMonths` | Feeds the Dates conversation rather than pre-empting it. |

Deliberately absent: availability, live pricing, star ratings, third-party
reviews. All of them turn this into a booking product, which v1 is not.

## How a listing becomes a trip

**Built, 2026-07-29 (ticket 39)** — `apps/web/src/app/explore/actions.ts`. The
listings stay static; this is the only live action on the page.

1. Group picks a preset → a new trip is created with the name pre-filled, the
   picker as admin, undated like any other new trip.
2. The itinerary seeds the **idea board** — one idea per highlight, unvoted.
   Ideas, not a fixed route: the group still decides. A non-empty board is what
   sticky-unlocks Route, so the new trip opens with Route already available.
3. `bestMonths` seeds nothing. Not even a hint on the Dates tab yet — the dates
   come from the group's own availability overlap, and the hint is a separate
   piece of work nobody has asked for.
4. The preset is copied, not linked. There is no listing id on the trip: editing
   the trip never touches the listing, and a listing being withdrawn never
   changes a trip already started.

Point 4 matters: a trip is the group's notebook. Nothing outside the group may
mutate it after the fact.

## Commercial models, if it ever goes that way

| Model | Shape | Problem |
|---|---|---|
| Flat listing fee | Operator pays per month to be listed at all | Cleanest — the money buys *presence*, not *ranking*. Small revenue. |
| Paid placement | Operator pays to sit higher | Buys the recommendation. This is the one monetisation.md rejects. |
| Affiliate / commission | Paid per click-through or per booking | Same objection, plus it needs a booking rail Waypoint doesn't have. |
| Nothing | Editorial only, listings as a free acquisition surface | Costs money, earns none, keeps the trust intact. |

The flat listing fee is the only one worth prototyping, and only if ordering is
provably neutral (alphabetical, or by the group's own filter) and every paid
listing carries a visible label.

## Open questions

- Does an inert Explore page actually get used, or do groups arrive with a
  destination already in mind? **Answer this with the mockup before anything
  else.** If nobody browses it, the whole document is moot.
- Can "clearly labelled paid listing" survive contact with an operator who wants
  ranking? (Historically: no.)
- Who checks a partner itinerary is any good? A bad listing is Waypoint's
  reputation, not the operator's.
- What's the obligation when a group starts a trip from a listing and the
  operator later withdraws it? (Nothing, per point 4 above — but that needs
  saying out loud in terms.)
- Does this need consumer-protection copy — that Waypoint is not a travel agent,
  sells nothing, and holds no ATOL protection? Almost certainly yes, before any
  operator name on that page is real.

## See also

- [`monetisation.md`](monetisation.md) — the rejected list this document is in
  tension with.
- [`product-ideas.md`](product-ideas.md) — the feature side.
- [`../CLAUDE.md`](../CLAUDE.md) — v1 scope: payments and booking are out.
