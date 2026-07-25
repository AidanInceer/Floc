# CI/CD

Pipeline design for the hub. GitHub requires workflow *files* to live in
[`/.github/workflows/`](../../.github/workflows/), so this page is the
explanation and that directory is the implementation.

## Shape

| Workflow | Trigger | Job |
|---|---|---|
| `ci.yml` | every PR, push to `main` | lint · typecheck · test · build, **affected packages only** |
| `security.yml` | every PR, push to `main`, weekly | secret scan, dependency review, vulnerability audit |
| `deploy-vercel.yml` | called by other workflows | the one and only deploy implementation |
| `deploy-<venture>-<app>.yml` | push/PR touching that app's paths | thin caller: paths in, project ID out |

## Why it's built this way

**Each app deploys on its own.** A monorepo that redeploys everything on every
commit stops being cheap very quickly, and couples ventures that are supposed to
be independent. Each deployable app gets its own caller workflow with a `paths:`
filter, so a change to `carbon-ledger` cannot trigger a `finance-planner`
deploy.

**One deploy implementation, many callers.** The deploy steps — install, verify,
`vercel pull`/`build`/`deploy`, PR comment — live once in `deploy-vercel.yml`.
Callers pass an app name, a workspace name, and a Vercel project ID. Fixing a
deploy bug is a one-file change rather than a sweep across every venture.

**CI only builds what changed.** `turbo run <task> --filter='...[origin/main]'`
selects the affected packages *plus their dependents*, so a change to a
`shared/packages/*` package still rebuilds every venture that consumes it, while
a docs-only change builds nothing.

**Verification happens in the deploy job too.** The deploy runs
`typecheck test build` for the app and its workspace dependencies before it
ships. CI passing on a PR is not proof that main still builds after a merge
race.

## Adding a new deployable app

1. Create the Vercel project. Set its **Root Directory** to the app path (e.g.
   `ventures/carbon-ledger/apps/web`). Keeping the path in Vercel rather than in
   CI means it lives in one place.
2. Copy `deploy-finance-planner-prototype.yml` to
   `deploy-<venture>-<app>.yml`. Change four things: the workflow name, the
   `paths:` globs, `app_name` / `workspace`, and the variable name.
3. Add a repository **variable** `VERCEL_PROJECT_ID_<VENTURE>_<APP>` with the
   `prj_...` ID. Until that variable exists the workflow skips cleanly, so a
   half-wired app never reds the repo.

The project ID is a variable, not a secret: it identifies a project and is inert
without `VERCEL_TOKEN`. Treating identifiers as secrets makes the real secrets
harder to see.

## Secrets

Two repository secrets, both from Vercel, both required before any deploy runs:

| Secret | Where it comes from |
|---|---|
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens. Scope it to the team. |
| `VERCEL_ORG_ID` | Vercel → Team Settings → General, or `.vercel/project.json` after `vercel link` |

Set them with the GitHub CLI:

```bash
gh secret set VERCEL_TOKEN
```

Rotate `VERCEL_TOKEN` if it is ever printed in a log. Never commit either value
— `security.yml` scans for exactly this and will fail the build.

## Environments

`preview` and `production` are GitHub Environments. Production deploys run only
from `main`; add required reviewers on the `production` environment when a
venture starts carrying real user data, and the deploy job will pause for
approval automatically — no workflow change needed.

## Not wired yet

- **Remote Turborepo cache.** Worth adding once CI time is felt; needs
  `TURBO_TOKEN` / `TURBO_TEAM`.
- **CodeQL.** Warranted once there is meaningful application code; today the
  repo is mostly documentation and static HTML.
- **Preview deploys for wireframes.** They are single files opened from disk;
  publish them as Artifacts instead of hosting them.
