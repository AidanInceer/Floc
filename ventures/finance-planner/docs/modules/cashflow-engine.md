# Module: Cash-flow Engine

**Goal:** the forecasting core. A generalised, tested reimplementation of the
Excel `Cashflow` tab — the heart of Finance Planner.

Lives (as pure logic) in `services/domain`; the API `forecast` module
orchestrates I/O around it.

## What it computes

Given: opening balances (by pot), recurring items, one-offs, a risk profile, and
a horizon (default 12 months), produce a month-by-month projection.

Per month:

```
income            = Σ recurring(in)  + Σ one-off(in)          # incl. bonus net of tax
essential out     = Σ recurring(out, essential) × shareFactor  # share-adjusted
discretionary out = Σ recurring(out, discretionary) + card avg
one-offs          = Σ one-off(out)                             # funded from the right pot
savings contrib   = base contribution + cash-sweep top-up
net for month     = income − essential − discretionary − one-offs − savings contrib
spending cash    += net for month                              # running balance
```

Tracked running balances (mirroring the Excel): **spending cash (closing)**,
cash-ISA remaining, investment balance.

## Key behaviours ported from the Excel

- **Pot separation.** Spending cash excludes ring-fenced money (emergency fund,
  gifts) and ISAs. The house purchase "never touches" spending cash.
- **Share factor.** Shared costs counted at the user's share (e.g. 65% mortgage,
  50% council tax). Modelled as `shareFactor` on recurring items.
- **Start/stop months.** Old rent stops at the completion month; housing costs
  start then. Modelled via `startsMonth` / `endsMonth`.
- **Cash-sweep rule.** When spending cash would exceed `cashBufferThreshold`,
  sweep the excess into the investment contribution that month.
- **Bonus handling.** A one-off income in a specific month, net of an editable
  tax+NI estimate.

## Headline outputs (what the UI shows)

- **Lowest point** in the horizon (trough) + which month.
- Spending cash at N months out.
- Cash-ISA left over at end.
- Investment balance at end.
- **Runway** — months until spending cash would hit zero (or "never in horizon").

## Long-run growth projection

Separate pure function: project the investment balance at lower/upper growth
bounds with continuing contributions, at 1/3/5/10/15/20/25/30 years. Always
labelled illustrative, not a forecast. (Generalises the Excel long-run table.)

## Determinism & testing

- Pure functions, no I/O, no clock reads inside (horizon start passed in).
- Golden-master tests: reproduce the exact numbers from the source Excel model
  as a regression fixture, then generalise.
- Money as integer minor units throughout; round only at defined points.

## Scenarios (Phase 6)

The Excel's "inputs" become scenario levers: completion month, contribution
start month, buffer threshold, growth rates, share factors. A scenario = a set
of overrides → rerun the engine → diff the outputs.

## Interface (illustrative)

```ts
function forecast(input: {
  horizonMonths: number;
  startMonth: string;
  openingBalances: PotBalances;
  recurring: RecurringItem[];
  oneOffs: OneOff[];
  risk: RiskProfile;
}): ForecastResult;
```

## Open questions

- Rounding policy (per-line vs end-of-month).
- How aggressively to auto-derive recurring items vs require confirmation.
