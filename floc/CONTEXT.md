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

## Notes

**Notes** — the trip's tab of shared, freely written pages. Any member may
write in any page; several people can write at once.

**Page** (or *notes page*) — one page in Notes, with a title and a body of
blocks. Every trip has at least one. A page may hold sub-pages, one level deep.
Never call it a "doc": that word is kept for an uploaded *document* in Files.

**Block** — one line-level piece of a page: a paragraph, heading, list item,
checklist item, quote, divider or table.

**Highlight** — a colour laid on a run of text in a page.

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

**Ideas page** — an optional notes page a copy adds. *At your stops*: other
things to do at each stop, with pace and cost. *Other stops*: places to swap
in, how many nights, and what to do there.

## Roster

**Guest** — a person on a trip's invite link who voted with a name and no
account. Not a member: they can vote on ideas and mark dates, nothing more.
They become a member when they sign up from the invite, and are deleted with
their answers a week after they start if they do not.
