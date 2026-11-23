import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import { requireInProduction } from "../lib/env.ts";
import { databaseFetch } from "./database-fetch.ts";
import * as schema from "./schema.ts";

if (typeof window !== "undefined") {
  throw new Error(
    "src/db must never reach the browser — a Client Component is importing it, directly or through a helper. Put the helper in src/server/ (which is `server-only`, so this becomes a build error instead) and leave the client-safe part in src/lib/ — see lib/tabs.ts vs server/audit.ts.",
  );
}

const client = createClient({
  url: requireInProduction("TURSO_DATABASE_URL", "file:./local.db"),
  authToken: process.env.TURSO_AUTH_TOKEN,
  fetch: databaseFetch,
});

export const db = drizzle(client, { schema });
export { schema };
