# Venture template

Canonical scaffold for a new venture. **Copy this folder** to start a new
company/product:

```bash
cp -r ventures/_template ventures/<your-venture>
```

See [`../../docs/adding-a-venture.md`](../../docs/adding-a-venture.md) for the
full checklist.

> This folder is intentionally excluded from the pnpm workspace (see
> `pnpm-workspace.yaml`) so its empty scaffold packages aren't installed until
> copied into a real venture.

## The three pillars

Every venture has the same shape so hub foundations and mental models transfer:

- **[`apps/`](apps/)** — user-facing frontends (web, marketing, mobile).
- **[`services/`](services/)** — backend: APIs, workers, and pure domain logic.
- **[`data-platform/`](data-platform/)** — pipelines, warehouse models, analytics.

Add a `docs/` folder and (optionally) a venture `CLAUDE.md` with
product-specific rules once you start building.

## When you copy this

1. Rename the folder (kebab-case) — it becomes your package scope.
2. Keep the three pillars even if some start empty (consistency = navigability).
3. Reach for `shared/*`, `infra/*`, `enablement/*` before building bespoke.
4. Run `pnpm install` so the new workspace packages are picked up.
