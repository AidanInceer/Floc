# Nexus Hub — Documentation

Hub-level documentation. Venture-specific docs live inside each venture (e.g.
[`../ventures/finance-planner/docs/`](../ventures/finance-planner/docs/)).

## Start here

1. [`repo-structure.md`](repo-structure.md) — every top-level area, what it's
   for, and where code belongs.
2. [`adding-a-venture.md`](adding-a-venture.md) — scaffold a new company/product
   from `ventures/_template/`.
3. [`areas-and-teams.md`](areas-and-teams.md) — the functional areas a growing
   SaaS org needs, and which folder each maps to.

## Principles

- **Ventures are isolated; foundations are shared.** A venture never imports
  another venture; both lean on `shared/`.
- **Reuse before rebuild.** Infra, CI, UI, types, pipelines are foundations —
  extend them, don't fork them per venture.
- **Foundations are contracts.** Changes to `shared/` and `infra/` ripple across
  ventures; version and document them.

## Decisions

Cross-cutting architecture decisions are recorded as ADRs. Hub-wide ADRs can
live here under `docs/adr/` (create when the first one is needed); venture-local
decisions live in that venture's `docs/adr/`.
