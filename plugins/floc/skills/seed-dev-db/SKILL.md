---
name: seed-dev-db
description: Load the Floc dev scenarios (A and B) into local.db alongside whatever is already there, so the web and phone apps have trips, friends, packing claims, money and profiles to test with — and sign in as any seeded person. Use when the user says /floc:seed-dev-db, "seed the db", "load scenario A/B", "I need test data", or wants to test something between several people.
---

# seed-dev-db

Put the seed people and trips into `local.db`. It does **not** touch your own trips,
friends or uploads. To go back to a clean, fixed state, use `/floc:reset-dev-db` instead.

## Process

### 1. Pick the scope

| Command (run from repo root) | Does |
|---|---|
| `pnpm --filter floc-web db:seed` | Rebuild A and B |
| `pnpm --filter floc-web db:seed a` | Rebuild A only; B is left as it is |
| `pnpm --filter floc-web db:seed b --reset` | Remove B; build nothing |
| `pnpm --filter floc-web db:seed --reset` | Remove both; build nothing |

Each build first removes the old copy of that scenario, so running it again is
safe. It never gives you two Portugals.

No scenario named in the request → rebuild both.

### 2. Run it

Servers may stay up: the seed writes rows only, not `.next`.

If it fails with `no such column` or `no such table`, `local.db` is behind the
schema. Apply the newest `floc/apps/web/drizzle/*.sql` to `local.db` and run
again. Do not change the seed to work around it.

If it fails because `FLOC_DEV_USER_EMAIL` or `FLOC_DEV_USER_PASSWORD` is not set,
tell the user to add both to `floc/apps/web/.env`. The seed puts every trip on
that account.

### 3. Verify

The output lists each trip it built. Want to see:

- `Portugal, late summer` (A)
- `The Dolomites, February`, `Tokyo, cherry blossom`, `Krakow, last winter` (B)

If the web server is up, confirm sign-in works:

```bash
curl -s -o /dev/null -w 'dev=%{http_code}\n' -X POST http://localhost:3000/api/dev/sign-in
curl -s -o /dev/null -w 'priya=%{http_code}\n' -X POST "http://localhost:3000/api/dev/sign-in?email=priya%40a.seed.floc.test"
```

Want `200` for both. A `404` means the two `.env` variables are missing, or the
server is running as production.

### 4. Report

Say which scenarios are loaded, and who to sign in as for what the user wants to
test (see the table below). Nothing else.

## What is in the seed

The dev account (`FLOC_DEV_USER_EMAIL`, id `dev-user` on a fresh database) is on
every trip, except Tokyo, where it has a pending invite.

**A: the ordinary case.** One trip, `Portugal, late summer`: four people who are
all friends.

| Person | Email | Profile |
|---|---|---|
| Priya Raman | `priya@a.seed.floc.test` | Open; vegetarian, shared |
| Tom Whitfield | `tom@a.seed.floc.test` | Friends only |
| Sofia Alves | `sofia@a.seed.floc.test` | Private |

The packing list has one line in each state: packed, claimed, shared (half packed),
unclaimed, and yours. There are also two personal lines, three expenses, and a gap
in availability.

**B: the messy case.**

| Person | Email | Profile | Relation to you |
|---|---|---|---|
| Nadia Haddad | `nadia@b.seed.floc.test` | Open; diet note | Friend |
| Callum Reid | `callum@b.seed.floc.test` | Mixed rings | Friend |
| Mei Tanaka | `mei@b.seed.floc.test` | Open; vegan | Friend; sent the Tokyo invite |
| Jonas Berg | `jonas@b.seed.floc.test` | Private | Friend |
| Ruth Okonkwo | `ruth@b.seed.floc.test` | Friends only | On your trip, **not** a friend |
| Elliot Vance | `elliot@b.seed.floc.test` | Open | Stranger; friend request to you |

- `The Dolomites, February`: 6 members, half-packed list, expenses in three currencies with uneven splits.
- `Tokyo, cherry blossom`: pending invite, so you are not a member yet.
- `Krakow, last winter`: a past trip.

Every seeded account uses the password `seed-password`.

## Signing in as someone

- **Web:** `/login` has a "Sign in as" dropdown above **Dev sign in**. From the
  browser pane, sign in on that page's own origin so the cookie lands there:
  `javascript_tool` → `await fetch('/api/dev/sign-in?email=ruth%40b.seed.floc.test',{method:'POST'})`, then reload.
- **Phone:** the sign-in screen has the same dropdown above **Dev Sign In**, on a
  dev build only. Take a screenshot to find it, then use `adb shell input tap`.
  The phone must be signed out first (You tab → Sign out of this phone).

## Gotchas

- **There is no "public" profile.** The widest ring is `trip_members`, and a
  stranger (Elliot) gets no profile page at all. That is correct behaviour.
- **Only seeded people can be signed into.** The route refuses any email that is
  not the env account or `*.seed.floc.test`, so a 404 for a real address is
  correct.
- **Removing a scenario also removes any trip a seed person is on**, including one
  the user made and invited them to. Warn before `--reset` if the user has done that.
- **Vibe tags must come from `VIBE_TAGS`**, and diet flags from `DIET_FLAGS`, in
  `@floc/core`. A tag outside that list is dropped when read, so it never shows.
  `Profile` in `profiles.ts` is typed to stop this.
- **Rebuilding a scenario signs its people out**, because their rows are
  recreated. Your own session survives a plain seed.

## Changing the seed

All in `floc/apps/web/src/db/seed/`:

| File | Owns |
|---|---|
| `identity.ts` | Email domain, `SCENARIOS`, shared password |
| `profiles.ts` | Visibility presets (`OPEN`, `FRIENDS_ONLY`, `PRIVATE`, `MIXED`) |
| `people.ts` | Accounts, passwords, profiles, friendships |
| `world.ts` | Trip, packing and expense builders |
| `scenario-a.ts` / `scenario-b.ts` | The scenarios themselves |
| `reset.ts` / `wipe.ts` | Remove one scenario / empty everything |

A new scenario needs a key in `SCENARIOS`, a `scenario-<key>.ts`, and an entry in
`BUILDERS` in `index.ts`. Keep each function under 120 lines: split into
`plan…`, `pack…`, `spend…` as the existing ones do.
