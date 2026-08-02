# Architecture

System diagram for the Waypoint monorepo. The active app is
[`ventures/waypoint/apps/web`](../ventures/waypoint/apps/web) — Next.js App
Router + Drizzle over Turso (libSQL) + Better Auth. Everything else in the
repo is plumbing, docs, or superseded prior art.

```mermaid
flowchart TB
    subgraph Client["Browser"]
        UI["Next.js App Router UI<br/>(app/trip, trips, explore, friends, profile, settings, login, signup, invite)"]
    end

    subgraph WebApp["ventures/waypoint/apps/web"]
        Routes["App Router pages + layouts"]
        API["Route handlers<br/>app/api/* (incl. app/api/auth/[...all])"]
        Server["server/*<br/>itinerary, places, friends, profile,<br/>unlocks, notes-read, access, visibility, auth, email"]
        Lib["lib/*<br/>pure helpers: money, dates, votes, tags,<br/>stops, availability, travel-map, dietary"]
        Components["components/*"]
        DB["db/*<br/>schema.ts, index.ts, seed.ts (Drizzle)"]
        AuthClient["lib/auth-client.ts<br/>(Better Auth)"]
    end

    Turso[("Turso libSQL DB")]
    BetterAuth["Better Auth service"]

    UI --> Routes
    Routes --> Components
    Routes --> API
    Routes --> AuthClient
    API --> Server
    Server --> DB
    Server --> Lib
    Server --> BetterAuth
    DB --> Turso
    AuthClient --> BetterAuth

    subgraph Monorepo["Repo plumbing (pnpm + Turborepo)"]
        Root["root: pnpm-workspace.yaml, turbo.json"]
        Prototype["apps/prototype (superseded Vite/localStorage)"]
        Docs["docs/, wireframes/ (static, no build)"]
    end

    Root -.orchestrates.-> WebApp
    Root -.legacy.-> Prototype
```

## Notes

- `lib/` is pure logic (money, dates, tags, votes, availability…); `server/`
  is server-only logic that touches the DB or auth — split per
  [fd49d74](../../fd49d74) (`#107`).
- `apps/prototype` is dead prior art, not wired to anything live — don't
  extend it.
- `docs/`, `wireframe/` are static content, no build step.

## Request flow

Server Components by default; mutations are Server Actions co-located in each
route folder's `actions.ts`. There is **no client-side fetch to our own API** —
`app/api/*` exists only for the Better Auth catch-all
(`app/api/auth/[...all]`), not as a general JSON API.

```mermaid
sequenceDiagram
    participant Browser
    participant RSC as Server Component (app/trip/[id]/*)
    participant Action as Server Action (actions.ts)
    participant Access as server/access.ts<br/>requireTripAccess
    participant Domain as server/* (itinerary, places, friends…)
    participant Lib as lib/* (pure logic)
    participant DB as db/* (Drizzle) → Turso

    Browser->>RSC: navigate to /trip/:id/:tab
    RSC->>Access: requireTripAccess(tripId, session)
    Access->>DB: membership check
    DB-->>Access: member row or none
    Access-->>RSC: trip context, or 404-equivalent
    RSC->>Domain: read (itinerary, notes, votes…)
    Domain->>DB: query (deletedAt IS NULL)
    DB-->>Domain: rows
    Domain-->>RSC: view data
    RSC-->>Browser: rendered HTML

    Browser->>Action: form submit / button (Server Action)
    Action->>Access: requireTripAccess / assertAdmin
    Action->>Lib: parseMoney / computeSplits / validate
    Action->>DB: write (transaction where multi-row)
    DB-->>Action: ok
    Action-->>Browser: revalidate + re-render
```

Key point: **`requireTripAccess` is the only door into a trip.** A non-member
gets the same response as a request for a trip that doesn't exist —
enumeration-proof by construction, never a hand-rolled membership `if`.

## Auth flow

Better Auth owns sessions; `lib/auth-client.ts` is the browser-side handle,
`server/auth.ts` the server-side one. No custom session table, no JWT rolled
by hand.

```mermaid
flowchart LR
    Login["/login, /signup"] --> AuthClient["lib/auth-client.ts"]
    AuthClient --> Handler["app/api/auth/[...all]<br/>Better Auth route handler"]
    Handler --> AuthServer["server/auth.ts"]
    AuthServer --> DB[("Turso — user/session tables")]
    RSC["Server Components / Actions"] --> AuthServer
    AuthServer -->|session| Access["requireTripAccess / assertAdmin"]
```

## Data model shape

Mirrors [`docs/data-model/erd.md`](../ventures/waypoint/docs/data-model/erd.md)
in the venture — that file is the schema of record, kept in lockstep with
`apps/web/src/db/schema.ts`. Shape, not full ERD:

```mermaid
erDiagram
    TRIP ||--o{ TRIP_MEMBER : has
    TRIP ||--o{ DAY : "has (day-first itinerary)"
    DAY ||--o{ DAY_EVENT : has
    TRIP ||--o{ EXPENSE : has
    EXPENSE ||--o{ EXPENSE_SPLIT : "snapshots (never recalculated)"
    TRIP ||--o{ NOTE : "polymorphic (scope + scope_id)"
    TRIP_MEMBER ||--o{ AVAILABILITY : submits
    TRIP ||--o{ VOTE : has
```

Notes that shape the schema, not just the diagram:

- **No `stop` table.** A "stop" is derived by grouping consecutive `day` rows
  with the same `overnight_place_id` — itinerary storage is day-first.
- **No lifecycle enum.** Trip state is derived from what data exists; the only
  persisted lifecycle bits are sticky unlock flags (`route_unlocked_at`,
  `days_unlocked_at`), which never regress.
- **Money is integer minor units, always** — parsed/split/formatted only
  through `lib/money.ts`, never `parseFloat`. `expense_split` rows are
  write-once snapshots so a member leaving doesn't corrupt history.
- **Soft-delete everywhere** — every read filters `deletedAt IS NULL`.
- **Last-write-wins** — no optimistic locking, no version column;
  `last_modified_at` is debugging-only.
- **Discussion is one polymorphic `note` table** (`scope` + `scope_id`), not a
  comment table per feature.

## Deployment & environments

- **Hosting is per-app, not per-monorepo.** `apps/web` gets its own Vercel
  project + CI workflow; CI must never deploy the whole monorepo at once.
- **Data store:** Turso (libSQL), reached only through `db/index.ts`.
- **Auth:** Better Auth, self-hosted inside the Next.js app (no external auth
  SaaS call at runtime beyond what Better Auth itself makes).
- **Degrade without credentials, never crash** — the pattern repeats at every
  external integration boundary:
  - No Nominatim → fall back to free-text place names.
  - No Resend key → email logged to console instead of sent.
  - No Google client → the button that needs it isn't rendered.
- **Light-only UI**, no theme system — one less environment axis to support.
- Out of scope for v1 (so absent from this architecture on purpose): payment
  rails, POI/attraction data, flight booking, i18n, analytics, push
  notifications.
