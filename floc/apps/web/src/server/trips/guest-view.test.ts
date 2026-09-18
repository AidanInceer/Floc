/**
 * What somebody on a share link may read (#330).
 *
 * These are the privacy boundary, not a feature: every assertion here is about
 * something a member can see that a non-member must not. A field added to a
 * projection without a test is exactly how one leaks.
 */
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { guestDocuments, guestItinerary } from "@/server/trips/guest-view";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

const addDocument = (values: Partial<typeof schema.document.$inferInsert>) =>
  db.insert(schema.document).values({
    tripId: world.ours.id,
    uploadedBy: world.admin,
    ownerId: null,
    name: "A file.pdf",
    storageKey: "k",
    mimeType: "application/pdf",
    sizeBytes: 10,
    category: "travel",
    ...values,
  } as typeof schema.document.$inferInsert);

describe("the itinerary", () => {
  it("is day first, with each day's events in order", async () => {
    const days = await guestItinerary(world.ours.id);

    expect(days).toHaveLength(1);
    expect(days[0].events.map((e) => e.title)).toEqual([
      "Ours event",
      "Ours dinner",
    ]);
  });

  it("carries the day's overnight place, since the route is the trip", async () => {
    const days = await guestItinerary(world.ours.id);
    expect(days[0]).toHaveProperty("overnightPlaceName");
  });

  it("carries no event note — that is the group talking to itself", async () => {
    const days = await guestItinerary(world.ours.id);
    expect(Object.keys(days[0].events[0])).not.toContain("note");
  });

  it("reaches no other trip's days", async () => {
    const days = await guestItinerary(world.ours.id);
    const titles = days.flatMap((d) => d.events.map((e) => e.title));

    expect(titles).not.toContain("Theirs event");
    expect(titles).not.toContain("Theirs dinner");
  });

  it("is empty, not broken, for a trip with no days", async () => {
    await db.delete(schema.dayEvent);
    await db.delete(schema.day);

    expect(await guestItinerary(world.ours.id)).toEqual([]);
  });
});

describe("the documents", () => {
  it("names a shared file but hands over no way to open it", async () => {
    await addDocument({ name: "Ferry tickets.pdf", storageKey: "k-shared" });

    const docs = await guestDocuments(world.ours.id);

    expect(docs.map((d) => d.name)).toEqual(["Ferry tickets.pdf"]);
    expect(Object.keys(docs[0])).not.toContain("storageKey");
  });

  it("keeps the filing, so the folder reads as a real one", async () => {
    await addDocument({ name: "Hotel.pdf", storageKey: "k-stay", category: "stay" });

    const [doc] = await guestDocuments(world.ours.id);
    expect(doc.category).toBe("stay");
  });

  it("never shows a member's private file, not even its name", async () => {
    await addDocument({
      ownerId: world.member,
      name: "Mo passport.jpg",
      storageKey: "k-private",
      category: "admin",
    });

    expect(await guestDocuments(world.ours.id)).toEqual([]);
  });

  it("never shows a deleted file", async () => {
    await addDocument({
      name: "Old booking.pdf",
      storageKey: "k-gone",
      deletedAt: new Date(),
    });

    expect(await guestDocuments(world.ours.id)).toEqual([]);
  });

  it("never shows another trip's file", async () => {
    await addDocument({
      tripId: world.theirs.id,
      uploadedBy: world.outsider,
      name: "Theirs.pdf",
      storageKey: "k-theirs",
    });

    expect(await guestDocuments(world.ours.id)).toEqual([]);
  });

  it("is empty, not broken, for a trip with no files", async () => {
    expect(await guestDocuments(world.ours.id)).toEqual([]);
  });
});
