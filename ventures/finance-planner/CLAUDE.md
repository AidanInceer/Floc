# CLAUDE.md — finance-planner (venture)

Venture-specific instructions. These apply **within
`ventures/finance-planner/`** and sit on top of the hub
[`../../CLAUDE.md`](../../CLAUDE.md). Where they conflict, the more specific rule
(this file) wins inside this folder.

## What this venture is

AI-assisted personal financial adviser. Open banking → cash-flow forecast →
generalised, knowledge-grounded guidance. Currently **pre-MVP**: docs, mockups,
and a throwaway interactive prototype in [`apps/prototype`](apps/prototype/).
The real app (`apps/web`) is still a skeleton. See [`README.md`](README.md) and
[`docs/vision.md`](docs/vision.md).

> Naming: the product's real brand is TBD; `finance-planner` is a placeholder.
> "Nexus" refers to the incubator hub, **not** this product.

## Internal shape

- `apps/web` — Next.js frontend.
- `apps/prototype` — throwaway Vite/React draft. Carries the venture's visual
  system and a portable SQL storage layer (SQLite-in-WASM behind a driver port,
  Postgres-ready) — see [`apps/prototype/src/db/README.md`](apps/prototype/src/db/README.md).
- `services/api` — NestJS API, module-per-domain.
- `services/domain` — pure finance calc (framework-free, tested).
- `data-platform` — pipelines & analytics.
- `docs` — vision, architecture, domain model, modules, ADRs, mockups.

## Golden rules (venture)

1. **Money is never a float.** Integer minor units (pence) + ISO currency, or a
   Decimal type. Never binary floating point for balances/amounts.
2. **Domain logic is pure and tested.** Calculation lives in `services/domain`,
   framework-free, deterministic, unit-tested. `apps`/`services/api` only
   orchestrate.
3. **Security first.** Financial data. No secrets in code, no logging of
   PII/tokens, encrypt bank tokens at rest. See [`docs/modules/auth-security.md`](docs/modules/auth-security.md).
4. **Low-friction onboarding is a feature.** Every new required input is a cost.
   Prefer derived/defaulted values. See [`docs/modules/onboarding.md`](docs/modules/onboarding.md).
5. **Advice is guidance, not regulated advice.** Frame outputs as informational.
   No personalised regulated investment advice. Cite sources.
6. **Modular.** New capability = a new module with a clear contract, not edits
   sprawled across the codebase. See [`docs/architecture.md`](docs/architecture.md).

## Prefer hub foundations

- UI from `shared/packages/{design-system,ui-kit}`; types/utils/client from
  `shared/packages/{shared-types,shared-utils,api-client}`.
- Don't reinvent infra/CI/standards — inherit from the hub.

## Guardrails

- Don't invent UK tax figures — pull from the knowledge-base module / cite gov.uk.
- Don't wire real bank credentials or live keys into the repo.
- Flag anything needing FCA/GDPR consideration rather than glossing.
