# CLAUDE.md — Waypoint

Venture-level rules. These win inside `ventures/waypoint/`; the hub's
[`CLAUDE.md`](../../CLAUDE.md) still applies to everything they don't cover.

## What Waypoint is

A group-travel planner: a handful of friends deciding where to go, when, in what
order, and who owes who afterwards. Pre-MVP.

| Thing | Where | Status |
|---|---|---|
| The app | [`apps/web`](apps/web/README.md) | Real code. Next.js App Router + Turso (libSQL) + Drizzle + Better Auth. |
| Old prototype | `apps/prototype` | **Superseded.** Vite/localStorage, the retired ADR-0010 cut. Prior art — don't extend it. |
| Wireframe variants | `wireframe/*.html` | Design artefacts. `paper.html` is the one v1 follows. |
| Schema of record | [`docs/data-model/erd.md`](docs/data-model/erd.md) | Mirrors `apps/web/src/db/schema.ts`. Change both together. |
| Visual language | [`docs/visual-language.md`](docs/visual-language.md) | Tokens + component inventory. |
| Homepage mockups | [`docs/mockups/`](docs/mockups/README.md) | The landing page's design artefacts. The live `/` follows `homepage-pinboard.html` below the hero and `homepage-hero-b-beforeafter.html` for the hero itself; everything else there is unadopted, including the two phone-app explorations. |
| Where it could go | [`docs/monetisation.md`](docs/monetisation.md) · [`docs/product-ideas.md`](docs/product-ideas.md) · [`docs/partner-trips.md`](docs/partner-trips.md) | Thinking, not commitments. Nothing in any of them is scheduled. The one exception is `/explore`, whose listings are **static and editorial** — illustrative operator names, no partner deal, nothing bookable. Its one live action is "Start this trip", which copies a listing into a real trip (ticket 39, `app/explore/actions.ts`). Read `partner-trips.md` before adding anything else. |

The decisions behind all of it live in `.scratch/waypoint-v1/` — `map.md` is the
index, one ticket file per decision. **Read the relevant ticket before changing
behaviour**; the 13 original ADRs were retired (git `95266e3`) and must not be
treated as current.

## Non-negotiables

1. **Money is never a float.** Integer minor units everywhere. Amounts are
   parsed with `parseMoney`, split with `computeSplits`, formatted with
   `formatMoney` — never by hand, never with `parseFloat`.
2. **`expense_split` rows are snapshots.** Written once from the split type,
   never recalculated, so they survive a member leaving. An expense edit
   rewrites the expense and all its splits in one transaction.
3. **The itinerary is day-first.** `day` and `day_event` are stored; a "stop"
   is *derived* by grouping consecutive days with the same
   `overnight_place_id`. Never add a `stop` table.
4. **No lifecycle enum.** Trip state is derived from what data exists. The only
   persisted lifecycle state is the sticky tab-unlock flags
   (`route_unlocked_at`, `days_unlocked_at`), and an unlock never regresses.
5. **Enumeration-proof trip access.** Load a trip only through
   `requireTripAccess` — a non-member gets the same response as a nonexistent
   trip. Never hand-roll a membership check.
6. **Admin powers are exactly four**: invite, kick, promote, delete (plus
   archive/restore). Everything else a member can do too — including **leaving**
   (`leaveTrip`, ticket 65). Gate with `assertAdmin`. One exception to "roles
   only change through `promoteMember`": when the last admin leaves, admin
   passes automatically to the earliest-joined remaining member, and the last
   member out archives the trip. Succession, not a fifth power.
7. **Last-write-wins, everywhere.** No optimistic locking, no version checks,
   no check-and-reject write path. `last_modified_at` is for debugging only.
8. **Soft-delete.** Every read *and every write* filters
   `isNull(table.deletedAt)`. The rule used to say "every read", and that
   phrasing is exactly what let a handful of updates through that would
   resurrect a deleted row into a half-state from a stale id (ticket 115). The
   two deliberate exceptions both say so where they are: `ensureDays`, because a
   soft-deleted row still occupies the (trip, date) unique index, and
   `joinByToken`, because reviving a kicked member's row is the point.
9. **A trip may have no dates.** `start_date`/`end_date` are nullable and
   creating a trip without them is the normal path — the Dates tab is where the
   group decides, from `availability` overlap, and it never waits for a full
   house. Nothing may treat undated as an error state.
10. **No timezones.** Trip and day dates are date-only `YYYY-MM-DD` strings;
   event times are relative to the itinerary's location. Nothing is persisted
   with an offset, and there is no `timezone` column.
11. **Degrade, don't crash, without credentials.** Nominatim unreachable or
    rate-limited → free-text place names. No Resend key → email logged to the
    console. No Google client → the button isn't rendered. Never a silent drop.

## Conventions in `apps/web`

- Server Components by default. Mutations are Server Actions in the route
  folder's `actions.ts`. No client fetches to our own API.
- **Validate at the door.** A date write goes through `isIsoDate` /
  `readIsoDate` / `readOptionalIsoDate` (`lib/dates.ts`) and free text through
  `capText` / `capRequiredText` (`lib/text.ts`) — ticket 113. A `maxlength` on
  an input is a courtesy to whoever is typing; the action is reachable without
  the form. Rejections come back as a form error, never an unhandled throw.
- **An `actions.ts` never imports `@/db`.** The SQL lives in the `server/`
  aggregates — `itinerary`, `ideas`, `money`, `membership`, `notes` (ticket
  108) — which own soft-delete filtering, the result-set ceilings in
  `server/limits.ts`, and the `revalidatePath` set for their part of the
  domain. An action decides who may do what and what it means; the aggregate
  decides how it is stored. Add a rule to the aggregate, not to a caller.
- Primitives come from `components/ui.tsx` (server) and
  `components/client-ui.tsx` (client). Don't add a second design system and
  don't reach for shadcn — the inventory is deliberately hand-rolled.
- Colours come from the tokens only (`bg-sheet`, `text-ink-soft`,
  `border-rule`, `text-pen`, the agreed/open/action trio). Never a hex
  literal in a component.
- Status is never colour alone — every state also carries a word.
- **Light only.** No dark palette, no `data-theme`, no theme setting, no
  `theme` column. Don't add a `prefers-color-scheme` block — see ticket 07.
- A trip member's avatar colour comes from their `TripMember.tone`. Pass it
  through to `Avatar`/`AvatarRow`; only people with no roster behind them fall
  back to the name hash.
- The tab set is **Overview · Ideas · Dates · Route · Days · Money**. Every
  `trip/[id]/*` page renders `<Page wide flush>` — that's what keeps the folder
  tabs attached to the sheet, and a page that forgets it visibly misaligns.
- **Discussion threads go through the polymorphic `note` table** (`scope` +
  `scope_id`), rendered by `components/note-thread.tsx` and written by
  `trip/[id]/notes-actions.ts`. Don't add a per-surface comment table.
- Copy is British English, sentence case, concrete. Realistic content, never
  lorem.
- Comment a non-obvious decision with a one-line pointer to the ticket that
  drove it. That's the house style throughout `src/`.

## Out of scope for v1

Payments (the money model is a ledger, not a payment rail), attractions/POI
data and third-party reviews, flight *booking* (search deep links only), i18n,
analytics, consent UI, marketing email, and any push notification. Don't
pre-build infrastructure for them.
