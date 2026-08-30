# CLAUDE.md — Waypoint (hub)

pnpm + Turborepo monorepo. One venture: **Waypoint** (group-travel planner).
App = [`ventures/waypoint/apps/web`](ventures/waypoint/apps/web/README.md) — Next.js App Router + Turso (libSQL) + Drizzle + Better Auth.
**Read [`ventures/waypoint/CLAUDE.md`](ventures/waypoint/CLAUDE.md) before touching app code** — holds the non-negotiables.
Waypoint is the only venture; don't add others unasked. Pre-MVP: narrow slices, one ticket at a time, confirm scope before big builds.
Pitfalls: [`learnings.md`](learnings.md).

## Structure

| Where | What |
|---|---|
| `ventures/waypoint/apps/web/` | The app. See its CLAUDE.md. |
| `ventures/waypoint/apps/prototype/` | Superseded — don't extend. |
| `docs/` | Local HTML site, no build. Open `docs/index.html` off disk. |
| `ventures/waypoint/.scratch/waypoint-v1/` | One file per ticket/decision; `map.md` = index. Read before changing behaviour. |

Key docs: [approach](docs/design/approach.html) · [visual language](docs/design/visual-language.html) · [architecture](docs/architecture/architecture.html) · [ERD](docs/data-model/erd.html).

## Environment

Windows 11. The terminal is **Windows PowerShell 5.1** (VS Code's default), not pwsh 7 and not bash.
No `&&` — chain with `;`. No `ls`/`rm -rf`/`touch`/`cat` — use `Get-ChildItem`, `Remove-Item -Recurse -Force`, `New-Item`, `Get-Content`.
Hand the user PowerShell, never Unix shell.

## Commands

```bash
pnpm install                        # root
pnpm dev                            # turbo run dev (build|typecheck|lint|test likewise)
pnpm --filter waypoint-web <task>   # scope to app
pnpm fitness                        # layers, dead code, tokens, contrast, bundle
pnpm verify                         # everything CI runs, locally
```

`pnpm verify` ([`scripts/verify.sh`](scripts/verify.sh)) mirrors every CI job — lint/typecheck/test/build, fitness (layering, dead code, `globals.css` tokens, WCAG contrast, bundle budget), migration drift, wireframe self-containment, `pnpm audit`, gitleaks (skipped if absent). Change a `.github/workflows/` **check** job → change verify.sh same commit; drifted local gate = false confidence. `sync-develop.yml` is the exception: it runs no check, so it moves alone.

**Stop dev server before anything that builds.** `verify`/`build`/`fitness` all write `apps/web/.next`, owned by `next dev`. Build over live dev → shredded chunks → `Cannot find module './vendor-chunks/...'` on every route; only cure is deleting `.next` — `pnpm --filter waypoint-web run clean:next`, the one delete an agent is allowed (`rm -rf`/`Remove-Item -Recurse` are denied outright, and deny beats allow). Same script cures OneDrive's `EINVAL: readlink` on `.next`. Order: **stop dev → build/verify → restart.** Check with `preview_list`, not `ps` (preview-managed `next dev` doesn't show in process list).

**No pre-push hook.** Run `pnpm verify` by hand before **every** push, `develop` included. A red `develop` means the next batch to `main` carries several tickets' breakage at once and you debug all of them together — keeping `develop` green is the only reason it is safe to merge.

## Key decisions

- **Docs = HTML, not markdown** — edit the page. Every page: `<link>` `assets/docs.css`, `<nav id="sidebar">`, `<script src>` `assets/nav.js` (plain `<script src>` only — `fetch`/ES modules blocked on `file://`). New page needs a line in [`docs/assets/nav.js`](docs/assets/nav.js) `TREE` or it's unreachable. `docs/mockups/` standalone.
- **Branching.** Two long-lived branches, no feature branches. Work lands on `develop`, one commit per ticket, `pnpm verify` green **before every push**. `develop` reaches `main` in batches via PR, merged as a **merge commit** — never squash, never rebase; squashing flattens the one-commit-per-ticket history. `main` deploys, so it is only ever a merge commit or a hotfix. Hotfix = commit straight to `main`; [`sync-develop.yml`](.github/workflows/sync-develop.yml) merges `main` back into `develop` on every push to `main`, so nothing has to be resynced by hand. Never commit a feature to `main` directly. No branch protection — the hotfix path stays open.
- **Ticket state.** `Closes` only fires on the default branch, so an issue built on `develop` stays open until the batch merges. Label it **`on-develop`** the moment its commit is pushed; `gh issue list --label on-develop --state open` is then the list of what is built but unshipped. The merge to `main` closes them; leave the label on as history.
  Deliberately parked work gets **`future-work`** instead — `gh issue list --label future-work` is the pile nobody is picking up next, so an open issue is never ambiguous about whether it is queued.
- **Commit subject:** `<version> #<issue>: <type>: <description>` — e.g. `0.4.0 #93: feat: split the profile`. Version bumps `apps/web/package.json` same commit (minor=feat, patch=fix). Body ends `Closes AidanInceer/Waypoint#<n>`. Types: `feat|fix|docs|refactor|chore|test`. No-ticket work → literal `#no-ticket`, drop `Closes`. Never invent/borrow a number (wrong `Closes` shuts someone's issue). Don't open an issue just to cite one.
- **Deploy = Railway** via `railway.json` at root: runs migration, starts `waypoint-web`. Push to `main` deploys. Env vars in Railway Variables tab, never repo.

## Security

No secrets/keys/tokens in repo. No logging PII/tokens. Degrade without credentials, don't crash. Flag anything touching auth/encryption/PII/compliance.

## Agent skills

Issues/PRDs = GitHub issues (`gh`) — [issue-tracker](docs/agents/issue-tracker.html) / [domain](docs/agents/domain.html).
