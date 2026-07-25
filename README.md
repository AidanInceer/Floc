# Nexus — Venture Hub

> A centralised monorepo for building multiple companies/products on shared
> foundations. Spin up a new venture with infra, CI/CD, design system, and
> security already in place — instead of rebuilding the plumbing every time.

**Status:** early scaffold. The hub structure exists; the first venture
(**[finance-planner](ventures/finance-planner/)** — an AI-assisted financial
adviser) is a pre-MVP design canvas. Most areas are documented placeholders,
not running systems.

> **Nexus** is the name of this **incubator hub**, not any single product.
> `finance-planner` is a placeholder folder name for the first venture — rename
> it to the product's real brand when chosen.

---

## The idea

One repo, two kinds of thing:

- **`ventures/`** — each company/product/startup, all shaped the same way
  (`apps/`, `services/`, `data-platform/`). New ventures are scaffolded from
  `ventures/_template/`.
- **Shared foundations** — everything a venture *inherits* rather than
  duplicates: reusable packages, infra modules, security/compliance tooling,
  internal tools, and enablement (templates, CLI, standards, onboarding).

A venture should be able to focus on its product and lean on the hub for the
undifferentiated heavy lifting.

## Layout

```
/
├── ventures/                    # one folder per company/product
│   ├── _template/               # scaffold copied for every new venture
│   │   ├── apps/                #   user-facing frontends
│   │   ├── services/            #   backend services / APIs / domain logic
│   │   └── data-platform/       #   pipelines, warehouse, analytics
│   └── finance-planner/         # first venture — AI financial adviser (placeholder name)
│       ├── apps/  services/  data-platform/  docs/
├── shared/                      # reused across every venture
│   ├── packages/                #   design-system, ui-kit, shared-types, shared-utils, api-client
│   ├── infra-modules/           #   reusable terraform/k8s modules
│   └── data-modules/            #   reusable pipeline/warehouse templates
├── infra/                       # the hub's own infrastructure
│   ├── terraform/  kubernetes/  observability/  ci-cd/
├── security-compliance/         # policies-as-code, vuln tooling, evidence automation
├── internal-tools/              # docs site, admin dashboards, support tooling
├── enablement/                  # templates, CLI, standards, onboarding — make teams fast
└── docs/                        # hub-level documentation
```

Full rationale and per-area breakdown: [`docs/repo-structure.md`](docs/repo-structure.md).

## Quick links

- **How the repo is organised** → [`docs/repo-structure.md`](docs/repo-structure.md)
- **Add a new venture** → [`docs/adding-a-venture.md`](docs/adding-a-venture.md)
- **Which areas map to which teams/functions** → [`docs/areas-and-teams.md`](docs/areas-and-teams.md)
- **The first venture** → [`ventures/finance-planner/README.md`](ventures/finance-planner/README.md)
- **Agent instructions** → [`CLAUDE.md`](CLAUDE.md) (hub) · each venture may add its own

## Conventions

- Monorepo: **pnpm workspaces + Turborepo**.
- Commits: **Conventional Commits** (`feat:`, `fix:`, `docs:`, `chore:`…),
  ideally scoped by area (`feat(nexus): …`, `chore(infra): …`).
- Each venture owns its stack but should prefer shared packages/modules.
- Secrets never in the repo. See [`security-compliance/`](security-compliance/).
