---
name: schema-change
description: Change the Floc database schema end to end — edit schema.ts, generate the migration, apply it to local.db, update the ERD, and keep the invariants. Use when the user says /floc:schema-change, "add a column", "new table", "change the schema", or any work that edits floc/apps/web/src/db/schema.ts.
---

# schema-change

A schema change is four things in one slice: `schema.ts`, a migration, the
migration applied to `local.db`, and the ERD. Missing any one breaks something
later — dev dies on `no such column`, CI fails the `migrations` job, or the
docs lie.

## 1. Check it against the invariants

Read "Data model shape" in
[architecture](../../../../docs/architecture/architecture.html). Refuse, or
ask, before you add:

- a `stop` table or a lifecycle/status column — both are derived from data;
- a money column that is not an integer in minor units;
- a timezone or offset — dates are `YYYY-MM-DD`, times are local;
- a `NOT NULL` `start_date`/`end_date` — dates may be empty;
- a version column — last write wins.

Every new trip-owned table gets `created_at`, `last_modified_at` and
`deleted_at`, and every read and write of it filters `deleted_at IS NULL`.

**Destructive change** (drop a table or column, narrow a type, rewrite rows)
→ stop and ask. Production has real users; Railway applies the migration on
deploy and it does not roll back.

## 2. Test first, then edit `schema.ts`

Write the failing test in the `server/` module that will use the column, then
edit `floc/apps/web/src/db/schema.ts`. Put an enum's values in `@floc/core`
and import them, so the phone and the schema share one list.

## 3. Generate the migration

```bash
pnpm --filter floc-web db:generate
```

Open the new `floc/apps/web/drizzle/NNNN_*.sql` and read it. Drizzle rebuilds
a SQLite table (copy, drop, rename) for changes `ALTER` cannot do — that is
normal, but check it keeps every row.

## 4. Apply it to `local.db`

`db:generate` applies nothing, and `local.db` has no migration journal. Run:

```bash
node plugins/floc/skills/schema-change/apply-local.mjs floc/apps/web/drizzle/NNNN_name.sql
```

The script is wired to `floc/apps/web/local.db` only — it cannot reach Turso.
A statement already applied is skipped, so a second run is safe. A table
rebuild that fails halfway leaves `local.db` odd; `pnpm --filter floc-web
db:reset` puts it back.

If the web dev server is up, it keeps working — no restart needed for a new
column. Reload the page and confirm the feature reads the column.

## 5. Tests green

```bash
pnpm --filter floc-web test
```

Unit tests build their own database from the migrations, so a red here after
step 3 usually means the migration and `schema.ts` disagree.

## 6. Update the docs

- [ERD](../../../../docs/architecture/data-model/erd.html): the table's block,
  its relationships, and a line in the cardinality table for a new table.
- "Data model shape" in
  [architecture](../../../../docs/architecture/architecture.html) if the new
  table is one a reader needs to see.
- `pnpm docs:check` — it fails on a table missing from the ERD.

`/floc:sync-docs` covers the rest of the diff.

## 7. If the phone needs it

A new field the phone reads goes through `FlocPort` and a procedure in
`@floc/api` — never a Drizzle type on the phone. A new procedure needs its
`parity.json` line (`pnpm parity --fix`, then write the `why`).

## Report

The migration file, what it changes, applied to `local.db` (yes/no), tests,
docs changed. Nothing else. Landing it is `/floc:push`.
