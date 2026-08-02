# Research — legal exposure of listing other people's trips

Findings for [ticket 05](../../../../.scratch/waypoint-v0.2/issues/05-listings-legal-and-consumer-protection.md),
which [ticket 03](../../../../.scratch/waypoint-v0.2/issues/03-explore-commercial-stance.md)
(the commercial stance on Explore) decides from. **This document does not decide
the stance.**

**I am not a lawyer and this is not legal advice.** It is a reading of primary
sources — UK legislation, CAA guidance, the CAP Code — assembled so the product
decision can be taken with the shape of the risk visible. Sources read 26 July
2026. The "get a solicitor" list at the end is the part to act on if any
operator name on `/explore` becomes real.

## The short version

The three regimes turn on **selling**, and Waypoint sells nothing.

| Regime | What triggers it | Waypoint today |
|---|---|---|
| Package Travel Regs 2018 | Combining and **selling or offering for sale** travel services; or facilitating **purchase** of a second service via a linked booking process | Neither. No sale, no payment, no booking process |
| ATOL | **Advertising *and* selling** flight-inclusive travel to UK consumers | No flight sale. Deep links only, and out of this map's scope |
| CAP Code | Marketing communications must be obviously identifiable | **This one bites the moment a listing is paid for** |

So the sharp edge is not travel law — it is **advertising disclosure**. The
paid variant of Explore is materially riskier than the editorial variant, but
the risk lands in a different place than `partner-trips.md` assumed.

## 1. Package Travel and Linked Travel Arrangements Regulations 2018

Source: [SI 2018/634 reg. 2](https://www.legislation.gov.uk/uksi/2018/634/regulation/2/made).

The definitions are built on trade, sale and purchase:

- **Organiser** — "a trader who combines and **sells, or offers for sale**,
  packages, either directly or through another trader or together with another
  trader", *or* one transmitting traveller data to another trader via linked
  booking processes.
- **Retailer** — "a trader other than the organiser who **sells or offers for
  sale** packages combined by an organiser."
- **Package** — at least two different types of travel service for the same
  trip, either combined by one trader before a single contract, or meeting
  criteria including single point of sale, inclusive pricing, use of the word
  "package", or **linked online bookings with data transmission within 24 hours
  of first booking confirmation**.
- **Linked travel arrangement** — "at least two different types of travel
  service **purchased** for the purpose of the same trip or holiday, not
  constituting a package", via separate contracts where a trader facilitates
  either separate selection and payment at a single point of sale visit, or
  **targeted procurement of additional services from another trader within 24
  hours of first booking confirmation**.
- **Travel service** — passenger carriage; non-residential accommodation;
  vehicle rental; or other tourist services not intrinsically part of those.

**Reading it against Explore as designed.** A page that describes itineraries,
takes no payment, concludes no contract, and passes no traveller data to
anyone is not combining and selling packages, and nothing is being *purchased*
through it. On the face of the definitions, Explore is outside — and, notably,
**that conclusion does not change if an operator pays a flat fee to be listed**:
the fee is a transaction between Waypoint and the operator, not a sale of a
travel service to a traveller. The regs care what the *traveller* buys.

**The line not to cross.** Both the package and LTA definitions have a limb
about **transmitting traveller data to another trader** and about facilitating
"targeted procurement" within 24 hours of a first booking confirmation. That is
the click-through-and-handover pattern. Today it cannot bite, because there is
no booking anywhere in Waypoint for a 24-hour clock to start from. It becomes
live the moment Explore either passes user details to an operator or sits
alongside anything that confirms a booking. **If ticket 03 or ticket 04 ever
proposes handing a group's details to an operator, this document stops
applying and a solicitor starts.**

## 2. ATOL

Sources: [CAA — Do I need an ATOL](https://www.caa.co.uk/atol-protection/atol-requirements-for-the-travel-industry/do-i-need-an-atol/),
[CAA — Selling flight-only](https://www.caa.co.uk/atol-protection/atol-requirements-for-the-travel-industry/air-travel-organisers-licensing-atol/selling-flight-only/).

The CAA's framing: a business selling a flight-inclusive package or flight-only
must be an airline, an ATOL holder, or an exempt person, and the regime applies
to businesses outside the UK that are "advertising and selling to consumers in
the UK". Exempt categories include an agent for an ATOL holder, a member of an
accredited body, an airline ticket agent, and "a person making available
occasionally on a not-for-profit basis to a limited group of consumers".

**Explore involves no flights at all**, so ATOL does not arise from listings as
scoped. (Flight search was decided in v1 ticket 10 as deep links only, and is
explicitly out of scope for this map.)

**Gap, stated plainly.** The CAA page does not explicitly address whether
advertising or listing *without* selling triggers the requirement. Its language
consistently pairs "advertising **and** selling", which suggests both elements
are needed — but that is my inference from the phrasing, not a statement by the
CAA, and I have not found a page where they say so directly. The CAA's own
advice is to "seek independent professional advice if you are uncertain".

**What this means for disclaimer copy:** the instinct in ticket 05's brief —
that the page should say Waypoint is not a travel agent, sells nothing and
holds no ATOL protection — is sound, and cheap. But note it should not claim
protection *doesn't apply* in a way that misleads about what the group is
buying elsewhere; the accurate framing is that Waypoint itself sells nothing,
and that anything the group books with an operator is a matter between them and
that operator, with whatever protection that operator provides.

## 3. CAP Code — the regime that actually bites

Sources: [ASA — Online affiliate marketing](https://www.asa.org.uk/advice-online/affiliate-marketing.html),
[ASA — Recognising online affiliate marketing](https://www.asa.org.uk/news/Insight-recognising-online-affiliate-marketing-same-rules-new-guidance.html),
[the CAP Code (PDF)](https://www.asa.org.uk/static/47eb51e7-028d-4509-ab3c0f4822c9a3c4/48184608-fc9f-4290-9c84673f55f65794/The-Cap-code.pdf).

Two rules do the work:

- **Rule 2.1** — marketing communications must be "obviously identifiable as
  such".
- **Rule 2.3** — they must "make clear their commercial intent".

The ASA's affiliate guidance is unusually specific about what passes and what
does not, and it is directly transferable to a paid listing:

**Accepted:** "Ad" or "#Ad" at the *beginning* of the content; "(Ad)" before
the relevant section; an asterisk tied to a clear disclosure. The identifier
must appear **before the consumer engages** — for articles, "an identifier… in
the title… clear to consumers before they click through".

**Ruled insufficient** (this list is the useful part):

- A disclaimer at the **bottom** — "a disclaimer of this nature at the bottom
  of such a post is unlikely to be sufficient".
- **"may earn an affiliate commission"** — judged "ambiguous and confusing".
- Generic site-wide warnings that authors "*may* receive commission" without
  identifying *which* content is commercial.
- Malformed or coy labels: `*affiliate` alone, `a d/affiliate`, `#collab`.

**Read against `partner-trips.md`.** That document proposes distinguishing
listings by an `editorial` flag "always shown on the card". Measured against the
above, a neutral word like "Partner" is doing the job of a disclosure without
being one — it describes a relationship, not a commercial intent, and it is
much closer to the rejected `#collab` than to the accepted "Ad". If ticket 03
takes money, **the label almost certainly has to use the word "Ad" or
"Advertisement" and sit on the card before the reader engages with it** — not
in a footer, not in a tooltip, not as a colour.

That is a real product cost, and it is exactly the cost `monetisation.md`
predicted when it said a bought recommendation damages trust: the disclosure
regime forces the purchase to be visible.

**Gap.** The CAP Code scope page 404'd, so I could not verify verbatim the
clause bringing a company's **own website** content into remit. The affiliate
guidance plainly assumes own-site content is covered, and CAP's remit is
generally understood to include non-paid-for space online under the marketer's
control that is directly connected with the supply of goods or services — but
treat the exact clause as unverified until read.

## 4. Liability for third-party content, and quality

No primary source consulted here settles this, and I am flagging rather than
guessing. The exposures worth naming for ticket 03:

- **Misdescription.** A listing that overstates what an operator delivers is
  Waypoint's publication, whoever wrote it. `partner-trips.md` already asks
  "who checks a partner itinerary is any good?" — the answer has legal weight,
  not just reputational.
- **Operator failure.** What Waypoint owes a group that started a trip from a
  listing whose operator then collapses. `partner-trips.md` answers "nothing"
  on the product side (the preset is copied, not linked) and notes this "needs
  saying out loud in terms" — correct, and it needs terms to exist to say it in.
- **Terms of service.** Waypoint has none. A page carrying third-party
  commercial content without terms is the gap, more than any single clause
  within them. This belongs on ticket 10's pre-deploy blocker list regardless
  of how ticket 03 goes.

## 5. Editorial-only versus paid — the comparison ticket 05 asked for

| | Editorial only, no fee | Paid listings |
|---|---|---|
| Package Travel Regs | Outside, on the definitions | **Still outside** — the fee is not a traveller's purchase |
| ATOL | Not engaged (no flights) | Not engaged (no flights) |
| CAP Code | Own-site content, no commercial relationship to disclose | **Engaged.** Rules 2.1/2.3 require an upfront, unambiguous identifier — realistically "Ad" |
| Content liability | Ours, and we wrote it | Ours, and we didn't write it — worse |
| Terms of service needed | Yes | Yes, and with more in them |

**So: materially safer, but not for the reason expected.** Going paid does not
move Waypoint across any travel-law line — that line is drawn at selling and at
handing over traveller data, and neither variant approaches it. What going paid
does is trigger an advertising-disclosure obligation whose accepted form
("Ad", upfront, before engagement) is conspicuous by design, plus liability for
content someone else wrote.

## What this means for ticket 03

1. **The travel-law objection to paid listings is weaker than assumed.** If
   ticket 03 was expecting the regs to make the decision, they don't. The
   decision stays a product and trust judgement — which is where
   `monetisation.md` always put it.
2. **The disclosure requirement is the real constraint, and it is concrete.**
   Ticket 03 should decide the stance knowing that a paid listing realistically
   carries "Ad" on its face, above the fold of the card. If that is unacceptable
   aesthetically or on trust grounds, that is a legitimate reason to stay
   editorial — and a much sharper one than "it feels wrong".
3. **`partner-trips.md`'s neutrality condition survives contact.** Nothing here
   requires neutral ordering, but nothing here provides cover for paid ranking
   either; that condition remains a self-imposed one, and it is the right one.
4. **The `editorial` boolean in ticket 02's schema is not sufficient on its
   own.** It records provenance; the disclosure needs to record *whether money
   changed hands*, which is a different fact. Ticket 02 should carry both.
5. **Terms of service are a prerequisite**, not a nicety, before any real
   operator name appears — for ticket 10's blocker list.
6. **The bright line to write into `CLAUDE.md`**: Waypoint transmits no user
   data to any operator, and facilitates no booking. That single rule is what
   keeps Explore outside the Package Travel Regulations, and it should be a
   non-negotiable rather than an implementation detail.

## Needs a qualified solicitor, not a product decision

- **Before any real operator name is published**: terms of service and the
  liability position for third-party listing content.
- **Before any paid listing goes live**: confirmation that the chosen
  disclosure wording and placement satisfy CAP rules 2.1 and 2.3 for a listing
  card (the guidance I found is written for affiliate content and influencer
  posts; a listings page is analogous, not identical).
- **Immediately, if ticket 03 or 04 ever proposes passing group details to an
  operator or facilitating a booking** — that engages the linked-travel-
  arrangement limbs directly, and the analysis above no longer holds.
- **Joining the existing list**: v1 ticket 07 already flagged Mapbox cookie
  consent and data-export adequacy for real legal review. These go on the same
  list.
