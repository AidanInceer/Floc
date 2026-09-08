# CLAUDE.md — Floc

Group-travel planner (where/when/order, who owes who). Pre-MVP. pnpm + Turborepo monorepo, one venture — don't add others unasked. Narrow slices, one ticket at a time; confirm scope before big builds. Pitfalls: [`learnings.md`](learnings.md).

**Name.** `Floc` in prose, lowercase where machines read it (`floc-web`, `floc/`, `FLOC_FILES_DIR`). `Flok` may replace it later — don't half-apply either. Wordmark `floc` + pen dot **floc.** in `app-chrome.tsx` and the invite OG card.

## Structure

Next.js App Router + Turso (libSQL) + Drizzle + Better Auth.

| Path | What |
|---|---|
| `floc/apps/web/src/app/` | Routes. Server Components + Server Actions (`actions.ts` per folder). |
| `floc/apps/web/src/server/` | All SQL + soft-delete filtering. One file per concept; name needs "and" → split. |
| `.../server/freshness.ts` | Fact → stale pages. Only importer of `next/cache`; else call `refresh`. |
| `floc/packages/floc-core/src/` | `@floc/core` — the domain rules and vocabulary (money/dates/calendar/packing) **and the design token values**. Pure, no I/O, imports nothing from the app. |
| `floc/packages/floc-api/src/` | `@floc/api` — the tRPC router every non-web client reads a trip through. Declares procedures and input rules; reaches data only via `FlocPort`, which the host implements. |
| `floc/apps/web/src/server/api-port.ts` | The web app's `FlocPort` — the API's data access, built from the same `server/` modules the pages use. |
| `floc/apps/mobile/` | `floc-mobile` — Expo (iOS + Android). Own UI, own version. [`SHIPPING.md`](floc/apps/mobile/SHIPPING.md) decides store build vs EAS Update; [`STORE.md`](floc/apps/mobile/STORE.md) is the submission checklist. |
| `floc/apps/web/src/lib/` | What is left: browser- or Next-bound helpers only (env, theme, tabs, map, auth-client). |
| `floc/apps/web/src/components/` | `ui.tsx`/`client-ui.tsx` = house design system. Reach first. |
| `floc/apps/web/src/db/schema.ts` | Schema of record. Mirrors [ERD](docs/data-model/erd.html) — change both. |
| `floc/apps/prototype/` | Old, don't extend. |
| `floc/.scratch/floc-v1/decisions/` | One file per decision, named for its ticket. Read before changing behaviour. |
| `docs/` | Local HTML site, no build. Open `docs/index.html` off disk. |

Docs: [approach](docs/design/approach.html) · [visual language](docs/design/visual-language.html) · [architecture](docs/architecture/architecture.html) · [ERD](docs/data-model/erd.html).

## Environment

Windows 11, **Windows PowerShell 5.1** — not pwsh 7, not bash. No `&&`, chain with `;`. No `ls`/`rm -rf`/`touch`/`cat` — use `Get-ChildItem`, `Remove-Item -Recurse -Force`, `New-Item`, `Get-Content`. Hand the user PowerShell, never Unix.

## Commands

```bash
pnpm install                     # root
pnpm dev                         # turbo run dev (build|typecheck|lint|test likewise)
pnpm --filter floc-web <task>    # scope to app
pnpm fitness                     # layers, dead code, tokens, contrast, bundle
pnpm parity                      # the web/app gap is declared, not forgotten
pnpm verify                      # everything CI runs, locally
```

- **A new API procedure needs a line in [`parity.json`](scripts/parity/parity.json)** saying whether the phone app has it, and why not. `pnpm parity --fix` writes the boring half; the `why` is yours. Rules and tests: [`parity.ts`](floc/packages/floc-api/src/parity.ts).
- [`verify`](scripts/verify.sh) mirrors CI. Change a `.github/workflows/` **check** job → change verify.sh same commit. `sync-develop.yml` has no check, moves alone.
- **Stop dev server before anything that builds.** `verify`/`build`/`fitness` write `.next`, owned by `next dev`; building over it corrupts chunks. Fix: `pnpm --filter floc-web run clean:next` (the one delete an agent may run; also cures OneDrive `EINVAL: readlink`). Check with `preview_list`, not `ps`.
- **No pre-push hook** — run `pnpm verify` by hand before **every** push, `develop` included.
- **Schema change isn't done until `local.db` has it.** `db:generate` writes the migration but nothing applies it locally → dev dies on `no such column`. Run the new `drizzle/*.sql` against `local.db` in the same slice, before pushing.
- **Mobile deps come from `npx expo install`, never `pnpm add`.** Expo pins a version per SDK; npm's latest is a different one, and the mismatch surfaces as a red screen at runtime, not an install error. Servers down first (a live process holds `node_modules` and the install rolls back). `npx expo install --check` before believing any version.
- **A new native module means a rebuild, a new route means new router types.** `pnpm --filter floc-mobile android` for the first; for the second, expo-router rewrites `.expo/types/router.d.ts` when Metro starts, so typecheck *after* Metro or it passes on the old union.

## Non-negotiables

1. **Money never a float** — integer minor units; `parseMoney`/`computeSplits`/`formatMoney` only.
2. **`expense_split` rows = snapshots**, never recalculated; edit rewrites expense + splits in one transaction.
3. **Itinerary day-first** — store `day`/`day_event`; a "stop" derives from consecutive days sharing `overnight_place_id`. Never add a `stop` table.
4. **No lifecycle state** — trip state derives from data present; no enum/flag/column/tab gating.
5. **Enumeration-proof access** — load a trip only via `requireTripAccess`; non-member gets the same response as nonexistent.
6. **Admin powers = exactly four**: invite, kick, promote, delete/archive. Else (incl. leaving) = any member. Gate with `assertAdmin`.
7. **Last-write-wins** — no optimistic locking; `last_modified_at` is debug-only.
8. **Soft-delete everywhere** — every read *and write* filters `isNull(table.deletedAt)`. Three exceptions (`ensureDays`, `applyTripWindow`, `addMember`) — see comments.
9. **A trip may have no dates** — nullable `start_date`/`end_date`; undated is never an error.
10. **No timezones** — dates are `YYYY-MM-DD`, event times local to the itinerary. Never persist an offset.
11. **Degrade, don't crash, without credentials** — missing provider (Nominatim/Resend/Google) → reduced feature, never a throw.

## Conventions

- Server Components by default; mutations are Server Actions in `actions.ts` — never inline `"use server"` closures.
- **Nothing in `app/` imports `@/db`** — SQL lives only in `server/`.
- Validate at the door: dates via `@floc/core/dates`, free text via `@floc/core/text`. Rejections are form errors, never throws.
- **Colours from tokens only** — no hex literals, and token *values* live in `@floc/core/tokens`, not `globals.css`. `pnpm fitness` fails if the two disagree. Status always carries a word, never colour/icon alone.
- **Light + dark, same token names** — dark restates base values in `:root[data-theme="dark"]`. **No `dark:` variant** (means the token is wrong). Choice in `localStorage`, never a column.
- **No emoji** — icons are line-art: 14×14 `viewBox` ~13px, `fill="none"`, `strokeWidth` 1.15–1.25, `stroke="currentColor"`.
- **Outside UI libraries** only where hand-rolling costs months (BlockNote runs Notes), and only if it takes the tokens/type/no-emoji rules.
- **If the drawing is clear, say nothing** — text carries only what layout can't. No heading-above-heading, captions decoding the design, or narrating state a control shows. Exceptions: what's *missing*, and status.
- **On the app, cut harder** — same rules, no browser slack. Prefer the glyph alone where the word is one press away and is the accessible label; don't spend a labelled row on a question with a right default (ride the line it belongs to); two short controls share a line; short labels, the section heading carries the subject. Never a dead control with a sentence explaining why — make it work or don't draw it. Check overflow on the device.
- British English, sentence case, real content — never lorem.
- Read [approach](docs/design/approach.html) + [visual language](docs/design/visual-language.html) before UI/UX work — full visual language lives there.
- **Comments ruthless** — only *why* + ticket pointer, or a real gotcha; never *what*. One line beats a block.

## Code standards

- **Single responsibility** — name needs "and" → two files.
- **Dependency inversion at seams** — `@floc/core` pure and app-free; `components/` take data, never fetch; only `server/` opens the DB. Type-only imports across a seam OK. `pnpm deps:check` enforces.
- **YAGNI** — no abstraction/option/knob without a second call site today.
- **Composability over configuration** — 8 optional props for 4 cases → several components.

| Rule | Limit |
|---|---|
| File length | 600 lines (blank/comment excluded) |
| Function length | 120 lines — page JSX return exempt |
| Cyclomatic complexity | 15 per function |
| Component props | past ~6, split |

`eslint` enforces all but props. Pre-ceiling files on a dated allowlist in `eslint.config.mjs`. Split beats adding a line.

**Performance:** Server Components unless a client is needed; no client fetch where a server read does; no heavyweight import behind a rare branch; cap/page unbounded lists (`LIMITS`). `pnpm check:bundle` holds shared First Load JS under budget.

## Out of scope (v1)

Payments, POI data/reviews, flight *booking* (deep links only), i18n, analytics, consent UI, marketing email, push notifications.

## Workflow

- **Branching.** Two long-lived branches, no feature branches. Work lands on `develop`, one commit per ticket, `verify` green before every push. `develop` → `main` in batches via PR, **merge commit** — never squash/rebase. `main` deploys → only ever a merge commit or hotfix. Hotfix = commit straight to `main`; [`sync-develop.yml`](.github/workflows/sync-develop.yml) merges it back. Never commit a feature to `main`.
- **Commit subject:** `<version> #<issue>: <type>: <description>` (e.g. `0.4.0 #93: feat: split the profile`). Bump `floc/apps/web/package.json` same commit (minor=feat, patch=fix). Body ends `Closes AidanInceer/Floc#<n>`. Types: `feat|fix|docs|refactor|chore|test`. No-ticket work uses literal `#no-ticket`, drops `Closes`. Never invent/borrow a number — a wrong `Closes` shuts someone's issue.
- **Ticket state.** `Closes` fires only on `main`, so a `develop` issue stays open until the batch merges — label **`on-develop`** the moment its commit is pushed. Parked work gets **`future-work`**.
- **Ticket labels.** One type label: `type:feat` | `type:fix` | `type:refinement`. State labels on top: `wayfinder:grilling`, `on-develop`, `future-work`. Blocked-by edges in the body under `## Blocked by` as `#<n>`, never a label. A ticket never sits above its blocker.
- **Priority stack.** Issue titled **`Priority`** in `AidanInceer/Floc` holds the ordered backlog in its body; top line = next ticket. Never worked on, never closed. A ticket leaves when tagged `on-develop`.
- **Docs = HTML, not markdown** — edit the page. Each needs `<link>` `assets/docs.css`, `<nav id="sidebar">`, `<script src>` `assets/nav.js` (plain `<script src>` only — `fetch`/ES modules blocked on `file://`). New page needs a line in [`nav.js`](docs/assets/nav.js) `TREE` or it's unreachable. `docs/mockups/` standalone.
- **Deploy = Railway** via `railway.json` (runs migration, starts `floc-web`). Push to `main` deploys. Env vars in Railway Variables tab, never the repo.

## Security

No secrets/keys/tokens in the repo. No logging PII or tokens. Degrade without credentials, don't crash. Flag anything touching auth, encryption, PII, or compliance.

## Agent skills

Issues/PRDs are GitHub issues, driven with `gh`.

| Skill | Does |
|---|---|
| `/to-tickets` | Slices a plan into tracer-bullet issues with blocking edges. |
| `/prioritise-tickets` | Puts unprioritised open issues into the `Priority` stack, fixes type labels. |
| `/pickup-ticket` | Takes the top startable ticket, works it to a pushed `develop` commit. |

**Loop:** idea → `/to-tickets` → `/prioritise-tickets` → `/pickup-ticket` → build on `develop`, one commit, `verify` green → push → tag `on-develop` → pop stack → batch PR to `main` closes it.
