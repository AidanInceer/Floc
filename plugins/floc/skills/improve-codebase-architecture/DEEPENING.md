# Pulling it into one place

How to merge copies into one place safely, by what the code touches. The
kind decides how the change is tested.

## What the code touches

### 1. Nothing outside itself

Pure rules: dates, money, stops, routes, finder ranking. Move it to
`@floc/core` (no I/O, no app imports — `pnpm deps:check`) and test it
there through the one function. No stand-in needed. Most Floc cards are this
kind; prefer it.

### 2. The database

SQL in `floc/apps/web/src/server/`. Tests run real queries on a real migrated
database through `floc/apps/web/src/test/db.ts`, never against `local.db`. Keep every read and write filtering
`deleted_at IS NULL` (rule 8) and every trip load behind `requireTripAccess`
or `tripProcedure` (rule 5). A change that rewrites an expense rewrites its
splits in one transaction (rule 2).

### 3. Our own code across a network

The web pages and the phone reach the same data: pages through `server/`,
the phone through `@floc/api`, which only reaches data through `FlocPort`.
That is a real plug-in point with two sides: `server/api-port/` in the app,
a fake in API tests. Logic belongs on the `server/` side, so both get it.
Notes live sync is the same shape: `@floc/core/notes/live` takes the socket
and cache as arguments; web and phone pass their own.

### 4. Someone else's service

Mail, Google, maps, stores, FX rates. Pass the client in as an argument; tests
pass a fake. A missing key hides or reduces the feature, never throws
(rule 11).

### 5. The browser or the phone

Canvas, pointer events, `ResizeObserver`, theme changes, Expo modules. Keep
the maths pure and tested (kind 1); keep the glue thin. If the glue is copied
across screens, one hook that owns it is the change, and the maths it calls
stays where it is.

## Plug-in points

- **One side means it is not a plug-in point yet.** Do not add an argument
  or an interface for something only one caller ever passes. It is just a
  detour.
- **Two sides make it real:** web and phone, or the app and a test fake.
- Things only the one place's own tests need stay private to it. Do not
  widen what callers must know just for a test.

## Tests: replace, do not stack

- Write the new tests against the one place, through what callers use.
- Then delete the old tests on the copies that the change removed. Do not
  keep both.
- A test asserts what a caller can see, not internal state. If a test must
  change when the inside changes, it tests too deep.
- Coverage floor stays 80% on every package. Never lower it.
- Test first, red then green (`/floc:tdd`). A copy that already disagrees
  gets a failing test that shows which answer is right before anything moves.
