# AGENTS.md — Floc

Floc is group trip planning, simplified — the travel agent partner for a group: where, when, in what order, and who owes who. Pre-MVP. One pnpm + Turborepo monorepo, one product — do not add another unasked. Work in narrow slices, one ticket at a time. Confirm scope before a big build. Known pitfalls: [`learnings.md`](learnings.md).

**Name.** Write `Floc` in prose and `floc` where a machine reads it (`floc-web`, `floc/`, `FLOC_FILES_DIR`). The name is settled ([ADR-016](docs/adr/decisions.html#adr-016)). The wordmark is `floc` with a pen-blue dot (**floc.**), drawn by `components/system/wordmark.tsx` and the invite OG card.

## Mission first

Before you plan, grill, write a ticket or build, read [mission and values](docs/mission.html) — what Floc is for, who it serves and what it values — and the [decision log](docs/adr/decisions.html). Every choice must fit both. Name the value or ADR a recommendation rests on. If they are silent or an option conflicts with them, ask Aidan; do not guess. A new product decision gets an ADR record; a new value or a change to what Floc is for goes on the mission page.

## Structure

Next.js App Router + Turso (libSQL) + Drizzle + Better Auth.

| Path | Holds |
|---|---|
| `floc/apps/web/src/app/` | Routes. Server Components read; Server Actions (`actions.ts` per folder) write. |
| `floc/apps/web/src/server/` | All SQL. One file per concept — a name that needs "and" is two files. |
| `.../server/freshness.ts` | Maps a changed fact to the pages it makes stale. The only importer of `next/cache`; everything else calls `refresh`. |
| `.../server/api-port/` | The web app's `FlocPort`: the same `server/` modules the pages use. |
| `floc/packages/floc-core/src/` | `@floc/core`: domain rules and words (money, dates, calendar, packing) and the design token values. Pure: no I/O, no imports from an app. |
| `floc/packages/floc-editor/src/` | `@floc/editor`: the notes page editor ([ADR-014](docs/adr/decisions.html#adr-014)) — Tiptap schema, commands and React UI. The web renders it; the phone runs it in an Expo DOM component. Takes a Yjs doc and callbacks; no I/O. |
| `floc/packages/floc-api/src/` | `@floc/api`: the tRPC router every non-web client uses. Declares procedures and input rules; reaches data only through `FlocPort`. |
| `floc/apps/mobile/` | `floc-mobile`: Expo app for iOS and Android. Own UI and version, same [visual language](docs/design/visual-language.html). Shipping: [`SHIPPING.md`](floc/apps/mobile/SHIPPING.md), [`STORE.md`](floc/apps/mobile/STORE.md). |
| `floc/apps/web/src/lib/` | Browser- or Next-bound helpers only (env, theme, tabs, map, auth client). |
| `floc/apps/web/src/components/` | Take data, never fetch. `system/ui.tsx` and `system/client-ui.tsx` are the house design system — use them first. |
| `floc/apps/web/src/db/schema.ts` | Schema of record. The [ERD](docs/architecture/data-model/erd.html) mirrors it — change both together. |
| `docs/` | Local HTML site, no build, gitignored. Open `docs/index.html` from disk. |

Docs: [mission and values](docs/mission.html) · [decision log](docs/adr/decisions.html) · [approach](docs/design/approach.html) · [visual language](docs/design/visual-language.html) · [architecture](docs/architecture/architecture.html) · [ERD](docs/architecture/data-model/erd.html).

## Environment

Windows 11, **Windows PowerShell 5.1** — not pwsh 7, not bash. No `&&`: chain with `;`. Use `Get-ChildItem`, `Remove-Item -Recurse -Force`, `New-Item`, `Get-Content` — never `ls`, `rm -rf`, `touch`, `cat`. Give the user PowerShell, never Unix commands.

## Commands

```bash
pnpm install                      # at the root
pnpm dev                          # turbo run dev (build, typecheck, lint, test work the same way)
pnpm --filter floc-web <task>     # one app only
pnpm run:all / pnpm run:stop      # user's own full loop in two windows (agents use /floc:run)
pnpm fitness                      # layers, dead code, tokens, contrast, bundle, docs
pnpm parity                       # every web/app gap is declared
pnpm verify                       # everything CI runs, locally
pnpm --filter floc-web db:seed    # dev scenarios A + B (`a` or `b` for one, `--reset` to remove)
pnpm --filter floc-web db:reset   # empty local.db and uploads, then seed — same state every time
pnpm --filter floc-web e2e        # Playwright on the .next-verify build, own db on :3100
pnpm --filter floc-mobile maestro # Maestro flows on the emulator, against the dev loop
```

- **`verify` builds into `.next-verify`**, so dev servers can stay up. A bare `build` or `fitness` writes `.next`, which `next dev` owns — stop the servers first (check with `preview_list`, not `ps`). A poisoned `.next` (or OneDrive `EINVAL: readlink`): `pnpm --filter floc-web run clean:next` — the one delete an agent may run.
- **`verify` mirrors CI** ([`verify.sh`](scripts/verify.sh)). Change a check job in `.github/workflows/` → change `verify.sh` in the same commit.
- **End to end.** Playwright ([`e2e/`](floc/apps/web/e2e/)) needs a build (`verify` makes one) and seeds its own database, never `local.db`. Each person signs in once, in `auth.setup.ts` — production allows 3 sign-ins per 10 s. Maestro ([`.maestro/`](floc/apps/mobile/.maestro/)) runs against `/floc:run` with scenario A seeded. There is one flow, `app.yaml`: wipe once, sign in once through the dev sign-in button, then walk the app. Extend it; do not add flows that relaunch. Target a control by `testID` (`id:` in the flow). Maestro is not in CI or `verify` — run it by hand.
- **Git hooks.** `pre-commit` lints staged files and scans for secrets. `commit-msg` checks the subject. There is no pre-push hook: every push goes through `/floc:push`, which runs `verify`. `pnpm hooks:install` re-arms the hooks.
- **New API procedure** → a line in [`parity.json`](scripts/parity/parity.json): does the phone have it, and if not, why. `pnpm parity --fix` writes the mechanical half; you write the `why`. Rules: [`parity.ts`](floc/packages/floc-api/src/parity.ts).
- **Schema change** → `/floc:schema-change`. It is not done until `local.db` has the migration; `db:generate` writes it but applies nothing, and dev fails on `no such column`.
- **Mobile dependency** → `/floc:add-mobile-dep`. Always `npx expo install`, never `pnpm add`: Expo pins a version per SDK, and a mismatch fails at runtime as a red screen, not at install.
- **New route on the phone** → typecheck *after* Metro starts. expo-router rewrites `.expo/types/router.d.ts` at start; before that, typecheck passes against the old routes.

## Invariants

Never break these. Code comments cite them by number (`rule 5`), so keep the numbers. [Architecture](docs/architecture/architecture.html) explains each — read it before you change behaviour.

1. **Money is never a float.** Integer minor units; only `@floc/core/money` does maths on it.
2. **`expense_split` rows are snapshots.** Never recalculated. An edit rewrites the expense and its splits in one transaction.
3. **The itinerary is day-first.** Store `day` and `day_event`. A stop is consecutive days with the same `overnight_place_id` — never a `stop` table.
4. **No lifecycle state.** Trip state comes from the data present — no status enum, flag, column or tab gate.
5. **Trip access is enumeration-proof.** Load a trip only through `requireTripAccess` (web) or `tripProcedure` (API). A non-member gets the same answer as a trip that does not exist.
6. **Exactly four admin powers:** remove a member, promote, delete or archive the trip, reset the invite link. Everything else, leaving included, is open to any member. Gate with `assertAdmin`.
7. **Last write wins.** No optimistic locking; `last_modified_at` is for debugging only.
8. **Soft-delete everywhere.** Every read *and write* filters `deleted_at IS NULL`. The few exceptions (`ensureDays`, `addMember`) explain themselves in comments. A notes page a member archives is deleted for good after 7 days ([ADR-017](docs/adr/decisions.html#adr-017)).
9. **A trip may have no dates.** `start_date` and `end_date` are nullable; undated is never an error.
10. **No timezones.** Dates are `YYYY-MM-DD`; event times are local to the trip. Never store an offset.
11. **Degrade, do not crash, without credentials.** A missing provider key (mail, Google, maps, stores) hides or reduces the feature — never a throw.

## Conventions

- Server Components by default. Mutations are Server Actions in `actions.ts` — never inline `"use server"` closures.
- **Nothing in `app/` imports `@/db`.** SQL lives only in `server/`.
- Validate at the door: dates through `@floc/core/dates/dates`, free text through `@floc/core/text/text`. A rejection is a form error, never a throw.
- British English, sentence case, real content — never lorem ipsum.
- **Comments: none by default.** A good name beats a comment. Write one only for a *why* the code cannot show: a non-obvious constraint, an upstream bug, a choice that looks wrong until explained, a gotcha that has bitten. Never restate *what*, never head a function with a summary of itself, never justify code you could delete. Add a ticket number when it carries the why (`#212`). One line beats a block. [`check-comments`](scripts/check-comments.mjs) flags new noise on edit and at commit (`pnpm comments`); a longer comment passes with a ticket number or a leading `Why:`.

## UI and UX

**Web and app share one visual language**, set by [approach](docs/design/approach.html) and [visual language](docs/design/visual-language.html). Read both before UI work. This section lists only what code enforces; the docs own the look.

- **Colours from tokens only** — no hex literals. Token values live in `@floc/core/design/tokens`, not `globals.css`; `pnpm fitness` fails if the two disagree. Status always has a word, never colour or an icon alone.
- **Light and dark use the same token names.** Dark restates values in `:root[data-theme="dark"]`. **No `dark:` variant** — needing one means the token is wrong. The choice lives in `localStorage`, never in a column.
- **No emoji.** Icons are line art: 14×14 `viewBox`, drawn at ~13px, `fill="none"`, `strokeWidth` 1.15–1.25, `stroke="currentColor"`. See [iconography](docs/design/visual-language.html#iconography).
- **If the drawing is clear, say nothing.** Text carries only what the layout cannot. No heading above a heading, no caption that explains the design, no words that repeat what a control shows. Exceptions: what is *missing*, and status.
- **Outside UI libraries** only where building it ourselves would take months, and only if the library accepts our tokens, type and no-emoji rules. Notes runs on the headless Tiptap core under our own UI, in `@floc/editor` ([ADR-014](docs/adr/decisions.html#adr-014)).

Differences between the surfaces are written once, in the docs — do not repeat them here:

| Surface | House components | Surface rules |
|---|---|---|
| Web | `floc/apps/web/src/components/system/ui.tsx` · `client-ui.tsx` | The baseline both docs describe. |
| App | `floc/apps/mobile/src/components/system/ui.tsx` · `glyphs.tsx` | [On a phone, cut it back](docs/design/visual-language.html#on-a-phone); [drawn tighter](docs/design/approach.html#the-app). |

Use a house component before writing markup. If neither surface has one, the [component inventory](docs/design/visual-language.html#components) says whether it should exist. A rule that fits both surfaces goes in the shared docs, not one app.

## Code standards

- **Single responsibility.** A name that needs "and" is two files.
- **Group by feature, nest freely.** A folder past 20 flat `.ts`/`.tsx` files splits into feature subfolders (`components/trip/`, `server/money/`), which may nest further (`trip/card/`). Prefer many small files. `pnpm fitness` enforces the cap.
- **Dependency inversion at seams.** `@floc/core` stays pure and app-free; `components/` take data and never fetch. Type-only imports across a seam are fine. `pnpm deps:check` enforces this.
- **YAGNI, KISS, SOLID.** Build like a principal engineer and designer: fast, scalable, modular, maintainable.
- **Composition over configuration.** Eight optional props for four cases → several components.
- **Test first.** Red, green, refactor: write the failing test, watch it fail for the right reason, write the least code that passes, then tidy. A bug fix starts with a test that reproduces it. One behaviour per test, through the public interface. Screens and components that need a renderer are exempt; the logic behind them is not — move it somewhere testable. `/floc:tdd` drives the loop.
- **Coverage floor 80%** (lines, functions, branches, statements) on every package; `vitest --coverage` fails below it. Never lower a threshold — add the test.

| Rule | Limit |
|---|---|
| File length | 600 lines (blank and comment lines excluded) |
| Function length | 120 lines (a page's JSX return is exempt) |
| Cyclomatic complexity | 15 per function |
| Component props | about 6 — past that, split |

ESLint enforces all but props. Files over a limit before it existed sit on a dated allowlist in `eslint.config.mjs`. Split the file rather than add to the list.

**Performance:** no client fetch where a server read works; no heavy import behind a rare branch; cap or page every unbounded list (`LIMITS` in `server/limits.ts`). `pnpm --filter floc-web check:bundle` keeps shared First Load JS under budget.

## Out of scope (v1)

Payments between members, POI data and reviews, flight *booking* (deep links only), i18n, advertising, marketing email.

**Analytics and cookie consent land before go-live** ([#368](https://github.com/AidanInceer/Floc/issues/368)). Until then, strictly necessary cookies only. Rules: three categories — strictly necessary, functional, analytics (no ads); nothing non-essential runs or stores before consent; no cookie or stored choice lasts past 12 months. A new or changed cookie or browser-stored value → update the list on `/privacy` in the same commit.

## Workflow

- **Branches.** Two long-lived branches, no feature branches. Work lands on `develop` through `/floc:push` and goes to `main` in batches through `/floc:release`. A hotfix commits straight to `main`; a feature never does.
- **Commits, labels and the Priority stack** are owned by the skills: `/floc:push` (subject, version bump, `Closes`, `on-develop`), `/floc:prioritise-tickets` (labels, stack), `/floc:to-tickets` (blocked-by edges). Never borrow an issue number.
- **Docs are HTML, not markdown** — edit the page.
- **Docs move with the code, in the same commit.** Before `/floc:push`, ask which page the diff makes untrue. `/floc:sync-docs` maps each kind of change to its page and runs `pnpm docs:check`.
- **Deploy is Railway** via `railway.json` (runs the migration, starts `floc-web`). A push to `main` deploys. Env vars live in Railway's Variables tab, never in the repo.

## Real users — hard stop

Production has a few real test users. **Never delete, wipe or overwrite trip or user data** (people, trips, money, files) in production or any shared database: no hard deletes, no destructive migrations, no resets, no scripts that remove rows. Ask first, every time. Resetting and seeding local `local.db` is fine. The one exception: a notes page a member archives is deleted for good after 7 days ([ADR-017](docs/adr/decisions.html#adr-017)).

## Security

No secrets, keys or tokens in the repo. Never log PII or tokens. Flag anything that touches auth, encryption, PII or compliance.

## Agent skills

Issues and PRDs are GitHub issues, driven with `gh`. The skills are the `floc` plugin in [`plugins/floc/`](plugins/floc/), enabled by `.claude/settings.json`. **Claude reads a cached copy.** After editing a skill: bump `version` in `plugins/floc/.claude-plugin/plugin.json`, run `claude plugin update floc@floc --scope project`, then restart the session.

| Skill | Does |
|---|---|
| `/floc:run` | Starts web, Metro, the emulator and the app, then proves each one answers. |
| `/floc:implement-feature` | Builds one feature test-first on web and app; checks parity, UI and docs. |
| `/floc:schema-change` | Changes `schema.ts`, writes the migration, applies it to `local.db`, updates the ERD. |
| `/floc:add-mobile-dep` | Adds a package to the Expo app with the pinned version, rebuilds if native. |
| `/floc:sync-docs` | Finds the doc pages a diff makes untrue, updates them, runs `docs:check`. |
| `/floc:review-docs` | Acts on the marks left in the local docs editor. |
| `/floc:push` | Local work → one verified commit on `develop`, ticket tagged, CI watched. |
| `/floc:release` | `develop` → `main` PR; merges on green checks (asks on a schema migration), then checks tickets, sync and deploy. |
| `/floc:grill` | Grills you 2–4 questions a round, writes the decisions into the ticket, reports the shared understanding, then hands over to `implement-feature`. Never splits unless asked. |
| `/floc:tdd` | Red → green loop: what a good test is, where it goes, the anti-patterns. |
| `/floc:prototype` | Throwaway code that answers one question, in gitignored `floc/wireframe/`, served on :4100 by `pnpm wireframe`. Never in the app, never on a branch, never committed. |
| `/floc:feedback` | Turns what you noticed in a build into tickets, names why it drifted, and fixes the mission page or the decision log. |
| `/floc:to-tickets` | Slices a plan into tracer-bullet issues with blocking edges. |
| `/floc:prioritise-tickets` | Puts unprioritised open issues into the `Priority` stack, fixes type labels. |
| `/floc:pickup-ticket` | Takes the top startable ticket and works it to a pushed `develop` commit. |
| `/floc:seed-dev-db` | Loads dev scenarios A and B next to existing data. |
| `/floc:reset-dev-db` | Backs up, wipes `local.db` and uploads, reseeds with fixed ids, signs back in. |

Agent `floc:ci-babysit` watches CI for one commit, and on red fixes it on `develop`, pushes and watches again (three tries, never weakening a check). `/floc:push` and `/floc:release` start it in the background, in its own worktree.

**Loop:** idea → `/floc:grill` → `/floc:to-tickets` → `/floc:prioritise-tickets` → `/floc:pickup-ticket` → `/floc:push` → `/floc:release` → `/floc:feedback`.
