# CLAUDE.md — Waypoint

pnpm + Turborepo monorepo, one venture: **Waypoint** (group-travel planner).
Real code is [`ventures/waypoint/apps/web`](ventures/waypoint/apps/web/README.md)
— Next.js App Router + Turso (libSQL) + Drizzle + Better Auth.

[`ventures/waypoint/CLAUDE.md`](ventures/waypoint/CLAUDE.md) has the product
rules and wins inside that folder — **read it before touching app code.**
Waypoint is the only venture; don't add others unasked. Phase: pre-MVP — narrow
end-to-end slices, one ticket at a time; confirm scope before large builds.

## Structure

| Where | What |
|---|---|
| `ventures/waypoint/apps/web/` | The app. See its own CLAUDE.md. |
| `ventures/waypoint/apps/prototype/` | Superseded — don't extend. |
| `docs/` | Local-only HTML site, no build/server. Open `docs/index.html` off disk. |
| `ventures/waypoint/.scratch/waypoint-v1/` | One file per ticket/decision; `map.md` is the index. Read before changing behaviour. |

Key docs: [design approach](docs/design/approach.html) ·
[visual language](docs/design/visual-language.html) ·
[architecture](docs/architecture/architecture.html) ·
[ERD](docs/data-model/erd.html).

## Commands

```bash
pnpm install                        # root
pnpm dev                            # turbo run dev (build|typecheck|lint|test likewise)
pnpm --filter waypoint-web <task>   # scope to the app
```

## Key decisions

- **Docs are HTML, not markdown** — edit the page itself. Every page: `<link>`
  to `assets/docs.css`, `<nav id="sidebar">`, `<script src>` to `assets/nav.js`
  (plain `<script src>` only — `fetch`/ES modules are blocked on `file://`).
  A new page needs a line in [`docs/assets/nav.js`](docs/assets/nav.js)'s
  `TREE` array or it's unreachable. `docs/mockups/` is standalone, not part of
  the site.
- **No feature branches.** Work lands on `main` directly; one commit per
  ticket, made at session end.
- **Commit subject:** `<version> #<issue>: <type>: <description>` — e.g.
  `0.4.0 #93: feat: split the profile into two faces`. Version bumps
  `apps/web/package.json` in the same commit (minor=feature, patch=fix). Body
  ends `Closes AidanInceer/Waypoint#<n>`. Types: `feat|fix|docs|refactor|chore|test`.
- **Deployment is per-app** — its own workflow + Vercel project; never deploy
  the whole monorepo at once.

## Common agent pitfalls here

- Editing a `.md` doc source that doesn't exist — the HTML *is* the doc, edit it directly.
- Adding a page to `docs/` without adding it to `nav.js`'s `TREE` — it silently becomes unreachable.
- Using `fetch`/ES modules in a docs page — breaks on `file://`, use `<script src>`.
- Treating `wireframe/` folders as packages — they're plain inline HTML/CSS/JS, no `package.json`.
- An npm-style `"workspaces"` array — workspaces are defined in `pnpm-workspace.yaml` only.
- A PowerShell commit here-string where `@'`/`'@` aren't alone on their lines — the `@` leaks into the commit subject. Verify with `git log -1 --format=%s`.
- Skipping the venture's own CLAUDE.md — it holds the actual non-negotiables (money-as-float, day-first itinerary, enumeration-proof access, etc.), not this file.

## Security

No secrets/keys/tokens in the repo, no logging PII/tokens, degrade without
credentials rather than crash. Flag anything touching auth, encryption, PII,
or compliance rather than glossing over it.

## Agent skills

Issues/PRDs live as GitHub issues (`gh` CLI) — see
[issue-tracker](docs/agents/issue-tracker.html) / [domain](docs/agents/domain.html).
