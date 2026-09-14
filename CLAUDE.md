# CLAUDE.md — Floc

Group-travel planner (where/when/order, who owes who). Pre-MVP. pnpm + Turborepo monorepo, one venture — don't add others unasked. Narrow slices, one ticket at a time; confirm scope before big builds. Pitfalls: [`learnings.md`](learnings.md).

**Name.** `Floc` in prose, lowercase where machines read it (`floc-web`, `floc/`, `FLOC_FILES_DIR`). `Flok` may replace it later — don't half-apply either. Wordmark `floc` + pen dot **floc.** in `app-chrome.tsx` and the invite OG card.

## Structure

Next.js App Router + Turso (libSQL) + Drizzle + Better Auth.

| Path | What |
|---|---|
| `floc/apps/web/src/app/` | Routes. Server Components + Server Actions (`actions.ts` per folder). |
| `floc/apps/web/src/server/` | All SQL. One file per concept; name needs "and" → split. |
| `.../server/freshness.ts` | Fact → stale pages. Only importer of `next/cache`; else call `refresh`. |
| `floc/packages/floc-core/src/` | `@floc/core` — the domain rules and vocabulary (money/dates/calendar/packing) **and the design token values**. Pure, no I/O, imports nothing from the app. |
| `floc/packages/floc-api/src/` | `@floc/api` — the tRPC router every non-web client reads a trip through. Declares procedures and input rules; reaches data only via `FlocPort`, which the host implements. |
| `floc/apps/web/src/server/api-port.ts` | The web app's `FlocPort` — the same `server/` modules the pages use. |
| `floc/apps/mobile/` | `floc-mobile` — Expo (iOS + Android). Own UI and version, same [visual language](docs/design/visual-language.html). Ship: [`SHIPPING.md`](floc/apps/mobile/SHIPPING.md), [`STORE.md`](floc/apps/mobile/STORE.md). |
| `floc/apps/web/src/lib/` | What is left: browser- or Next-bound helpers only (env, theme, tabs, map, auth-client). |
| `floc/apps/web/src/components/` | `ui.tsx`/`client-ui.tsx` = house design system. Reach first. |
| `floc/apps/web/src/db/schema.ts` | Schema of record. Mirrors [ERD](docs/architecture/data-model/erd.html) — change both. |
| `floc/apps/prototype/` | Old, don't extend. |
| `docs/` | Local HTML site, no build. Open `docs/index.html` off disk. |

Docs: [approach](docs/design/approach.html) · [visual language](docs/design/visual-language.html) · [architecture](docs/architecture/architecture.html) · [ERD](docs/architecture/data-model/erd.html).

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
pnpm --filter floc-web db:seed    # dev scenarios A + B (`a`/`b` for one, `--reset` to remove)
pnpm --filter floc-web db:reset   # empty local.db + uploads, then seed — same state every time
pnpm --filter floc-web e2e        # Playwright over the `.next-verify` build, own db on :3100
pnpm --filter floc-mobile maestro # Maestro flows on the emulator, against the dev loop
```

- **End to end.** Playwright ([`e2e/`](floc/apps/web/e2e/)) needs a build first (`verify` does one); it seeds its own database, never `local.db`. Sign in once per person in `auth.setup.ts` — production allows 3 sign-ins per 10 s. Maestro ([`.maestro/`](floc/apps/mobile/.maestro/)) runs against `/floc:run` with scenario A seeded. One flow, `app.yaml`: wipe once, sign in once as a seeded person through the dev sign-in button, then walk the app. Extend it rather than adding flows that relaunch. Target a control by `testID` → `id:`. Not in CI or `verify` — run it by hand.

- **A new API procedure needs a line in [`parity.json`](scripts/parity/parity.json)** saying whether the phone app has it, and why not. `pnpm parity --fix` writes the boring half; the `why` is yours. Rules and tests: [`parity.ts`](floc/packages/floc-api/src/parity.ts).
- [`verify`](scripts/verify.sh) mirrors CI. Change a `.github/workflows/` **check** job → change verify.sh same commit.
- **`verify` builds into `.next-verify`**, so dev servers stay up. A bare `build`/`fitness` still writes `.next`, owned by `next dev` — stop servers first (`preview_list`, not `ps`). Poisoned `.next`: `pnpm --filter floc-web run clean:next` (the one delete an agent may run; also cures OneDrive `EINVAL: readlink`).
- **No pre-push hook** — every push goes through `/floc:push`, which runs `verify`. `pre-commit` lints staged files and scans for secrets; `commit-msg` checks the subject. `pnpm hooks:install` re-arms them.
- **Schema change isn't done until `local.db` has it.** `db:generate` writes the migration but nothing applies it locally → dev dies on `no such column`. Run the new `drizzle/*.sql` against `local.db` in the same slice, before pushing.
- **Mobile deps come from `npx expo install`, never `pnpm add`.** Expo pins a version per SDK; npm's latest is a different one, and the mismatch surfaces as a red screen at runtime, not an install error. Servers down first (a live process holds `node_modules` and the install rolls back). `npx expo install --check` before believing any version.
- **A new native module means a rebuild, a new route means new router types.** `pnpm --filter floc-mobile android` for the first; for the second, expo-router rewrites `.expo/types/router.d.ts` when Metro starts, so typecheck *after* Metro or it passes on the old union.

## Invariants

Never break these — integer money, enumeration-proof trip access, soft-delete on every read and write, trip state derived from data (no lifecycle flags), exactly three admin powers, day-first itinerary (no `stop` table), last-write-wins, nullable dates, no timezones. Each is specified in [architecture](docs/architecture/architecture.html) — read it before changing behaviour.

## Conventions

- Server Components by default; mutations are Server Actions in `actions.ts` — never inline `"use server"` closures.
- **Nothing in `app/` imports `@/db`** — SQL lives only in `server/`.
- Validate at the door: dates via `@floc/core/dates`, free text via `@floc/core/text`. Rejections are form errors, never throws.
- British English, sentence case, real content — never lorem.
- **Comments ruthless** — none by default; a good name beats a line. Write one only for a *why* the code can't show: a non-obvious constraint, an upstream bug, a decision that looks wrong until explained, or a gotcha that has bitten. Never restate *what*, never head a function with a summary of itself, never leave one to justify code you could delete. Ticket pointer where it carries the why (`#212`). One line beats a block. [`check-comments`](scripts/check-comments.mjs) flags new noise on edit and at commit (`pnpm comments` to run it); a longer comment passes with its ticket or a leading `Why:`.

## UI and UX

**Both surfaces share one visual language**, ruled by [approach](docs/design/approach.html) and [visual language](docs/design/visual-language.html) — read them before UI work. Below is only what code enforces; the docs own how it looks.

- **Colours from tokens only** — no hex literals, and token *values* live in `@floc/core/tokens`, not `globals.css`. `pnpm fitness` fails if the two disagree. Status always carries a word, never colour/icon alone.
- **Light + dark, same token names** — dark restates base values in `:root[data-theme="dark"]`. **No `dark:` variant** (means the token is wrong). Choice in `localStorage`, never a column.
- **No emoji** — icons are line-art: 14×14 `viewBox` ~13px, `fill="none"`, `strokeWidth` 1.15–1.25, `stroke="currentColor"`. See [iconography](docs/design/visual-language.html#iconography).
- **If the drawing is clear, say nothing** — text carries only what layout can't. No heading-above-heading, captions decoding the design, or narrating state a control shows. Exceptions: what's *missing*, and status.
- **Outside UI libraries** only where hand-rolling costs months (BlockNote runs Notes), and only if it takes the tokens/type/no-emoji rules.

Surface differences live in the docs, once — **don't restate them here**:

| Surface | House components | Surface rules |
|---|---|---|
| Web | `floc/apps/web/src/components/ui.tsx` · `client-ui.tsx` | The baseline both docs describe throughout; the app is drawn tighter against it. |
| App | `floc/apps/mobile/src/components/ui.tsx` · `glyphs.tsx` | [on a phone, cut it back](docs/design/visual-language.html#on-a-phone); [drawn tighter](docs/design/approach.html#the-app). |

Reach for the house component before writing markup; if neither surface has it, the [component inventory](docs/design/visual-language.html#components) says whether it should exist. A rule that fits both surfaces belongs in the shared docs, not one app.

## Code standards

- **Single responsibility** — name needs "and" → two files.
- **Group by feature, nest freely** — a folder past 20 flat `.ts/.tsx` files splits into feature subfolders (`components/trip/`, `server/money/`); subfolders may nest further (`trip/card/`). Prefer many small files and folders. `pnpm fitness` enforces the cap.
- **Dependency inversion at seams** — `@floc/core` pure and app-free; `components/` take data, never fetch. Type-only imports across a seam OK. `pnpm deps:check` enforces.
- **Follow YAGNI, KISS, SOLID** - you are a principle engineer/designer, who creates performant app/websites which are scalable, modular, maintainable and performant
- **Composability over configuration** — 8 optional props for 4 cases → several components.
- **Test-driven** — red, green, refactor. Write the failing test first, watch it fail for the right reason, write the least code that passes, then tidy. A bug fix starts with a test that reproduces it. One behaviour per test, through the public interface, not the internals. Screens and components that need a renderer are exempt; the logic behind them is not — move it somewhere testable. `/mattpocock-skills:tdd` drives the loop.
- **Coverage floor 80%** (lines, functions, branches, statements) on every package — `vitest --coverage` fails under it. Never lower a threshold to pass; add the test.

| Rule | Limit |
|---|---|
| File length | 600 lines (blank/comment excluded) |
| Function length | 120 lines — page JSX return exempt |
| Cyclomatic complexity | 15 per function |
| Component props | past ~6, split |

`eslint` enforces all but props. Pre-ceiling files on a dated allowlist in `eslint.config.mjs`. Split beats adding a line.

**Performance:** no client fetch where a server read does; no heavyweight import behind a rare branch; cap/page unbounded lists (`LIMITS`). `pnpm check:bundle` holds shared First Load JS under budget.

## Out of scope (v1)

Payments, POI data/reviews, flight *booking* (deep links only), i18n, advertising, marketing email.

**Analytics and cookie consent land before go-live** ([#368](https://github.com/AidanInceer/Floc/issues/368)). Until then only strictly necessary cookies. Rules: three categories — strictly necessary, functional, analytics (no ads); nothing non-essential runs or stores before consent; no cookie or stored choice lasts past 12 months. A new or changed cookie → update the list on `/privacy` same commit.

## Workflow

- **Branches.** Two long-lived, no feature branches. Work lands on `develop` via `/floc:push`, batched to `main` via `/floc:release`. Hotfix = commit straight to `main`. Never commit a feature to `main`.
- **Commits, labels, Priority stack** — the skills own the rules: `/floc:push` (subject, version bump, `Closes`, `on-develop`), `/floc:prioritise-tickets` (labels, stack), `/floc:to-tickets` (blocked-by edges). Never borrow an issue number.
- **Docs = HTML, not markdown** — edit the page.
- **Deploy = Railway** via `railway.json` (runs migration, starts `floc-web`). Push to `main` deploys. Env vars in Railway Variables tab, never the repo.

## Security

No secrets/keys/tokens in the repo. No logging PII or tokens. Flag anything touching auth, encryption, PII, or compliance.

## Agent skills

Issues/PRDs are GitHub issues, driven with `gh`. The skills are the `floc` plugin in [`plugins/floc/`](plugins/floc/), enabled by `.claude/settings.json`. **Claude reads a cached copy** — after editing a skill, bump `version` in `plugins/floc/.claude-plugin/plugin.json`, run `claude plugin update floc@floc --scope project`, then restart the session.

| Skill | Does |
|---|---|
| `/floc:run` | Brings up web, Metro, emulator and app, then proves each answers. |
| `/floc:push` | Local work → one verified commit on `develop`, ticket tagged, CI watched. |
| `/floc:release` | `develop` → `main` PR, merge commit on your yes, then tickets, sync and deploy checked. |
| `/floc:to-tickets` | Slices a plan into tracer-bullet issues with blocking edges. |
| `/floc:prioritise-tickets` | Puts unprioritised open issues into the `Priority` stack, fixes type labels. |
| `/floc:pickup-ticket` | Takes the top startable ticket, works it to a pushed `develop` commit. |
| `/floc:seed-dev-db` | Loads dev scenarios A/B (people, trips, claims, profiles) next to existing data. |
| `/floc:reset-dev-db` | Backs up, wipes `local.db` + uploads, reseeds with fixed ids, signs back in. |

Agent `floc:ci-watch` — watches CI for one SHA; `/floc:push` and `/floc:release` spawn it in the background.

**Loop:** idea → `/floc:to-tickets` → `/floc:prioritise-tickets` → `/floc:pickup-ticket` → `/floc:push` → `/floc:release`.
