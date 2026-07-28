# waypoint-web

The Waypoint v1 app: a group-travel planner. Next.js App Router, Turso (libSQL)
+ Drizzle, Better Auth.

This replaces [`../prototype`](../prototype/README.md), which implemented the
retired ADR-0010 cut and is kept only as prior art.

## Running it

Nothing needs provisioning to get it up — with no credentials the app falls
back to a local file database, email/password auth, console-logged email and
free-text place names.

```bash
corepack pnpm install
```

```bash
cp ventures/waypoint/apps/web/.env.example ventures/waypoint/apps/web/.env
```

```bash
corepack pnpm --filter waypoint-web db:push
```

```bash
corepack pnpm --filter waypoint-web db:seed
```

```bash
corepack pnpm --filter waypoint-web dev
```

`db:seed` writes one trip mid-planning ("Portugal, late summer") so every tab
has real content. The seeded users have no password — sign up with your own
email, then join the trip via its invite link.

## What degrades without credentials

| Missing | Effect |
|---|---|
| `TURSO_DATABASE_URL` | Falls back to `file:./local.db`. Fine for dev, wrong for Vercel — the filesystem there is ephemeral. |
| `GOOGLE_CLIENT_ID`/`SECRET` | The Google button is not rendered; email/password still works. |
| _(no maps key at all)_ | Geocoding is Nominatim and tiles are OpenStreetMap — free, no account, no key (v0.2 tickets 15/12). If Nominatim is unreachable or rate-limited, place search returns nothing and the picker falls back to typing a place name. |
| `RESEND_API_KEY` | Outbound email is logged to the server console instead of sent — never silently dropped. |

## Layout

```
src/
  app/                    routes; each folder's writes live in its actions.ts
    trip/[id]/            the five tabs — layout.tsx owns the header + tab bar
  components/             ui.tsx (server) + client-ui.tsx (client) primitives
  db/                     schema.ts (the whole ERD), index.ts, seed.ts
  lib/                    access, auth, dates, money, unlocks, email,
                          geocoding (Nominatim), map (OSM tiles)
  middleware.ts           session gate; membership is decided in lib/access.ts
```

## The rules that are code, not schema

Ticket 04 lists invariants SQLite cannot enforce. Where each one lives:

| Invariant | Enforced in |
|---|---|
| Splits sum to the expense total exactly | `lib/money.ts` (`computeSplits`), covered by `money.test.ts` |
| Tab unlocks never regress | `lib/unlocks.ts` (`refreshUnlocks` only ever `coalesce`s a timestamp in) |
| Only an admin may invite, kick, promote, archive or delete | `lib/access.ts` (`assertAdmin`) at the top of each admin action |
| A non-member cannot tell a real trip id from a fake one | `lib/access.ts` (`requireTripAccess` → `notFound()`), plus `app/not-found.tsx` |
| Money is never a float | `lib/money.ts` — integer minor units throughout, `parseMoney` refuses anything else |

## Tests

```bash
corepack pnpm --filter waypoint-web test
```

Unit tests cover the parts with exact invariants: money splitting and balances,
date-only arithmetic, and the derived-stop grouping. There is no UI test layer
in v1.

## Deployment

Per-app Vercel project, never the whole monorepo (hub rule). Root directory
`ventures/waypoint/apps/web`. Set `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`,
`BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` and — once provisioned — the Google
and Resend keys. Maps need no key (Nominatim + OSM tiles). Turso and Resend both install through the Vercel
Marketplace (tickets 02, 08).
