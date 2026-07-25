// The storage port.
//
// Everything above this file (migrations, repositories, the store) talks SQL to
// a `SqlDriver` and knows nothing about which engine is underneath. Today the
// browser prototype runs SQLite-in-WASM; swapping to hosted Postgres means
// supplying a different driver, not rewriting queries.
//
// Two conventions keep the SQL above this line portable:
//
//   1. Placeholders are always `?`, positionally. The SQLite driver passes them
//      through; the Postgres driver rewrites them to `$1, $2, …`. Repositories
//      never write dialect-specific placeholders.
//   2. Types stay to the portable subset — TEXT, INTEGER, BIGINT. Money is
//      BIGINT minor units, booleans are INTEGER 0/1. See `migrations/`.

/** A value that can cross the SQL boundary in either direction. */
export type SqlValue = string | number | null | Uint8Array;

export type Row = Record<string, SqlValue>;

export interface SqlDriver {
  /** Which engine is underneath. Repositories should not branch on this; it
   *  exists for diagnostics and for the rare dialect-specific migration. */
  readonly dialect: "sqlite" | "postgres";

  /** Run a query that returns rows. Placeholders are `?`. */
  query<T = Row>(sql: string, params?: SqlValue[]): Promise<T[]>;

  /** Run a single statement that returns nothing. Placeholders are `?`. */
  exec(sql: string, params?: SqlValue[]): Promise<void>;

  /** Run a multi-statement script (DDL). No placeholders. */
  execScript(sql: string): Promise<void>;

  /**
   * Run `fn` inside a transaction, committing on resolve and rolling back on
   * throw. The driver handed to `fn` must be used for every statement in the
   * transaction — do not close over the outer driver.
   */
  transaction<T>(fn: (tx: SqlDriver) => Promise<T>): Promise<T>;

  close(): Promise<void>;
}

/**
 * Rewrite positional `?` placeholders to Postgres `$n`, leaving `?` inside
 * string literals alone. Exported so both the Postgres driver and its tests
 * can use it.
 */
export function toNumberedPlaceholders(sql: string): string {
  let out = "";
  let n = 0;
  let quote: string | null = null;

  for (let i = 0; i < sql.length; i++) {
    const c = sql[i];

    if (quote) {
      out += c;
      // '' and "" are escaped quotes inside a literal — skip the pair.
      if (c === quote && sql[i + 1] === quote) {
        out += sql[++i];
      } else if (c === quote) {
        quote = null;
      }
      continue;
    }

    if (c === "'" || c === '"') {
      quote = c;
      out += c;
      continue;
    }

    out += c === "?" ? `$${++n}` : c;
  }

  return out;
}
