/**
 * #344: what the inbox shows. Hidden when its thing is gone or you left the
 * trip, kept 30 days, 50 a page, and opening one is yours alone to do.
 */
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { insertNote, softDeleteNoteAndReplies } from "@/server/notes/notes";
import { insertNudge, removeMembership } from "@/server/trips/roster";
import { inviteToTrip } from "@/server/trips/invites";
import { softDeleteTrip } from "@/server/trips/trips";
import { countUnread, listInbox, openNotification } from "@/server/notifications/inbox";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

const nudge = (tab: "dates" | "money" = "dates") =>
  insertNudge({ tripId: world.ours.id, fromUserId: world.admin, toUserId: world.member, tab, message: null });

describe("the inbox", () => {
  it("names the person and the trip, newest first, and counts unread", async () => {
    await nudge();
    const page = await listInbox(world.member, null);

    expect(page.items).toHaveLength(1);
    expect(page.items[0]).toMatchObject({ text: "Ada nudged you about Ours", read: false, loud: true });
    expect(await countUnread(world.member)).toBe(1);
    expect(await countUnread(world.admin)).toBe(0);
  });

  it("marks one read and hands back where it points", async () => {
    await nudge("money");
    const [item] = (await listInbox(world.member, null)).items;

    expect(await openNotification(world.member, item.id)).toBe(`/trip/${world.ours.id}/money`);
    expect(await countUnread(world.member)).toBe(0);
    expect((await listInbox(world.member, null)).items[0].read).toBe(true);
  });

  it("will not open somebody else's", async () => {
    await nudge();
    const [item] = (await listInbox(world.member, null)).items;
    expect(await openNotification(world.outsider, item.id)).toBeNull();
    expect(await countUnread(world.member)).toBe(1);
  });

  it("hides a comment once it is deleted", async () => {
    await insertNote({
      tripId: world.ours.id,
      createdBy: world.admin,
      scope: "trip",
      scopeId: world.ours.id,
      parentId: null,
      body: "Hi",
    });
    const note = await db.select({ id: schema.note.id }).from(schema.note).get();
    expect(await countUnread(world.member)).toBe(1);

    await softDeleteNoteAndReplies(note!.id);
    expect((await listInbox(world.member, null)).items).toEqual([]);
  });

  it("hides a trip's notifications from someone who left it", async () => {
    await nudge();
    await removeMembership(world.ours.id, world.member, world.member);
    expect((await listInbox(world.member, null)).items).toEqual([]);
  });

  it("shows an invite to a trip you are not on yet, until the trip is deleted", async () => {
    await inviteToTrip({ tripId: world.ours.id, fromUserId: world.admin, toUserIds: [world.outsider] });
    expect(await countUnread(world.outsider)).toBe(1);

    await softDeleteTrip(world.ours.id);
    expect(await countUnread(world.outsider)).toBe(0);
  });

  it("drops anything older than 30 days", async () => {
    await nudge();
    await db.update(schema.activity).set({ lastModifiedAt: new Date(Date.now() - 31 * 86_400_000) });
    expect((await listInbox(world.member, null)).items).toEqual([]);
  });

  it("pages 50 at a time", async () => {
    for (let i = 0; i < 51; i++) await nudge();
    const first = await listInbox(world.member, null);
    const second = await listInbox(world.member, first.next);

    expect(first.items).toHaveLength(50);
    expect(second.items).toHaveLength(1);
    expect(second.next).toBeNull();
    expect(new Set([...first.items, ...second.items].map((i) => i.id)).size).toBe(51);
  });
});
