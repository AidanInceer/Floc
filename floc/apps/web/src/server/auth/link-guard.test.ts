/**
 * Account pre-hijack: somebody signs up with an address they do not own, then
 * the owner signs in with Google and is linked onto that account.
 */
import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { dropUnprovenPassword } from "@/server/auth/link-guard";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  await db.insert(schema.account).values([
    { id: "acc-pw", accountId: world.outsider, providerId: "credential", userId: world.outsider, password: "hash" },
    { id: "acc-g", accountId: "google-1", providerId: "google", userId: world.outsider },
  ]);
  await db.insert(schema.session).values({
    id: "s-1",
    token: "t-1",
    userId: world.outsider,
    expiresAt: new Date(Date.now() + 60_000),
  });
});

const providers = async (userId: string) =>
  (await db.select().from(schema.account).where(eq(schema.account.userId, userId)).all())
    .map((a) => a.providerId)
    .sort();

const sessions = (userId: string) =>
  db.select().from(schema.session).where(eq(schema.session.userId, userId)).all();

describe("a provider linking onto an existing account", () => {
  it("drops the password and every session when the address was never confirmed", async () => {
    await dropUnprovenPassword(world.outsider, "google");

    expect(await providers(world.outsider)).toEqual(["google"]);
    expect(await sessions(world.outsider)).toEqual([]);
  });

  it("keeps both when the address was confirmed", async () => {
    await db.update(schema.user).set({ emailVerified: true }).where(eq(schema.user.id, world.outsider));

    await dropUnprovenPassword(world.outsider, "google");

    expect(await providers(world.outsider)).toEqual(["credential", "google"]);
    expect(await sessions(world.outsider)).toHaveLength(1);
  });

  it("does nothing when the new account is the password itself", async () => {
    await dropUnprovenPassword(world.outsider, "credential");

    expect(await providers(world.outsider)).toEqual(["credential", "google"]);
  });
});
