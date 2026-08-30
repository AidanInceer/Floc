# CLAUDE.md — Floc (venture)

Venture rules. Win inside `floc/`; hub [`CLAUDE.md`](../../CLAUDE.md) covers the rest. Pitfalls: [`../../learnings.md`](../../learnings.md).

## What it is

Group-travel planner: friends deciding where/when/order, who owes who. Pre-MVP. Stack: **Next.js App Router + Turso (libSQL) + Drizzle + Better Auth** (`apps/web`). `apps/prototype` superseded — don't extend.

## Structure

| Where | What |
|---|---|
| `apps/web/src/app/` | Routes. Server Components + Server Actions (`actions.ts` per folder). |
| `apps/web/src/server/` | Query aggregates (`itinerary`, `ideas`, `money`, `trips`, `roster`, `invites`, `availability`, `notes`…) — owns all SQL + soft-delete filtering. One file per concept; name needs an "and" → split (#242). |
| `apps/web/src/server/freshness.ts` | Fact → stale pages (#241). Only importer of `next/cache`; else call `refresh`. |
| `apps/web/src/lib/` | Pure helpers (money, dates, calendar) — no I/O. |
| `apps/web/src/components/` | `ui.tsx`/`client-ui.tsx` = house design system — reach first. |
| `apps/web/src/db/schema.ts` | Schema of record. Mirrors [`docs/data-model/erd.html`](../../docs/data-model/erd.html) — change both. |
| `docs/` | Local HTML site (`docs/index.html`), no build. Approach, visual language, vocab, backlog. |
| `.scratch/floc-v1/` | One file per ticket/decision (`map.md` = index). Read relevant ticket before changing behaviour. |

## Non-negotiables

1. **Money never a float.** Integer minor units; `parseMoney`/`computeSplits`/`formatMoney` only.
2. **`expense_split` rows = snapshots**, never recalculated — edit rewrites expense + splits in one transaction.
3. **Itinerary day-first.** `day`/`day_event` stored; a "stop" = derived from consecutive days sharing `overnight_place_id`. Never add a `stop` table.
4. **No lifecycle state.** Trip state derives from data present — no enum/flag/column, no tab gating.
5. **Enumeration-proof access.** Load trip only via `requireTripAccess` — non-member = nonexistent trip, same response.
6. **Admin powers = exactly four**: invite, kick, promote, delete/archive. Else (incl. leaving) any member. Gate with `assertAdmin`.
7. **Last-write-wins.** No optimistic locking/version checks. `last_modified_at` = debug-only.
8. **Soft-delete everywhere** — every read *and write* filters `isNull(table.deletedAt)`. Three hard-delete/revive exceptions (`ensureDays`, `applyTripWindow`, `addMember`) — see code comments.
9. **Trip may have no dates.** Nullable `start_date`/`end_date`; undated never an error.
10. **No timezones.** Dates = `YYYY-MM-DD` strings; event times local to itinerary. Never persist an offset.
11. **Degrade, don't crash, without credentials.** Missing provider (Nominatim/Resend/Google) → reduced feature, never throw.

## Conventions

- Server Components default; mutations = Server Actions in route's `actions.ts` — never inline `"use server"` closures.
- **Nothing in `app/` imports `@/db`** — SQL only in `server/` aggregates.
- Validate at the door: dates via `lib/dates.ts`, free text via `lib/text.ts`. Rejections = form errors, never throws.
- **Visual: white ground + pastels + one blue** (#187). Canvas `#F7F6F3`, white surfaces, hairlines; four pastels one-per-domain (peri/dates, mint/money, butter/ideas & people, blush/route); **blue `#4E68D8` = "yours to do" only** (actions, links, own rows). Soft-toy geometry (large radii, pill controls); pill-box nav, account right-aligned; quiet motion (1.5–2px hover lift, `.22s`, `cubic-bezier(.2,.85,.3,1)`). Type: Bricolage Grotesque (display) + Instrument Sans (body) + DM Mono (data — all money/dates). Docs = yardstick, `docs/design/`.
- Colours from tokens only — no hex literals. Status never colour/icon alone — always a word too.
- **Outside UI lib allowed** where hand-rolling isn't worth months — BlockNote runs Notes (#238). High bar; it takes the tokens/type/no-emoji rule or doesn't ship. Prefer house components for anything ordinary.
- **No emoji anywhere** (#148). Every icon = drawn line-art: 14×14 `viewBox` at ~13px, `fill="none"`, `strokeWidth` 1.15–1.25, `stroke="currentColor"` (see `TravelModeIcon`, `ReactionGlyph`, `WeatherGlyph`).
- **Light + dark, same token names** (#240). Dark restates base values in `:root[data-theme="dark"]`; aliases follow. **No `dark:` variant** — needing one means the token is wrong. Choice in `localStorage`, never a `theme` column. Contrast checked both.
- **If the drawing is clear, say nothing** (#209). Text carries only what layout can't. Banned on sight: heading above a heading (one name per panel; no `.typed` kicker over `<h2>`; a `text-ink-soft` paragraph is body copy, fine); captions decoding the design; narration of state a control shows; instructional copy ("click here"); a link repeating nav. Exceptions: what's *missing* (rule 11), and status (never colour alone).
- British English, sentence case, real content (never lorem).
- Read `docs/design/approach.html` + `visual-language.html` before UI/UX work.
- **Comments: ruthless.** Only *why* + ticket pointer, or a genuine gotcha — never *what*. One line beats a block.

## Code standards

- **Single responsibility** — can the file be named after one thing? Name needs "and" → two files.
- **Dependency inversion at seams.** `lib/` pure, knows nothing of `server/`/`app/`/`components/`; `components/` take data, never fetch; only `server/` opens DB. Type-only imports across a seam fine. `pnpm deps:check` enforces.
- **YAGNI.** No abstraction/option/knob without a second call site needing it today.
- **Composability over configuration.** Eight optional props for four cases → several components. Copy `PASTEL_SKINS`: one shared thing, composed at call site.

| Rule | Limit |
|---|---|
| File length | 600 lines (blank/comment excluded) |
| Function length | 120 lines — a page's JSX return exempt |
| Cyclomatic complexity | 15 per function |
| Component props | past ~6, split |

`eslint` enforces all but the last. Pre-ceiling files sit on a **dated allowlist** in `eslint.config.mjs` — each exception a dated decision. Splitting beats adding a line.

**Performance defaults:** Server Components unless client needed; no client fetch where a server read does; no heavyweight import behind a rare branch; unbounded lists paged/capped (`LIMITS`). `pnpm check:bundle` holds shared First Load JS under budget.

## Out of scope for v1

Payments, attractions/POI data & reviews, flight *booking* (deep links only), i18n, analytics, consent UI, marketing email, push notifications.
