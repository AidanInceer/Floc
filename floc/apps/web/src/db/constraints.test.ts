import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { upsertPlace } from "@/server/itinerary/places";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";

let world: Scenario;
let files = 0;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

const bill = (overrides: Partial<typeof schema.expense.$inferInsert> = {}) =>
  db
    .insert(schema.expense)
    .values({
      tripId: world.ours.id,
      createdBy: world.admin,
      paidBy: world.admin,
      description: "Ferry",
      amountMinor: 4000,
      currency: "GBP",
      splitType: "even",
      ...overrides,
    })
    .returning({ id: schema.expense.id })
    .get();

const file = (overrides: Partial<typeof schema.document.$inferInsert> = {}) =>
  db
    .insert(schema.document)
    .values({
      tripId: world.ours.id,
      uploadedBy: world.admin,
      name: "ticket.pdf",
      storageKey: `key-${++files}`,
      mimeType: "application/pdf",
      sizeBytes: 1,
      ...overrides,
    })
    .returning({ id: schema.document.id })
    .get();

const split = (expenseId: number, owedAmountMinor = 2000) =>
  db.insert(schema.expenseSplit).values({ expenseId, userId: world.member, owedAmountMinor });

const providerPlace = (providerId: string | null) =>
  db.insert(schema.place).values({ providerId, name: "Lisbon" }).returning({ id: schema.place.id }).get();

describe("expense splits", () => {
  it("refuses a second live split for one person (rule 2)", async () => {
    const { id } = await bill();
    await split(id);

    await expect(split(id)).rejects.toThrow();
  });

  it("allows a new split once the old one is soft-deleted (rule 2)", async () => {
    const { id } = await bill();
    await split(id);
    await db.update(schema.expenseSplit).set({ deletedAt: new Date() }).where(eq(schema.expenseSplit.expenseId, id));

    await expect(split(id)).resolves.toBeDefined();
  });

  it("refuses a negative share and allows a share of nothing", async () => {
    const { id } = await bill();

    await expect(split(id, -1)).rejects.toThrow();
    await expect(split(id, 0)).resolves.toBeDefined();
  });
});

describe("the same trip", () => {
  it("refuses an expense on another trip's day", async () => {
    await expect(bill({ dayId: world.theirs.dayId })).rejects.toThrow();
  });

  it("refuses moving an expense to another trip's day", async () => {
    const { id } = await bill({ dayId: world.ours.dayId });

    await expect(
      db.update(schema.expense).set({ dayId: world.theirs.dayId }).where(eq(schema.expense.id, id)),
    ).rejects.toThrow();
  });

  it("refuses a file on another trip's day", async () => {
    await expect(file({ dayId: world.theirs.dayId })).rejects.toThrow();
  });

  it("refuses moving a file to another trip's day", async () => {
    const { id } = await file({ dayId: world.ours.dayId });

    await expect(
      db.update(schema.document).set({ dayId: world.theirs.dayId }).where(eq(schema.document.id, id)),
    ).rejects.toThrow();
  });

  it("still empties the day on an expense and a file when the day goes", async () => {
    const expense = await bill({ dayId: world.ours.dayId });
    const document = await file({ dayId: world.ours.dayId });

    await db.delete(schema.day).where(eq(schema.day.id, world.ours.dayId));

    const billRow = await db.select().from(schema.expense).where(eq(schema.expense.id, expense.id)).get();
    const fileRow = await db.select().from(schema.document).where(eq(schema.document.id, document.id)).get();
    expect(billRow?.dayId).toBeNull();
    expect(fileRow?.dayId).toBeNull();
  });
});

describe("a file's place in the plan", () => {
  it("refuses a file on both a day and an event", async () => {
    await expect(file({ dayId: world.ours.dayId, dayEventId: world.ours.eventId })).rejects.toThrow();
  });

  it("refuses adding an event to a file already on a day", async () => {
    const { id } = await file({ dayId: world.ours.dayId });

    await expect(
      db.update(schema.document).set({ dayEventId: world.ours.eventId }).where(eq(schema.document.id, id)),
    ).rejects.toThrow();
  });
});

describe("places", () => {
  it("refuses a second live place for one provider id", async () => {
    await providerPlace("osm:test:1");

    await expect(providerPlace("osm:test:1")).rejects.toThrow();
  });

  it("allows the provider id again once the first place is soft-deleted", async () => {
    const { id } = await providerPlace("osm:test:1");
    await db.update(schema.place).set({ deletedAt: new Date() }).where(eq(schema.place.id, id));

    await expect(providerPlace("osm:test:1")).resolves.toBeDefined();
  });

  it("allows any number of places with no provider id", async () => {
    await providerPlace(null);

    await expect(providerPlace(null)).resolves.toBeDefined();
  });

  it("gives two people adding one place at once the same row", async () => {
    const input = { providerId: "osm:test:2", name: "Porto" };

    const [first, second] = await Promise.all([upsertPlace(input), upsertPlace(input)]);

    expect(first).toBe(second);
  });
});

describe("accounts", () => {
  const account = (id: string, userId: string) =>
    db.insert(schema.account).values({ id, accountId: "google-1", providerId: "google", userId });

  it("refuses the same provider account twice", async () => {
    await account("a-1", world.admin);

    await expect(account("a-2", world.member)).rejects.toThrow();
  });
});

describe("settlements", () => {
  it("refuses a settlement of nothing", async () => {
    await expect(
      db.insert(schema.settlement).values({
        tripId: world.ours.id,
        fromUserId: world.member,
        toUserId: world.admin,
        amountMinor: 0,
        currency: "GBP",
        createdBy: world.member,
      }),
    ).rejects.toThrow();
  });
});
