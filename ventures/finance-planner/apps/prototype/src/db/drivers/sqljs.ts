// SQLite-in-the-browser driver (sql.js — SQLite compiled to WebAssembly).
//
// This is the prototype's default. It is a real SQL database: real DDL, real
// joins, real transactions — it just happens to live in a byte array that we
// persist to IndexedDB after each write, rather than on a server's disk.
//
// sql.js is synchronous; the async signatures exist to satisfy the `SqlDriver`
// port, which is what lets a network-bound Postgres driver take its place.

import initSqlJs from "sql.js";
import type { Database, SqlJsStatic } from "sql.js";
import wasmUrl from "sql.js/dist/sql-wasm.wasm?url";
import type { Row, SqlDriver, SqlValue } from "../driver";

let runtime: Promise<SqlJsStatic> | null = null;

function sqlJs(): Promise<SqlJsStatic> {
  runtime ??= initSqlJs({ locateFile: () => wasmUrl });
  return runtime;
}

export interface SqlJsDriverOptions {
  /** Called after every committed write with the serialised database. */
  onPersist?: (bytes: Uint8Array) => void;
  /** An existing database file to open instead of creating an empty one. */
  initialBytes?: Uint8Array | null;
}

export async function createSqlJsDriver(
  options: SqlJsDriverOptions = {},
): Promise<SqlDriver> {
  const SQL = await sqlJs();
  const db = new SQL.Database(options.initialBytes ?? undefined);

  // Foreign keys are off by default in SQLite. Turn them on so the schema's
  // REFERENCES clauses actually mean something here, as they would in Postgres.
  db.run("PRAGMA foreign_keys = ON;");

  let depth = 0; // transaction nesting depth; SQLite has no nested BEGIN

  const persist = () => {
    if (depth > 0) return; // mid-transaction — wait for the commit
    options.onPersist?.(db.export());
  };

  const driver: SqlDriver = {
    dialect: "sqlite",

    async query<T = Row>(sql: string, params: SqlValue[] = []): Promise<T[]> {
      const stmt = db.prepare(sql);
      try {
        stmt.bind(params as never);
        const out: T[] = [];
        while (stmt.step()) out.push(stmt.getAsObject() as T);
        return out;
      } finally {
        stmt.free();
      }
    },

    async exec(sql: string, params: SqlValue[] = []): Promise<void> {
      const stmt = db.prepare(sql);
      try {
        stmt.bind(params as never);
        stmt.step();
      } finally {
        stmt.free();
      }
      persist();
    },

    async execScript(sql: string): Promise<void> {
      db.run(sql);
      persist();
    },

    async transaction<T>(fn: (tx: SqlDriver) => Promise<T>): Promise<T> {
      if (depth > 0) return fn(driver); // already inside one — join it
      db.run("BEGIN");
      depth++;
      try {
        const result = await fn(driver);
        depth--;
        db.run("COMMIT");
        persist();
        return result;
      } catch (err) {
        depth--;
        db.run("ROLLBACK");
        throw err;
      }
    },

    async close(): Promise<void> {
      db.close();
    },
  };

  return driver;
}
