/** What a notes page can link to (#408). */
import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db } from "@/db";
import { day, dayEvent, document, expense, packingLine, place } from "@/db/schema";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { loadTripLinkItems } from "./trip-link-items";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

describe("loadTripLinkItems", () => {
  it("lists the trip's days, events, places, money, packing and files, by current name", async () => {
    const lisbon = await db.insert(place).values({ name: "Lisbon" }).returning({ id: place.id }).get();
    await db.update(day).set({ overnightPlaceId: lisbon.id }).where(eq(day.id, world.ours.dayId));
    await db.update(dayEvent).set({ title: null }).where(eq(dayEvent.id, world.ours.lateEventId));
    await db.insert(expense).values({ tripId: world.ours.id, createdBy: world.admin, paidBy: world.member, description: "Lagos flat", amountMinor: 96000, currency: "EUR", splitType: "even" });
    await db.insert(packingLine).values([
      { tripId: world.ours.id, createdBy: world.admin, label: "Plug adapters", ownerId: world.admin },
      { tripId: world.ours.id, createdBy: world.admin, label: "Walking shoes" },
    ]);
    await db.insert(document).values({ tripId: world.ours.id, uploadedBy: world.member, name: "Boarding passes", storageKey: "k", mimeType: "application/pdf", sizeBytes: 1 });

    const items = await loadTripLinkItems(world.ours.id);
    expect(items.map((item) => [item.kind, item.label, item.detail])).toEqual([
      ["day", "Tue 1 Sept", "Day 1 · Lisbon"],
      ["event", "Ours event", "Tue 1 Sept, 09:00"],
      ["event", "Food", "Tue 1 Sept, 19:00"],
      ["place", "Lisbon", "From Tue 1 Sept"],
      ["expense", "Lagos flat", "€960.00 · Mo paid"],
      ["packing", "Plug adapters", "Ada"],
      ["packing", "Walking shoes", "Everyone"],
      ["file", "Boarding passes", "Mo"],
    ]);
  });

  it("leaves out what was deleted and what belongs to another trip", async () => {
    await db.update(dayEvent).set({ deletedAt: new Date() }).where(eq(dayEvent.id, world.ours.eventId));
    const items = await loadTripLinkItems(world.ours.id);
    expect(items.map((item) => item.label)).not.toContain("Ours event");
    expect(items.map((item) => item.label)).not.toContain("Theirs event");
  });
});
