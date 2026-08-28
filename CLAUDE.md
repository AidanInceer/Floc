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
pnpm fitness                        # layers, dead code, tokens, contrast, bundle
pnpm verify                         # everything CI runs, run locally
```

`pnpm verify` ([`scripts/verify.sh`](scripts/verify.sh)) mirrors every CI job —
lint/typecheck/test/build, the fitness functions (layering, dead code, the
`globals.css` token rules, WCAG contrast, the bundle budget), migration drift,
wireframe self-containment, `pnpm audit`, and gitleaks (skipped when not
installed). **Change a job in
`.github/workflows/` and change it there in the same commit** — a local gate
that has drifted from CI is worse than none, because it buys false confidence.

**Stop the dev server before anything that builds.** `pnpm verify`, `pnpm
build` and `pnpm fitness` all write `apps/web/.next`, which the running dev
server owns. Build over a live `next dev` and the two shred each other's
chunks: the app then throws `Cannot find module './vendor-chunks/...'` or
`Cannot read properties of undefined (reading 'call')` on every route, and the
only cure is deleting `.next` — which an agent is not permitted to do, so it
lands on the user. Order is always: **stop the dev server → build/verify →
start it again.** Never leave a preview running across a verify. Check with
`preview_list`, not `ps` — a preview-managed `next dev` does not appear in a
process listing, so "ps found nothing" is not evidence that it is down.

**Nothing runs it for you.** There is no pre-push hook — run `pnpm verify` by
hand before a push you care about. CI still runs every one of these jobs and is
the gate that actually blocks, so the cost of skipping it locally is finding out
after the push rather than before. That matters here because `main` deploys:
a red push is a broken deploy until CI catches it.

**Before pushing, review the diff with a subagent** (Opus 5, low effort) over
what is about to go out, and fix what it finds first. This repo has no pull
requests — the commit is the unit of work and there is no review surface
between it and `main` — so the review happens here or not at all. It is cheap,
and it is good at what the mechanical checks cannot see: edge cases, security,
and consistency with the patterns already in the codebase. The written
standards in [`ventures/waypoint/CLAUDE.md`](ventures/waypoint/CLAUDE.md) are
what make it worth doing — a review against stated rules beats one against the
reviewer’s own taste.

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
  Work with no ticket behind it — a tweak asked for mid-session, a drive-by fix
  — uses the literal `#no-ticket` in that slot and drops the `Closes` line:
  `0.62.2 #no-ticket: fix: use the colourful OSM map style`. **Don't invent a
  number, and don't borrow the last commit's** — a wrong `Closes` shuts someone
  else's issue. Don't open an issue just to have one to cite either; ask only if
  the work looks big enough to deserve tracking.
- **Deployment is Railway**, driven by `railway.json` at the repo root: it runs
  the migration script, then starts `waypoint-web`. A push to `main` deploys.
  Env vars live in Railway's own Variables tab, never in the repo.

## Common agent pitfalls here

- Editing a `.md` doc source that doesn't exist — the HTML *is* the doc, edit it directly.
- Adding a page to `docs/` without adding it to `nav.js`'s `TREE` — it silently becomes unreachable.
- Using `fetch`/ES modules in a docs page — breaks on `file://`, use `<script src>`.
- An npm-style `"workspaces"` array — workspaces are defined in `pnpm-workspace.yaml` only.
- A PowerShell commit here-string where `@'`/`'@` aren't alone on their lines — the `@` leaks into the commit subject. Verify with `git log -1 --format=%s`.
- Running `pnpm verify`/`pnpm build` with the dev server still up — see the rule above; it corrupts `.next` and the user has to delete it by hand.
- Skipping the venture's own CLAUDE.md — it holds the actual non-negotiables (money-as-float, day-first itinerary, enumeration-proof access, etc.), not this file.

## Security

No secrets/keys/tokens in the repo, no logging PII/tokens, degrade without
credentials rather than crash. Flag anything touching auth, encryption, PII,
or compliance rather than glossing over it.

## Agent skills

Issues/PRDs live as GitHub issues (`gh` CLI) — see
[issue-tracker](docs/agents/issue-tracker.html) / [domain](docs/agents/domain.html).
