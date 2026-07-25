# Storage layer

A real SQL database behind a driver port, so the prototype can run entirely in
the browser today and move to hosted Postgres without rewriting queries.

```
                    store.tsx  (React)
                        │
                   repository.ts   ← the only file that writes SQL
                        │
                    driver.ts      ← the port: query / exec / execScript / transaction
                   ╱          ╲
        drivers/sqljs.ts     drivers/postgres.ts
        SQLite via WASM      pg.Pool (server-side)
        + IndexedDB file
```

## Why it is shaped this way

- **Queries live in one layer.** `repository.ts` is the only file with SQL
  strings in it. Components and the store call methods, not statements.
- **Migrations are plain `.sql`.** `migrations/*.sql` is imported raw and run
  verbatim. The same text runs against SQLite here and Postgres in a deployed
  environment — nothing is generated or dialect-translated.
- **The port is async even though SQLite is not.** That is deliberate: a
  synchronous interface would not survive contact with a network database.

## Portability rules

The SQL above the driver stays inside a subset both engines accept:

| Concern | Rule |
|---|---|
| Placeholders | Always positional `?`. The Postgres driver rewrites to `$1, $2, …`. |
| Money | `BIGINT` minor units (pence). Never a float — see the venture `CLAUDE.md`. |
| Booleans | `INTEGER` 0/1. SQLite has no `BOOLEAN`; Postgres accepts `INTEGER`. |
| Ids | Application-generated `TEXT`. No `AUTOINCREMENT` / `SERIAL` / `IDENTITY`. |
| Timestamps | `TEXT`, ISO-8601 UTC. |
| Tenancy | Every table carries `household_id` from day one. |

Pounds only exist above the repository boundary; `toMinor` / `fromMinor` in
`domain/money.ts` are the sanctioned crossing points.

## Adding a migration

1. Add `migrations/00N_name.sql`.
2. Register it in `migrations/index.ts`.

The runner records applied versions in `schema_migrations` and runs each
migration in its own transaction, so a failure leaves the database on the last
good version. Migrations are append-only — never edit one that has shipped.

## Moving to Postgres

`drivers/postgres.ts` has no dependency on the `pg` package; it takes a
structurally-typed pool. From a server process:

```ts
import { Pool } from "pg";
import { createPostgresDriver } from "./db/drivers/postgres";
import { createRepositories, migrate } from "./db";

const driver = createPostgresDriver(new Pool({ connectionString: process.env.DATABASE_URL }));
await migrate(driver);
const repos = createRepositories(driver, householdId);
```

Two things change alongside the driver:

- **The browser stops talking to the database directly.** Credentials cannot
  live in a client bundle, so the repositories move behind `services/api` and
  the app calls HTTP endpoints. The repository interface is what the API
  handlers use, so the layer itself does not change.
- **`household_id` starts varying.** It is currently a constant; with real
  users it comes from the authenticated session, and the existing
  `WHERE household_id = ?` clauses become the tenancy boundary.

## Prototype caveats

- The browser database is unencrypted and lives in IndexedDB. It holds seeded
  example figures only — do not put real financial data in it.
- `plan.upsert` and `profile.upsert` delete-then-insert rather than using
  `ON CONFLICT`, which the two engines spell differently. Row-level edits go
  through `update()`, which is a plain `UPDATE`.
