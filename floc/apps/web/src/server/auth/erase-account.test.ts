/**
 * Deleting an account. The row stays, so every expense, split and note that
 * points at it stays valid (rule 2); what made it a person goes.
 */
import { and, eq, isNull } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { ERASED_NAME, eraseAccount } from "@/server/auth/erase-account";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  await db.insert(schema.userProfile).values({
    userId: world.member,
    displayName: "Mo Rahman",
    dietaryNotes: "nut allergy",
    friendCode: "MO-1234",
  });
  await db.insert(schema.account).values({
    id: "acc-1",
    accountId: world.member,
    providerId: "credential",
    userId: world.member,
    password: "hash",
  });
  await db.insert(schema.session).values({
    id: "s-1",
    token: "t-1",
    userId: world.member,
    expiresAt: new Date(Date.now() + 60_000),
  });
  const bill = await db
    .insert(schema.expense)
    .values({
      tripId: world.ours.id,
      createdBy: world.member,
      paidBy: world.member,
      description: "Ferry",
      amountMinor: 4000,
      currency: "GBP",
      splitType: "even",
    })
    .returning({ id: schema.expense.id })
    .get();
  await db.insert(schema.expenseSplit).values([
    { expenseId: bill.id, userId: world.member, owedAmountMinor: 2000 },
    { expenseId: bill.id, userId: world.admin, owedAmountMinor: 2000 },
  ]);
});

const person = (id: string) =>
  db.select().from(schema.user).where(eq(schema.user.id, id)).get();

describe("erasing an account", () => {
  it("keeps the row that the ledger points at, with nothing personal on it", async () => {
    await eraseAccount(world.member);

    const row = await person(world.member);
    expect(row?.name).toBe(ERASED_NAME);
    expect(row?.email).not.toContain("example.test");
    const profile = await db
      .select()
      .from(schema.userProfile)
      .where(eq(schema.userProfile.userId, world.member))
      .get();
    expect(profile?.displayName).toBeNull();
    expect(profile?.dietaryNotes).toBeNull();
    expect(profile?.friendCode).toBeNull();
  });

  it("ends every way back in", async () => {
    await eraseAccount(world.member);

    expect(
      await db.select().from(schema.account).where(eq(schema.account.userId, world.member)).all(),
    ).toEqual([]);
    expect(
      await db.select().from(schema.session).where(eq(schema.session.userId, world.member)).all(),
    ).toEqual([]);
  });

  it("leaves every trip and keeps the money as it was", async () => {
    await eraseAccount(world.member);

    const live = await db
      .select()
      .from(schema.tripMembership)
      .where(
        and(
          eq(schema.tripMembership.userId, world.member),
          isNull(schema.tripMembership.deletedAt),
        ),
      )
      .all();
    expect(live).toEqual([]);
    const splits = await db.select().from(schema.expenseSplit).all();
    expect(splits.map((s) => s.owedAmountMinor)).toEqual([2000, 2000]);
  });

  it("frees the address for a new account", async () => {
    await eraseAccount(world.member);

    await db
      .insert(schema.user)
      .values({ id: "u-new", name: "Mo", email: "u-member@example.test" });
    expect((await person("u-new"))?.email).toBe("u-member@example.test");
  });
});
