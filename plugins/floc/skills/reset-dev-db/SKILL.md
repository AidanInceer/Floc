---
name: reset-dev-db
description: Put the Floc dev database back to the exact same seeded state every time — empty local.db and the uploads folder, then load scenarios A and B with fixed ids — and sign the web and phone back in. Use when the user says /floc:reset-dev-db, "reset the db", "start fresh", "back to the seed state", or wants a deterministic starting point before testing.
---

# reset-dev-db

Wipe everything local and reseed. After this, the database is the same as after
every other reset:

- trips `1` Portugal, `2` Dolomites, `3` Tokyo, `4` Krakow
- users `dev-user`, `seed-a-priya` … `seed-b-ruth`

To add the seed **without** losing the user's own data, use `/floc:seed-dev-db`.

## Process

### 1. Back up first

The reset deletes the user's own trips, friends, profile edits and uploads. The
user asking for a reset is the permission. The backup is what makes it
reversible, so never skip it:

```powershell
$dir = "<scratchpad>\db-backup"; New-Item -ItemType Directory -Force $dir | Out-Null; Copy-Item C:\dev\Floc\floc\apps\web\local.db $dir -Force
```

Use the session scratchpad, never the repo: `local.db` holds password hashes.

### 2. Reset

```bash
pnpm --filter floc-web db:reset
```

Servers may stay up. It empties rows, not the file, because `next dev` holds
`local.db` open and Windows will not delete an open file.

It refuses to run, by design, if:
- `TURSO_DATABASE_URL` is not a `file:` URL, or `NODE_ENV` is production.
  **Never** "fix" this by editing the guard. Stop and tell the user.
- `FLOC_FILES_DIR` points outside `floc/apps/web`.

`no such column` / `no such table` → `local.db` is behind the schema. Apply the
newest `floc/apps/web/drizzle/*.sql` and run again.

### 3. Verify it is deterministic

Want `Wiped N tables` and then `trip 1` … `trip 4` in the output. To prove the
ids, check them:

```bash
cd floc/apps/web; node -e "const {createClient}=require('@libsql/client');const c=createClient({url:'file:./local.db'});c.execute('select id from user order by id').then(u=>c.execute('select id,name from trip order by id').then(t=>console.log(u.rows.map(r=>r.id).join(','),'|',t.rows.map(r=>r.id+':'+r.name).join(','))))"
```

Want exactly:

```
dev-user,seed-a-priya,seed-a-sofia,seed-a-tom,seed-b-callum,seed-b-elliot,seed-b-jonas,seed-b-mei,seed-b-nadia,seed-b-ruth | 1:Portugal, late summer,2:The Dolomites, February,3:Tokyo, cherry blossom,4:Krakow, last winter
```

If this does not match, something outside the seed is writing rows. Find it
before you report success.

### 4. Sign back in

The reset deletes **every session**, so the web and phone are both signed out.

- **Web** (server up): `curl -s -o /dev/null -w 'dev=%{http_code}\n' -X POST http://localhost:3000/api/dev/sign-in`. Want `200`.
  In the browser pane, do the same `fetch` from the page, then reload.
- **Phone** (emulator up): take a screenshot, tap **Dev Sign In** with
  `adb shell input tap`, then take a screenshot to confirm the Trips tab loads.

Skip whichever surface is not running. Do not start servers just for this.

### 5. Report

Say: reset done, ids match, which surfaces are signed back in, and where the backup is.
Give the restore command:

```powershell
Copy-Item "<scratchpad>\db-backup\local.db" C:\dev\Floc\floc\apps\web\local.db -Force
```

Stop the servers before restoring: the copy must not land on an open file.

## Gotchas

- **Dates are relative to today, on purpose.** Ids and content are fixed; trip
  dates move with the calendar, so an upcoming trip never turns into a past one.
  A test that asserts a literal date will fail tomorrow. Assert on ids and names instead.
- **Kept on purpose:** `__drizzle_migrations` (the schema journal) and `fx_rate`
  (a cache of an outside API).
- **Fixed ids only hold on an empty database.** `db:seed` alone keeps an
  account's existing id. Only `db:reset` guarantees `dev-user`.
- **A new table needs nothing.** The wipe reads `sqlite_master` and turns foreign
  keys off for the sweep, so a new table is not a new ordering problem.
- **This is not `pnpm verify`.** The reset does not touch `.next`, but verify
  does. Stop the servers before verify, as always.
