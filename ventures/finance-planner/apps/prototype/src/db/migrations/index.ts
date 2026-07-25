// The migration set, in order.
//
// Adding a migration is two steps: drop a numbered `.sql` file in this folder,
// then add it to the array below. Files are imported raw so the same text is
// what runs against SQLite here and against Postgres in a deployed environment
// — there is no generated or dialect-translated SQL anywhere.

import init from "./001_init.sql?raw";

export interface Migration {
  version: number;
  name: string;
  sql: string;
}

export const MIGRATIONS: Migration[] = [
  { version: 1, name: "init", sql: init },
];
