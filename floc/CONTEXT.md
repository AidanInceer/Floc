# Floc — glossary

The project's ubiquitous language. Terms only — no implementation, no spec.
Keep it a glossary and nothing else.

## Money

**Expense** — a bill one member (the *payer*) paid for, split across
participants. Its split rows are immutable snapshots, never recalculated.

**Split** — one participant's owed share of an expense. A snapshot; an edit
rewrites the whole set, never mutates a row.

**Settlement** — a single real-world payment from one member to another for an
amount, recorded after money has moved (cash, outside the app). An immutable
fact. A party to it may correct it (#361); soft-deleting it reverts it.

**Balance** — a member's net position in one currency: what they're owed minus
what they owe. Derived live from expenses − settlements; never stored. Positive
= owed money back; negative = owes (or has *overpaid*, when a deleted expense
tips it below zero).

**Overpayment** — a negative balance for someone who settled: they paid more
than the (now-changed) bills say they owed. An honest state, not an error.

**Simplified transfers** — the minimised set of payments that squares everyone
up, netted across the group and across currencies (#463; you may be told to pay
someone you never shared a bill with). Each payment clears debts in their own
currencies, so every book still reaches zero. The money tab's only view.

**Settle up** — the act of recording a settlement, pre-filled from a simplified
transfer; either party to it may record it.

**Settled (trip)** — every currency's balances net to zero. A whole-book
property, never a per-row flag.

**Home / preferred currency** — a member's own currency (`userProfile`,
defaults GBP). Settle-up shows every amount in it, and a payer pays in it
(#463); the *convert* toggle targets it. Never changes what the ledger stores.

**Convert** — a UI-only toggle that shows an amount in the viewer's home
currency using a free daily FX rate. Display only — the ledger is always in the
currency the expense/settlement was recorded in.

**Estimate** — what a trip will roughly cost one member, as a range, from
Floc's price table and their travel style (#574). Personal and Pro; never an
expense, never touches a balance.

**Estimate line** — one of the estimate's parts: Flights, Stay, Food and drink,
Activities, Getting around. Each maps to expense categories; spending in no
line shows under *Other*.

**Guide** — Floc's own figure for a line, before the member replaces it with
*their figure*.

**Budget** — the most one member means to spend on a trip, optionally split by
line. Private to them. Its *fit* is Fits, Tight or Over against the estimate.

**Travel style** — a member's cabin, stay and pace. Lives on the profile; a
change on one trip stays on that trip.

**Home airport** — where a member's flights start, set on the profile or
inferred from their own flight files until they confirm one.

## Notes

**Notes** — the trip's tab of shared, freely written pages. Any member may
write in any page; several people can write at once.

**Page** (or *notes page*) — one page in Notes, with a title and a body of
blocks. Every trip has at least one. A page may hold sub-pages, one level deep.
Never call it a "doc": that word is kept for an uploaded *document* in Files.

**Block** — one line-level piece of a page: a paragraph, heading, list item,
checklist item, quote, divider or table.

**Highlight** — a colour laid on a run of text in a page.

**Comment** — something a member says on an event on Days or on a notes page,
with replies one level deep and reactions. A comment sits on exactly one of the
two. Never call it a "note": *Notes* is the tab of pages.

**Page comment** — a comment pinned to a run of text in a page, with replies;
it can be resolved.

**Trip link** — an inline pill in a page that points at a day, event, place,
expense, packing item or file on the same trip. It shows the item's current
name, and "Removed" once the item is deleted.

**Page icon** — an optional line icon a member picks for a page, from Floc's
own icon set. Never an emoji.

**Archived page** — a page a member has archived. It can be restored for 7
days, then it is deleted for good, with its sub-pages and comments.

## Explore

**Listing** — one ready-made trip on Explore: its stops, travel, days and best
months. Static content in `@floc/core`, never a database row.

**Copy** (*start this trip*) — makes a new trip from a listing. A snapshot: no
link back, so editing one never changes the other. With a start month it brings
the days, stops, travel and (optionally) events; with *Decide later* it is an
undated trip with the highlights page only.

**Start month** — a best month picked when copying. The trip starts on the 1st
of the next such month still ahead and runs for the listing's nights.

**Saved trip** — an Explore listing a person saved with its heart. Private until
the person shares it (see *Shared list*); Explore shows no count. It opens the
listing with the copy choice open.

**Shared list** — a person's saved trips, shown on their profile to the people
their *Saved* privacy setting names: nobody, friends, or trip members. Their
want-to-go countries show with it only where their Travel map setting allows.
Packing lists are never part of it.

**You both** — the mark on a saved trip or want-to-go country that the viewer and
the list's owner both hold. Derived on read, never stored.

**Want to go** — a country a person wants to visit. The same fact as the yellow
on their profile globe: changing one changes the other.

**Lists** — the account tab that holds what a person keeps: *Saved* (saved trips
and want-to-go countries), *Wish lists* and *Packing* (saved packing lists).

**Wish list** — a list a few people keep together before any trip exists:
Explore trips, countries, free-text ideas and links (ADR-049). You join only by
accepting an invite. All members are equal, and the list goes when the last one
leaves. Named after its people until someone renames it. Not the same as a
person's *Shared list*.

**Ideas page** — an optional notes page a copy adds. *At your stops*: other
things to do at each stop, with pace and cost. *Other stops*: places to swap
in, how many nights, and what to do there.

## Ideas

**Idea** — one option the group is choosing between: a line of text members vote
on. While its event exists on Days, it is out of the list.

**Idea category** — where an idea sits: Travel, Activities, Food, Drinks, Other,
or one a member adds. A member's category lasts while an idea uses it.

**Add to Days** — turns an idea into an event of its category's type.

## Roster

**Guest** — a person on a trip's invite link who voted with a name and no
account. Not a member: they can vote on ideas and mark dates, nothing more.
They become a member when they sign up from the invite, and are deleted with
their answers a week after they start if they do not.
