# MVP scope

The MVP is deliberately small: **one user (the author), real bank data, a
trustworthy cash-flow forecast, and a first slice of guidance.** The point is to
validate categorisation quality and forecast accuracy against real spending over
the next couple of years — not to be feature-complete.

## In scope (MVP)

1. **Auth** — single-user email + password login with **TOTP 2FA**. Secure sessions.
2. **Connect a bank** — one open-banking connection, transactions + balances
   syncing into the canonical ledger. Manual account entry for the rest
   (crypto, ISAs, ring-fenced pots).
3. **Categorisation** — rules-first, AI-assisted; essential vs discretionary;
   recurring detection for the big items (salary, rent/mortgage, subs).
4. **Cash-flow forecast** — the generalised Excel `Cashflow` tab: 12-month
   projection, running spending-cash balance, **lowest point** + runway,
   share-adjusted shared costs, cash-sweep rule.
5. **A few manual planning inputs** — known one-offs (e.g. a furniture budget),
   ring-fenced amounts, buffer threshold, risk profile.
6. **First advice slice** — emergency-fund check + buffer check + one or two
   knowledge-grounded tips (ISA allowance awareness), narrated by Claude, sourced.
7. **Dashboard + cash-flow view** matching the mockups.

## Explicitly out (for MVP)

- Multi-user / sharing.
- Multiple markets (UK only).
- Full tax computation / filing.
- Regulated, personalised investment advice.
- Multi-currency.
- Rich scenario editor (one or two hard-coded scenario levers only).

## The onboarding bar

A new user should reach a **useful forecast in minutes**, not hours. Concretely:
connect one bank + confirm a handful of auto-detected recurring items + set a
risk profile → see a forecast. Everything else is optional and defaultable. See
[`modules/onboarding.md`](modules/onboarding.md).

## Success criteria

- Forecast's projected spending-cash trough is within a small margin of what
  actually happens over a test month.
- ≥80% of transactions auto-categorised without correction after a short
  learning period.
- Setup to first forecast under ~15 minutes.
- Zero secrets/PII in logs or repo; bank tokens encrypted at rest.

## Build order (thin vertical slices)

1. Domain calc core (`services/domain`) + tests — port the Excel logic.
2. Auth + 2FA.
3. Manual accounts + manual transactions → forecast end-to-end (no bank yet).
4. Open-banking connector for one provider → replace manual with real feed.
5. Categorisation pipeline.
6. Advice slice + knowledge base for the figures it needs.

See [`roadmap.md`](roadmap.md) for phasing.
