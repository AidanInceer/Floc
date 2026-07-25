# CLAUDE.md — venture template

Starter agent instructions for a new venture. When you copy `_template` into a
real venture, **edit this file**: state what the venture is, its internal shape,
and any product-specific invariants (see
[`../finance-planner/CLAUDE.md`](../finance-planner/CLAUDE.md) for a worked
example).

Applies within this venture folder, on top of the hub
[`../../CLAUDE.md`](../../CLAUDE.md).

## Shape

- `wireframe/index.html` — optional. A concept venture may start here, as a
  single self-contained page, before any of the below exists. Conventions are in
  the hub [`../../CLAUDE.md`](../../CLAUDE.md).
- `apps/` — frontends.
- `services/` — APIs, workers, pure domain logic (`services/domain` for
  framework-free, tested business rules).
- `data-platform/` — pipelines, warehouse, analytics.

## Defaults inherited from the hub

- Prefer `shared/packages/*` for UI, types, utils, API client.
- Inherit infra/CI, security guardrails, and `enablement/standards`.
- No secrets in the repo; no cross-venture imports.

## Fill in for this venture

- **What it is / who it's for.**
- **Domain invariants** (e.g. money as minor units, units of measure, key rules).
- **External integrations** and their consent/security posture.
- **Definition of done** specifics beyond the hub baseline.
