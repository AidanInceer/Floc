/**
 * Test setup, applied to every suite (ticket 105).
 *
 * Two jobs, both of which have to happen *before* any test file's imports run —
 * which is exactly what a vitest setup file guarantees.
 *
 * **1. Point the database at a temporary file.** `src/db/index.ts` builds its
 * libSQL client at module load from `TURSO_DATABASE_URL`, and libSQL already
 * speaks `file:`, so a different URL is the entire seam. No ORM mock, no
 * fixture framework: the queries under test are the real queries, because the
 * real queries are what was wrong.
 *
 * One file per vitest worker, not per suite. Suites within a worker run
 * sequentially and `resetDb()` truncates between them, so they cannot see each
 * other's rows; a file per suite would re-run the migrations for every one.
 *
 * **2. Stub the Next.js request context.** A Server Action called from a test
 * has no request behind it, so `revalidatePath` has nothing to invalidate and
 * `headers()` has nothing to read. `notFound()` and `redirect()` are kept as
 * *throwing* stubs rather than no-ops — they are control flow in the code under
 * test, and a no-op would let an action carry on past its own access check and
 * quietly pass a test it should fail.
 */
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { vi } from "vitest";

const dir = mkdtempSync(join(tmpdir(), "waypoint-test-"));
const worker = process.env.VITEST_WORKER_ID ?? "0";
process.env.TURSO_DATABASE_URL = `file:${join(dir, `w${worker}.db`)}`;
delete process.env.TURSO_AUTH_TOKEN;

/** Thrown by the `notFound()` stub — see `expectNotFound` in ./db.ts. */
export const NOT_FOUND = "NEXT_NOT_FOUND";
/** Thrown by the `redirect()` stub, carrying its target so tests can assert it. */
export const REDIRECT = "NEXT_REDIRECT";

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
 *
 * Better Auth reads a session cookie off the request; with no request there is
 * nothing to read, so the stub is at `auth.api.getSession` — the single point
 * `lib/access.ts` goes through — rather than at `lib/access` itself. Mocking
 * `lib/access` would mock out the thing most of these tests exist to check.
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

/**
 * Email is a side effect of several actions under test and needs no assertion
 * here — the catalogue has its own tests. Stubbed so a suite never depends on
 * `RESEND_API_KEY` and never prints a send to the test output.
 */
vi.mock("@/server/email", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/server/email")>();
  return { ...actual, sendEmail: async () => {} };
});
