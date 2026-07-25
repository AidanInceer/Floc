# Finance Planner — Documentation

Concept docs and the design canvas. These are living documents meant to be
expanded in later sessions.

## Start here

1. [`vision.md`](vision.md) — what Finance Planner is and why.
2. [`mvp-scope.md`](mvp-scope.md) — the deliberately small first version.
3. [`data-flow.md`](data-flow.md) — how data moves, left → right.
4. [`architecture.md`](architecture.md) — system shape and module boundaries.
5. [`domain-model.md`](domain-model.md) — the finance concepts (from the Excel model).
6. [`tech-stack.md`](tech-stack.md) — chosen technologies and why.
7. [`security-and-compliance.md`](security-and-compliance.md) — handling money & PII.
8. [`roadmap.md`](roadmap.md) — phased plan.

## Modules

Each capability is a module with its own design doc:

- [`modules/onboarding.md`](modules/onboarding.md) — low-friction setup.
- [`modules/open-banking.md`](modules/open-banking.md) — bank connections & sync.
- [`modules/cashflow-engine.md`](modules/cashflow-engine.md) — forecasting core.
- [`modules/advice-engine.md`](modules/advice-engine.md) — generalised guidance.
- [`modules/knowledge-base.md`](modules/knowledge-base.md) — UK tax/benefit reference data.
- [`modules/auth-security.md`](modules/auth-security.md) — auth, 2FA, encryption.

## Decisions

Architecture Decision Records live in [`adr/`](adr/).

## Mockups

Static design mockups are in [`mockups/`](mockups/). Open
[`mockups/index.html`](mockups/index.html) in a browser.
