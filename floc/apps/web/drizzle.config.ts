import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "turso",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL ?? "file:./local.db",
    // Why `|| undefined`: a task worktree blanks the token for its local file, and drizzle-kit refuses an empty one.
    authToken: process.env.TURSO_AUTH_TOKEN || undefined,
  },
});
