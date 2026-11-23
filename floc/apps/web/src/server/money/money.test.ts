import { and, eq, isNull } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import {
  findLiveExpense,
  findLiveSettlement,
  listSettlements,
  rewriteSettlement,
  softDeleteExpense,
  softDeleteSettlement,
  writeExpense,
  writeSettlement,
  writeSettlements,
  type ExpenseFields,
} from "@/server/money/money";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

const fields = (over: Partial<ExpenseFields> = {}): ExpenseFields => ({
  dayId: null,
  paidBy: world.admin,
  description: "Ferry tickets",
  amountMinor: 3000,
  currency: "GBP",
  splitType: "even",
  category: "other",
  notes: null,
  ...over,
});

const expensesOf = (tripId: number) =>
  db.select().from(schema.expense).where(eq(schema.expense.tripId, tripId)).all();

const splitsOf = (expenseId: number) =>
  db
    .select()
    .from(schema.expenseSplit)
    .where(and(eq(schema.expenseSplit.expenseId, expenseId), isNull(schema.expenseSplit.deletedAt)))
    .all();

async function seedExpense(over: Partial<ExpenseFields> = {}) {
  await writeExpense({
    tripId: world.ours.id,
    createdBy: world.admin,
    fields: fields(over),
    splits: [
      { userId: world.admin, owedAmountMinor: 1500 },
      { userId: world.member, owedAmountMinor: 1500 },
    ],
  });
  return (await expensesOf(world.ours.id))[0];
}

describe("writing an expense", () => {
  it("creates the expense and its splits in one go", async () => {
    const row = await seedExpense();
    expect(row.description).toBe("Ferry tickets");
    expect(row.amountMinor).toBe(3000);

    const splits = await splitsOf(row.id);
    expect(splits).toHaveLength(2);
    expect(splits.reduce((n, s) => n + s.owedAmountMinor, 0)).toBe(3000);
  });

  it("replaces the whole split set on an edit rather than merging rows", async () => {
    const row = await seedExpense();

    await writeExpense({
      tripId: world.ours.id,
      expenseId: row.id,
      createdBy: world.admin,
      fields: fields({ amountMinor: 1000, description: "Ferry, one way" }),
      splits: [{ userId: world.admin, owedAmountMinor: 1000 }],
    });

    expect(await expensesOf(world.ours.id)).toHaveLength(1);
    const splits = await splitsOf(row.id);
    expect(splits).toHaveLength(1);
    expect(splits[0].userId).toBe(world.admin);
    expect((await expensesOf(world.ours.id))[0].description).toBe("Ferry, one way");
    const all = await db.select().from(schema.expenseSplit).where(eq(schema.expenseSplit.expenseId, row.id)).all();
    expect(all.length).toBeGreaterThan(1);
  });

  const editOf = (expenseId: number, splits: { userId: string; owedAmountMinor: number }[]) =>
    writeExpense({
      tripId: world.ours.id,
      expenseId,
      createdBy: world.admin,
      fields: fields({ amountMinor: 1000, description: "Ferry, one way" }),
      splits,
    });

  it("saves an edit in one trip to the database (rule 2)", async () => {
    const row = await seedExpense();
    const interactive = vi.spyOn(db, "transaction");
    const batch = vi.spyOn(db, "batch");

    await editOf(row.id, [{ userId: world.admin, owedAmountMinor: 1000 }]);

    expect(interactive).not.toHaveBeenCalled();
    expect(batch).toHaveBeenCalledTimes(1);
    interactive.mockRestore();
    batch.mockRestore();
  });

  it("leaves the expense and its splits whole when an edit fails (rule 2)", async () => {
    const row = await seedExpense();

    await expect(editOf(row.id, [{ userId: "nobody", owedAmountMinor: 1000 }])).rejects.toThrow();

    expect((await expensesOf(world.ours.id))[0]).toMatchObject({ amountMinor: 3000, description: "Ferry tickets" });
    expect(await splitsOf(row.id)).toHaveLength(2);
  });

  it("folds rapid edits into one activity and keeps a read notice read", async () => {
    const row = await seedExpense();
    const split = [
      { userId: world.admin, owedAmountMinor: 500 },
      { userId: world.member, owedAmountMinor: 500 },
    ];
    await editOf(row.id, split);
    await db.update(schema.notification).set({ readAt: new Date() });
    await editOf(row.id, split);

    const changed = await db.select().from(schema.activity).where(eq(schema.activity.kind, "expense_changed")).all();
    expect(changed).toHaveLength(1);
    const notices = await db
      .select()
      .from(schema.notification)
      .where(and(eq(schema.notification.activityId, changed[0].id), eq(schema.notification.userId, world.member)))
      .all();
    expect(notices).toHaveLength(1);
    expect(notices[0].loud).toBe(false);
    expect(notices[0].readAt).not.toBeNull();
  });
});

describe("finding an expense", () => {
  it("refuses one belonging to another trip", async () => {
    const row = await seedExpense();
    expect(await findLiveExpense(world.theirs.id, row.id)).toBeUndefined();
    expect((await findLiveExpense(world.ours.id, row.id))?.id).toBe(row.id);
  });

  it("stops finding it once it is soft-deleted, and leaves the splits alone", async () => {
    const row = await seedExpense();
    await softDeleteExpense(world.ours.id, row.id);

    expect(await findLiveExpense(world.ours.id, row.id)).toBeUndefined();
    expect(await splitsOf(row.id)).toHaveLength(2);
  });
});

describe("settlements", () => {
  const settle = () =>
    writeSettlement({
      tripId: world.ours.id,
      createdBy: world.member,
      fromUserId: world.member,
      toUserId: world.admin,
      amountMinor: 1500,
      currency: "GBP",
    });

  it("records a transfer and lists it live", async () => {
    await settle();
    const rows = await listSettlements(world.ours.id);
    expect(rows).toHaveLength(1);
    expect(rows[0].fromUserId).toBe(world.member);
    expect(rows[0].toUserId).toBe(world.admin);
    expect(rows[0].amountMinor).toBe(1500);
  });

  it("reverts by soft-delete — the row drops off the live list", async () => {
    await settle();
    const [row] = await listSettlements(world.ours.id);

    await softDeleteSettlement(world.ours.id, row.id);

    expect(await listSettlements(world.ours.id)).toHaveLength(0);
    expect(await findLiveSettlement(world.ours.id, row.id)).toBeUndefined();
  });

  it("will not find or delete one belonging to another trip", async () => {
    await settle();
    const [row] = await listSettlements(world.ours.id);
    expect(await findLiveSettlement(world.theirs.id, row.id)).toBeUndefined();
  });

  it("records several transfers in one write, each in its own currency", async () => {
    await writeSettlements(world.ours.id, world.member, [
      { fromUserId: world.member, toUserId: world.admin, amountMinor: 1500, currency: "GBP" },
      { fromUserId: world.member, toUserId: world.admin, amountMinor: 3270, currency: "EUR" },
    ]);
    const rows = await listSettlements(world.ours.id);
    expect(rows.map((r) => `${r.amountMinor} ${r.currency}`).sort()).toEqual(["1500 GBP", "3270 EUR"]);
  });

  it("rewrites a live settlement in place, dropping a cross-currency snapshot (#361)", async () => {
    await writeSettlement({
      tripId: world.ours.id,
      createdBy: world.member,
      fromUserId: world.member,
      toUserId: world.admin,
      amountMinor: 1750,
      currency: "EUR",
      clearsAmountMinor: 1500,
      clearsCurrency: "GBP",
      fxRate: 0.85,
      fxRateDate: "2026-09-01",
    });
    const [row] = await listSettlements(world.ours.id);

    expect(
      await rewriteSettlement(world.ours.id, row.id, {
        fromUserId: world.admin,
        toUserId: world.member,
        amountMinor: 900,
        currency: "GBP",
      }),
    ).toBe(true);

    const [edited] = await listSettlements(world.ours.id);
    expect(edited).toMatchObject({
      id: row.id,
      fromUserId: world.admin,
      toUserId: world.member,
      amountMinor: 900,
      currency: "GBP",
      clearsAmountMinor: null,
      clearsCurrency: null,
      fxRate: null,
      fxRateDate: null,
    });
  });

  it("will not rewrite a reverted settlement, or another trip's", async () => {
    await settle();
    const [row] = await listSettlements(world.ours.id);
    const edit = { fromUserId: world.member, toUserId: world.admin, amountMinor: 1, currency: "GBP" as const };

    expect(await rewriteSettlement(world.theirs.id, row.id, edit)).toBe(false);
    await softDeleteSettlement(world.ours.id, row.id);
    expect(await rewriteSettlement(world.ours.id, row.id, edit)).toBe(false);

    const [dead] = await db.select().from(schema.settlement).all();
    expect(dead.amountMinor).toBe(1500);
  });

  it("writes none of them when one is refused", async () => {
    await expect(
      writeSettlements(world.ours.id, world.member, [
        { fromUserId: world.member, toUserId: world.admin, amountMinor: 1500, currency: "GBP" },
        { fromUserId: world.member, toUserId: "u-nobody", amountMinor: 900, currency: "GBP" },
      ]),
    ).rejects.toThrow();
    expect(await listSettlements(world.ours.id)).toEqual([]);
  });
});

describe("writes against deleted rows", () => {
  it("does not re-stamp deletedAt on a second delete", async () => {
    const row = await seedExpense();
    await softDeleteExpense(world.ours.id, row.id);
    const first = (await expensesOf(world.ours.id))[0].deletedAt;

    await softDeleteExpense(world.ours.id, row.id);

    expect((await expensesOf(world.ours.id))[0].deletedAt?.getTime()).toBe(
      first?.getTime(),
    );
  });
});
