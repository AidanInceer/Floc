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
up, netted across the group (you may be told to pay someone you never shared a
bill with). The money tab's only view.

**Settle up** — the act of recording a settlement, pre-filled from a simplified
transfer; either party to it may record it.

**Settled (trip)** — every currency's balances net to zero. A whole-book
property, never a per-row flag.

**Home / preferred currency** — a member's own currency (`userProfile`,
defaults GBP). Used only as the target of the *convert* display toggle; never
changes what the ledger stores.

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
