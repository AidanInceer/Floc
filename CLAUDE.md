# CLAUDE.md — Floc

Group-travel planner: friends deciding where/when/order, who owes who. Pre-MVP.
pnpm + Turborepo monorepo, one venture. Don't add others unasked.
Narrow slices, one ticket at a time, confirm scope before big builds.
Pitfalls: [`learnings.md`](learnings.md).

**The name.** `Floc` in prose, lowercase wherever a machine parses it (`floc-web`, `floc/`, `FLOC_FILES_DIR`). `Flok` may still replace it — no domain bought yet. Don't pre-empt that; a half-applied spelling is worse than either. Wordmark = `floc` + pen dot: **floc.** — in `app-chrome.tsx` and again in the invite OG card.

## Structure

Stack: Next.js App Router + Turso (libSQL) + Drizzle + Better Auth.

| Where | What |
|---|---|
| `floc/apps/web/src/app/` | Routes. Server Components + Server Actions (`actions.ts` per folder). |
| `floc/apps/web/src/server/` | Query aggregates — owns all SQL + soft-delete filtering. One file per concept; name needs an "and" → split. |
| `floc/apps/web/src/server/freshness.ts` | Fact → stale pages. Only importer of `next/cache`; else call `refresh`. |
| `floc/apps/web/src/lib/` | Pure helpers (money, dates, calendar) — no I/O. |
| `floc/apps/web/src/components/` | `ui.tsx`/`client-ui.tsx` = house design system — reach first. |
| `floc/apps/web/src/db/schema.ts` | Schema of record. Mirrors [ERD](docs/data-model/erd.html) — change both. |
| `floc/apps/prototype/` | Superseded — don't extend. |
| `floc/.scratch/floc-v1/` | One file per ticket/decision; `map.md` = index. Read before changing behaviour. |
| `docs/` | Local HTML site, no build. Open `docs/index.html` off disk. |

Key docs: [approach](docs/design/approach.html) · [visual language](docs/design/visual-language.html) · [architecture](docs/architecture/architecture.html) · [ERD](docs/data-model/erd.html).

## Environment

Windows 11, **Windows PowerShell 5.1** — not pwsh 7, not bash. No `&&`, chain with `;`. No `ls`/`rm -rf`/`touch`/`cat` — use `Get-ChildItem`, `Remove-Item -Recurse -Force`, `New-Item`, `Get-Content`. Hand the user PowerShell, never Unix shell.

## Commands

```bash
pnpm install                     # root
pnpm dev                         # turbo run dev (build|typecheck|lint|test likewise)
pnpm --filter floc-web <task>    # scope to app
pnpm fitness                     # layers, dead code, tokens, contrast, bundle
pnpm verify                      # everything CI runs, locally
```

[`pnpm verify`](scripts/verify.sh) mirrors every CI job. Change a `.github/workflows/` **check** job → change verify.sh same commit. `sync-develop.yml` runs no check, so it moves alone.

**Stop the dev server before anything that builds.** `verify`/`build`/`fitness` write `.next`, owned by `next dev`; building over live dev shreds the chunks. Cure is `pnpm --filter floc-web run clean:next` — the one delete an agent may run, and it also cures OneDrive's `EINVAL: readlink`. Check with `preview_list`, not `ps`.

**No pre-push hook.** Run `pnpm verify` by hand before **every** push, `develop` included.

**A schema change is not done until `local.db` has it.** `db:generate` writes the migration; nothing applies it locally, so the dev server keeps querying the old table and dies on `no such column`. Run the new `drizzle/*.sql` against `local.db` in the same slice as the schema edit, before pushing — a pushed migration with an unmigrated `local.db` breaks dev for everyone next pulling it.

## Non-negotiables

1. **Money never a float.** Integer minor units; `parseMoney`/`computeSplits`/`formatMoney` only.
2. **`expense_split` rows = snapshots**, never recalculated — edit rewrites expense + splits in one transaction.
3. **Itinerary day-first.** `day`/`day_event` stored; a "stop" derives from consecutive days sharing `overnight_place_id`. Never add a `stop` table.
4. **No lifecycle state.** Trip state derives from data present — no enum, flag, column, or tab gating.
5. **Enumeration-proof access.** Load a trip only via `requireTripAccess` — non-member gets the same response as a nonexistent trip.
6. **Admin powers = exactly four**: invite, kick, promote, delete/archive. Everything else (incl. leaving) is any member. Gate with `assertAdmin`.
7. **Last-write-wins.** No optimistic locking. `last_modified_at` is debug-only.
8. **Soft-delete everywhere** — every read *and write* filters `isNull(table.deletedAt)`. Three exceptions (`ensureDays`, `applyTripWindow`, `addMember`) — see code comments.
9. **A trip may have no dates.** Nullable `start_date`/`end_date`; undated is never an error.
10. **No timezones.** Dates are `YYYY-MM-DD` strings; event times local to the itinerary. Never persist an offset.
11. **Degrade, don't crash, without credentials.** Missing provider (Nominatim/Resend/Google) → reduced feature, never a throw.

## Conventions

- Server Components by default; mutations are Server Actions in the route's `actions.ts` — never inline `"use server"` closures.
- **Nothing in `app/` imports `@/db`** — SQL lives only in `server/` aggregates.
- Validate at the door: dates via `lib/dates.ts`, free text via `lib/text.ts`. Rejections are form errors, never throws.
- **Visual: white ground + pastels + one blue.** Canvas `#F7F6F3`, white surfaces, hairlines; four pastels one-per-domain (peri/dates, mint/money, butter/ideas & people, blush/route); **blue `#4E68D8` = "yours to do" only**. Large radii, pill controls, pill-box nav, account right-aligned; quiet motion (1.5–2px hover lift, `.22s`, `cubic-bezier(.2,.85,.3,1)`). Type: Bricolage Grotesque (display) + Instrument Sans (body) + DM Mono (all money/dates).
- Colours from tokens only — no hex literals. Status never colour or icon alone; always a word too.
- **Light + dark, same token names.** Dark restates base values in `:root[data-theme="dark"]`. **No `dark:` variant** — needing one means the token is wrong. Choice in `localStorage`, never a column. Contrast checked both.
- **No emoji anywhere.** Every icon is drawn line-art: 14×14 `viewBox` at ~13px, `fill="none"`, `strokeWidth` 1.15–1.25, `stroke="currentColor"`.
- **Outside UI libraries** only where hand-rolling isn't worth months (BlockNote runs Notes). High bar; it takes the tokens/type/no-emoji rules or it doesn't ship.
- **If the drawing is clear, say nothing.** Text carries only what layout can't. Banned: a heading above a heading, captions decoding the design, narration of state a control already shows, instructional copy, a link repeating nav. Exceptions: what's *missing*, and status.
- British English, sentence case, real content — never lorem.
- Read [approach](docs/design/approach.html) + [visual language](docs/design/visual-language.html) before UI/UX work.
- **Comments: ruthless.** Only *why* plus a ticket pointer, or a genuine gotcha — never *what*. One line beats a block.

## Code standards

- **Single responsibility** — if the file's name needs an "and", it's two files.
- **Dependency inversion at seams.** `lib/` is pure; `components/` take data, never fetch; only `server/` opens the DB. Type-only imports across a seam are fine. `pnpm deps:check` enforces it.
- **YAGNI.** No abstraction, option, or knob without a second call site needing it today.
- **Composability over configuration.** Eight optional props for four cases → several components.

| Rule | Limit |
|---|---|
| File length | 600 lines (blank/comment excluded) |
| Function length | 120 lines — a page's JSX return exempt |
| Cyclomatic complexity | 15 per function |
| Component props | past ~6, split |

`eslint` enforces all but the last. Pre-ceiling files sit on a dated allowlist in `eslint.config.mjs`. Splitting beats adding a line.

**Performance defaults:** Server Components unless a client is needed; no client fetch where a server read does; no heavyweight import behind a rare branch; unbounded lists paged or capped (`LIMITS`). `pnpm check:bundle` holds shared First Load JS under budget.

## Out of scope for v1

Payments, attractions/POI data and reviews, flight *booking* (deep links only), i18n, analytics, consent UI, marketing email, push notifications.

## Workflow

- **Branching.** Two long-lived branches, no feature branches. Work lands on `develop`, one commit per ticket, `pnpm verify` green before every push. `develop` reaches `main` in batches via PR, merged as a **merge commit** — never squash, never rebase. `main` deploys, so it is only ever a merge commit or a hotfix. Hotfix = commit straight to `main`; [`sync-develop.yml`](.github/workflows/sync-develop.yml) merges it back into `develop`. Never commit a feature to `main`. No branch protection — the hotfix path stays open.
- **Commit subject:** `<version> #<issue>: <type>: <description>` — e.g. `0.4.0 #93: feat: split the profile`. Version bumps `floc/apps/web/package.json` in the same commit (minor=feat, patch=fix). Body ends `Closes AidanInceer/Floc#<n>`. Types: `feat|fix|docs|refactor|chore|test`. No-ticket work uses the literal `#no-ticket` and drops `Closes`. Never invent or borrow a number — a wrong `Closes` shuts someone's issue.
- **Ticket state.** `Closes` only fires on the default branch, so an issue built on `develop` stays open until the batch merges. Label it **`on-develop`** the moment its commit is pushed; the merge to `main` closes it, and the label stays as history. Parked work gets **`future-work`** instead, so an open issue is never ambiguous about whether it's queued.
- **Ticket labels.** Exactly one type label per queued ticket: `type:feat` | `type:fix` | `type:refinement`. State labels on top: `wayfinder:grilling`, `on-develop`, `future-work`. Blocked-by edges live in the issue body under `## Blocked by` as `#<n>`, never as a label. A ticket never sits above its blocker.
- **Priority = one stack issue.** An issue titled **`Priority`** in `AidanInceer/Floc` holds the ordered backlog in its body; the top line is the next ticket. Never worked on, never closed. A ticket leaves the stack when it's tagged `on-develop`, not when work starts.
- **Docs = HTML, not markdown** — edit the page. Every page needs `<link>` `assets/docs.css`, `<nav id="sidebar">`, and `<script src>` `assets/nav.js` (plain `<script src>` only — `fetch` and ES modules are blocked on `file://`). A new page needs a line in [`docs/assets/nav.js`](docs/assets/nav.js) `TREE` or it's unreachable. `docs/mockups/` is standalone.
- **Deploy = Railway** via `railway.json`: runs the migration, starts `floc-web`. Push to `main` deploys. Env vars in the Railway Variables tab, never the repo.

## Security

No secrets, keys, or tokens in the repo. No logging PII or tokens. Degrade without credentials, don't crash. Flag anything touching auth, encryption, PII, or compliance.

## Agent skills

Issues and PRDs are GitHub issues (`gh`) — [issue-tracker](docs/agents/issue-tracker.html) · [domain](docs/agents/domain.html).

| Skill | Does |
|---|---|
| `/to-tickets` | Slices a plan into tracer-bullet issues, each with its blocking edges. |
| `/prioritise-tickets` | Places every unprioritised open issue into the `Priority` stack, and fixes its type label. |
| `/pickup-ticket` | Takes the top startable ticket off the stack and works it to a pushed `develop` commit. |

**The loop:** idea → `/to-tickets` → `/prioritise-tickets` → `/pickup-ticket` → build on `develop`, one commit, `pnpm verify` green → push → tag `on-develop` → pop the stack → batch PR to `main` closes it.
