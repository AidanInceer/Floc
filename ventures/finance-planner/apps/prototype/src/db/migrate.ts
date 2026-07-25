// Migration runner.
//
// Engine-agnostic: it only uses the `SqlDriver` port, so the same runner brings
// up the browser's SQLite file and a hosted Postgres database. Applied versions
// are recorded in `schema_migrations`, and each migration runs inside its own
// transaction so a failure leaves the database on the last good version.

import type { SqlDriver } from "./driver";
import { MIGRATIONS } from "./migrations";
import type { Migration } from "./migrations";

const LEDGER = `
CREATE TABLE IF NOT EXISTS schema_migrations (
  version     INTEGER PRIMARY KEY,
  name        TEXT NOT NULL,
  applied_at  TEXT NOT NULL
);
`;

/**
 * Bring `driver` up to the latest schema version.
 * Returns the versions applied by this call (empty if already current).
 */
export async function migrate(
  driver: SqlDriver,
  migrations: Migration[] = MIGRATIONS,
): Promise<number[]> {
  await driver.execScript(LEDGER);

  const applied = await driver.query<{ version: number }>(
    "SELECT version FROM schema_migrations",
  );
  const done = new Set(applied.map((r) => Number(r.version)));

  const pending = [...migrations]
    .sort((a, b) => a.version - b.version)
    .filter((m) => !done.has(m.version));

  for (const m of pending) {
    await driver.transaction(async (tx) => {
      await tx.execScript(m.sql);
      await tx.exec(
        "INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)",
        [m.version, m.name, new Date().toISOString()],
      );
    });
  }

  return pending.map((m) => m.version);
}
