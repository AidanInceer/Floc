import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { db, schema } from "@/db";
import { listExpenses, listSettlements, listSplits } from "@/server/money/money";
import { expectNotFound, migrateTestDb, resetDb, seedScenario, signIn, type Scenario } from "@/test/db";

const { getHomeRates, sendEmails, pending } = vi.hoisted(() => ({
  getHomeRates: vi.fn(),
  sendEmails: vi.fn(),
  pending: [] as unknown[],
}));

vi.mock("next/server", () => ({ after: (task: () => unknown) => void pending.push(task()) }));
vi.mock("@/server/money/fx", () => ({ getHomeRates }));
vi.mock("@/server/auth/email", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/auth/email")>()),
  sendEmails,
}));

import { addExpense, deleteExpense, deleteSettlement, recordSettlement, updateExpense } from "./actions";

let world: Scenario;

function form(fields: Record<string, string | string[]>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    for (const v of [value].flat()) fd.append(key, v);
  }
  return fd;
}

const expenseForm = (overrides: Record<string, string | string[]> = {}) =>
  form({
    tripId: String(world.ours.id),
    description: "Dinner",
    currency: "GBP",
    paidBy: world.admin,
    amount: "30.00",
    participant: [world.admin, world.member],
    ...overrides,
  });

const settlementForm = (overrides: Record<string, string> = {}) =>
  form({
    tripId: String(world.ours.id),
    fromUserId: world.member,
    toUserId: world.admin,
    currency: "GBP",
    amount: "15.00",
    ...overrides,
  });

async function sentTo() {
  await Promise.all(pending.splice(0));
  return sendEmails.mock.calls.flatMap(([batch]) => batch.map((mail: { to: string }) => mail.to));
}

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  sendEmails.mockReset();
  getHomeRates.mockReset();
  signIn(world.admin);
});

describe("adding an expense", () => {
  it("writes the expense and an even split, and leaves telling people to the notification rules (#346)", async () => {
    expect(await addExpense({}, expenseForm())).toEqual({});

    const [expense] = await listExpenses(world.ours.id);
    expect(expense).toMatchObject({ description: "Dinner", amountMinor: 3000, currency: "GBP" });
    const splits = await listSplits(world.ours.id);
    expect(splits.map((s) => s.owedAmountMinor)).toEqual([1500, 1500]);
    expect(await sentTo()).toEqual([]);
  });

  it.each([
    ["no description", { description: "" }, "Give the expense a description."],
    ["no payer", { paidBy: "" }, "Say who paid."],
    ["an unknown currency", { currency: "XXX" }, "Pick a currency."],
    ["a zero amount", { amount: "0" }, "Enter an amount above zero."],
  ])("refuses %s", async (_, overrides, error) => {
    expect(await addExpense({}, expenseForm(overrides))).toEqual({ error });
    expect(await listExpenses(world.ours.id)).toEqual([]);
  });

  it("refuses an amount that is not money, or is past the ceiling", async () => {
    expect((await addExpense({}, expenseForm({ amount: "lots" }))).error).toBeTruthy();
    expect((await addExpense({}, expenseForm({ amount: "999999999" }))).error).toMatch(/Keep an expense under/);
    expect(await listExpenses(world.ours.id)).toEqual([]);
  });

  it("refuses a split with nobody in it", async () => {
    expect((await addExpense({}, expenseForm({ participant: [] }))).error).toBeTruthy();
    expect(await listExpenses(world.ours.id)).toEqual([]);
  });

  it("refuses a pinned share bigger than the bill", async () => {
    const result = await addExpense({}, expenseForm({ [`pin_${world.member}`]: "40.00" }));
    expect(result.error).toBeTruthy();
    expect(await listExpenses(world.ours.id)).toEqual([]);
  });

  it("refuses a trip the viewer is not on (rule 5)", async () => {
    signIn(world.outsider);
    await expectNotFound(() => addExpense({}, expenseForm()));
  });
});

describe("editing an expense", () => {
  async function existing() {
    await addExpense({}, expenseForm());
    return (await listExpenses(world.ours.id))[0].id;
  }

  it("replaces the fields and the whole split set", async () => {
    const expenseId = String(await existing());

    const result = await updateExpense(
      {},
      expenseForm({ expenseId, description: "Late dinner", amount: "12.00", participant: [world.member] }),
    );

    expect(result).toEqual({});
    const [expense] = await listExpenses(world.ours.id);
    expect(expense).toMatchObject({ description: "Late dinner", amountMinor: 1200 });
    const splits = await listSplits(world.ours.id);
    expect(splits.map((s) => [s.userId, s.owedAmountMinor])).toEqual([[world.member, 1200]]);
  });

  it("says so when the expense is gone", async () => {
    expect(await updateExpense({}, expenseForm({ expenseId: "99999" }))).toEqual({
      error: "That expense no longer exists.",
    });
  });

  it.each([
    ["no description", { description: "" }, "Give the expense a description."],
    ["no payer", { paidBy: "" }, "Say who paid."],
    ["an unknown currency", { currency: "XXX" }, "Pick a currency."],
    ["a zero amount", { amount: "0" }, "Enter an amount above zero."],
  ])("refuses %s", async (_, overrides, error) => {
    const expenseId = String(await existing());
    expect(await updateExpense({}, expenseForm({ expenseId, ...overrides }))).toEqual({ error });
    expect((await listExpenses(world.ours.id))[0].description).toBe("Dinner");
  });

  it("refuses a split that cannot be made", async () => {
    const expenseId = String(await existing());
    expect((await updateExpense({}, expenseForm({ expenseId, participant: [] }))).error).toBeTruthy();
  });

  it("soft-deletes, so the ledger no longer shows it", async () => {
    const expenseId = String(await existing());
    await deleteExpense(form({ tripId: String(world.ours.id), expenseId }));
    expect(await listExpenses(world.ours.id)).toEqual([]);
    expect(await db.select().from(schema.expense).all()).toHaveLength(1);
  });
});

describe("recording a settlement", () => {
  beforeEach(() => signIn(world.member));

  it("records a same-currency payment between two members", async () => {
    expect(await recordSettlement({}, settlementForm())).toEqual({});
    const [row] = await listSettlements(world.ours.id);
    expect(row).toMatchObject({ fromUserId: world.member, toUserId: world.admin, amountMinor: 1500, currency: "GBP" });
    expect(getHomeRates).not.toHaveBeenCalled();
  });

  it.each([
    ["an unknown currency", { currency: "XXX" }, "Pick a currency."],
    ["a payment to yourself", { toUserId: "" }, "A settlement is between two different people."],
    ["the same person twice", { toUserId: "u-member" }, "A settlement is between two different people."],
    ["someone off the trip", { toUserId: "u-outsider" }, "Both people must be on the trip."],
    ["a zero amount", { amount: "0" }, "Enter an amount above zero."],
    ["an unknown pay currency", { payCurrency: "XXX" }, "Pick a currency."],
  ])("refuses %s", async (_, overrides, error) => {
    expect(await recordSettlement({}, settlementForm(overrides))).toEqual({ error });
    expect(await listSettlements(world.ours.id)).toEqual([]);
  });

  it("refuses an amount that is not money", async () => {
    expect((await recordSettlement({}, settlementForm({ amount: "a tenner" }))).error).toBeTruthy();
  });

  it("lets only the payer or receiver record it", async () => {
    await db.insert(schema.user).values({ id: "u-third", name: "Tia", email: "u-third@example.test" });
    await db.insert(schema.tripMembership).values({ tripId: world.ours.id, userId: "u-third", role: "member" });
    signIn("u-third");

    expect(await recordSettlement({}, settlementForm())).toEqual({
      error: "Only the payer or receiver can record this.",
    });
  });

  it("converts at the fetched rate when paid in another currency", async () => {
    getHomeRates.mockResolvedValue({ toHome: { EUR: 0.85 }, date: "2026-09-01" });

    expect(await recordSettlement({}, settlementForm({ payCurrency: "EUR", payAmount: "1.00" }))).toEqual({});

    const [row] = await listSettlements(world.ours.id);
    expect(row).toMatchObject({
      currency: "EUR",
      clearsAmountMinor: 1500,
      clearsCurrency: "GBP",
      fxRate: 0.85,
      fxRateDate: "2026-09-01",
    });
    expect(row.amountMinor).toBeGreaterThan(1500);
  });

  it("refuses a conversion that comes to nothing", async () => {
    getHomeRates.mockResolvedValue({ toHome: { EUR: 1e9 }, date: "2026-09-01" });
    expect(await recordSettlement({}, settlementForm({ payCurrency: "EUR" }))).toEqual({
      error: "That converts to nothing — check the amount.",
    });
  });

  it("takes the typed amount, and records no date, when no rate can be had", async () => {
    getHomeRates.mockResolvedValue(null);

    expect(await recordSettlement({}, settlementForm({ payCurrency: "EUR", payAmount: "17.50" }))).toEqual({});

    const [row] = await listSettlements(world.ours.id);
    expect(row).toMatchObject({ amountMinor: 1750, currency: "EUR", fxRateDate: null });
    expect(row.fxRate).toBeCloseTo(15 / 17.5);
  });

  it("asks for the paid amount when there is no rate and none was typed", async () => {
    getHomeRates.mockResolvedValue(null);
    expect(await recordSettlement({}, settlementForm({ payCurrency: "EUR" }))).toEqual({
      error: "No rate available — type what you paid in EUR.",
    });
    expect(await recordSettlement({}, settlementForm({ payCurrency: "EUR", payAmount: "0" }))).toEqual({
      error: "Enter an amount above zero.",
    });
  });

  it("reverts a settlement, and ignores one that is not there", async () => {
    await recordSettlement({}, settlementForm());
    const [row] = await listSettlements(world.ours.id);
    const tripId = String(world.ours.id);

    await deleteSettlement(form({ tripId, settlementId: String(row.id) }));
    await deleteSettlement(form({ tripId, settlementId: String(row.id) }));

    expect(await listSettlements(world.ours.id)).toEqual([]);
  });
});
