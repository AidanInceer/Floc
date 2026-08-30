# Vocabulary — Floc

The words this venture uses, and the words it does not. Use the term as it is
defined here in code, in copy, in issues and in commit messages. Do not use a
synonym.

Write in Simplified Technical English: short sentences, active voice, one idea
per sentence, present tense.

## People

| Term | Meaning |
|---|---|
| **user** | A person with an account. Use this word in anything a person reads. |
| **member** | A user's link to one trip. This is the code word: `trip_membership`, `TripMember`, `listMembers`, non-negotiable 6. A user is a member *of a trip*; a user with no trip is still a user. |
| **admin** | A member with the four powers: invite, kick, promote, delete (plus archive and restore). Nothing else. |
| **viewer** | The member who is making the current request. `requireTripAccess` returns it. |

Copy says user. Code says member. Neither word crosses over.

## The trip

| Term | Meaning |
|---|---|
| **trip** | The whole plan one group is making. |
| **window** | The trip's dates: `start_date` and `end_date`. A trip may have no window (non-negotiable 9). The window is the extent of the itinerary (ticket 140). |
| **availability** | A user's marks on the calendar: the dates that user could go. Availability is not the window. The group reads the overlap, then commits a window. |
| **itinerary** | Every `day` in the trip, with what each day holds. |
| **day** | One date in the window. Stored. Holds an overnight place and its events. |
| **day_event** | One thing that happens on a day: activity, transport or food. Stored. |
| **stop** | Consecutive days that share an `overnight_place_id`. **Derived, never stored** (non-negotiable 3). |
| **place** | A geocoded location, or free text where geocoding is unavailable. |

## Words to avoid

| Do not write | Write instead |
|---|---|
| date range, trip dates | window |
| leg, segment, destination | stop |
| activity, item, entry | day_event |
| participant, traveller, attendee | member |
| lifecycle, phase, status, state machine | Nothing. Trip state is derived (non-negotiable 4). |
| soft delete a day when the window shrinks | remove the day. Ticket 140 hard-deletes it, because a soft-deleted row keeps the `(trip, date)` index. |

## Related

- [`CLAUDE.md`](../../CLAUDE.md) — the non-negotiables these terms serve.
- [`docs/data-model/erd.html`](../../../docs/data-model/erd.html) — the schema of record.
