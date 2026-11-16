import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { vi } from "vitest";

const dir = mkdtempSync(join(tmpdir(), "floc-test-"));
const worker = process.env.VITEST_WORKER_ID ?? "0";
process.env.TURSO_DATABASE_URL = `file:${join(dir, `w${worker}.db`)}`;
delete process.env.TURSO_AUTH_TOKEN;

export const NOT_FOUND = "NEXT_NOT_FOUND";
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

export const currentUser: { id: string | null } = { id: null };

vi.mock("@/server/auth/auth", () => ({
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

vi.mock("@/server/auth/email", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/server/auth/email")>();
  return { ...actual, sendEmails: async (batch: unknown[]) => batch.map(() => true) };
});
