// Database entry point — pick a driver, migrate, hand back repositories.
//
// `openDatabase()` is the one function the app calls. Moving this prototype to
// hosted Postgres means changing the driver constructed here (and moving the
// call into `services/api`, since a browser must never hold credentials) —
// the migrations and repositories come along unchanged.

import { migrate } from "./migrate";
import { createRepositories } from "./repository";
import type { Repositories } from "./repository";
import { createSqlJsDriver } from "./drivers/sqljs";
import { debouncePersist, deleteDatabaseFile, loadDatabaseFile } from "./persistence";
import type { SqlDriver } from "./driver";
import { seed } from "../seed";

export interface OpenDatabaseResult {
  driver: SqlDriver;
  repos: Repositories;
  /** True when this call created and seeded a fresh database. */
  seeded: boolean;
}

export async function openDatabase(): Promise<OpenDatabaseResult> {
  const existing = await loadDatabaseFile();

  const driver = await createSqlJsDriver({
    initialBytes: existing,
    onPersist: debouncePersist(),
  });

  await migrate(driver);

  const repos = createRepositories(driver);

  // An empty (or newly created) database gets the worked example, so the app
  // has something real to render on first run.
  const state = await repos.loadAppState();
  if (state) return { driver, repos, seeded: false };

  await repos.seedAppState(structuredClone(seed));
  return { driver, repos, seeded: true };
}

/** Wipe the stored database file. The caller is expected to reopen afterwards. */
export async function destroyDatabase(driver: SqlDriver): Promise<void> {
  await driver.close();
  await deleteDatabaseFile();
}

export { createRepositories } from "./repository";
export { migrate } from "./migrate";
export type { SqlDriver } from "./driver";
export type { Repositories } from "./repository";
