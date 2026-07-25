# 3. Module-per-domain with explicit contracts

Date: 2026-07-24

## Status

Accepted

## Context

"Modular and expandable" is a primary product requirement: new data feeds, new
markets, and new advice rubrics must slot in without rewrites. Without explicit
boundaries, a growing finance app tends toward a tangle where one change ripples
everywhere.

## Decision

Each capability is a **self-contained module with an explicit contract**:

- Defined inputs (DTOs/events) and outputs.
- Its **own storage** — no reaching into another module's tables.
- Core arithmetic delegated to pure functions in `services/domain`.
- A matching design doc in `docs/modules/`.

Key extensibility seams are formalised as interfaces:

- Open-banking **provider** behind a `BankDataProvider` interface (new provider =
  new adapter).
- Knowledge base **keyed by jurisdiction** (new market = additive data).
- Advice **rubrics** as declarative, versioned, composable rule sets.
- Categorisation as a **pipeline** (deterministic rules → AI fallback).

## Consequences

- Adding capability means adding/extending a module against a contract, not
  editing across the tree.
- Modules are independently testable and reviewable.
- Slightly more upfront ceremony (contracts, DTOs) than a monolith — accepted as
  the cost of long-term expandability.
- The dependency rule (everything points inward toward `services/domain`) must be
  enforced in review.
