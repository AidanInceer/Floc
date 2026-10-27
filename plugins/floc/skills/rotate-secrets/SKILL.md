---
name: rotate-secrets
description: Rotate the Floc production credentials stored in Railway (BETTER_AUTH_SECRET, CRON_SECRET, TURSO_AUTH_TOKEN, GOOGLE_CLIENT_SECRET, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET) in one run with one redeploy. Use when the user says /floc:rotate-secrets, "rotate the secrets", "rotate keys", or after a provider or Railway revokes or leaks a credential.
---

# rotate-secrets

One script does the work: `floc/apps/web/scripts/rotate-railway-secrets.mjs`.
It reads new values from `floc-rotation.env` at the repo root (`--from <path>`
for another file) and makes that file, empty, on first run. It refuses a file in
the repo that git does not ignore (`*.env` covers it).

**Never open that file, ask for, print or log a secret value** — not in chat,
not in a debug script. A check prints a prefix, a mode or an account ID at most.
The user runs `--apply` in their own terminal; agents may not deploy production.
The repo is public: never write account names, project or service IDs,
hostnames, emails or key prefixes beyond the type (`sk_test_`) into code,
tests, this skill or tickets. The script finds the Railway project by its
service names and the Turso database from `TURSO_DATABASE_URL`.

## What the script does

| Credential | How |
|---|---|
| `BETTER_AUTH_SECRET`, `CRON_SECRET` | Made on the machine. floc-cron's `CRON_SECRET` references floc-web, so one write covers both. |
| `GOOGLE_CLIENT_SECRET` | From the file; checked against Google's token endpoint before any write. |
| `STRIPE_SECRET_KEY` | From the file; must be the same account and mode as the deployed key. |
| `STRIPE_WEBHOOK_SECRET` | From the file; Stripe must have an enabled endpoint for `floc.live/api/billing/webhook`, and a signed probe event proves the deploy took the secret. |
| `TURSO_AUTH_TOKEN` | `TURSO_API_TOKEN` from the file (a Turso **API** token, not the database token); the script invalidates the database tokens, then mints a full-access one with the same lifetime until the database accepts it (`SELECT 1`). Invalidation finishes in the background: a token minted at once was refused with 401. |

Six numbered steps: check values → variables with `skipDeploys` → Turso swap →
deploy floc-web → deploy floc-cron → `/login` 200 and webhook probe. Deploys
build the branch head (`serviceInstanceDeployV2`), like a push: redeploying an
old deployment failed with no logs, and a crashed cron run cannot be redeployed.
floc-cron deploys after floc-web, because its run calls floc-web with the new
`CRON_SECRET`; a cron deploy starts one run. Nothing is
written if a check fails. An empty line in the file skips that credential.

Effects: everyone is signed out (web and phone), calendar feed links change, and
the site has **no database from the Turso swap until the redeploy ends**.

## Process

### 1. Read-only plan

The user runs, from the repo root:

```powershell
railway login
node --experimental-strip-types floc/apps/web/scripts/rotate-railway-secrets.mjs
```

The first run makes `floc-rotation.env`. Later runs show each value as
`filled` or `empty, skipped`, list unused names (`NEXT_PUBLIC_MAPTILER_KEY`) and
anything "Not handled" — tell the user to rotate those by hand.

### 2. Dashboard steps (user)

Production uses a Stripe **sandbox** (test mode) — confirm before sending the
user to Stripe live. Give only the steps the plan needs; each value
goes on its line in `floc-rotation.env`:

1. **Turso** — app.turso.tech → Settings → API Tokens → Create → `TURSO_API_TOKEN`.
2. **Google** — console.cloud.google.com → APIs & Services → Credentials → the
   Floc web client → **Add secret** → `GOOGLE_CLIENT_SECRET`. Keep the old one
   enabled until step 4 below.
3. **Stripe secret key** — Workbench → Overview → Manage API keys → Secret key →
   **Rotate key**, old key expiring in 24 hours → `STRIPE_SECRET_KEY`.
4. **Stripe webhook** — Workbench → Webhooks → the floc.live destination →
   Signing secret → **Roll secret**, old one expiring in 24 hours →
   `STRIPE_WEBHOOK_SECRET`. No destination listed → **Add destination**: events
   from your account, `checkout.session.completed`,
   `customer.subscription.updated`, `customer.subscription.deleted`, webhook
   endpoint `https://floc.live/api/billing/webhook`; copy its signing secret.

### 3. Apply (user)

```powershell
node --experimental-strip-types floc/apps/web/scripts/rotate-railway-secrets.mjs --apply
```

Type `ROTATE`. Pick a quiet time.

**If it stops after "Replacing the Turso token", the site is down.** Have the
user run `--apply` again at once: a rerun swaps Turso again and redeploys. Then
find the cause from the stop message; debug Railway with a script that prints
only HTTP status and GraphQL error messages.

A Railway deploy that fails at **Pre deploy command** with `HTTP status 401`
means the database refused `TURSO_AUTH_TOKEN`: the migration runs before the
app starts. Rerun `--apply`. Check a token by its `iat` claim and a `SELECT 1`,
never by printing it.

### 4. After

The script then writes the new `GOOGLE_CLIENT_SECRET` and `STRIPE_SECRET_KEY`
into `floc/apps/web/.env` (local dev shares the Google client and the Stripe
sandbox). It only replaces lines that exist and leaves `STRIPE_WEBHOOK_SECRET`,
which `stripe listen` signs locally. To do only this part:

```powershell
node --experimental-strip-types floc/apps/web/scripts/rotate-railway-secrets.mjs --local
```

1. Delete `floc-rotation.env`. Once the user confirms the run finished, the
   agent may run `Remove-Item floc-rotation.env` (allow-listed in
   `.claude/settings.json`).
2. Sign in with Google on floc.live; Google console → disable, then delete, the
   old client secret.
3. Turso → delete the API token used for the run.
4. Delete unused variables in Railway: `NEXT_PUBLIC_MAPTILER_KEY` (and its
   MapTiler key), `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `WAYPOINT_FILES_DIR`.
5. Check the next floc-cron run in Railway logs.

### 5. Report

Credential names and outcome only. A stop message names the step; act on it
and have the user run again.
