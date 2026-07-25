# 3. Product name — candidates and criteria

Date: 2026-07-25

## Status

Proposed — `waypoint` is the working folder name, **not** a committed brand.

## Context

The venture currently uses `waypoint`. It reads well and matches the product's
central metaphor (a trip is a line with stops on it), but "Waypoint" is heavily
used — there are Waypoint-branded products in devtools (HashiCorp), consulting,
insurance and outdoor gear. The `.com` is long gone. A name that needs a
qualifier to be findable is a tax paid forever.

## Decision

Judge every candidate against six criteria before falling in love with any:

1. **Says group, journey, or both** — ideally without saying "trip" or "travel".
2. **Short** — one or two syllables preferred, ≤ 8 characters ideal.
3. **Verbable** — "let's *x* it", "*x* the trip". Verbs win in group chats,
   which is where this product spreads.
4. **Spellable from hearing it once** — it will be recommended out loud in pubs.
5. **Ownable** — plausible domain (`.com`, `.travel`, `.trip`, `.co`), clean app
   store and trademark search in travel/software classes.
6. **Doesn't age into a lie** — nothing that implies only road trips, only
   groups, or only Europe.

### Candidates

**Group / togetherness**

| Name | Why | Risk |
|---|---|---|
| **Convoy** | Vehicles moving together with a shared destination; verbable; warm | Freight-tech uses it (Convoy, US trucking) |
| **Flock** | Migration + group; short; "flock to Puglia"; gorgeous bird mark | Slack-adjacent chat app exists in India |
| **Entourage** | The group as the point | Long, dated, Apple mail client |
| **Tandem** | Two-plus moving as one | Language-learning app owns it |
| **Cohort** | Precise for "the people on this trip" | Cold, academic |
| **Caravan** | Group travelling together, ancient and warm | UK reads it as a towed box in a field |

**Route / navigation**

| Name | Why | Risk |
|---|---|---|
| **Cairn** | A stack of stones marking a route, *left by the people before you* — group memory and wayfinding in one word. Short, ownable, beautiful mark | Slightly niche; pronounced "care-n", may need teaching |
| **Bearing** | A direction agreed on; "get your bearings" | Bland, engineering connotation |
| **Meridian** | Grand, summery, navigational | Overused in finance/hotels |
| **Sextant** | Distinctive instrument | Archaic, hard to spell |
| **Portage** | Carrying between waters | Obscure |
| **Trailhead** | Where a journey starts | Salesforce owns it |
| **Milepost / Waypost** | Stops on a line | Generic-adjacent to Waypoint |

**Intent / feeling** — these lean on *why* trips fail to happen

| Name | Why | Risk |
|---|---|---|
| **Someday** | Every group trip starts as "someday we should…". The product's whole job is turning someday into a date. Emotionally exact, immediately understood, works solo and group | Common word — SEO and trademark are a fight |
| **Outbound** | Departure energy; clean, modern | Sales-tooling connotation |
| **Layover** | Charming, memorable | Implies transit, not the trip |
| **Ferry** | Verbable, warm, coastal | Implies boats only |
| **Roam** | Short, verbable, travel-native | Extremely contested |

### Shortlist

**Cairn**, **Convoy**, **Someday**, **Flock** — in that order.

`Cairn` is the recommendation: it satisfies all six criteria, it is the only
candidate whose literal meaning is *a marker left by a group for the people who
follow*, which is exactly the public-profile/inspiration feature
([0008](0008-accounts-2fa-and-public-profiles.md)), and it gives the design a
signature mark that isn't another map pin.

## Consequences

- The folder stays `waypoint` until a name is chosen; renaming a venture folder
  is cheap now and expensive after code exists, so decide before `apps/` appears.
- Whichever name wins, run domain + trademark checks (classes 9, 39, 42) **before**
  any visual identity work, not after.
- Reserve the mark and the handles in one pass; a name we can't hold on Instagram
  is a name the group chat can't find.
