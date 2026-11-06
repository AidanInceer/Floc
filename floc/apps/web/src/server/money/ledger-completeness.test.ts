import { beforeAll, beforeEach, expect, it } from "vitest";
import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario } from "@/test/db";
import { listExpenses, listSplits, listSettlements } from "./money";
import { ledgerBalances } from "@floc/core/money/ledger";

beforeAll(migrateTestDb);
beforeEach(resetDb);

it("calculates the whole balance when a trip exceeds the activity display ceiling", async () => {
  const world = await seedScenario();
  for (let page = 0; page < 41; page++) {
    const count = page === 40 ? 1 : 50;
    const expenses = await db.insert(schema.expense).values(Array.from({ length: count }, () => ({
      tripId: world.ours.id, createdBy: world.admin, paidBy: world.admin,
      description: "Train", amountMinor: 100, currency: "GBP" as const, splitType: "even" as const,
    }))).returning({ id: schema.expense.id });
    await db.insert(schema.expenseSplit).values(expenses.flatMap((e) => [
      { expenseId: e.id, userId: world.admin, owedAmountMinor: 50 },
      { expenseId: e.id, userId: world.member, owedAmountMinor: 50 },
    ]));
  }
  const [expenses, splits, settlements] = await Promise.all([
    listExpenses(world.ours.id), listSplits(world.ours.id), listSettlements(world.ours.id),
  ]);
  const balances = ledgerBalances({ expenses, splits, settlements });
  expect(balances.GBP[world.admin]).toBe(100050);
  expect(balances.GBP[world.member]).toBe(-100050);
});
