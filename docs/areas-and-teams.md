# Areas & teams

A map from the functional areas a growing SaaS org needs → where they live in
this repo. Focus is on **areas to populate in the monorepo**, not org-chart
detail. Headcount hints are rough, for a ~100-person, multi-million-revenue
company, and only to convey relative weight.

## Functional areas → repo location

| Area | What it does | Lives in | Rough weight @100 |
|---|---|---|---|
| **Product Management** | What to build, why, for whom | (drives `ventures/*`) | ~5–8 |
| **Frontend / Apps** | User-facing web/mobile | `ventures/*/apps`, `shared/packages/ui-kit` | ~15–20 |
| **Backend / Services** | APIs, domain logic, workers | `ventures/*/services` | ~20–25 |
| **Data Engineering** | Pipelines, warehouse, ingestion | `ventures/*/data-platform`, `shared/data-modules` | ~6–10 |
| **Data / Analytics** | Metrics, BI, experimentation | `ventures/*/data-platform`, `internal-tools/admin-dashboards` | ~4–6 |
| **Design & Design Systems** | UX, visual language, tokens | `shared/packages/design-system`, `ui-kit` | ~5–8 |
| **Platform / DevEx** | Make teams fast; shared code, CLI, standards | `enablement/`, `shared/packages/shared-*`, `api-client` | ~6–10 |
| **Infrastructure / DevOps** | Cloud, clusters, IaC | `infra/terraform`, `infra/kubernetes`, `shared/infra-modules` | (part of Platform/SRE) |
| **SRE / Reliability** | Uptime, on-call, observability | `infra/observability`, `infra/ci-cd` | ~5–8 |
| **Security** | AppSec, guardrails, scanning | `security-compliance/policies-as-code`, `vulnerability-tooling` | ~4–6 |
| **Compliance (software)** | SOC 2 / ISO evidence & controls | `security-compliance/compliance-evidence-automation` | ~1–3 |
| **Internal Tools / IT** | Docs site, admin, support tooling | `internal-tools/` | ~3–5 |
| **Go-to-Market** | Sales, marketing, success | (mostly outside the repo; marketing sites in `ventures/*/apps`) | ~15–20 |
| **BizOps / Finance / People** | Runs the company | (outside the repo) | ~8–12 |

## Things easy to miss (called out)

- **Product Management** is its own function — not a side-effect of engineering.
- **Design Systems** is distinct from Frontend: `design-system` (tokens/theming)
  vs `ui-kit` (components) vs each venture's screens.
- **Platform / DevEx** becomes essential past ~6 engineering teams — it owns
  `enablement/` and the shared packages so ventures don't each reinvent plumbing.
- **Software compliance ≠ legal compliance.** SOC 2 / ISO 27001 (security-owned)
  lives here in `security-compliance/`; GDPR/contracts/legal is a separate
  business function and generally not in this repo.
- **Self-hosted internal knowledge** (handbook/wiki, the "Notion/Obsidian"
  itch) → `internal-tools/internal-docs-site`.

## How areas use the hub

- **Venture teams** (product + frontend + backend + data) own a
  `ventures/<name>/` and ship the product.
- **Foundation teams** (platform, infra/SRE, security, design systems) own the
  shared areas that every venture depends on — their "customers" are the venture
  teams.

This split is the operating model the folder structure encodes: ventures move
fast on top; foundations provide leverage underneath.
