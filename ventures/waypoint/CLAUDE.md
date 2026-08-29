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
| `apps/web/src/components/` | `ui.tsx`/`client-ui.tsx` are the house design system — reach for it first. |
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
- **Visual direction: white ground + pastels + one blue** (#187). Canvas `#F7F6F3` (a barely-there off-white — the hairline on a panel carries its edge, not the ground), white surfaces, hairlines; four pastels one-per-domain (peri/dates, mint/money, butter/ideas & people, blush/route); **blue `#4E68D8` means "yours to do" and nothing else** (actions, links, your own rows). Soft-toy geometry (large radii, pill controls); pill-box nav everywhere, account right-aligned; quiet motion (1.5–2px hover lift, `.22s`, `cubic-bezier(.2,.85,.3,1)`). Type: Bricolage Grotesque (display) + Instrument Sans (body) + DM Mono (data — all money/dates). This replaced the paper-and-biro look; docs are the yardstick, see `docs/design/`.
- Colours come from tokens only — no hex literals. Status is never colour (or icon) alone — always a word too.
- **An outside UI library is allowed** where hand-rolling it is not worth the
  months — BlockNote runs the Notes editor (#238). The bar is high, and the
  price is the same either way: it takes the tokens, the type and the no-emoji
  rule, or it doesn't ship. Prefer the house components for anything ordinary.
- **No emoji anywhere in the app** (#148). Every icon is drawn line-art in the app'''s own hand — an emoji is someone else'''s artwork and can'''t take the ink of what it sits in. Scale: 14×14 `viewBox` at ~13px, `fill="none"`, `strokeWidth` 1.15–1.25, `stroke="currentColor"` (see `TravelModeIcon`, `ReactionGlyph`, `WeatherGlyph`).
- **Light and dark, same token names** (#240). Dark restates the base values in
  `:root[data-theme="dark"]`; aliases follow on their own. **No `dark:` variant
  anywhere** — if a component needs one, the token is wrong. The choice lives in
  `localStorage`, never a `theme` column. Contrast is checked for both.
- **If the drawing is clear, say nothing** (#209). Text exists to carry what the layout cannot. When a reader can work something out from the arrangement, colour, grouping or position on the page, adding words for it is noise — cut them. In practice this bans, on sight:
  - **A heading above a heading.** One name per panel or section. "The group" over "Who's going" is one fact printed twice; pick the shorter and delete the other. This bans the section-head pattern of a small `.typed` kicker label stacked over an `<h2>` title (e.g. "What groups say" over a full-sentence heading) — a section gets **one** heading, not a label and a title. A supporting `text-ink-soft` paragraph under the heading is body copy, not a second heading, and is fine.
  - **Captions that decode the design** — "Colour is where you sleep", "Numbered pins match the cards below". If the encoding needs a key, fix the encoding.
  - **Narration of state a control already shows** — a filled toggle plus "this is on"; a disabled button plus "you can't do this yet".
  - **Instructional copy** ("click here…", "use the tabs above").
  - **A link that repeats the nav** — "open Days" beside cards that already link to Days.
  The exceptions are the things a drawing genuinely cannot say: what is *missing* (rule 11's "not on the map — no coordinates: …"), and status, which is never colour alone.
- British English, sentence case, real content (never lorem).
- Read `docs/design/approach.html` + `visual-language.html` before UI/UX work.
- **Comments: be ruthless.** Only *why* + a ticket pointer, or a genuine gotcha — never *what* the code does. One line beats a block.

## Code standards

Design principles, stated for this codebase rather than in the abstract.

- **Single responsibility** — the practical test: can the file be named after
  one thing? If the name needs an “and”, it is two files.
- **Dependency inversion at the seams.** `lib/` is pure and knows nothing of
  `server/`, `app/` or `components/`; `components/` take data, never fetch it;
  only `server/` opens the database. Type-only imports across a seam are fine
  — they vanish at build time. `pnpm deps:check` enforces this.
- **YAGNI.** No abstraction, option or config knob without a second call site
  that needs it today. Pre-MVP with one venture, speculative generality is the
  expensive mistake.
- **Composability over configuration.** A component taking eight optional props
  to cover four cases should be several components. `PASTEL_SKINS` is the shape
  to copy: one shared thing, composed at the call site.

Hard numbers, because a rule without one is a preference:

| Rule | Limit |
|---|---|
| File length | 600 lines (blank/comment lines not counted) |
| Function length | 120 lines — a page’s JSX return is exempt, markup is not logic |
| Cyclomatic complexity | 15 per function |
| Component props | past ~6, split the component |

`eslint` enforces all but the last. Files that predate the ceilings sit on a
**dated allowlist** in `eslint.config.mjs` — the point is that each exception is
a visible decision with a date on it. Delete a line when its file comes back
under; splitting the file is always the better move than adding one.

**Performance defaults**, so it is not decided case by case: Server Components
unless the file needs the client; no client-side fetch where a server read will
do; no heavyweight import behind a rarely-taken branch; every list that can
grow unbounded is paged or capped (`LIMITS`). `pnpm check:bundle` holds the
shared First Load JS under its budget.

**Comments: see the convention above — be ruthless.** The house style drifted
into paragraph-length blocks narrating what the code already says, restating
the change just made, or recording history that belongs in the commit message
and `.scratch/`. A comment earns its place only by saying **why**, and only
when the why is not obvious. Delete rather than update a comment that only
restates its code.

## Common agent pitfalls here

- Adding a `stop` or lifecycle-state table/column — both are explicitly derived, not stored (rules 3–4).
- Treating "no dates" or "no forecast/location" as an error path — these are normal, silent states (rules 9, 11).
- Writing a page-specific `loadXTab()` in `server/` instead of a reusable aggregate read.
- Forgetting `isNull(deletedAt)` on a new write, or copying one of the three hard-delete exceptions without re-reading why they're exceptions.
- Hand-rolling a trip membership check instead of `requireTripAccess`.
- Reaching for a hex colour instead of the token set.

## Out of scope for v1

Payments, attractions/POI data & reviews, flight *booking* (deep links only),
i18n, analytics, consent UI, marketing email, push notifications.
