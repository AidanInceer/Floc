# 7. Money — a shared ledger, not a payments business

Date: 2026-07-25

## Status

Proposed

## Context

Group trips generate a specific, well-understood money mess: one person fronts
the villa, another books the van, three people pay for dinners, one person
didn't do the boat trip, and everyone is owed something by someone. Splitwise
solved the maths a decade ago; the gap is that the maths lives away from the
trip that caused it.

The tempting next step — holding balances, taking the payment, clipping a fee —
turns this into a regulated money business (in the UK: FCA authorisation or an
agent relationship, safeguarding of funds, KYC/AML obligations, fraud liability).
That is a different company with a different risk profile.

## Decision

- **We record who owes whom. We never hold, move, or touch funds.**
- Every cost is attached to a trip and, where possible, to a booking, stop or
  day. "Ullapool cottage · £888 · Mira paid · split 6 ways" is one object that
  the day view, the ledger and the route all read from.
- Splits: equal by default; by share, by person, or exclude-me as alternatives.
- **Multi-currency from day one.** A cost carries its original currency and the
  rate used at entry; balances display in each member's home currency. Trips
  cross borders — this is not a v2 problem.
- **Money is integer minor units.** Never binary floating point. (Hub convention
  borrowed from `finance-planner`; it applies wherever money appears.)
- Settle-up produces a **simplified set of transfers** and hands off: a bank deep
  link, a payment request link, or "mark as settled" on trust. The user pays in
  their own banking app.
- **Nudges are the product's contribution**, not collection: "three people owe
  Rae for the ferry" with a one-tap reminder, in the app the group already has
  open.

## Consequences

- No FCA authorisation, no safeguarding, no AML programme, no chargeback
  exposure. The compliance surface is data protection only.
- No payments revenue. Monetisation must come from subscription or partner
  referral ([0009](0009-third-party-integrations.md)).
- "Mark as settled" is trust-based and will occasionally be wrong. Accepted:
  Splitwise proved groups tolerate this.
- Reversing this decision later is a company-level change, not a feature — it
  needs its own ADR and probably its own entity.
- Correctness bar is high: a ledger that is subtly wrong destroys trust
  permanently. The split/settle maths belongs in a pure, exhaustively tested
  module with no framework dependencies.
