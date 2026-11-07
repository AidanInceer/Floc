# AGENTS.md — Floc

Floc is group trip planning, simplified — the travel agent partner for a group: where, when, in what order, and who owes who. Pre-MVP. One pnpm + Turborepo monorepo, one product — do not add another unasked. Work in narrow slices, one ticket at a time. Confirm scope before a big build. Known pitfalls: [`learnings.md`](learnings.md).

**Name.** Write `Floc` in prose and `floc` where a machine reads it (`floc-web`, `floc/`, `FLOC_FILES_DIR`). Settled in [ADR-016](docs/foundation/decisions.html#adr-016). The wordmark (**floc.**, pen-blue dot) is drawn by `components/system/wordmark.tsx` and the invite OG card.

## Mission first

Before you plan, grill, write a ticket or build, read [mission and values](docs/foundation/mission.html) and the [decision log](docs/foundation/decisions.html). Every choice must fit both; name the value or ADR a recommendation rests on. If they are silent or conflict, ask Aidan; do not guess. A new product decision gets an ADR; a new value or a change to what Floc is for goes on the mission page.

## Structure

Next.js App Router + Turso (libSQL) + Drizzle + Better Auth. **Feature → folder map: [`floc/FILES.md`](floc/FILES.md)** — look there before you search. `pnpm deps:check` enforces the seams below.

- `floc/apps/web/src/app/` — routes. Server Components read; Server Actions (`actions.ts` per folder) write.
- `.../src/server/` — all SQL, one file per concept. `server/freshness.ts` maps a changed fact to the pages it makes stale and is the only importer of `next/cache`; everything else calls `refresh`. `server/api-port/` is the web app's `FlocPort`.
- `.../src/db/schema.ts` — schema of record. The [ERD](docs/engineering/data-model.html) mirrors it; change both together.
- `.../src/components/` take data, never fetch. `.../src/lib/` holds browser- or Next-bound helpers only.
- `floc/packages/` — `floc-core` (domain rules, words, token values; pure, no I/O, no app imports), `floc-editor` (notes editor, [ADR-014](docs/foundation/decisions.html#adr-014)), `floc-globe` (paper globe, [ADR-032](docs/foundation/decisions.html#adr-032)), `floc-api` (tRPC router for non-web clients, data only through `FlocPort`). The phone runs editor and globe in an Expo DOM component.
- `floc/apps/mobile/` — Expo app. `floc/marketing/` — marketing visuals, never shipped, posted only by `pnpm marketing publish` ([README](floc/marketing/README.md)).
- `docs/` — HTML site, no build, in the private `AidanInceer/floc-docs` repo. The main checkout holds the clone; every worktree's `docs/` links to it. Open `docs/index.html` from disk; layout in [editing these docs](docs/process/editing-docs.html). `floc/wireframe/` — gitignored mockups on :4100 (`/floc:prototype`).

**Area rules** in [`.claude/rules/`](.claude/rules/) load when Claude touches a matching file; other agents read the one for the folder they edit: [mobile](.claude/rules/mobile.md) · [web e2e](.claude/rules/e2e.md) · [API](.claude/rules/api.md) · [design](.claude/rules/design.md).

Docs: [approach](docs/design/index.html) · [visual language](docs/design/visual-language.html) · [architecture](docs/engineering/index.html).

## Environment

Windows 11, **Windows PowerShell 5.1** — not pwsh 7, not bash. No `&&`: chain with `;`. Use `Get-ChildItem`, `Remove-Item -Recurse -Force`, `New-Item`, `Get-Content` — never `ls`, `rm -rf`, `touch`, `cat`. Give the user PowerShell, never Unix commands.

No `python` and no `sqlite3`: script in `node`, read the database with `db:query`. pnpm hoists packages to the root `node_modules`; an app folder has no `node_modules/.bin`.

## Commands

```bash
pnpm install                      # at the root
pnpm dev                          # turbo run dev (build, typecheck, lint, test work the same way)
pnpm --filter floc-web <task>     # one app only
pnpm run:all / pnpm run:stop      # user's own full loop in two windows (agents use /floc:run)
pnpm fitness                      # layers, dead code, tokens, css, icons, contrast, bundle, docs
pnpm parity                       # every web/app gap is declared
pnpm verify                       # everything CI runs, locally (release profile)
pnpm checks quick                 # only what the diff needs; /floc:push runs it
pnpm workspace:new <name>         # new task worktree in .claude/worktrees, ready to build
pnpm workspace:list               # every worktree: kind, branch, PR, watcher, what it waits on
pnpm workspace:sweep              # remove landed or idle empty worktrees, and branches already on develop
pnpm delivery status              # every running watcher and its PR
pnpm --filter floc-web db:seed    # dev scenarios A + B (`a` or `b` for one, `--reset` to remove)
pnpm --filter floc-web db:reset   # empty local.db and uploads, then seed — same state every time
pnpm --filter floc-web db:trips   # every local trip: id, dates, now/upcoming/past, members — who to sign in as
pnpm --filter floc-web db:query "<select>"  # read local.db; SQLite refuses writes. Never a throwaway libsql script
pnpm --filter floc-web e2e        # Playwright on the .next-verify build, own db on :3100
pnpm --filter floc-mobile maestro # Maestro flows on the emulator, against the dev loop
```

- **`verify` builds into `.next-verify`**, so dev servers can stay up. A bare `build` or `fitness` writes `.next`, which `next dev` owns — stop the servers first (check with `preview_list`, not `ps`). A poisoned `.next` (or OneDrive `EINVAL: readlink`): `pnpm --filter floc-web run clean:next` — the one delete an agent may run.
- **Checks share one definition**, `scripts/checks/manifest.mjs`, used locally and by CI: `quick` before a push, `pr` on a PR to develop, `release` on develop and on PRs to main. A pass is reused only for the same code, base, runtime and settings. Change a check → change the manifest; `ci.yml` only picks the profile.
- **Git hooks** are per worktree: `pre-commit` lints staged files, checks comments and scans for secrets; `commit-msg` checks the subject. `pnpm workspace:prepare` installs them.
- **Data model change → ask Aidan first, every time.** A table or column added, removed, renamed or retyped, or a constraint or index changed: stop, say what changes and why, and wait for a yes before you touch `schema.ts`. Name it again in the push and release reports.
- **Schema change** → `/floc:schema-change`. Not done until this checkout's database has the migration; `db:generate` writes it but applies nothing, and dev fails on `no such column`.
- **Mobile dependency** → `/floc:add-mobile-dep`. Always `npx expo install`, never `pnpm add`.

## Invariants

Never break these. Code comments cite them by number (`rule 5`), so keep the numbers. [Architecture](docs/engineering/index.html) explains each — read it before you change behaviour.

1. **Money is never a float.** Integer minor units; only `@floc/core/money` does maths on it.
2. **`expense_split` rows are snapshots.** Never recalculated. An edit rewrites the expense and its splits in one transaction.
3. **The itinerary is day-first.** Store `day` and `day_event`. A stop is consecutive days with the same `overnight_place_id` — never a `stop` table.
4. **No lifecycle state.** Trip state comes from the data present — no status enum, flag, column or tab gate.
5. **Trip access is enumeration-proof.** Load a trip only through `requireTripAccess` (web) or `tripProcedure` (API). A non-member gets the same answer as a trip that does not exist.
6. **Exactly four admin powers:** remove a member, promote, delete or archive the trip, reset the invite link. Everything else, leaving included, is open to any member. Gate with `assertAdmin`.
7. **Last write wins.** No optimistic locking; `last_modified_at` is for debugging only.
8. **Soft-delete everywhere.** Every read *and write* filters `deleted_at IS NULL`. The few exceptions (`ensureDays`, `addMember`) explain themselves in comments. A notes page a member archives is deleted for good after 7 days ([ADR-017](docs/foundation/decisions.html#adr-017)).
9. **A trip may have no dates.** `start_date` and `end_date` are nullable; undated is never an error.
10. **No timezones.** Dates are `YYYY-MM-DD`; event times are local to the trip. Never store an offset.
11. **Degrade, do not crash, without credentials.** A missing provider key (mail, Google, maps, stores) hides or reduces the feature — never a throw.

## Conventions

- Server Components by default. Mutations are Server Actions in `actions.ts` — never inline `"use server"` closures.
- **Nothing in `app/` imports `@/db`.** SQL lives only in `server/`.
- Validate at the door: dates through `@floc/core/dates/dates`, free text through `@floc/core/text/text`. A rejection is a form error, never a throw.
- British English, sentence case, real content — never lorem ipsum.
- **Comments: none by default.** Write one only for a *why* the code cannot show — a non-obvious constraint, an upstream bug, a choice that looks wrong until explained. Never restate *what*. Add a ticket number when it carries the why (`#212`). [`check-comments`](scripts/check-comments.mjs) flags noise on edit and at commit; a longer comment passes with a ticket number or a leading `Why:`.

## UI and UX

**Before any UI work — web, phone, mockup or marketing — read the [design card](.claude/rules/design.md).** It is the checklist a screen must pass; Claude loads it automatically when it touches UI files or mockups. The reasons live in [approach](docs/design/index.html) and [visual language](docs/design/visual-language.html); the visual language wins.

- **Tokens only.** Values live in `@floc/core/design/tokens` — no hex literal, no bare radius. Light and dark share token names; no `dark:` variant. The theme choice lives in `localStorage`, never in a column.
- **`pnpm design:check`** (part of `fitness`) blocks a new bare radius, depth shadow, grey hover, approximate money, placeholder or emoji. Fix the finding; never raise `scripts/design/baseline.json`.
- **Outside UI libraries** only where building it ourselves would take months, and only if the library accepts our tokens, type and no-emoji rules.
- **Before calling UI work done,** walk the whole task ([journey review](docs/design/index.html#journey-review)) and ask the `floc:design-review` agent for a fresh look. Report any surface or state not verified.

## Code standards

- **Single responsibility.** A name that needs "and" is two files.
- **Group by feature, nest freely.** A folder past 20 flat `.ts`/`.tsx` files splits into feature subfolders, which may nest further. Prefer many small files.
- **Dependency inversion at seams.** `@floc/core` stays pure and app-free; `components/` never fetch. Type-only imports across a seam are fine.
- **YAGNI, KISS, SOLID. Composition over configuration:** eight optional props for four cases → several components. About 6 props per component — past that, split.
- **Test first** (`/floc:tdd`). Red, green, refactor. A bug fix starts with a test that reproduces it. One behaviour per test, through the public interface. Components that need a renderer are exempt; the logic behind them is not — move it somewhere testable.
- **Coverage floor 80%** on every package. Never lower a threshold — add the test.
- **Limits:** file 600 lines, function 120 (a page's JSX return is exempt), complexity 15. ESLint enforces them. Over a limit, split the file; never add to the dated allowlist in `eslint.config.mjs`.
- **Performance:** no client fetch where a server read works; no heavy import behind a rare branch; cap or page every unbounded list (`LIMITS` in `server/limits.ts`). `check:bundle` keeps shared First Load JS under budget.

## Out of scope (v1)

Payments between members, POI data and reviews, flight *booking* (deep links only), i18n, advertising, marketing email.

**Analytics and cookie consent land before go-live** ([#368](https://github.com/AidanInceer/Floc/issues/368)). Until then, strictly necessary cookies only. Three categories — strictly necessary, functional, analytics (no ads); nothing non-essential runs or stores before consent; no cookie or stored choice lasts past 12 months. A new or changed cookie or browser-stored value → update the list on `/privacy` in the same commit.

## Workflow

- **One task, one worktree.** Shaping (`/floc:grill`, tickets, `/floc:prototype` in `floc/wireframe`) happens in the main checkout. Building never does: `pnpm workspace:new <name>` (or `/floc:pickup-ticket`) makes `.claude/worktrees/<name>` on `feature/<name>` from `origin/develop`, with its own ports, seeded database, uploads, hooks and the docs link. All edits, checks and commits for that task stay there, in one session; the next task gets its own worktree and session. A hook blocks Edit and Write on repo files in the main checkout, and a session-start brief says if the main checkout or the cached skills are stale.
- **Preview a worktree** with `pnpm workspace:start web` in the background, then `preview_start` with the `url` from `pnpm workspace:status`. Never edit the main checkout's `.claude/launch.json`; every session reads it.
- **Branches.** `feature/*`, `fix/*`, `chore/*` → PR to `develop`. `develop` → `main` only through `/floc:release`. `hotfix/*` starts from `main` and PRs to `main`. Nothing pushes to `develop` or `main` directly. GitHub rules require the checks on `main`; on `develop` the watcher merges only on green checks. GitHub deletes a PR's branch when it merges.
- **Push.** `/floc:push` runs `pnpm delivery publish`: commit, merge the latest develop in, quick checks, doc pages to floc-docs, PR to develop with auto-merge, and a watcher. Then the session ends its turn — no agent waits on CI. Never publish when the user asked for local review only.
- **Watcher and clean-up.** The watcher is a plain script run by Task Scheduler, so it works whichever app started it. It merges when checks pass, settles lockfile conflicts, waits for develop CI, then removes the worktree and its branch. A code conflict or red check stops it with a Windows notification. `workspace:new` and `/floc:push` sweep any landed worktree it missed, and subagent or release worktrees with nothing of their own. A worktree with unsaved or unlanded work, or a running watcher, is never removed.
- **Parallel work.** Each worktree lands on its own as soon as its checks pass; develop does not make a PR re-test after other merges. The full checks after each merge catch combined breaks. Conflicts are merged in, never rebased, so no force push.
- **Release.** `/floc:release` sets one version (minor for any `feat`, else patch), opens `release/<version>` → main, and its watcher confirms `floc.live/api/health` reports the merge commit before calling it live. Schema migrations wait for Aidan's yes.
- **Commit subject.** `#<issue|no-ticket>: <feat|fix|docs|refactor|chore|test>: <description>`, no version. Use only a ticket picked up in this session or given in chat; a ticket subject needs its matching `Closes AidanInceer/Floc#<issue>` line.
- **Docs are HTML, not markdown**, and move with the code: `/floc:sync-docs` edits the pages the diff makes untrue, and `/floc:push --docs` commits and pushes those pages to floc-docs.
- **Design review** once per UI diff: the `floc:design-review` agent, recorded with `pnpm delivery review`. Publish refuses a UI diff without it.
- **Deploy is Railway** via `railway.json`. A merge to `main` deploys. Env vars live in Railway's Variables tab, never in the repo.

## Working and reporting

Aidan asks, the agent builds, then reports once. Session noise makes it hard to see what happened.

- **Work silently.** No progress updates, no narration between tool calls, no plan restated in chat. Message only when finished, blocked, or a decision is needed.
- **Final report: super concise.** A few bullets, one per piece of work, each with its checked state — `local, uncommitted` · `local` · `PR open` · `PR needs you` · `on develop` · `release PR open` · `live` · `not checked` — then one `Next:` line if Aidan must act. No recap, no steps taken, no file lists. Add screenshots when the work is visual.
- **Say only what is checked.** "Live" only after the health or watcher check. A blocker or failed check keeps its full error. Always name a data model change and any surface not verified.
- **Long reports are the deliverable.** An audit, security or vulnerability review, retro or research report is written in full.
- A subagent reports to its parent the same way. The `/floc:push`, `/floc:release` and `/floc:implement-feature` reports end in this format.

## Real users — hard stop

Production has a few real test users. **Never delete, wipe or overwrite trip or user data** (people, trips, money, files) in production or any shared database: no hard deletes, no destructive migrations, no resets, no scripts that remove rows. Ask first, every time. Resetting and seeding local `local.db` is fine. The one exception: a notes page a member archives is deleted for good after 7 days ([ADR-017](docs/foundation/decisions.html#adr-017)).

## Security

No secrets, keys or tokens in the repo. Never log PII or tokens. Flag anything that touches auth, encryption, PII or compliance.

## Agent skills

Issues and PRDs are GitHub issues, driven with `gh`. Skills are the `floc` plugin in [`plugins/floc/`](plugins/floc/); each skill's description says when to use it. **Claude reads a cached copy:** after editing a skill, bump `version` in `plugins/floc/.claude-plugin/plugin.json`, run `claude plugin update floc@floc --scope project`, then restart the session.

- **Loop:** idea → `/floc:grill` → `/floc:to-tickets` → `/floc:prioritise-tickets` → `/floc:pickup-ticket` → `/floc:push` → `/floc:release` → `/floc:feedback`.
- **Build:** `/floc:implement-feature`, `/floc:tdd`.
- **Dev loop and data:** `/floc:run`, `/floc:seed-dev-db`, `/floc:reset-dev-db`, `/floc:schema-change`, `/floc:add-mobile-dep`.
- **Docs and design:** `/floc:sync-docs`, `/floc:review-docs`, `/floc:prototype`, `/floc:audit`, `/floc:marketing` (never publishes unasked).
- **Other:** `/floc:improve-codebase-architecture`, `/floc:rotate-secrets`, `/floc:retro` (user-run only; edits nothing until asked).
- Agent `floc:ci-babysit` fixes a red check after a watcher reports it, through a PR; never started for green work.
- Agent `floc:design-review` gives a UI change a fresh-eyes check against the design card and screenshots; it edits nothing. `/floc:implement-feature` and `/floc:push` start it on any UI diff.

**Phases.** The `Priority` stack runs in three phases, one `phase:N` label per ticket: 1 product complete, 2 go-live readiness, 3 after go-live. A phase finishes before the next starts. `grilling` is intentional — the alignment step with Aidan before a build.
