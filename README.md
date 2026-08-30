# Nexus — Venture Hub

> A centralised monorepo for building multiple companies/products on shared
> foundations. Spin up a new venture with infra, CI/CD, design system, and
> security already in place — instead of rebuilding the plumbing every time.

**Status:** pre-MVP. The hub structure exists; the one product
(**[floc](floc/apps/web/README.md)** — a group-travel planner) is the only
venture. Most other areas are documented placeholders, not running systems.

> **Nexus** is the name of this **incubator hub**, not any single product.
> **Floc** is the product.

---

## The idea

One repo, two kinds of thing:

- **The product** — `floc/`, holding its own `apps/`. A second venture would
  sit beside it as its own top-level folder.
- **Shared foundations** — everything a venture *inherits* rather than
  duplicates: reusable packages, infra modules, security/compliance tooling,
  internal tools, and enablement (templates, CLI, standards, onboarding).

A venture should be able to focus on its product and lean on the hub for the
undifferentiated heavy lifting

## Layout

```
/
├── floc/                        # the product — group-travel planner
│   ├── apps/web/                #   the Next.js app
│   └── docs/                    #   product-scoped notes
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

## Quick links

- **All documentation** → [`docs/index.html`](docs/index.html) — open it in a
  browser straight off disk. The docs are a small local-only site now, not
  Markdown files: plain HTML, a sidebar to browse with, no server and no build.
- **Wireframes** → [`docs/mockups/`](docs/mockups/README.md)
- **The venture** → [`floc/apps/web/README.md`](floc/apps/web/README.md)
- **Agent instructions** → [`CLAUDE.md`](CLAUDE.md) (hub) · each venture may add its own

## Conventions

- Monorepo: **pnpm workspaces + Turborepo**.
- Commits: **Conventional Commits** (`feat:`, `fix:`, `docs:`, `chore:`…),
  ideally scoped by area (`feat(nexus): …`, `chore(infra): …`).
- Each venture owns its stack but should prefer shared packages/modules.
- Secrets never in the repo. See [`security-compliance/`](security-compliance/).
