import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { findTripAccess } from "@/server/access";
import { listExpenses, listSettlements } from "@/server/money/money";
import { joinWithLink } from "@/server/trips/invites";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";

import { recordTransfers, removeExpense, saveExpense, type ExpenseSave } from "./money-save";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

async function accessFor(viewerId: string, tripId = world.ours.id) {
  const access = await findTripAccess(tripId, viewerId);
  if (!access) throw new Error("no access");
  return access;
}

const bill = (patch: Partial<ExpenseSave> = {}): ExpenseSave => ({
  description: "Dinner",
  amountMinor: 4000,
  currency: "GBP",
  category: "food",
  splitType: "shares",
  paidBy: world.admin,
  dayId: null,
  notes: null,
  splits: [
    { userId: world.admin, owedAmountMinor: 2000 },
    { userId: world.member, owedAmountMinor: 2000 },
  ],
  ...patch,
});

describe("saving an expense", () => {
  it("writes it and says nothing", async () => {
    expect(await saveExpense(await accessFor(world.admin), bill())).toBeNull();
    expect(await listExpenses(world.ours.id)).toHaveLength(1);
  });

  it("gives the same sentence for an empty description whichever door it came from", async () => {
    expect(await saveExpense(await accessFor(world.admin), bill({ description: "" }))).toMatchObject({ message: "Give the expense a description.", kind: "invalid" });
    expect(await listExpenses(world.ours.id)).toHaveLength(0);
  });

  it("refuses a sharer who is not on the trip", async () => {
    const splits = [
      { userId: world.admin, owedAmountMinor: 2000 },
      { userId: world.outsider, owedAmountMinor: 2000 },
    ];
    expect(await saveExpense(await accessFor(world.admin), bill({ splits }))).toMatchObject({ message: "Everyone sharing it must be on the trip." });
    expect(await listExpenses(world.ours.id)).toHaveLength(0);
  });

  it("rewrites the expense when given its id", async () => {
    const access = await accessFor(world.admin);
    await saveExpense(access, bill());
    const [written] = await listExpenses(world.ours.id);
    expect(await saveExpense(access, bill({ expenseId: written!.id, description: "Supper" }))).toBeNull();
    expect((await listExpenses(world.ours.id)).map((e) => e.description)).toEqual(["Supper"]);
  });

  it("refuses an expense that belongs to another trip", async () => {
    await saveExpense(await accessFor(world.outsider, world.theirs.id), bill({ paidBy: world.outsider, splits: [{ userId: world.outsider, owedAmountMinor: 4000 }] }));
    const [theirs] = await listExpenses(world.theirs.id);
    expect(await saveExpense(await accessFor(world.admin), bill({ expenseId: theirs!.id }))).toMatchObject({ message: "That expense no longer exists." });
  });
});

describe("removing an expense", () => {
  it("takes it off the ledger", async () => {
    const access = await accessFor(world.admin);
    await saveExpense(access, bill());
    const [written] = await listExpenses(world.ours.id);
    await removeExpense(access, written!.id);
    expect(await listExpenses(world.ours.id)).toHaveLength(0);
  });
});

describe("recording transfers", () => {
  const between = (from: string, to: string) => [{ fromUserId: from, toUserId: to, amountMinor: 500, currency: "GBP" as const }];

  it("records a transfer the viewer is party to", async () => {
    expect(await recordTransfers(await accessFor(world.member), between(world.member, world.admin))).toBeNull();
    expect(await listSettlements(world.ours.id)).toHaveLength(1);
  });

  it("refuses a settlement between one person and themselves", async () => {
    await expect(recordTransfers(await accessFor(world.member), between(world.admin, world.admin))).resolves.toMatchObject({ kind: "invalid" });
    expect(await listSettlements(world.ours.id)).toHaveLength(0);
  });

  it("forbids a transfer the viewer is no part of", async () => {
    await joinWithLink(world.ours.id, world.outsider);
    expect(await recordTransfers(await accessFor(world.member), between(world.admin, world.outsider))).toMatchObject({ kind: "forbidden" });
    expect(await listSettlements(world.ours.id)).toHaveLength(0);
  });

  it("writes none of them when one is refused", async () => {
    const mixed = [...between(world.member, world.admin), ...between(world.member, world.member)];
    expect(await recordTransfers(await accessFor(world.member), mixed)).not.toBeNull();
    expect(await listSettlements(world.ours.id)).toHaveLength(0);
  });
});
