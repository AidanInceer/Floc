# CLAUDE.md — Waypoint

Venture-level rules. Win inside `ventures/waypoint/`; the hub's
[`CLAUDE.md`](../../CLAUDE.md) applies to everything not covered here.

## What it is

Group-travel planner: friends deciding where/when/order, and who owes who.
Pre-MVP. Stack: **Next.js App Router + Turso (libSQL) + Drizzle + Better Auth**
(`apps/web`). `apps/prototype` is superseded — don't extend it.

## Structure

| Where | What |
|---|---|
| `apps/web/src/app/` | Routes. Server Components + Server Actions (`actions.ts` per folder). |
| `apps/web/src/server/` | Query aggregates (`itinerary`, `ideas`, `money`, `membership`, `notes`, …) — owns all SQL, soft-delete filtering, `revalidatePath`. |
| `apps/web/src/lib/` | Pure helpers (money, dates, calendar math) — no I/O. |
| `apps/web/src/components/` | `ui.tsx`/`client-ui.tsx` are the hand-rolled design system; don't add shadcn or a second one. |
| `apps/web/src/db/schema.ts` | Schema of record. Mirrors [`docs/data-model/erd.html`](../../docs/data-model/erd.html) — change both together. |
| `docs/` | Local HTML site (`docs/index.html`), no build. Design approach, visual language, vocab, backlog. |
| `.scratch/waypoint-v1/` | One file per ticket/decision (`map.md` is the index). Read the relevant ticket before changing behaviour. |

## Non-negotiables

1. **Money is never a float.** Integer minor units; `parseMoney`/`computeSplits`/`formatMoney` only.
2. **`expense_split` rows are snapshots**, never recalculated — an edit rewrites expense + splits in one transaction.
3. **Itinerary is day-first.** `day`/`day_event` are stored; a "stop" is derived by grouping consecutive days sharing `overnight_place_id`. Never add a `stop` table.
4. **No lifecycle state.** Trip state derives entirely from data present — no enum/flag/column, no tab gating.
5. **Enumeration-proof access.** Load a trip only via `requireTripAccess` — non-member = nonexistent trip, same response.
6. **Admin powers are exactly four**: invite, kick, promote, delete/archive. Everything else (incl. leaving) any member can do. Gate with `assertAdmin`.
7. **Last-write-wins.** No optimistic locking, no version checks. `last_modified_at` is debug-only.
8. **Soft-delete everywhere** — every read *and write* filters `isNull(table.deletedAt)`. Three deliberate hard-delete/revive exceptions exist (`ensureDays`, `applyTripWindow`, `joinByToken`) — see code comments there.
9. **A trip may have no dates.** Nullable `start_date`/`end_date`; undated is never an error state.
10. **No timezones.** Dates are `YYYY-MM-DD` strings; event times are local to the itinerary. Never persist an offset.
11. **Degrade, don't crash, without credentials.** Missing provider (Nominatim/Resend/Google) → visibly reduced feature, never a throw.

## Conventions

- Server Components by default; mutations are Server Actions in the route's `actions.ts` — never inline `"use server"` closures.
- **Nothing in `app/` imports `@/db`** — SQL lives only in `server/` aggregates.
- Validate at the door: dates via `lib/dates.ts`, free text via `lib/text.ts`. Rejections are form errors, never unhandled throws.
- Colours/icons come from tokens only — no hex literals, no icon fonts/Lucide/etc. Status is never colour (or icon) alone.
- Light only — no dark palette, no `theme` column.
- **No instructional copy** ("click here…") and **show it, don't narrate it** — if a control already shows a state, don't also write a sentence describing it.
- British English, sentence case, real content (never lorem).
- Read `docs/design/approach.html` + `visual-language.html` before UI/UX work.
- **Comments: be ruthless.** Only *why* + a ticket pointer, or a genuine gotcha — never *what* the code does. One line beats a block.

## Common agent pitfalls here

- Adding a `stop` or lifecycle-state table/column — both are explicitly derived, not stored (rules 3–4).
- Treating "no dates" or "no forecast/location" as an error path — these are normal, silent states (rules 9, 11).
- Writing a page-specific `loadXTab()` in `server/` instead of a reusable aggregate read.
- Forgetting `isNull(deletedAt)` on a new write, or copying one of the three hard-delete exceptions without re-reading why they're exceptions.
- Hand-rolling a trip membership check instead of `requireTripAccess`.
- Reaching for shadcn/Lucide/a hex colour instead of the existing token + hand-rolled component set.

## Out of scope for v1

Payments, attractions/POI data & reviews, flight *booking* (deep links only),
i18n, analytics, consent UI, marketing email, push notifications.
