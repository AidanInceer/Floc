import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb } from "@/test/db";

import { devAccountEmail } from "./dev-accounts";

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  process.env.FLOC_DEV_USER_EMAIL = "dev@example.test";
  process.env.FLOC_DEV_USER_PASSWORD = "dev-password";
  await db.insert(schema.user).values({ id: "seed-a-priya", name: "Priya", email: "priya@a.seed.floc.test" });
});
afterEach(() => vi.unstubAllEnvs());

describe("devAccountEmail", () => {
  it("finds the address behind a user id", async () => {
    expect(await devAccountEmail("seed-a-priya")).toBe("priya@a.seed.floc.test");
  });

  it("is null for an id nobody has", async () => {
    expect(await devAccountEmail("nobody")).toBeNull();
  });

  it("is null when the dev door is shut", async () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(await devAccountEmail("seed-a-priya")).toBeNull();
  });
});
