# Roadmap

Phased and deliberately conservative. Each phase is shippable and earns trust
before the next.

## Phase 0 — Scaffold & design *(current)*

- Repo layout, docs, agentic harness, static mockups. **No app code.**
- Domain model captured from the Excel forecaster.

## Phase 1 — Forecast core (offline)

- `services/domain`: port the Excel cash-flow + long-run projection logic, fully
  unit-tested. Money as minor units.
- Manual account + transaction + recurring/one-off entry.
- Cash-flow forecast end-to-end with **no bank connection yet** (manual data).
- Basic dashboard + cash-flow view (real, minimal).

## Phase 2 — Auth & security

- Email/password auth, TOTP 2FA, secure sessions.
- Token encryption plumbing (ready for real bank tokens).

## Phase 3 — Open banking

- One provider adapter behind `BankDataProvider`.
- Consent flow, sync jobs, normalisation into the canonical ledger.
- Replace manual feed with real transactions.

## Phase 4 — Categorisation & recurring detection

- Rules-first pipeline + AI fallback (Claude).
- Recurring-item detection driving the forecast automatically.
- Feedback loop (user corrections improve rules).

## Phase 5 — Advice & knowledge base

- UK knowledge base (tax bands, NI, ISA/allowance limits, IHT) with scheduled refresh.
- Rubric engine (emergency fund, buffer, order-of-saving).
- Claude-narrated, sourced guidance feed.

## Phase 6 — Scenarios & polish

- Parameterised scenarios ("move in month X", "sweep above £Y").
- Onboarding streamlining pass — measure and cut time-to-first-forecast.

## Later / expandable

- Additional open-banking providers.
- Additional markets (jurisdiction-keyed knowledge base).
- Multi-user, sharing, richer analytics.
- Mobile.

## Guiding constraint

Never let breadth outrun trust. A correct, secure, narrow tool that the author
actually uses for two years beats a broad one that's wrong about money.
