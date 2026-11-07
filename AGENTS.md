# AGENTS.md — Floc

Floc is group trip planning, simplified: where, when, in what order, and who owes who. Pre-MVP. One pnpm + Turborepo monorepo, one product — add no other unasked. Narrow slices, one ticket at a time; confirm scope before a big build. Write `Floc` in prose, `floc` where a machine reads it. Pitfalls: [`learnings.md`](learnings.md).

**Mission first.** Before you plan, grill, ticket or build, read [mission](docs/foundation/mission.html) and the [decision log](docs/foundation/decisions.html). Name the value or ADR a recommendation rests on. Silent or conflicting → ask Aidan. A new product decision gets an ADR. Code cites the invariants, ADR-001 to ADR-011, as `rule n`.

## Structure

Next.js App Router, Turso (libSQL), Drizzle, Better Auth; Expo for the phone. **Feature → folder map: [`floc/FILES.md`](floc/FILES.md)** — look there before you search. Layers: [architecture](docs/engineering/index.html); `pnpm deps:check` enforces them. `docs/` is HTML with no markdown source, a link to the private `AidanInceer/floc-docs` clone. Area rules in [`.claude/rules/`](.claude/rules/) load by path; other agents read the one for the folder they edit.

## Environment

Windows 11, **Windows PowerShell 5.1** — not pwsh 7, not bash. No `&&`: chain with `;`. Give the user PowerShell, never Unix commands. No `python`, no `sqlite3`: script in `node`.

## Commands

```bash
pnpm workspace:new <name>                    # task worktree, ready to build
pnpm checks quick                            # what the diff needs
pnpm verify                                  # everything CI runs
pnpm --filter floc-web db:query "<select>"   # read local.db
```

**Data model change → ask Aidan first, every time.** Any table, column, constraint or index: say what and why, wait for a yes, then `/floc:schema-change`. Name it in push and release reports.

## Comments

None by default. Write one only for a *why* the code cannot show — a non-obvious constraint, an upstream bug, a choice that looks wrong until explained. Never restate *what*. Add a ticket number when it carries the why (`#212`). A hook flags noise; a longer comment passes with a ticket number or a leading `Why:`.

## UI and UX

Before any UI work — web, phone, mockup or marketing — read the [design card](.claude/rules/design.md). Tokens only; no outside UI library unless building it would take months.

## Code standards

- **Single responsibility.** A name that needs "and" is two files. Group by feature, nest freely; split a folder past 20 flat files.
- **Dependency inversion at seams.** `@floc/core` stays pure; components never fetch.
- **YAGNI, KISS, composition over configuration.** About 6 props per component — past that, split.
- **Test first** (`/floc:tdd`). A bug fix starts with a failing test. One behaviour per test, through the public interface; logic behind a component moves somewhere testable.
- **Never lower a limit.** Coverage 80%, file 600 lines, function 120, complexity 15. Fix the code; never raise a threshold, a baseline or the ESLint allowlist.
- **Performance never gets worse.** A change must not slow the site: server reads over client fetches, no heavy import behind a rare branch, every unbounded list capped (`LIMITS` in `server/limits.ts`).

## Workflow

- **One task, one worktree.** Shape (`/floc:grill`, tickets, `/floc:prototype`) in the main checkout; build only in `pnpm workspace:new <name>`. Preview it: `pnpm workspace:start web` in the background, then `preview_start` with the `url` from `pnpm workspace:status`. Never edit the main checkout's `.claude/launch.json`.
- **Branches:** `feature/*`, `fix/*`, `chore/*` → PR to `develop`; `develop` → `main` only through `/floc:release`; `hotfix/*` from and to `main`. Never push to either directly; merge conflicts in, never rebase.
- **Ship** with `/floc:push`, then end the turn — a watcher owns CI. Never publish when asked for local review only. Docs move with the code (`/floc:sync-docs`).
- **Commit subject:** `#<issue|no-ticket>: <feat|fix|docs|refactor|chore|test>: <description>`. Only a ticket picked up this session or given in chat; it needs a `Closes AidanInceer/Floc#<issue>` line.

## Working and reporting

- **Work silently.** No progress updates or narration. Message only when finished, blocked, or a decision is needed.
- **Final report:** a few bullets, one per piece of work, each with its checked state — `local, uncommitted` · `local` · `PR open` · `PR needs you` · `on develop` · `release PR open` · `live` · `not checked` — then one `Next:` line if Aidan must act. Screenshots for visual work.
- **Say only what is checked.** "Live" only after the health or watcher check. Failed checks keep their full error. Always name a data model change and any surface not verified.
- Audits, reviews, retros and research reports are the deliverable — write them in full.

## Real users — hard stop

Production has real test users. **Never delete, wipe or overwrite trip or user data** in production or any shared database — no hard deletes, destructive migrations, resets or row-removing scripts. Ask first, every time. Local `local.db` is fine.

## Security

No secrets in the repo; env vars live in Railway. Never log PII or tokens. Flag anything touching auth, encryption, PII or compliance.

## Agent skills

Skills are the `floc` plugin in [`plugins/floc/`](plugins/floc/). Claude reads a cached copy: after editing a skill, bump `version` in `plugins/floc/.claude-plugin/plugin.json`, run `claude plugin update floc@floc --scope project`, restart the session.

Loop: `/floc:grill` → `/floc:to-tickets` → `/floc:prioritise-tickets` → `/floc:pickup-ticket` → `/floc:push` → `/floc:release`. The `Priority` stack runs in phases (`phase:N`); one finishes before the next. `grilling` is intentional — never skip it.
