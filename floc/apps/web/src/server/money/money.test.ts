/**
 * The money aggregate's one headline rule (ticket 108): an expense and its
 * whole split set move together, and a split has no independent life.
 *
 * `writeExpense` is the only way to write either table, so these tests are how
 * non-negotiable 2 — `expense_split` rows are snapshots, rewritten whole and
 * never merged — stops being a comment and starts being a property.
 */
import { and, eq, isNull } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

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
    // Integer minor units, and the splits sum to the total exactly (rule 1).
    expect(splits.reduce((n, s) => n + s.owedAmountMinor, 0)).toBe(3000);
  });

  it("replaces the whole split set on an edit rather than merging rows", async () => {
    const row = await seedExpense();

    await writeExpense({
      tripId: world.ours.id,
      expenseId: row.id,
      createdBy: world.admin,
      fields: fields({ amountMinor: 1000, description: "Ferry, one way" }),
      // The member is tapped out: no row, not a zero row.
      splits: [{ userId: world.admin, owedAmountMinor: 1000 }],
    });

    expect(await expensesOf(world.ours.id)).toHaveLength(1);
    const splits = await splitsOf(row.id);
    expect(splits).toHaveLength(1);
    expect(splits[0].userId).toBe(world.admin);
    expect((await expensesOf(world.ours.id))[0].description).toBe("Ferry, one way");
    // The old snapshot is kept, marked gone (rule 8).
    const all = await db.select().from(schema.expenseSplit).where(eq(schema.expenseSplit.expenseId, row.id)).all();
    expect(all.length).toBeGreaterThan(1);
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
    // The splits are snapshots — hidden by the parent's `deletedAt`, not rewritten.
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

/** Ticket 115 (M10) — writes filter soft-deletes too, not just reads. */
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
