import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { ensureProfile, updateProfileFields } from "@/server/auth/profile";
import { clearRatesMemo } from "@/server/money/fx";
import { listExpenses, listSettlements, listSplits, writeExpense } from "@/server/money/money";
import { settleUpFrom } from "@/server/money/settle-up";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  clearRatesMemo();
  world = await seedScenario();
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ date: "2026-11-01", rates: { GBP: 0.8, USD: 1.04 } }) })));
});
afterEach(() => vi.unstubAllGlobals());

async function ledger() {
  await writeExpense({
    tripId: world.ours.id,
    createdBy: world.admin,
    fields: { dayId: null, paidBy: world.admin, description: "Ferry tickets", amountMinor: 3000, currency: "GBP", splitType: "even", category: "other", notes: null },
    splits: [
      { userId: world.admin, owedAmountMinor: 1500 },
      { userId: world.member, owedAmountMinor: 1500 },
    ],
  });
  const [expenses, splits, settlements] = await Promise.all([listExpenses(world.ours.id), listSplits(world.ours.id), listSettlements(world.ours.id)]);
  return { expenses, splits, settlements };
}

describe("settleUpFrom", () => {
  it("reads the home currency of anyone the caller's homes leave out", async () => {
    await ensureProfile(world.member);
    await updateProfileFields(world.member, { homeCurrency: "EUR" });
    const held = await ledger();

    const read = await settleUpFrom({ ledger: held, viewerId: world.admin });
    const given = await settleUpFrom({ ledger: held, viewerId: world.admin, homes: new Map([[world.admin, "GBP"]]) });

    expect(given).toEqual(read);
  });
});
