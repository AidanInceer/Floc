// PostgreSQL driver — the expansion path off the browser.
//
// This file deliberately does NOT depend on the `pg` package. It takes a
// structurally-typed pool, so a server process wires it up like this:
//
//   import { Pool } from "pg";
//   import { createPostgresDriver } from "…/db/drivers/postgres";
//
//   const driver = createPostgresDriver(new Pool({ connectionString: env.DATABASE_URL }));
//   await migrate(driver);
//
// …and everything above the port — migrations, repositories, the store — runs
// unchanged against it. Credentials come from the environment at the call site;
// nothing in this repo holds a connection string.
//
// Note this is a server-side driver: a browser must not hold database
// credentials, so in a deployed setup the app talks to `services/api`, and the
// API process is what constructs this driver.

import { toNumberedPlaceholders } from "../driver";
import type { Row, SqlDriver, SqlValue } from "../driver";

/** The slice of `pg.Pool` / `pg.PoolClient` this driver needs. */
export interface PgQueryable {
  query(text: string, values?: unknown[]): Promise<{ rows: Row[] }>;
}

export interface PgPoolLike extends PgQueryable {
  /** Checks out a dedicated connection — required for transactions, since
   *  BEGIN/COMMIT must run on one connection rather than across the pool. */
  connect(): Promise<PgClientLike>;
}

export interface PgClientLike extends PgQueryable {
  release(): void;
}

function driverFor(conn: PgQueryable, pool: PgPoolLike | null): SqlDriver {
  const self: SqlDriver = {
    dialect: "postgres",

    async query<T = Row>(sql: string, params: SqlValue[] = []): Promise<T[]> {
      const res = await conn.query(toNumberedPlaceholders(sql), params);
      return res.rows as T[];
    },

    async exec(sql: string, params: SqlValue[] = []): Promise<void> {
      await conn.query(toNumberedPlaceholders(sql), params);
    },

    async execScript(sql: string): Promise<void> {
      // Postgres accepts multi-statement strings when no parameters are bound.
      await conn.query(sql);
    },

    async transaction<T>(fn: (tx: SqlDriver) => Promise<T>): Promise<T> {
      // Without a pool we are already on a checked-out client inside a
      // transaction — join it rather than nesting BEGIN.
      if (!pool) return fn(self);

      const client = await pool.connect();
      const tx = driverFor(client, null);
      try {
        await client.query("BEGIN");
        const result = await fn(tx);
        await client.query("COMMIT");
        return result;
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    },

    async close(): Promise<void> {
      // Pool lifecycle belongs to the process that created it.
    },
  };

  return self;
}

export function createPostgresDriver(pool: PgPoolLike): SqlDriver {
  return driverFor(pool, pool);
}
