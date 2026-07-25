# shared/

Foundations every venture **inherits instead of duplicating**. If two ventures
would otherwise copy-paste it, it belongs here.

## Contents

- **[`packages/`](packages/)** — importable workspace packages:
  - [`design-system/`](packages/design-system/) — design tokens, theming primitives.
  - [`ui-kit/`](packages/ui-kit/) — reusable React components built on the tokens.
  - [`shared-types/`](packages/shared-types/) — cross-cutting TypeScript types.
  - [`shared-utils/`](packages/shared-utils/) — framework-free helper functions.
  - [`api-client/`](packages/api-client/) — typed client for internal APIs.
- **[`infra-modules/`](infra-modules/)** — reusable Terraform/Kubernetes modules
  ventures and `infra/` compose (a VPC module, a Postgres module, …).
- **[`data-modules/`](data-modules/)** — reusable pipeline/warehouse templates
  (ingestion patterns, model scaffolds).

## Rule

Everything here is a **contract** other ventures depend on. Treat changes like a
public API: version them, document breaking changes, and consider the blast
radius across ventures before shipping.
