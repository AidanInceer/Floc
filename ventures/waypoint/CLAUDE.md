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
| Schema of record | [`docs/data-model/erd.html`](../../docs/data-model/erd.html) | Mirrors `apps/web/src/db/schema.ts`. Change both together. |
| Design approach | [`docs/design/approach.html`](../../docs/design/approach.html) | The higher-level design guide — clarity, hierarchy, trust, states, and the anti-patterns to avoid, distilled from expert design reviews (Rio Lu / Cursor, Katie Dill / Stripe, Zain Ali / Instacart, Vlad / Webflow) plus UI fundamentals. **Read before any UI/UX work.** Raw transcripts in `docs/design/inputs/`. |
| Visual language | [`docs/design/visual-language.html`](../../docs/design/visual-language.html) | The concrete house style the approach serves: paper-and-biro tokens + component inventory. |
| Homepage mockups | [`docs/mockups/`](../../docs/mockups/README.md) | The landing page's design artefacts. The live `/` follows `homepage-g-boardingpass.html` — "the travel document" — end to end: the pass, the luggage tags, the coupon book, the entry stamp. The pinboard route and the before/after hero it replaced are superseded, and everything else there is unadopted, including the two phone-app explorations. |
| Where it could go | [`docs/monetisation.html`](../../docs/monetisation.html) · [`docs/product-ideas.html`](../../docs/product-ideas.html) · [`docs/partner-trips.html`](../../docs/partner-trips.html) | Thinking, not commitments. Nothing in any of them is scheduled. The one exception is `/explore`, whose listings are **static and editorial** — illustrative operator names, no partner deal, nothing bookable. Its one live action is "Start this trip", which copies a listing into a real trip (ticket 39, `app/explore/actions.ts`). Read `partner-trips.html` before adding anything else. |

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
4. **No lifecycle state at all.** Trip state is derived entirely from what data
   exists — no enum, no flag, no column. The sticky tab-unlock flags
   (`route_unlocked_at`, `days_unlocked_at`) were the one exception until
   ticket 126 dropped them: **every tab is open from the first day of a trip**,
   and a tab with nothing in it shows its own empty state rather than a
   padlock. Don't gate a tab, and don't persist a phase.
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
- **Nothing in `app/` imports `@/db`.** Not an `actions.ts` (ticket 108) and
  not a `page.tsx` (ticket 118). The SQL lives in the `server/` aggregates —
  `itinerary`, `ideas`, `money`, `membership`, `notes` — which own soft-delete
  filtering, the result-set ceilings in `server/limits.ts`, and the
  `revalidatePath` set for their part of the domain. An action decides who may
  do what and what it means; the aggregate decides how it is stored. Add a rule
  to the aggregate, not to a caller.
- **Reads are per aggregate, composed on the page.** A page still runs its own
  `Promise.all` over several aggregate reads — the fan-out is deliberate and
  the page is what knows which of its reads are independent. What a page must
  not have is a `loadXTab()` in `server/` named after its only caller: an
  aggregate read is a fact about the domain (`listIdeas`, `listSplits`), and
  more than one surface should be able to want it. Every list read is bounded,
  and each read scopes itself by `trip_id` rather than by ids another read has
  to return first.
- **A mutation lives in its route folder's `actions.ts`**, never as an inline
  `"use server"` closure in a page or component (ticket 117). Where an action
  needs ids the page holds, bind them (`postIdea.bind(null, tripId)`) — a
  closure captures whatever else is in scope for its lifetime.
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
- **No instructional copy.** Never write text that explains how to use the UI — fix the UI instead. "Scroll to explore", "click here to…" are always wrong.
- **Show it, don't narrate it.** The same rule one step further (ticket 134): a
  sentence that describes what a control or a graphic already shows is a bug in
  the graphic. "Best overlap so far: Mon 10 Aug – Sun 30 Aug — 1 of 1 free"
  above a calendar whose green run *is* that overlap, or "Pick the first day"
  over a grid you obviously pick days on, both went. Before adding a line of
  explanatory text, make the thing it would explain legible on its own; keep
  the words only where they carry something the visual can't (a state's name, a
  key's label — status is never colour alone). Copy that appears and disappears
  with the data is doubly suspect: it also moves the layout under the reader.
- **UI design discipline.** Before any visual or UX change, read `docs/design/approach.html` and `docs/design/visual-language.html`. Key rules: no scroll locking, no animations while the user is reading, no font proliferation (max three typefaces), every interactive surface has a visible hover state, whole-card clickability where a card navigates.
- Comment a non-obvious decision with a one-line pointer to the ticket that
  drove it. That's the house style throughout `src/`.

## Out of scope for v1

Payments (the money model is a ledger, not a payment rail), attractions/POI
data and third-party reviews, flight *booking* (search deep links only), i18n,
analytics, consent UI, marketing email, and any push notification. Don't
pre-build infrastructure for them.
