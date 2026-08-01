# Waypoint codebase review — 1 Aug 2026

Scope: `ventures/waypoint/apps/web` at `777501a` (v0.7.0). 114 TS/TSX files,
~20k lines. Read in full: `src/lib/*`, `src/db/*`, every `actions.ts`, the
heaviest pages. Baseline state: `typecheck` clean, `test` 123/123 passing,
`lint` 4 warnings 0 errors.

Findings are ordered by severity and each carries the file, the concrete
failure, and the fix. Counts: **3 critical, 4 high, 11 medium, 6 low**.

---

## Summary

The codebase is unusually well-reasoned — the comments explain *why*, the money
model is genuinely float-free, and the read paths have been deliberately
de-serialised. Two things let it down:

1. **Trip scoping is enforced inconsistently.** `requireTripAccess(tripId)`
   proves you're in trip *T*. It does **not** prove the `dayId`, `eventId` or
   `ideaId` you also posted belongs to *T*. Several actions check the first and
   skip the second, which is a cross-trip write path and a direct breach of
   non-negotiable 5. Where the check exists (`setLegTransport`,
   `insertEventAt`, `addNote`) it's explicitly commented — so the pattern is
   understood, just not applied uniformly.
2. **Test coverage stops exactly where the risk starts.** All 123 tests cover
   pure helpers (`money`, `event-order`, `stops`, `visibility` comparison).
   There is not one test over `access.ts`, any `actions.ts`, or any query.

---

## Critical

### C1 — Cross-trip itinerary writes: `dayId`/`eventId` never bound to the trip

**File:** `src/app/trip/[id]/days/actions.ts`
**Affects:** `addEvent`, `updateEvent`, `deleteEvent`, `reorderEvents`,
`swapEvents`, `moveEvent`, and the shared `loadEventSlots`.

Every one of these is an exported Server Action reachable by action id from any
authenticated browser. They gate on `requireTripAccess(tripId)` and then write
using the caller-supplied `dayId`/`eventId` with no join back to the trip:

```ts
export async function updateEvent(tripId: number, eventId: number, input) {
  const access = await requireTripAccess(tripId);   // proves membership of tripId
  await db.update(dayEvent).set({ ... })
    .where(eq(dayEvent.id, eventId));               // …but writes any event, anywhere
}
```

**Failure scenario:** Mallory is a member of her own trip #500. She calls
`updateEvent(500, <eventId in trip #12>, { type: "activity", title: "x" })`.
The membership check passes on 500; the write lands on trip #12's itinerary.
Same for `deleteEvent` (soft-deletes another group's event), `addEvent`
(injects an event into another group's day), and `reorderEvents` /
`swapEvents` / `moveEvent` (rewrite another day's times and `order_index` —
`reorderEvents` rewrites `time`, `endTime` and `allDay`, so it destroys agreed
times, not just ordering).

`insertEventAt` in the same file does it correctly and says why — *"Both days
must be this trip's, or a drag would be a way to reach into another group's
itinerary by id (rule 5)"*. The others were never brought up to it.

**Fix:** one shared guard, used by all of them:

```ts
async function assertDayInTrip(tripId: number, dayId: number) { … }   // day.tripId = tripId, deletedAt null
async function assertEventInTrip(tripId: number, eventId: number) { … } // join dayEvent→day
```

`addEvent`/`reorderEvents`/`swapEvents`/`moveEvent`/`loadEventSlots` take the
day guard; `updateEvent`/`deleteEvent` take the event guard. Add an
access-control test file covering the negative case for each.

### C2 — Cross-trip vote writes: `ideaId` never bound to the trip

**File:** `src/app/trip/[id]/ideas/actions.ts` — `castVote`, `clearVote`.

```ts
export async function castVote(tripId: number, ideaId: number, value: VoteValue) {
  const access = await requireTripAccess(tripId);
  await db.insert(ideaVote).values({ ideaId, userId: access.viewer.id, value })
    .onConflictDoUpdate({ … });
}
```

`ideaId` is never checked against `idea.tripId`. A member of any trip can vote
on — and, via the upsert, overwrite their own prior vote on — an idea in a trip
they've never been in. This also skews another group's Overview "waiting on N
to vote" tally, because `votes` there is scoped through `idea` and will happily
count the intruder's row.

Note the contrast two functions up: `deleteIdea` and `setIdeaPinned` **do**
carry `eq(idea.tripId, tripId)`. The vote pair was missed.

**Fix:** resolve the idea with `and(eq(idea.id, ideaId), eq(idea.tripId, tripId),
isNull(idea.deletedAt))` first and bail on miss, exactly as `deleteIdea` does.

### C3 — Auth secret and database URL silently fall back to dev defaults

**Files:** `src/lib/auth.ts:27`, `src/db/index.ts`

```ts
secret: process.env.BETTER_AUTH_SECRET ?? "dev-only-secret-change-me",
url:    process.env.TURSO_DATABASE_URL ?? "file:./local.db",
```

**Failure scenario:** a production deploy where `BETTER_AUTH_SECRET` is unset or
misspelled boots successfully and signs every session cookie with a constant
that is in a public-ish repo. Anyone who knows it can mint a session for any
user id — total authentication bypass, with no error, no log line, and nothing
in the UI to notice. The `TURSO_DATABASE_URL` fallback is the same shape:
production quietly runs against an empty ephemeral file database.

This is *not* rule 11 ("degrade, don't crash"). Rule 11 is about optional
third-party credentials (Nominatim, Resend, Google) where degrading is the
honest behaviour. A signing secret has no degraded mode.

**Fix:** keep the fallbacks for `NODE_ENV !== "production"`; throw at module
load in production when either is missing.

---

## High

### H1 — Unauthenticated Server Actions: `searchPlacesAction`, `resolveEventPlace`

**Files:** `src/app/trip/[id]/route/actions.ts:26`,
`src/app/trip/[id]/days/actions.ts:28,33`

Neither calls `requireUser` or `requireTripAccess`. Both are exported from a
`"use server"` module, so both are callable by anyone who can reach the app —
no account needed.

- `searchPlacesAction` is an open proxy onto Nominatim, attributed to the
  project's own contact User-Agent. Sustained abuse gets the UA blocked, which
  breaks geocoding for every real user (and OSM's policy makes the operator
  responsible).
- `resolveEventPlace` is worse: it **writes**. `upsertPlace` inserts a `place`
  row for any free-text name, so an anonymous caller can grow the `place` table
  without limit.

**Fix:** `await requireUser()` at the top of both, minimum. Better:
`requireTripAccess(tripId)` — both are only ever called from inside a trip, so
the tripId is available at the call site.

### H2 — Trip dates accept arbitrary strings

**Files:** `src/app/trip/[id]/overview/actions.ts:156` (`setTripDates`),
`src/app/trip/[id]/dates/actions.ts` (`setTripDatesFromCalendar`)

`setTripDates` does no validation at all; `setTripDatesFromCalendar` only
compares `startDate > endDate` lexically, which is meaningless for non-ISO
input. Both write straight into `trip.start_date` / `end_date`.

**Failure scenario:** `setTripDates` with `startDate: "soon"` stores it.
Downstream, `hasEnded` and `countdownLabel` get nonsense, `dateRange` in
`addStop` can loop or produce garbage dates, and the travel map's
green/yellow derivation (`hasEnded(t.endDate)`) silently mis-colours.

The Dates tab already has the right helper — `assertIsoDates` in the same file,
used by `setAvailabilityDates`. It just isn't applied to the trip's own dates.

**Fix:** run both dates through `assertIsoDates` (or return a form error) in all
three write paths.

### H3 — `syncCompletedCoTripFriendships` scans the whole `trip_membership` table

**File:** `src/lib/friends.ts:42`

```ts
const coMembers = await db.select({ … }).from(tripMembership)
  .where(and(isNull(tripMembership.deletedAt), ne(tripMembership.userId, userId)))
  .all();                                    // ← every membership row in the database
const otherUserIds = new Set(coMembers.filter((m) => tripIdSet.has(m.tripId))…);
```

The trip filter is applied **in JavaScript** after pulling every membership row
for every trip of every user. This runs on every `/friends` page load. At a few
hundred users it's a full-table scan per page view; the `inArray(tripId, …)`
that belongs in the `where` is already used correctly elsewhere in the file.

Second-order: the follow-up loop issues one `INSERT … ON CONFLICT DO NOTHING`
per co-member, serially.

**Fix:** add `inArray(tripMembership.tripId, tripIds)` to the query; batch the
inserts into one `.values([...])`.

### H4 — No test coverage over access control or any Server Action

All 10 test files cover pure functions. `access.ts`, `visibility.ts`'s loaders,
and all 11 `actions.ts` files are untested. C1 and C2 are precisely the bugs a
single "non-member cannot touch this" suite would have caught, and the
enumeration-proofness in non-negotiable 5 currently rests entirely on code
review.

**Fix:** an integration suite against a temp libSQL file database (the seed
script already proves the wiring works under plain Node) with, at minimum: a
non-member gets `notFound` from every trip route; a member of trip A cannot
mutate anything in trip B via any exported action; a stranger gets `notFound`
on a profile.

---

## Medium

### M1 — `pendingMapPrompts` is an N+1

`src/lib/travel-map.ts:194`. A serial `await countriesForTrips([row.tripId])`
inside a `for` loop — two queries per pending prompt, one trip at a time.
`countriesForTrips` already takes an array. Call it once with all the trip ids
and group the result by trip.

### M2 — Public profile page runs 5+ serial round trips

`src/lib/visibility.ts:165`. `relationTo` → profile row → then, inside the
returned object literal, `await pastTripsFor(...)` and `await travelMapFor(...)`
evaluate **sequentially** (object properties are evaluated in order), and
`travelMapFor` is itself 3 more queries of which 2 are serial. Compute both
independently with `Promise.all` before building the object, and parallelise
`currentTripIds` / `countriesForTrips` where the dependency allows.

### M3 — `sharesATrip` and `coTripNameFor` do in two queries what one join does

`src/lib/visibility.ts:113`, `src/lib/friends.ts:136`. Both fetch one user's
trip ids, then fetch the other's filtered by that list. A single self-join on
`trip_membership` answers it in one round trip, and `relationTo` is on the hot
path of every profile view and every friend action.

### M4 — Notification emails block the action response

`postIdea` (`ideas/actions.ts`) awaits `Promise.all` over one send per member
before returning; `sendNudge` (`overview/actions.ts`) and `requestFriendById`
(`friends/actions.ts`) await their send inline. The money actions already do
this correctly with `after()` from `next/server`, with a comment explaining
exactly why. Apply the same pattern; `postIdea` should also use `sendEmails`
(batch) rather than N× `sendEmail`, which costs N preference lookups.

### M5 — Nudges and idea posts have no rate limit

`nudge` rows are inserted with no throttle and each sends an email.
**Failure scenario:** a member of a shared trip loops `sendNudge` and mail-bombs
a co-member from the project's own sending domain — a deliverability and abuse
problem, not just an annoyance. The recipient's only defence is turning the
whole `notify_nudges` category off. Add a per-(from, to, trip) cooldown —
the `nudge` table already stores `created_at`, so a single lookback query does
it.

### M6 — A fresh `Resend` client per email

`src/lib/email.ts:84`. `await import("resend")` and `new Resend(key)` run inside
`deliver`, i.e. once per recipient. Hoist to a module-level lazy singleton.

### M7 — `react()` can create duplicate reaction rows

`src/app/trip/[id]/notes-actions.ts:153`. Read-modify-write with no unique index
behind it (the index is deliberately non-unique so soft-deleted rows can be
revived). Two concurrent taps insert two rows, and the count then reads as 2
from one person. Low impact, but the fix is cheap: a partial unique index on
`(note_id, user_id, kind)` plus `onConflictDoUpdate`, matching what `castVote`
and `openPendingRequest` already do.

### M8 — Per-row serial writes on every event drag

`days/actions.ts` — `reorderEvents` awaits one `UPDATE` per event in a `for`
loop; `insertEventAt` does two more such loops. A 12-event day is ~12–24 serial
round trips per drag. `permuteDayContents` in `lib/itinerary.ts` solves the
identical problem correctly (snapshot first, then `Promise.all` the writes,
with a comment explaining the 2N cost). Apply the same shape.

### M9 — Nominatim rate limit is per-process, not global

`src/lib/geocoding.ts:67`. The `queue`/`lastCall` throttle is module state.
On Vercel, N concurrent function instances means up to N requests per second
against a policy whose cap is 1 — the exact thing the comment says the queue
exists to prevent. Either accept and document it, or move the token to shared
storage. Worth a decision either way before launch, since the penalty is a UA
block.

### M10 — Writes missing the soft-delete filter

`setOvernightPlace` and `setStopDates` (`route/actions.ts`) update `day` rows by
id with no `isNull(day.deletedAt)`; `toggleSettled` (`money/actions.ts`) doesn't
filter `expenseSplit.deletedAt`; `updateEvent`/`deleteEvent` don't filter
`dayEvent.deletedAt`. Non-negotiable 8 says every read filters — writes should
too, or a deleted row can be resurrected into a half-state.

### M11 — Input length caps are inconsistent

`note.body` is capped at 2000. Nothing else is: `idea.note`, `expense.description`
and `notes`, `nudge.message`, `trip.name` on **create** (`renameTrip` caps at 120,
`createTrip` doesn't), `userProfile.displayName`. A single multi-megabyte idea
is a cheap way to make a trip page unusable for the whole group.

---

## Low / maintainability

### L1 — `cta.url` is interpolated into an `href` unescaped

`src/lib/email.ts:137`. Every other interpolation goes through `escape()`; the
URL doesn't. All current URLs are app-constructed so this isn't live-exploitable,
but it's one caller away from HTML injection into outbound mail. Escape it.

### L2 — Duplicate trip mutations in two places

`trips/actions.ts` exports `archiveTrip` / `deleteTrip`; `overview/actions.ts`
exports `archiveTripFromOverview` / `deleteTripFromOverview` with the same
bodies plus different redirects. The comment on `archiveTripFromOverview` notes
`archiveTrip` "was never wired to anything". Two exported Server Actions doing
one job is two surfaces to keep gated. Collapse to one, parameterise the
redirect.

### L3 — `overview/page.tsx` is 774 lines and does O(n·m) work

The balance assembly runs `splitRows.filter(...)` once per expense — quadratic
in (expenses × splits) on the app's landing page. Group the splits by
`expenseId` into a `Map` first. The file also mixes six data derivations, the
trail computation and three sub-components; the derivations belong in
`lib/`, where they'd also become testable.

### L4 — `deleteAccount` loops per admin trip

`settings/actions.ts:144`. Two serial queries per trip where the user is admin,
plus a write. Fine at current scale; batch it if account deletion ever matters.
It also doesn't set `map_prompt_at` on the memberships it soft-deletes, unlike
`leaveTrip` and `kickMember` — arguably right (the account is going), but it's
an undocumented divergence from the other two.

### L5 — Actions use raw `tripId` where `access.trip.id` is available

Roughly half the actions write `.where(eq(trip.id, tripId))` using the unvalidated
parameter, the other half use `access.trip.id` (which `requireTripAccess` has
resolved and proven). They're equivalent today only because `requireTripAccess`
coerces with `Number()`. Standardising on `access.trip.id` makes the invariant
structural rather than incidental — and would have made C1/C2 harder to write.

### L6 — 4 lint warnings

Unused `VoteValue` import (`ideas/page.tsx:14`), `aria-pressed` on `role=gridcell`
in both `availability-calendar.tsx:311` and `date-range-picker.tsx:173` (a real
a11y bug — `gridcell` wants `aria-selected`), and the eslint config's anonymous
default export. The two calendar ones are worth fixing under the launch-polish
accessibility ticket (#101).

---

## What's good

Worth recording, because it's load-bearing and shouldn't be "simplified" away:

- **Money.** Integer minor units throughout, one `distribute` with deterministic
  remainder allocation, `MAX_AMOUNT_MINOR` guarding the `Number.MAX_SAFE_INTEGER`
  read-failure mode, and the whole-expense rewrite-in-a-transaction. 20 tests.
- **`loadTripAccess`.** The `cache()` key deliberately excludes `redirectTo`,
  with a comment explaining that leaving it in silently double-queried every tab
  but Overview. That's a subtle bug someone already found and documented.
- **Enumeration proofing.** `requireTripAccess` and `requireProfileView` both
  return `notFound()` for "no access" and "doesn't exist" identically, and
  `requestFriendById` re-checks `relationTo` rather than trusting a posted id.
- **The read paths generally.** `listMembersFor`, `loadThreads` scoping by
  `(trip_id, scope)` rather than by a fetched id list, Overview's six-way
  `Promise.all` — a lot of N+1s have already been found and killed. The ones
  above are what's left.
- **The comments.** Nearly every non-obvious decision names the ticket that
  drove it. This review was fast *because* of that.

---

## Suggested order of work

1. **C1, C2** — one shared trip-scoping guard, applied everywhere. One ticket.
2. **C3** — production env assertion. Ten lines.
3. **H1** — auth on the two place actions. Ten lines.
4. **H4** — the access-control test suite, which locks 1–3 in.
5. **H2, M11** — input validation pass (dates, lengths) across all actions.
6. **H3, M1, M2, M3, M8** — the query fixes, as one performance ticket.
7. The rest as launch-polish, folded into #100/#101.

---
---

# Part B — Simplification

Added 1 Aug 2026, same commit (`777501a`). Quality only: this half looks for
duplication, derivable state and unnecessary complexity, **not** correctness —
the bugs are in Part A above.

Nothing here is a bug. Several are the residue of decisions that were right at
the time and have since been overtaken.

### S1 — `searchPlacesAction` exists twice, byte-identical

`trip/[id]/route/actions.ts:26` and `trip/[id]/days/actions.ts:28`. Both are a
three-line wrapper over `searchPlaces`, both carry the same comment, and both
are consumed by the same `<PlacePicker>`. Two exported Server Actions means two
surfaces to secure — and H1 in Part A has to be fixed in both.

**Simpler:** one `lib/place-actions.ts` (or a single action in
`trip/[id]/actions.ts`, which doesn't exist yet but arguably should — see A2).
Delete the other. Same for `resolveEventPlace`, which is a one-line wrapper over
`upsertPlace` and could just be the shared action.

### S2 — `/trips` and `/trips/archived` duplicate the whole load-and-build

`trips/page.tsx:60` and `trips/archived/page.tsx:22` run the same
`tripMembership` ⨝ `trip` select with the same six columns and the same three
predicates, differing only in `isNull(trip.archivedAt)` vs `not(isNull(...))`,
then both build a `TripCardData[]` the same way and both call `listMembersFor`.

**Simpler:** `loadTripCards(viewerId, { archived: boolean })` in `lib/`,
returning `TripCardData[]`. Archived's extra `admins` derivation stays on the
page, where it's genuinely page-specific. Removes ~40 duplicated lines and one
future place to forget a `deletedAt`.

### S3 — Four trip-lifecycle actions where two would do

Covered as L2 in Part A: `trips/actions.ts` `archiveTrip`/`deleteTrip` and
`overview/actions.ts` `archiveTripFromOverview`/`deleteTripFromOverview` have
identical bodies and differ only in the trailing `redirect`. Take the redirect
target as an argument, or have the page-level one call the shared one.

### S4 — Overview's "unresolved" derivation is 90 lines of page-level logic

`overview/page.tsx:164–224` plus the JSX at 486–558. Two specific costs:

- `votingUnresolved.filter((m) => m.userId !== viewer.id)` is written out
  **four times** in the JSX (lines 524, 528, 529 and 552), and the
  `availabilityUnresolved` twin three more times. Bind each once above the
  return.
- The whole block — votes-by-user tally, availability set, balance folding,
  `moneyUnresolved`, `viewerPositions` — is pure given its inputs, and is
  exactly the kind of thing the codebase already tests happily in `lib/`
  (`votes.ts`, `availability.ts`, `money.ts` all exist and all have tests).

**Simpler:** `lib/unresolved.ts` taking the six row sets and the viewer,
returning `{ mine: Item[], theirs: Item[] }`. The page becomes a map over two
arrays, and the trickiest logic on the busiest page becomes unit-testable.

### S5 — Two email entry points for one job

`lib/email.ts` has `sendEmail` (looks up one preference, then `deliver`) and
`sendEmails` (batch-looks-up preferences, then `deliver`). The gating rules are
implemented twice, with the defaults ("missing profile → on", "transactional →
always") spelled out in both.

**Simpler:** `sendEmail(e)` becomes `sendEmails([e])`. One gate, one set of
defaults. This also fixes M4/M6 in passing, since every caller then gets the
batched preference lookup for free.

### S6 — `revalidatePath` pairs repeated across the itinerary actions

98 `revalidatePath` calls across the action files, and the pair

```ts
revalidatePath(`/trip/${id}/route`); revalidatePath(`/trip/${id}/days`);
```

appears in eight separate functions across `route/actions.ts` and
`days/actions.ts` — because Route and Days are two views of the same `day` rows.
`notes-actions.ts` already solved the general version of this with `pathFor`.

**Simpler:** `revalidateTrip(tripId, ...tabs)` in `lib/`, with an
`ITINERARY_TABS` constant for the common pair. When a seventh tab arrives, one
edit instead of eight.

### S7 — `Balances` hardcodes the currency list

`lib/money.ts:278`:

```ts
const balances: Balances = { GBP: {}, EUR: {}, USD: {} };
```

`CURRENCIES` is already exported from the schema and is already described there
as "expected to grow". Adding a fourth currency currently means remembering to
edit this object literal, and forgetting it produces an undefined `book` at
runtime rather than a type error.

**Simpler:** build it from `CURRENCIES` —
`Object.fromEntries(CURRENCIES.map((c) => [c, {}])) as Balances`. One line, and
the next currency is a one-token change.

### S8 — `derivedStateFor` re-implements two thirds of `travelMapFor`

`profile/actions.ts:168` fetches the viewer's live memberships and calls
`countriesForTrips` — which is `currentTripIds` + `countriesForTrips`, i.e.
`travelMapFor` minus the merge. `currentTripIds` is module-private in
`travel-map.ts`, which is why it got copied.

**Simpler:** export `currentTripIds` (or a `derivedMarksFor(userId)` that both
call) from `lib/travel-map.ts` and use it in both places. The travel map's
derivation then lives entirely in one file, which is what its header comment
claims.

### S9 — `unlocks.ts` re-exports `tabs.ts`

`lib/unlocks.ts:21` re-exports `lockReason`, `tabStates`, `TabKey` and
`TabState` from `lib/tabs.ts`. The split is deliberate and correct (tabs is
browser-safe, unlocks is `server-only`), but the re-export undoes half of it:
a client-adjacent module importing a tab type from `unlocks` pulls a
`server-only` module into its graph. Import `lib/tabs` directly at the call
sites and drop the re-export.

### S10 — Form-field boilerplate

`String(formData.get("x") ?? "").trim()` and its `|| null` variant appear
dozens of times across the action files. `money/actions.ts` already shows the
better shape with `readExpenseFields` and `parseSplit`: one function per form,
returning a typed object.

**Simpler:** either adopt that pattern uniformly, or add three helpers —
`text(fd, name)`, `optionalText(fd, name)`, `int(fd, name)`. This is also where
the missing length caps (M11) and date validation (H2) would naturally live,
which is the real argument for it.

### S11 — Inline `"use server"` closures inside pages

Six `page.tsx` files and `components/idea-card.tsx` define Server Actions
inline (`days/page.tsx:240` and `:515`, `trips/page.tsx`, `route/page.tsx`,
`ideas/page.tsx`, `profile/page.tsx`, `signup/page.tsx`). The venture
convention says *"Mutations are Server Actions in the route folder's
`actions.ts`"*. Two costs beyond the convention: they can't be unit-tested or
audited alongside the other actions, and the closure form captures the
enclosing render scope, so `days/page.tsx:240` keeps `d` (a whole day with its
events) alive for the action's lifetime.

**Simpler:** move the bodies into the neighbouring `actions.ts` and `.bind()`
the ids, which is what the same file already does at line 238
(`swapEvents.bind(null, trip.id, d.id)`).

### S12 — `computeSplits` supports two split types the UI can no longer produce

Since ticket 85 the form resolves everything to `shares` or `exact` via
`resolveWeightedSplit`. `even` and `percentage` remain in `SPLIT_TYPES`,
`computeSplits` and the tests. They must stay in the **schema** — stored rows
carry them and `expense_split` is a snapshot (non-negotiable 2) — but the
*write* path can no longer reach them.

**Simpler:** narrow the write path's type to `"shares" | "exact"` so the
compiler enforces what ticket 85 decided, and leave `SPLIT_TYPES` alone for
reads. Keeps the dead branches honest rather than looking like live options.

---

# Part C — Modularity, expandability, scalability

Structural observations. Several of these are the *root cause* of individual
findings above, which is the argument for treating them as their own tickets
rather than as cleanup.

## Modularity

### A1 — There is no layer between Server Actions and Drizzle

Every one of the 11 `actions.ts` files imports `db` and writes SQL inline;
`requireTripAccess` appears at 70 call sites; queries for the same table are
spelled out independently in the action, the page, and sometimes a `lib/`
loader. `lib/` holds the *pure* half of the domain (money, stops, event-order,
votes, availability) and it is excellent — but the persistence half has no home,
so it lives scattered across the route tree.

**The cost, concretely:** the soft-delete filter (non-negotiable 8) is a rule
repeated by hand in ~58 places; M10 in Part A is four places where it was
forgotten. The same is true of trip scoping (C1/C2) and of `touch()`.

**Improvement:** a thin repository layer, `src/server/<aggregate>.ts` —
`server/itinerary.ts`, `server/money.ts`, `server/notes.ts` — owning the reads
and writes for one aggregate, with the `deletedAt` filter and `touch()` applied
inside. Actions keep the validation, the authorisation and the revalidation;
they stop composing SQL. This is a refactor, not a rewrite: most of the query
bodies move unchanged, and the `lib/` pure half is untouched.

### A2 — `requireTripAccess` returns a permission, not a scope

This is the architectural root of C1 and C2. The function proves *"you are in
trip T"* and then hands back data; it does nothing to make the **next** query
inherit T. So every action has to remember to re-apply `eq(x.tripId, tripId)`
by hand, and six of them didn't.

**Improvement:** have it return a scope, not just facts —

```ts
const access = await requireTripAccess(tripId);
const day = await access.day(dayId);       // null if it isn't this trip's
const event = await access.event(eventId); // joins dayEvent → day → trip
```

Then "reach into another trip by id" stops being something you can write by
forgetting a line — it becomes something you'd have to bypass the API to do.
Given that enumeration-proof trip access is non-negotiable 5, the invariant
deserves to be structural rather than conventional. Pairs naturally with A1.

### A3 — `lib/` is a flat 37-file bag mixing three different things

Pure, browser-safe helpers (`money`, `stops`, `dates`, `tags`, `votes`,
`event-order`, `who`, `tabs`), database loaders (`access`, `visibility`,
`travel-map`, `friends`, `notes-read`, `profile`, `itinerary`), and
network/side-effect modules (`email`, `geocoding`) all sit side by side. Only
one file (`unlocks.ts`) declares `server-only`.

The blurred line is already causing real pain, and the codebase knows it:
`db/index.ts` carries a hand-written `typeof window !== "undefined"` throw
whose message is *"a Client Component is importing it, directly or through a
helper"* — a runtime guard standing in for a structural boundary. S9's
re-export is the same problem from the other side.

**Improvement:** split into `src/lib/` (pure, no `db` import, all unit-testable
— roughly the 10 files that already have tests) and `src/server/` (everything
touching `db`, `server-only` at the top of each). Then an accidental client
import is a build error with a useful message instead of a runtime throw, and
"is this testable without a database?" is answerable from the path.

### A4 — Notification delivery is welded to email

`lib/email.ts` holds the transport, the category gate, the HTML shell and the
catalogue of five messages in one 267-line module, and the four categories are
four boolean columns on `user_profile`. Adding an in-app notification later
means either a second parallel system or surgery on this file.

Push is explicitly out of scope for v1 and this should **not** be built now.
Recording it only because the seam is cheap to leave: keep the catalogue
(`emails.*`) as pure message descriptions, and let the transport be one function
that takes them. It already almost is — `deliver` is separate from the
catalogue. One more step (a `Notification` type the catalogue returns, and a
transport registry) would leave the door open at no cost.

### A5 — The visual layer is in good shape

Worth stating because it's the part most likely to be "improved" wrongly: 22
primitives in `ui.tsx` (server) and 8 in `client-ui.tsx` (client), one clean
line between them, no second design system, no hex literals in components. This
is more disciplined than most codebases at this stage and needs nothing. The
only note is that `ui.tsx` at 441 lines is nearing the point where splitting by
category (layout / controls / feedback) would help navigation — not yet, but
soon.

## Expandability

### A6 — The schema is genuinely extensible; the tested surface is not

The data model expands well: the polymorphic `note` table means a discussion
thread on a new surface is a new `NOTE_SCOPES` entry plus a `pathFor` case
(nothing else); a stop is derived so the itinerary has no ordering table to
migrate; `tags`/`vibe_tags` as JSON columns avoid a join table for vocabularies
nobody queries across. These are good decisions that will keep paying.

What does **not** expand is confidence. 123 tests, all on pure helpers, none on
`access.ts`, no `actions.ts`, no query. Every future feature ships on review
alone at exactly the boundary where the two critical bugs in Part A live.

**This is the single highest-leverage structural improvement available.** A
temp-file libSQL harness (the seed script already proves Drizzle runs under
plain Node) plus a `withTestDb` helper would make A1's repositories and A2's
scope object testable, and would turn non-negotiable 5 from a convention into
an assertion. Everything else in Part C is easier once it exists.

### A7 — Tab count is a soft ceiling

`NUDGE_TABS`, `NOTE_SCOPES`, `lib/tabs.ts`, `pathFor`, the unlock columns
(`route_unlocked_at`, `days_unlocked_at`) and the `revalidatePath` pairs all
encode the six-tab set independently. Adding a seventh tab (issue #103's
calendar re-imagining is exactly this shape) touches six places, two of them a
schema migration because the unlock flags are columns rather than rows.

Not worth pre-building — but if #103 lands, an `unlock` row per (trip, tab)
instead of a column per tab is the change that stops the next one costing a
migration.

## Scalability

### A8 — 58 unbounded `.all()` calls, zero `.limit()` calls

Nothing in the app paginates: not `/trips`, not the notes threads, not the days
list, not the expense ledger, not the ideas board. Every page loads the whole
set and filters in JS. At the current shape — a handful of friends, one trip —
this is correct and the simplicity is worth more than the pagination. The
ceilings, in the order they'll be hit:

1. **`syncCompletedCoTripFriendships`** (H3) — already unbounded across *all
   users*, not just the viewer's. This one is a scaling bug today, not a
   ceiling.
2. **Notes on a long trip** — `loadThreads` deliberately scopes by
   `(trip_id, scope)` rather than by id list, which is the right call for
   round trips but means a chatty trip loads every comment on every render of
   the Days tab.
3. **Expense ledger** — Overview folds every expense and every split on each
   load, currently with an O(n·m) filter (L3).

**Improvement:** none needed yet, beyond H3. Worth writing down the trigger:
when any one trip exceeds ~200 notes or ~200 expenses, the Days and Money tabs
need a windowed read. Recording the number now is cheaper than rediscovering
the ceiling under load.

### A9 — Per-request memoisation only; no cache tier

`cache()` from React dedupes within one render (used well — `getSession`,
`loadTripAccess`, `listMembers`), and `revalidatePath` invalidates the router
cache. There is nothing between those two: every request re-reads everything
from Turso over HTTP.

That is the right amount of caching for pre-MVP, and adding more now would
mostly add invalidation bugs. The note for later is that `unstable_cache` with
tags maps cleanly onto this codebase *because* A1's repository layer would give
each aggregate one place to tag from — another argument for doing A1 first.

### A10 — Serverless-instance assumptions

Two pieces of module-level state assume one process: the Nominatim throttle
(M9 — a policy breach at more than one instance) and the absence of any rate
limiting on nudges/emails (M5), which would need shared storage to enforce
properly. Both are fine on a single warm instance and both break quietly at the
exact moment the app becomes popular enough to matter. Neither needs solving
before launch; both need a decision recorded before launch.

---

## Consolidated priority

Merging Part A's ordering with the structural work:

| # | Work | Why now |
|---|---|---|
| 1 | C1, C2, C3, H1 | Exploitable today. Small, surgical fixes. |
| 2 | **A6** — DB test harness | Locks 1 in and unblocks everything below. |
| 3 | A2 — scope object from `requireTripAccess` | Makes C1/C2 structurally unwritable. |
| 4 | H2, M11, S10 | One validation pass, one natural home. |
| 5 | H3, M1, M2, M3, M8 | Query fixes, one performance ticket. |
| 6 | A1 + A3 — repository layer, `lib`/`server` split | The refactor S1–S9 mostly fall out of. |
| 7 | S4, S7, S11, L3 and the rest | Cleanup, foldable into #100/#101. |

A4, A7, A9 and A10 are notes for when their trigger arrives, not work items.
