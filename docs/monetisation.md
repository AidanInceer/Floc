# Waypoint — how this could make money

High-level thinking, not a decision. Nothing here is committed, scheduled, or
reflected in the code. Payments of any kind are explicitly **out of scope for
v1** (see [`CLAUDE.md`](../CLAUDE.md)) — this exists so that when v1 lands
there's a considered starting point rather than a panic.

## The constraint that shapes everything

Waypoint's whole pitch is *a shared notebook the group trusts*. That trust is
the asset, and most travel-industry revenue models spend it:

- **Booking commission** means the recommendation is bought. The moment a hotel
  appears because it pays, the group stops believing the route.
- **Advertising** means selling the group's attention while they're trying to
  make a decision — the one moment they came for.
- **Data resale** ends the product. A trip is who you travel with, when you're
  away from home, and what you can afford.
- **Taking a cut of settlements** turns the ledger into a payment rail, which
  is regulated, expensive, and would make the money tab feel like a toll booth.

So: **the group's core planning is free forever, and nothing that touches their
money costs money.** Every option below has to survive that.

## The shape of the market

Group travel planning has a specific commercial problem: the software is used
intensely for six weeks, then not at all for eleven months. Subscriptions fit
badly. What people *will* pay for tends to be either (a) something at the
moment of peak value, or (b) a use case that isn't "seven friends, one trip a
year".

That splits the options into three honest buckets.

---

## Bucket 1 — Charge at the moment of peak value

The end of the trip, when the book is full and the group is nostalgic. This is
the strongest instinct, because the willingness to pay is real and the thing
being sold isn't a feature the group needed to plan the trip.

### The printed book

The whole metaphor is already a notebook. At the end of a trip, Waypoint holds
the route, the day-by-day, who was there, the photos attached to expenses and
the arguments in the note threads. Turning that into an actual printed object
— a small hardback, £25–40, one per person who wants one — is a product that
sells itself at exactly the point the group is feeling warmest about it.

- **Why it works**: nobody has to pay to plan; the paying moment is a keepsake,
  not a paywall. Print-on-demand means no inventory.
- **Margin**: real but thin (print + shipping). A 7-person trip where 3 order
  is ~£100 revenue, maybe £45 gross.
- **Risk**: it's a physical-goods business bolted onto software — returns,
  shipping, customer service. Test with a PDF export first (£4?) and see if
  anyone even wants the artefact before touching a printer.
- **Cheapest test**: a "download the book" button that produces a nicely typeset
  PDF. Count clicks before building anything.

### The offline/travel pack

A paid one-off (£3–5 per trip, bought by anyone, unlocks for the group) that
bundles the things that matter *while you're away* rather than while you're
planning: a proper offline copy, printable day sheets, a wallet card with the
route and everyone's numbers. Distinct from the planning product, priced like a
guidebook, and it doesn't degrade the free tier because the free tier is about
deciding, not travelling.

---

## Bucket 2 — Charge the groups that aren't the core case

The core case (six to nine friends, one or two trips a year) stays free. Some
groups look like the core case but use the product ten times harder.

### Organiser plans (the strongest recurring-revenue candidate)

People who run trips *repeatedly for other people*: stag/hen organisers, walking
and cycling clubs, university societies, small tour operators, wedding parties,
sports teams on tour. They plan 5–20 trips a year, with rotating casts, and the
admin is the whole job.

What they'd pay for (~£8–15/month, or £60–120/year):

- Trip templates — clone last year's Peak District weekend, keep the route,
  swap the people.
- A roster: people who travel with you repeatedly, without re-inviting them.
- Cross-trip money: one person who owes across three trips, one number.
- Collecting *commitments* (not payments) — "who's actually in, by Friday".
- Their own branding on the shared/exported book.

**Why this is the best bet**: the willingness to pay is genuinely higher (it's
a job, not a holiday), the feature set is additive rather than restrictive, and
none of it makes the free product worse. It also has an obvious pipeline —
organisers are already visible in the free product by usage pattern.

### Very large groups

A 40-person trip is a different product with different problems (sub-groups,
who's in which house, coach seats). Charging above some member threshold is
defensible, but the number has to sit well clear of a normal friend group —
25+, not 10 — or it reads as a bait-and-switch on the core promise.

---

## Bucket 3 — Charge for depth, not for access

The classic freemium line, drawn so that no *trip* is ever crippled:

| Free forever | Paid ("the archive", ~£20/year) |
|---|---|
| Unlimited trips, unlimited members | — |
| Every planning surface, the full ledger | — |
| Your last N trips, in full | Every trip you've ever taken, forever |
| Export everything, always | Search across all trips at once |
| — | Attachments/receipt photos beyond a storage cap |

This is honest — the thing being charged for is *storage over time*, which is
the thing that actually costs money — but it only produces revenue from heavy
long-term users, which is a small slice. Treat it as a supplement.

---

## Explicitly rejected

| Idea | Why not |
|---|---|
| Booking commission / affiliate hotel links | Buys the recommendation; kills the trust the product runs on. If a search link is ever added it must be a plain deep link that pays nothing. |
| Advertising | Selling the group's attention during the decision they came to make. |
| Selling or brokering trip data | Ends the product. Not a pricing question. |
| A cut of settlements | Turns the ledger into a payment rail: regulated, expensive, and it makes the honest bit feel like a toll. |
| Charging per trip member | Punishes exactly the behaviour the product needs (inviting the ninth person). |
| Paywalling the money tab | It's the most-loved feature and the one with the clearest alternative (a spreadsheet). Charging for it loses users, not converts them. |

---

## A sequencing that doesn't need a decision yet

1. **v1 → free, no billing code at all.** Learn what groups actually do. The
   only thing worth doing now is not building anything that would make the
   options above impossible.
2. **Instrument the paying moments.** After a trip settles, offer the PDF
   export. Count who wants it. That is the cheapest possible read on Bucket 1.
3. **Find the organisers.** They'll be obvious: same account, many trips,
   rotating members. Talk to twenty of them before designing a plan.
4. **Ship one thing, priced simply.** Most likely the organiser plan (recurring,
   defensible, additive). The printed book second, if the PDF numbers justify
   the operational weight.
5. **Never** revisit the rejected list to close a revenue gap. The gap is a
   signal about the product, not about the pricing.

## Open questions

- Does the "end of trip" moment produce enough intent to buy, or does the group
  simply disperse? (Testable with the PDF, cheaply.)
- Are organisers a big enough population to be a business, or a nice niche?
- Is per-trip one-off pricing (a "travel pack") more natural than subscription
  for a product used in bursts? Probably — but it caps revenue hard.
- What's the minimum storage cost per archived trip? That number decides
  whether Bucket 3 is honest or arbitrary.

## See also

- [`product-ideas.md`](product-ideas.md) — the feature side: what else would
  actually solve problems for groups planning trips.
- [`../CLAUDE.md`](../CLAUDE.md) — the v1 scope boundary this document must not
  quietly cross.
