# Repo structure

Nexus is an **incubator hub**: a single monorepo where multiple ventures share
one set of foundations (infra, CI/CD, design system, security, tooling). The
goal is that starting venture #2 costs a fraction of venture #1.

```
/
├── ventures/                    # one folder per company/product
│   ├── _template/               # scaffold copied for every new venture
│   │   ├── apps/                #   user-facing frontends (web, mobile, …)
│   │   ├── services/            #   backend services / APIs / domain logic
│   │   └── data-platform/       #   pipelines, warehouse models, analytics
│   └── finance-planner/         # first venture (placeholder name)
│       ├── apps/  services/  data-platform/  docs/
├── shared/                      # inherited by every venture
│   ├── packages/
│   │   ├── design-system/       #   tokens, theming primitives
│   │   ├── ui-kit/              #   reusable React components
│   │   ├── shared-types/        #   cross-cutting TypeScript types
│   │   ├── shared-utils/        #   framework-free helpers
│   │   └── api-client/          #   generated/typed client for internal APIs
│   ├── infra-modules/           #   reusable terraform/k8s modules
│   └── data-modules/            #   reusable pipeline/warehouse templates
├── infra/                       # the hub's own running infrastructure
│   ├── terraform/               #   cloud resources (state, envs)
│   ├── kubernetes/              #   cluster manifests / helm
│   ├── observability/           #   metrics, logs, traces, dashboards, alerts
│   └── ci-cd/                   #   pipeline definitions, shared workflows
├── security-compliance/
│   ├── policies-as-code/        #   OPA/Sentinel, guardrails, IaC policy
│   ├── vulnerability-tooling/   #   SAST/DAST/dependency/secret scanning config
│   └── compliance-evidence-automation/  # SOC2/ISO evidence collection
├── internal-tools/
│   ├── internal-docs-site/      #   the engineering handbook / knowledge base
│   ├── admin-dashboards/        #   internal admin/ops UIs
│   └── support-tooling/         #   customer-support internal tools
├── enablement/                  # make teams fast — developer experience
│   ├── templates/               #   service/app/pipeline starter templates
│   ├── cli/                     #   internal CLI (scaffold, codegen, tasks)
│   ├── standards/               #   shared tsconfig/eslint/prettier, conventions
│   └── onboarding/              #   getting-started guides for new engineers
└── docs/                        # hub-level documentation (this folder)
```

## The decision that matters most: venture vs shared

| Question | Put it in… |
|---|---|
| Only ever used by one product? | `ventures/<name>/` |
| Used (or clearly will be) by 2+ ventures? | `shared/` |
| Runs the hub itself (clusters, pipelines, monitoring)? | `infra/` |
| Keeps us secure/compliant across everything? | `security-compliance/` |
| A tool *we* use internally, not shipped to customers? | `internal-tools/` |
| Helps engineers build faster (scaffolds, CLI, standards)? | `enablement/` |

Getting this right is the whole point of the hub — duplication across ventures
is the failure mode it exists to prevent.

## Area-by-area

### `ventures/`
Each venture is a self-contained product with a consistent internal shape:

- **`apps/`** — user-facing frontends (web app, marketing site, mobile).
- **`services/`** — backend: APIs, workers, and pure domain/business logic.
- **`data-platform/`** — the venture's pipelines, warehouse models, and
  analytics (a data-engineering-friendly home per venture).
- **`docs/`** — that venture's own vision, architecture, ADRs, mockups.

`_template/` is the canonical shape new ventures are cloned from — see
[`adding-a-venture.md`](adding-a-venture.md).

### `shared/`
Everything ventures inherit instead of duplicating:

- **`packages/`** — publishable/importable workspace packages: `design-system`
  and `ui-kit` (look & feel), `shared-types` and `shared-utils` (cross-cutting
  code), `api-client` (typed access to internal services).
- **`infra-modules/`** — reusable Terraform/Kubernetes modules (a "VPC module",
  a "Postgres module") that `infra/` and ventures compose.
- **`data-modules/`** — reusable pipeline/warehouse templates (ingestion
  patterns, dbt-style model scaffolds).

### `infra/`
The hub's own infrastructure, not app code: `terraform/` (cloud resources),
`kubernetes/` (clusters/manifests), `observability/` (Prometheus/Grafana/OTel,
dashboards, alerts), `ci-cd/` (shared pipeline definitions and reusable
workflows). Where your instinct about Terraform + SRE + monitoring lives.

### `security-compliance/`
Security and *software* compliance (distinct from legal/contract compliance):
`policies-as-code/` (guardrails enforced in CI), `vulnerability-tooling/`
(scanning: SAST/DAST, dependencies, secrets), and
`compliance-evidence-automation/` (auto-collect SOC 2 / ISO 27001 evidence).

### `internal-tools/`
Tools the company runs for itself, not customer-facing products:
`internal-docs-site/` (the self-hosted handbook/wiki — your "Notion/Obsidian"
instinct), `admin-dashboards/`, and `support-tooling/`.

### `enablement/`
Developer experience — the leverage that keeps 100 engineers fast:
`templates/` (starters), `cli/` (scaffold/codegen), `standards/` (shared
tsconfig/eslint/prettier + conventions), `onboarding/` (ramp guides).

### `docs/`
Hub-level docs: how the repo is organised, how to add a venture, how areas map
to teams. Product docs live inside each venture.

## Tech-stack independence

This layout is deliberately **stack-agnostic**. Terraform/K8s/dbt/React are
named as examples, not mandates — the folder *purposes* hold regardless of the
tools a venture picks.
