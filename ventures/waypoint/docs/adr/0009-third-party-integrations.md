# 9. Third-party integrations — deep link out, never resell

Date: 2026-07-25

## Status

Proposed

## Context

The brief asks for flight options via API — a Skyscanner link or similar — plus
weather per location, and maps for the route. Travel inventory is a hard,
expensive, low-margin business: OTA agreements, caching rules, price accuracy
obligations, and support burden when a booking goes wrong at 2am in an airport.

Meanwhile the *planning* value doesn't require owning the booking. A group needs
to see "the cheapest window everyone can fly is 25 May, about £180" to make a
decision. They're happy to book on Skyscanner.

## Decision

**Search and display, then hand off. We never take the booking, never hold
inventory, never own the ticket.**

| Need | Approach | Notes |
|---|---|---|
| Flights | Metasearch API (Skyscanner/Kiwi/Duffel-style) for indicative prices and times; deep link to book | Prices shown as indicative, timestamped. Never presented as bookable by us |
| Trains / ferries | Rail and ferry aggregators where an API exists; a plain link where it doesn't | Europe-first; coverage will be patchy and must degrade to a link |
| Accommodation | Deep links; **paste-a-link import** is the more valuable feature — parse a booking URL into a stop with dates, price and address | Import works everywhere, including the places APIs don't cover |
| Maps & routing | One mapping provider for tiles, geocoding, drive times | Chosen for cost at scale and offline-friendly tiles. Vendor-abstracted behind our own interface |
| Weather | Forecast API for stop coordinates, plus climate normals for dates beyond forecast range | A trip in eleven months needs "typically 24°C, rain 6 days" — not a forecast |
| Calendar | ICS export and two-way sync for the locked dates | Cheap, high perceived value |
| Email | Forward-your-confirmation inbox that parses into bookings | Highest-value integration after money; TripIt's core trick |

Principles:

- **Every integration must degrade to a link.** If the API is down, out of
  region, or too expensive, the feature becomes a well-placed link and the
  product still works.
- **Vendor-abstracted.** Each category sits behind our own interface. Assume
  every travel API will change terms or die.
- **No affiliate link may change what we show.** Ranking is by relevance to the
  group's constraints. Where we earn commission, say so on the row.
- **Cache aggressively, refresh visibly.** Show when a price was last checked.

## Consequences

- Affiliate/referral revenue becomes a plausible monetisation line without
  becoming an OTA — but it must never be allowed to distort ranking (see above),
  which caps how lucrative it can get. Accepted.
- No booking support burden, no ticketing liability, no fare-rule complexity.
- The paste-a-link and forward-your-email importers are the real integration
  moat: they work with every supplier, forever, without a partnership.
- Rate limits and per-call costs need a caching layer and a budget guard before
  any of these ship to real users.
