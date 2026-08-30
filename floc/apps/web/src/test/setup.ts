/**
 * Test setup, applied to every suite (ticket 105) — runs before any test
 * file's imports, which a vitest setup file guarantees.
 *
 * 1. Points the DB at a temp file via `TURSO_DATABASE_URL` (the seam
 *    `src/db/index.ts` builds its libSQL client from) — real queries, no
 *    mock. One file per worker, not per suite: `resetDb()` truncates between
 *    suites, so a file per suite would just re-run migrations needlessly.
 * 2. Stubs the Next.js request context. `notFound()`/`redirect()` stay
 *    *throwing* stubs, not no-ops — a no-op would let an action carry on past
 *    its own access check and quietly pass a test it should fail.
 */
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { vi } from "vitest";

const dir = mkdtempSync(join(tmpdir(), "floc-test-"));
const worker = process.env.VITEST_WORKER_ID ?? "0";
process.env.TURSO_DATABASE_URL = `file:${join(dir, `w${worker}.db`)}`;
delete process.env.TURSO_AUTH_TOKEN;

export const NOT_FOUND = "NEXT_NOT_FOUND"; // see expectNotFound in ./db.ts
export const REDIRECT = "NEXT_REDIRECT"; // carries the target so tests can assert it

vi.mock("next/cache", () => ({
  revalidatePath: () => {},
  revalidateTag: () => {},
}));

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error(NOT_FOUND);
  },
  redirect: (to: string) => {
    throw new Error(`${REDIRECT}:${to}`);
  },
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
  cookies: async () => new Map(),
}));

/**
 * Who `requireUser` / `requireTripAccess` see. Set by `signIn()` in ./db.ts.
 * Stubbed at `auth.api.getSession` (Better Auth's request-cookie read, with
 * no request to read) rather than at `lib/access.ts` itself, which is the
 * thing most of these tests exist to check.
 */
export const currentUser: { id: string | null } = { id: null };

vi.mock("@/server/auth", () => ({
  enabledProviders: { google: false, facebook: false },
  auth: {
    api: {
      getSession: async () => {
        if (!currentUser.id) return null;
        const { db } = await import("@/db");
        const { user } = await import("@/db/schema");
        const { eq } = await import("drizzle-orm");
        const row = await db
          .select()
          .from(user)
          .where(eq(user.id, currentUser.id))
          .get();
        return row ? { user: row, session: { userId: row.id } } : null;
      },
    },
  },
}));

// Stubbed so a suite never depends on RESEND_API_KEY or prints a send.
vi.mock("@/server/email", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/server/email")>();
  return { ...actual, sendEmails: async () => {} };
});
