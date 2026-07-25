# finance-planner / services / api

**NestJS** backend for the finance-planner venture, organised
**module-per-domain**. **Skeleton only — no app code yet.**

## Planned modules

| Module | Responsibility | Doc |
|---|---|---|
| `auth` | Login, 2FA, sessions, authZ | [auth-security](../../docs/modules/auth-security.md) |
| `accounts` | Account registry (bank + manual) | [domain-model](../../docs/domain-model.md) |
| `open-banking` | Provider adapters, consent, sync | [open-banking](../../docs/modules/open-banking.md) |
| `transactions` | Canonical ledger, dedupe | [domain-model](../../docs/domain-model.md) |
| `categorise` | Rules + AI categorisation | [advice-engine](../../docs/modules/advice-engine.md) |
| `forecast` | Cash-flow projection (orchestrates domain) | [cashflow-engine](../../docs/modules/cashflow-engine.md) |
| `advice` | Rubrics + narrative | [advice-engine](../../docs/modules/advice-engine.md) |
| `knowledge` | UK tax/benefit reference data | [knowledge-base](../../docs/modules/knowledge-base.md) |

## Rules

- Each module owns its tables; no cross-module table access.
- Pure calculation is delegated to [`../domain`](../domain/), not written here.
- Validate all inputs at the boundary (Zod). Enforce per-user authZ via guards.
- Persistence via Prisma + PostgreSQL.

See [`../../docs/architecture.md`](../../docs/architecture.md).
