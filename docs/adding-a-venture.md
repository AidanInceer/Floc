# Adding a venture

A "venture" is a company/product living under `ventures/<name>/`. Every venture
shares the same internal shape so the hub's foundations, tooling, and mental
model transfer directly.

## Steps

1. **Copy the template.**
   ```bash
   cp -r ventures/_template ventures/<your-venture>
   ```
   (Later this becomes `nexus new venture <name>` via the
   [`enablement/cli`](../enablement/cli/).)

2. **Name it.** Use a short, kebab-case folder name. This is the workspace scope
   for its packages (`@<venture>/…`).

3. **Fill the three pillars** (only what you need — start thin):
   - `apps/` — the frontend(s).
   - `services/` — API / workers / domain logic.
   - `data-platform/` — pipelines, warehouse models, analytics.

4. **Add a `docs/`** for the venture's vision, architecture, ADRs, and mockups.

5. **Optionally add a venture `CLAUDE.md`** with product-specific rules (see
   [`../ventures/finance-planner/CLAUDE.md`](../ventures/finance-planner/CLAUDE.md)
   for an example — e.g. domain invariants).

6. **Wire it up.** The root `pnpm-workspace.yaml` already globs
   `ventures/*/apps/*`, `ventures/*/services/*`, `ventures/*/data-platform/*`,
   so new workspace packages are picked up automatically. Run `pnpm install`.

## What you get for free (don't rebuild)

| Need | Reach for |
|---|---|
| UI look & feel | `shared/packages/design-system`, `ui-kit` |
| Cross-cutting types / helpers | `shared/packages/shared-types`, `shared-utils` |
| Talking to internal APIs | `shared/packages/api-client` |
| Cloud resources | `shared/infra-modules` + `infra/terraform` |
| Data pipelines | `shared/data-modules` |
| CI/CD | `infra/ci-cd` reusable workflows |
| Security guardrails & scanning | `security-compliance/` (applies automatically) |
| Lint/format/tsconfig | `enablement/standards` |
| Scaffolds & codegen | `enablement/templates`, `enablement/cli` |

## Rules

- **No cross-venture imports.** Need to share code? Promote it to `shared/`.
- **Prefer shared foundations** over per-venture bespoke infra/UI/types.
- **Keep the three-pillar shape** (`apps` / `services` / `data-platform`) even if
  some start empty — consistency is what makes the hub navigable.

## Reference implementation

[`ventures/finance-planner/`](../ventures/finance-planner/) is the first venture
and a worked example of the shape (currently a pre-MVP design canvas).
