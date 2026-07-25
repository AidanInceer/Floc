# internal-tools/

Tools the company runs **for itself** — not customer-facing products. **Placeholders.**

## Subfolders

- **[`internal-docs-site/`](internal-docs-site/)** — the self-hosted engineering
  handbook / knowledge base (the "Notion/Obsidian, but ours" itch): standards,
  runbooks, architecture, onboarding, decisions.
- **[`admin-dashboards/`](admin-dashboards/)** — internal admin/ops UIs (feature
  flags, user/account admin, operational metrics).
- **[`support-tooling/`](support-tooling/)** — tools for customer support
  (lookups, impersonation with audit, refund/adjustment workflows).

## Principles

- Internal ≠ careless: these often touch production data — same auth, authZ, and
  audit standards as customer products.
- Build on `shared/` (ui-kit, api-client) like any other app.
- Prefer one internal tool serving all ventures over per-venture duplicates.
