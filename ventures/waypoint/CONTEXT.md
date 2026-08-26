# Waypoint — glossary

The project's ubiquitous language. Terms only — no implementation, no spec.
Keep it a glossary and nothing else.

## Money

**Expense** — a bill one member (the *payer*) paid for, split across
participants. Its split rows are immutable snapshots, never recalculated.

**Split** — one participant's owed share of an expense. A snapshot; an edit
rewrites the whole set, never mutates a row.

**Settlement** — a single real-world payment from one member to another for an
amount, recorded after money has moved (cash, outside the app). An immutable
fact: never rewritten, only soft-deleted (which reverts it).

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
