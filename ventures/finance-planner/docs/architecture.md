# Architecture

## Shape

A TypeScript monorepo. A Next.js web client talks to a NestJS API. The API is
organised **module-per-domain** — this is the structural expression of the
"modular & expandable" goal. Pure finance logic lives in a framework-free
`services/domain` so it can be tested in isolation and reused anywhere.

```
                    ┌───────────────────────────┐
                    │        apps/web            │
                    │  Next.js · React · Tailwind│
                    │  onboarding, dashboard,    │
                    │  cashflow, advice, scenarios│
                    └─────────────┬──────────────┘
                                  │ HTTPS (typed client)
                    ┌─────────────▼──────────────┐
                    │        services/api            │
                    │        NestJS              │
                    │  ┌──────────────────────┐  │
                    │  │ auth        module    │  │
                    │  │ accounts    module    │  │
                    │  │ open-banking module   │  │
                    │  │ transactions module   │  │
                    │  │ categorise  module    │  │
                    │  │ forecast    module    │  │
                    │  │ advice      module    │  │
                    │  │ knowledge   module    │  │
                    │  └──────────────────────┘  │
                    └───┬───────────────┬────────┘
                        │               │
              ┌─────────▼───┐   ┌───────▼─────────┐
              │ PostgreSQL  │   │ services/domain │
              │ (Prisma)    │   │ pure calc/types │
              └─────────────┘   └─────────────────┘

  External: open-banking provider · Anthropic API · gov.uk data sources
```

## Layers

| Layer | Package | Responsibility | Depends on |
|---|---|---|---|
| Presentation | `apps/web` | UI, flows, viz | API (typed client), `shared/packages/ui-kit` |
| Application/API | `services/api` | HTTP, orchestration, persistence, integrations | `services/domain` |
| Domain | `services/domain` | Pure finance types + calculation (forecast, tax, rubrics). No I/O. | nothing |
| Shared | `shared/packages/ui-kit`, `enablement/standards` | Components; tsconfig/eslint | — |

**Dependency rule:** dependencies point inward. `services/domain` never imports
from `apps/*`. UI/API orchestrate; they don't contain core arithmetic.

## Module contract (the "plug-and-play" unit)

Every API module is a self-contained slice with an explicit surface:

- **Inputs:** DTOs / events it consumes.
- **Outputs:** DTOs / events it emits.
- **Storage:** its own tables (no reaching into another module's tables).
- **Domain use:** calls pure functions from `services/domain`.
- **Doc:** a matching `docs/modules/<name>.md`.

Adding a capability (a new data feed, a new market's tax rules, a new advice
rubric) means adding/extending a module against these contracts — not editing
across the whole tree.

### Extensibility seams

- **Open-banking provider** is an interface (`BankDataProvider`) with per-provider
  implementations. New provider = new adapter.
- **Knowledge base** is keyed by jurisdiction (`UK` first) so new markets are
  additive.
- **Advice rubrics** are declarative rule sets, versioned and composable.
- **Categorisation** is a pipeline: deterministic rules first, AI fallback.

## Data & sync

- Bank data is pulled on a schedule and on-demand, normalised, deduped, stored.
- Forecast is derived (recomputed from ledger + recurring model + manual items),
  not hand-maintained.
- Long-running work (syncs, knowledge refresh) runs as background jobs.

## Cross-cutting

- **Security:** token encryption, session/2FA, PII minimisation — see
  [`security-and-compliance.md`](security-and-compliance.md).
- **Observability:** structured logs (never log PII/tokens), health checks.
- **Config:** env-driven; secrets never in the repo (`.env.example` documents keys).

See [`adr/`](adr/) for the decisions behind these choices.
