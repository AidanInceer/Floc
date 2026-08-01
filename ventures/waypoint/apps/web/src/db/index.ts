import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import { requireInProduction } from "../lib/env.ts";
import * as schema from "./schema.ts";

/**
 * Turso (libSQL) over HTTP — reachable from Vercel Functions with no raw TCP
 * (ticket 02). With no TURSO_DATABASE_URL set this falls back to a local file
 * database so the app runs before any account is provisioned — outside
 * production only. In production a missing URL is fatal at module load
 * (ticket 112): silently serving an empty file database looks like total data
 * loss to anyone hitting it.
 */
// Naming the mistake directly: pulled into a client bundle, libSQL otherwise
// fails with an opaque "URL_SCHEME_NOT_SUPPORTED" about the file: URL, a long
// way from the actual cause. Not `import "server-only"` — the seed script runs
// this module under plain Node, where that package throws.
if (typeof window !== "undefined") {
  throw new Error(
    "src/db must never reach the browser — a Client Component is importing it, directly or through a helper. Put the helper in src/server/ (which is `server-only`, so this becomes a build error instead) and leave the client-safe part in src/lib/ — see lib/tabs.ts vs server/unlocks.ts.",
  );
}

const client = createClient({
  url: requireInProduction("TURSO_DATABASE_URL", "file:./local.db"),
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
export { schema };
