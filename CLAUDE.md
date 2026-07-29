# CLAUDE.md — Venture Hub

Instructions for Claude Code at the **hub** level. This repo is a centralised
monorepo hosting multiple ventures on shared foundations. Each venture may add
its own `CLAUDE.md` with venture-specific rules that take precedence *within
that venture's folder* (e.g. [`ventures/finance-planner/CLAUDE.md`](ventures/finance-planner/CLAUDE.md)).

## What this repo is

A hub for building multiple companies/products without rebuilding plumbing each
time. See [`README.md`](README.md) and [`docs/repo-structure.md`](docs/repo-structure.md).

- **`ventures/<name>/`** — a company/product. Shape: `apps/`, `services/`,
  `data-platform/` (+ optional `docs/`). Scaffolded from `ventures/_template/`.
- **`shared/`** — packages, infra-modules, data-modules reused by ventures.
- **`infra/`**, **`security-compliance/`**, **`internal-tools/`**,
  **`enablement/`** — cross-cutting hub capabilities.

## Current phase

**Scaffold / design canvas.** Most areas are documented placeholders. Do NOT
build out a full system unless asked. When implementing, prefer a thin vertical
slice inside one venture over broad horizontal stubs. Confirm scope before large
builds.

### Ventures that exist today

| Venture | Status | What's real |
|---|---|---|
| `finance-planner` | Pre-MVP | Docs, mockups, working Vite prototype (`apps/prototype`) |
| `meal-planner` | Concept | Wireframe only |
| `to-the-frontier` | Concept | Wireframe only — AI-literacy teaching app |
| `carbon-ledger` | Concept | Wireframe only — AI-assisted carbon footprinting |
| `shards-of-time` | Concept | Wireframe only — isometric tactics game UI |
| `waypoint` | Pre-MVP | ADRs, four wireframe variants, working Vite prototype (`apps/prototype`) — group travel planner |

Only `finance-planner` and `waypoint` have installable code. The rest are
design artefacts.

## Commands

```bash
pnpm install              # root; installs every workspace package
pnpm dev                  # turbo run dev across workspaces
pnpm build                # turbo run build
pnpm typecheck            # turbo run typecheck
pnpm lint                 # turbo run lint
pnpm test                 # turbo run test
```

Per-app work is faster scoped: `pnpm --filter finance-planner-prototype dev`.

Turbo tasks are declared in [`turbo.json`](turbo.json). A package with no such
script is simply skipped — that's why root commands pass on a repo that is
mostly documentation.

## Wireframes &amp; mockups

A concept venture starts as a single self-contained page at
`ventures/<name>/wireframe/index.html`, before any app scaffold exists.

Conventions to match when adding or editing one:

- One file, no build step, no external requests — inline all CSS/JS. Opens
  straight from disk and can be published as an Artifact unchanged.
- No `<!doctype>`, `<html>`, `<head>` or `<body>` wrapper — start at `<title>`.
- Theme-aware via CSS custom properties: define tokens on `:root`, redefine
  under `@media (prefers-color-scheme: dark)`, then again under
  `:root[data-theme="dark"]` / `[data-theme="light"]` so a toggle wins over the
  media query. A deliberately single-theme design (e.g. a game screen) is a
  valid exception — say so in the file.
- Realistic content, never lorem. These are read as product proposals.
- `wireframe/` sits outside the pnpm workspace globs on purpose — it is not a
  package and must not gain a `package.json`.
- Style variants of the same wireframe live beside `index.html` as siblings
  (`glossy.html`, `paper.html`, …), sharing structure and content so only the
  visual language differs. See `ventures/waypoint/` and its ADR 0012.

Mockups that belong to a venture with real code live in that venture's
`docs/mockups/` instead (see `finance-planner`).

## Golden rules (hub-wide)

1. **Know where code belongs.** Venture-specific code → `ventures/<name>/`.
   Anything reused by 2+ ventures → `shared/` (packages/modules), not copy-paste.
2. **Don't reach across ventures.** One venture must not import another
   venture's internals. Share via `shared/` only.
3. **Security first.** No secrets, keys, or tokens in the repo. No logging of
   PII/tokens. See [`security-compliance/`](security-compliance/).
4. **Reuse before rebuild.** Check `shared/` and `enablement/templates/` before
   writing new infra, CI, UI, or types.
5. **Docs stay in sync.** A structural change updates the relevant README /
   `docs/` page. New cross-cutting decision → an ADR (hub `docs/` or the
   venture's `docs/adr/`).
6. **Respect venture CLAUDE.md.** Inside a venture, its own `CLAUDE.md` rules
   win (e.g. finance-planner: "money is never a float").

## Conventions

- Package manager: **pnpm** (v9). Node >= 20. Build orchestration: **Turborepo**.
- Default branch: **`main`**. Feature branches → PR; CI must pass before merge.
- Commits: Conventional Commits, scoped where useful (`feat(nexus): …`,
  `chore(infra): …`, `docs(enablement): …`). A commit that resolves a tracked
  issue ends with `Closes <owner>/<repo>#<n>` — **fully qualified**, because
  ventures track their issues in their own GitHub repo (e.g.
  `AidanInceer/Waypoint`), so a bare `#12` points at the wrong tracker.
- **Commit at the end of a session, not during it.** Once the work has been
  reviewed and the go-ahead given — or the next session starts, which is the
  same signal — commit the changes: one commit per ticket, never a single
  catch-all. **Commit only; never push.** Pushing stays a separate, explicit
  ask.
- Workspaces are defined in **`pnpm-workspace.yaml` only** — new packages/apps
  must live under a globbed path to be picked up. Do not add an npm-style
  `"workspaces"` array to `package.json`; pnpm ignores it and the two silently
  drift apart.

## Gotchas

- **`_template` is excluded from the workspace** (`!ventures/_template/**`) so
  its scaffold packages aren't installed. Copying it into a real venture is what
  brings it into the workspace — rename the package first or the name collides.
- **`wireframe/` directories are not packages.** Plain HTML, no install, no
  build. See the wireframes section above.
- **`finance-planner/apps/prototype` is throwaway** and says so in its own
  `package.json` description. Its `build` runs `tsc --noEmit` first, so a type
  error there fails the whole root build.
- **`apps/web` folders are empty skeletons** (a README only). Don't assume a
  Next.js app exists just because the path does.
- **Deployment is per-app, not per-repo.** Each deployable app gets its own
  workflow + Vercel project; CI must never deploy the whole monorepo at once.

## Where things live

| Need | Location |
|---|---|
| A new product/company | `ventures/<name>/` (copy `ventures/_template/`) |
| Reusable UI / types / utils / API client | `shared/packages/` |
| Reusable terraform/k8s | `shared/infra-modules/` · `infra/` for hub's own |
| Data pipeline/warehouse templates | `shared/data-modules/` |
| Policies-as-code, scanning, audit evidence | `security-compliance/` |
| Internal docs site, admin, support tools | `internal-tools/` |
| Scaffolding templates, CLI, standards, onboarding | `enablement/` |
| Hub-level docs | `docs/` |

## Guardrails

- When unsure whether something is venture-specific or shared, ask before
  placing it — moving it later is costly.
- Don't wire real credentials or live keys anywhere in the repo.
- Flag anything touching auth, encryption, PII, or compliance rather than
  glossing over it.

## Agent skills

### Issue tracker

Issues/PRDs live as GitHub issues (`gh` CLI). See `docs/agents/issue-tracker.md`.

### Domain docs

Multi-context: root `CONTEXT-MAP.md` points to per-venture `CONTEXT.md` + `docs/adr/`. See `docs/agents/domain.md`.
