/**
 * A document can belong to a day or an event (ticket 320), and the Days page
 * reads every event's files in one go (tickets 322, 324).
 *
 * The event join is the sharp edge: a member's private file must not leak to
 * another member through it, and soft-deleting the event must unattach the
 * file rather than bin it — `set null` on the column, `isNull` on the join.
 */
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { db } from "@/db";
import { dayEvent, document } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  byEvent,
  insertDocument,
  listDocuments,
  placeDocument,
} from "@/server/documents/documents";

let world: Scenario;

const base = {
  name: "ticket.pdf",
  storageKey: "k1",
  mimeType: "application/pdf",
  sizeBytes: 100,
  category: "other" as const,
};

/** What the event modal shows one viewer. */
async function filesOn(eventId: number, viewerId: string) {
  const all = await listDocuments(world.ours.id, viewerId);
  return byEvent(all).get(eventId) ?? [];
}

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

describe("a document on an event", () => {
  it("lists a file parked on the event", async () => {
    await insertDocument({
      tripId: world.ours.id,
      uploadedBy: world.admin,
      ownerId: null,
      dayEventId: world.ours.eventId,
      ...base,
    });

    const files = await filesOn(world.ours.eventId, world.admin);
    expect(files.map((f) => f.name)).toEqual(["ticket.pdf"]);
    expect(files[0].dayEventId).toBe(world.ours.eventId);
  });

  it("names the event it sits on", async () => {
    await insertDocument({
      tripId: world.ours.id,
      uploadedBy: world.admin,
      ownerId: null,
      dayEventId: world.ours.eventId,
      ...base,
    });

    const [file] = await listDocuments(world.ours.id, world.admin);
    expect(file.eventTitle).not.toBeNull();
    expect(file.eventDayId).toBe(world.ours.dayId);
  });

  it("says nothing about an event for an unattached file", async () => {
    await insertDocument({
      tripId: world.ours.id,
      uploadedBy: world.admin,
      ownerId: null,
      ...base,
    });

    const [file] = await listDocuments(world.ours.id, world.admin);
    expect(file.dayEventId).toBeNull();
    expect(file.eventTitle).toBeNull();
  });

  it("hides another member's private file", async () => {
    await insertDocument({
      tripId: world.ours.id,
      uploadedBy: world.member,
      ownerId: world.member,
      dayEventId: world.ours.eventId,
      ...base,
    });

    expect(await filesOn(world.ours.eventId, world.admin)).toEqual([]);
    expect((await filesOn(world.ours.eventId, world.member)).length).toBe(1);
  });

  it("drops a soft-deleted file from the read", async () => {
    await insertDocument({
      tripId: world.ours.id,
      uploadedBy: world.admin,
      ownerId: null,
      dayEventId: world.ours.eventId,
      ...base,
    });
    await db
      .update(document)
      .set({ deletedAt: new Date() })
      .where(eq(document.dayEventId, world.ours.eventId));

    expect(await filesOn(world.ours.eventId, world.admin)).toEqual([]);
  });

  it("unattaches, never bins, when the event is soft-deleted", async () => {
    await insertDocument({
      tripId: world.ours.id,
      uploadedBy: world.admin,
      ownerId: null,
      dayEventId: world.ours.eventId,
      ...base,
    });
    await db
      .update(dayEvent)
      .set({ deletedAt: new Date() })
      .where(eq(dayEvent.id, world.ours.eventId));

    expect(await filesOn(world.ours.eventId, world.admin)).toEqual([]);
    const [file] = await listDocuments(world.ours.id, world.admin);
    expect(file.name).toBe("ticket.pdf");
    expect(file.dayEventId).toBeNull();
  });

  it("attaches and detaches", async () => {
    await insertDocument({
      tripId: world.ours.id,
      uploadedBy: world.admin,
      ownerId: null,
      ...base,
    });
    const row = await db.select({ id: document.id }).from(document).get();

    await placeDocument(row!.id, {
      dayId: null,
      dayEventId: world.ours.eventId,
    });
    expect((await filesOn(world.ours.eventId, world.admin)).length).toBe(1);

    await placeDocument(row!.id, { dayId: null, dayEventId: null });
    expect(await filesOn(world.ours.eventId, world.admin)).toEqual([]);
  });
});
