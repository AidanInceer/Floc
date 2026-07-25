# 2. Monorepo and TypeScript stack

Date: 2026-07-24

## Status

Accepted

## Context

Finance Planner spans a web UI, a backend with several domain areas, integrations
(open banking, AI, gov data), and a correctness-critical finance calculation
core. It's built by a solo developer initially and must stay maintainable as it
grows. See [`../tech-stack.md`](../tech-stack.md).

## Decision

- A **pnpm + Turborepo monorepo** holding `apps/web`, `services/api`, and shared
  `packages/*`.
- **TypeScript everywhere** — one type system from DB to UI across the finance
  domain.
- **Next.js** (App Router) for the web app.
- **NestJS** for the API, organised **module-per-domain**.
- **PostgreSQL + Prisma** for persistence.
- **Framework-free `services/domain`** for pure, tested finance calculation.
- Money represented as **integer minor units / Decimal**, never floats.

## Consequences

- One toolchain and type system reduces boundary bugs and context-switching.
- Turborepo gives cached, incremental builds across packages.
- NestJS modules give a natural home for each capability, matching the product's
  "modular & expandable" goal.
- The pure domain package is independently testable and reusable.
- Trade-off: not using Python for modelling; revisit only if heavy quant/ML work
  appears (see tech-stack "why not alternatives").
