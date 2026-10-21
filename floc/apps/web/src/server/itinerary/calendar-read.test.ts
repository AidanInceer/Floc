import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { findTripAccess } from "@/server/access";
import { insertDocument } from "@/server/documents/documents";
import { insertNote, softDeleteNoteAndReplies } from "@/server/notes/notes";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { loadCalendar } from "./calendar-read";

let world: Scenario;
beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

describe("calendar details", () => {
  it("treats another trip's event and an unknown event as unselected", async () => {
    const access = (await findTripAccess(world.ours.id, world.member))!;
    expect((await loadCalendar(access, world.theirs.eventId)).selected).toBeNull();
    expect((await loadCalendar(access, 999999)).selected).toBeNull();
  });

  it("drops a deleted discussion and its replies from the calendar count", async () => {
    const parent = await insertNote({
      tripId: world.ours.id, createdBy: world.member, scope: "day_event",
      scopeId: world.ours.eventId, parentId: null, body: "Removed discussion",
    });
    await insertNote({
      tripId: world.ours.id, createdBy: world.member, scope: "day_event",
      scopeId: world.ours.eventId, parentId: parent, body: "Removed reply",
    });
    await softDeleteNoteAndReplies(parent);
    const access = (await findTripAccess(world.ours.id, world.member))!;
    const calendar = await loadCalendar(access, world.ours.eventId);
    expect(calendar.commentCounts.has(world.ours.eventId)).toBe(false);
    expect(calendar.selected?.notes).toEqual([]);
  });

  it("offers only the viewer's visible files when opening an event", async () => {
    const addFile = (ownerId: string | null, dayEventId: number | null, name: string) => insertDocument({
      tripId: world.ours.id, uploadedBy: world.admin, ownerId, dayEventId,
      name, storageKey: "test-file", mimeType: "application/pdf", sizeBytes: 10, category: "other",
    });
    await addFile(null, world.ours.eventId, "Shared ticket");
    await addFile(world.admin, world.ours.lateEventId, "Private ticket");
    await addFile(world.member, null, "My booking");
    const previousDir = process.env.FLOC_FILES_DIR;
    process.env.FLOC_FILES_DIR = "test-volume";
    try {
      const access = (await findTripAccess(world.ours.id, world.member))!;
      const calendar = await loadCalendar(access, world.ours.eventId);
      expect(calendar.fileEventIds).toEqual(new Set([world.ours.eventId]));
      expect(calendar.selected?.files.map((file) => file.name)).toEqual(["Shared ticket"]);
      expect(calendar.selected?.loose.map((file) => file.name)).toEqual(["My booking"]);
      expect(JSON.stringify(calendar)).not.toContain("Private ticket");
    } finally {
      if (previousDir === undefined) delete process.env.FLOC_FILES_DIR;
      else process.env.FLOC_FILES_DIR = previousDir;
    }
  });

  it("loads only the selected event's discussion, including its replies", async () => {
    const post = (scopeId: number, body: string, parentId: number | null = null) => insertNote({
      tripId: world.ours.id, createdBy: world.member, scope: "day_event", scopeId, parentId, body,
    });
    const parent = await post(world.ours.eventId, "Selected discussion");
    await post(world.ours.eventId, "Selected reply", parent);
    await post(world.ours.lateEventId, "Another discussion");
    const access = (await findTripAccess(world.ours.id, world.member))!;
    const calendar = await loadCalendar(access, world.ours.eventId);
    expect(calendar.selected?.notes.map((note) => note.body)).toEqual(["Selected discussion"]);
    expect(calendar.selected?.notes[0].replies.map((reply) => reply.body)).toEqual(["Selected reply"]);
    expect(calendar.commentCounts.get(world.ours.eventId)).toBe(2);
    expect(JSON.stringify(calendar)).not.toContain("Another discussion");
  });

  it("returns comment counts without unopened discussions", async () => {
    await insertNote({
      tripId: world.ours.id, createdBy: world.member, scope: "day_event",
      scopeId: world.ours.eventId, parentId: null, body: "Unopened discussion",
    });
    const access = (await findTripAccess(world.ours.id, world.member))!;
    const calendar = await loadCalendar(access, null);
    expect(calendar.commentCounts.get(world.ours.eventId)).toBe(1);
    expect(calendar.selected).toBeNull();
    expect(JSON.stringify(calendar)).not.toContain("Unopened discussion");
  });
});
