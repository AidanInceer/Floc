# Waypoint — problems worth solving next

A backlog of *problems*, not a roadmap. Nothing here is committed. Several
items sit outside the v1 scope boundary in [`CLAUDE.md`](../CLAUDE.md) and say
so; the point of writing them down is to know what's being deferred and why,
not to pre-build for it.

Each entry is: the problem a real group has, what it might look like, and the
honest catch.

---

## 1. Getting people to actually turn up

### The commitment moment

**Problem.** The single hardest thing in group travel isn't picking a place —
it's the gap between "yeah I'm keen" and "I've booked my flight". Trips die in
that gap, and the organiser carries the anxiety alone.

**Shape.** A per-member commitment state on the trip: *interested → in →
booked*. Not a deadline, not a payment — a visible, self-declared answer to
"are you actually coming?". The overview says "5 of 7 are in, 2 have booked".

**Catch.** It can turn social pressure into a UI feature, which is exactly the
tone the product avoids. It works only if it stays self-declared and nobody
gets chased automatically. Fits the existing "nudges, not nagging" rule.

### The deposit problem

**Problem.** Someone always fronts £400 for a house and then feels awkward
asking. That awkwardness is the #1 reason organisers stop organising.

**Shape.** Flag an expense as "fronted" — it enters the ledger immediately,
before the trip, with a clear "3 of 7 have squared up" state. No money moves;
it's the *visibility* that does the work.

**Catch.** Almost free to build on the existing ledger. Genuinely high value.
Probably the best value-to-effort item on this page.

---

## 2. The parts of a trip Waypoint currently ignores

### Who's arriving when

**Problem.** Seven people from four cities on five different flights. Right now
that lives in the chat, and someone always ends up alone at an airport.

**Shape.** An arrivals/departures board per trip: each member's inbound and
outbound, times only, no booking integration. It immediately answers "who can
share the transfer?" and "when does the group actually start?".

**Catch.** Tempting to reach for flight APIs. Don't — free-text plus a time is
90% of the value, consistent with the "degrade, don't crash" rule.

### Where everyone is sleeping

**Problem.** The route says "Taormina, 3 nights". It doesn't say which house,
whose name the booking is in, what the door code is, or which four people are
in the annexe.

**Shape.** A booking/lodging record attached to a stop: name, address, who
booked it, reference, and the room allocation. The one thing everyone opens on
arrival day.

**Catch.** Room allocation is socially loaded (who shares with whom). Keep it
a plain list someone edits, not an algorithm.

### The packing and jobs list

**Problem.** "Who's bringing the speaker / the coolbox / the good knife?" and
"who's booking the airport transfer?" are the same problem: a shared checklist
with a name against each line.

**Shape.** One list per trip, each item claimable by a member. Deliberately
dumb.

**Catch.** Nearly free, and it's the kind of small feature that makes a product
feel finished. Low risk of scope creep if it stays one flat list.

---

## 3. Making decisions less painful

### Options, not just ideas

**Problem.** Voting works for "where shall we go". It works badly for "which of
these three houses", where the real content is a price, a location and a
tradeoff.

**Shape.** A comparison card: two to four options side by side with the
attributes that matter (price per person, distance, sleeps), then a vote. The
group's actual decision unit.

**Catch.** Attribute schemas get complicated fast. Keep it free-text rows the
group defines itself.

### Budget before booking

**Problem.** Groups discover they can't afford the trip *after* someone has
booked something. The money tab is retrospective — it tells you what you spent,
never what you're about to.

**Shape.** A per-person target ("about £600 each") set early, and an estimate
that accumulates as stops and options are added: "currently tracking at £710
each". Nobody has to enter real numbers for it to be useful.

**Catch.** Estimates that drift from reality are worse than none. Needs to be
visibly an estimate, in the same typed-figures discipline as the ledger.
Probably the highest-value item in this section — money anxiety is the quiet
reason people opt out of trips.

### Quiet voices

**Problem.** In a nine-person group, two people decide everything and one
person hates the plan silently. That surfaces on day three of the trip.

**Shape.** Something very light — an anonymous "does this work for everyone?"
temperature check on a decision, or simply showing who hasn't engaged with a
stop yet ("Ana hasn't opened Dates").

**Catch.** Easily creepy. "Who hasn't engaged" is surveillance if framed
wrong. Anonymous sentiment is safer but weaker. Worth research before design.

---

## 4. During the trip

### The one-screen day

**Problem.** Waypoint is currently a planning tool that goes quiet the moment
the trip starts, which is when the group most needs a shared answer.

**Shape.** A "today" view: today's day-plan, tonight's accommodation with the
address, who's arriving, and one tap to log an expense. Offline-readable.

**Catch.** This is what makes people open the app on holiday, which is what
makes them remember it exists next year. Strategically important beyond its
size.

### Fast expense capture

**Problem.** Nobody wants to fill in a form at a restaurant table. Expenses get
logged from memory three days later, badly.

**Shape.** Amount, one tap for "split evenly with everyone here", done. Photo
of the receipt optional and attached later.

**Catch.** The existing money model already supports it; this is a UI problem,
not a data-model one.

### When the plan breaks

**Problem.** The ferry is cancelled. The plan is now wrong, and seven people
each learn that separately.

**Shape.** Mark a day event as changed, with a one-line reason. It's a note,
not a notification system.

**Catch.** Push notifications are out of scope for v1 and this shouldn't become
the reason to add them.

---

## 5. Between trips

### The archive as an asset

**Problem.** "Where was that bar in Ortigia?" — the answer is in last year's
book and nobody can find it.

**Shape.** Search across every trip you've been on. Also: clone a past trip as
the starting point for a new one.

**Catch.** Cheap to build, and it's the feature that makes long-term retention
plausible — and the one people would plausibly pay to keep (see
[`monetisation.md`](monetisation.md), Bucket 3).

### The group as a durable thing

**Problem.** Trips are one-offs, but the *group* often isn't. Re-inviting the
same seven people every year is pure friction.

**Shape.** A saved travel group — reuse the roster, and carry the settled
balances forward so a debt from last year isn't quietly forgotten.

**Catch.** Cross-trip balances are a real data-model decision. Worth thinking
about early even if it's built late, because it's much harder to retrofit.

---

## What to *not* build

Stated plainly, because each of these will be suggested by someone:

| Idea | Why not |
|---|---|
| An AI itinerary generator | The problem is never "what could we do in Sicily" — the internet is full of that. It's "what will these seven people agree to". Generated plans have no social legitimacy: nobody feels bound by a suggestion they didn't argue about. |
| Attractions / POI database, reviews | Someone else's, always out of date, and it turns the notebook into a directory. Free-text place names plus a link out is enough. |
| Flight and hotel booking | Regulated, commission-driven, and it changes what the product is for. Search deep links only, paying nothing — the boundary already set in v1 scope. |
| A chat/messaging surface | The group already has a chat and won't move. Note threads on specific decisions are the right level; a general chat competes and loses. |
| Live location sharing | The phone already does it, and it's a privacy liability with no planning value. |
| Gamification (streaks, badges, "trip score") | Wrong tone for a product whose entire pitch is a quiet, trustworthy document. |
| Public trip sharing / social feed | A different product wearing this one's clothes. It also changes the privacy model from "nine people" to "the internet". |

---

## Rough shortlist

If forced to pick, in order — value against effort, and staying inside the
current v1 shape:

1. **The deposit / fronted-expense flag** — near-free on the existing ledger,
   removes the organiser's biggest social friction.
2. **The packing-and-jobs list** — trivial, and it makes the product feel
   finished.
3. **The one-screen "today" view** — turns a planning tool into something used
   on the trip, which is what makes it remembered next year.
4. **Budget-before-booking** — addresses the quiet reason people drop out.
5. **Who's arriving when** — high value, no integrations needed.
6. **Search across the archive** — cheap, and it's the retention story.

## See also

- [`monetisation.md`](monetisation.md) — how any of this could pay for itself.
- [`../CLAUDE.md`](../CLAUDE.md) — the v1 non-negotiables and scope boundary.
- [`mockups/`](mockups/) — the homepage prototypes; several of these ideas
  would change what the homepage should claim.
