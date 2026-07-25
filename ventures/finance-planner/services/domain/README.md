# finance-planner / services / domain

The **pure finance core** of the finance-planner venture. Framework-free,
deterministic, unit-tested. A library (not a running service) that the API and
other services depend on. **Skeleton only — no code yet.**

## Contains (planned)

- Canonical types: `Money`, `Account`, `Transaction`, `RecurringItem`, `OneOff`,
  `RiskProfile`, `ForecastResult` — see [`../../docs/domain-model.md`](../../docs/domain-model.md).
- **Cash-flow engine** — `forecast(...)`, the generalised Excel `Cashflow` tab.
  See [`../../docs/modules/cashflow-engine.md`](../../docs/modules/cashflow-engine.md).
- **Long-run growth projection**.
- **Rubrics** — deterministic advice checks.

## Rules

- **No I/O, no framework, no clock reads.** Inputs in, results out.
- **Money as integer minor units** (pence) — never floats.
- Every function unit-tested (Vitest). Port the Excel numbers as golden-master
  fixtures before generalising.
- The venture's `apps/*` and `services/*` may depend on this; it depends on
  nothing internal.
