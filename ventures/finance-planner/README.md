# Venture: finance-planner

> AI-assisted personal financial adviser with plug-and-play open banking.
> **Placeholder name** — rename this folder once the product's real brand is
> chosen. (The hub itself is "Nexus"; this is one venture inside it.)

The first venture in the [Nexus hub](../../README.md). Ingests bank data via
open banking → forecasts cash flow → gives generalised, knowledge-grounded
financial guidance. Currently a **pre-MVP design canvas** — docs and static
mockups, no working app code.

## Shape

Follows the standard venture layout:

- **[`apps/web`](apps/web/)** — Next.js frontend (skeleton).
- **[`services/api`](services/api/)** — NestJS API, module-per-domain (skeleton).
- **[`services/domain`](services/domain/)** — pure, tested finance calculation
  core (the generalised Excel model). Framework-free.
- **[`data-platform/`](data-platform/)** — transaction ingestion & analytics
  pipelines (placeholder).
- **[`docs/`](docs/)** — vision, architecture, domain model, module designs,
  ADRs, and mockups.

## Uses from the hub

- UI: [`shared/packages/design-system`](../../shared/packages/design-system/),
  [`ui-kit`](../../shared/packages/ui-kit/).
- Cross-cutting: [`shared-types`](../../shared/packages/shared-types/),
  [`shared-utils`](../../shared/packages/shared-utils/),
  [`api-client`](../../shared/packages/api-client/).
- Infra/CI, security guardrails, and standards from the hub's foundation areas.

## Start here

- [`docs/vision.md`](docs/vision.md) · [`docs/mvp-scope.md`](docs/mvp-scope.md)
- [`docs/architecture.md`](docs/architecture.md) · [`docs/domain-model.md`](docs/domain-model.md)
- Mockups → open [`docs/mockups/index.html`](docs/mockups/index.html)
- Venture-specific agent rules → [`CLAUDE.md`](CLAUDE.md)

## Origin

Generalises a bespoke Excel model (`Hertford_Mill_Financial_Dashboard.xlsx`,
kept out of git) built to answer one household's six-month cash-flow question.
