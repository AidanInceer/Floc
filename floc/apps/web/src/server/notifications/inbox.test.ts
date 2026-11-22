import { sql } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario, befriend } from "@/test/db";
import { insertNote, softDeleteNoteAndReplies } from "@/server/notes/notes";
import { removeMembership } from "@/server/trips/roster";
import { insertNudge } from "@/server/trips/nudges";
import { declineInvite, inviteToTrip } from "@/server/trips/invites";
import { acceptPendingRequest, openPendingRequest } from "@/server/social/friends";
import { closeWaiting, insertWaiting } from "@/server/documents/bookings/booking-inbox-rows";
import { recordActivity } from "@/server/notifications/activity";
import { softDeleteTrip } from "@/server/trips/trips";
import { tripHref } from "@floc/core/notifications/notification-href";
import { countUnread, listInbox, listUnseen, markAllRead, markInboxSeen, openNotification } from "@/server/notifications/inbox";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

const nudge = (tab: "dates" | "money" = "dates") =>
  insertNudge({ tripId: world.ours.id, fromUserId: world.admin, toUserId: world.member, tab });

describe("the inbox", () => {
  it("names the person and the trip, newest first, and counts unread", async () => {
    await nudge();
    const page = await listInbox(world.member, null);

    expect(page.items).toHaveLength(1);
    expect(page.items[0]).toMatchObject({ text: "Ada nudged you to mark your days on the trip Ours", read: false, loud: true });
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

  it("clears the bell on landing but leaves each row still new", async () => {
    await nudge();
    await markInboxSeen(world.member);

    expect(await countUnread(world.member)).toBe(0);
    expect((await listInbox(world.member, null)).items[0].read).toBe(false);
  });

  it("marks all read at once, and only your own", async () => {
    await nudge();
    await markAllRead(world.outsider);
    expect((await listInbox(world.member, null)).items[0].read).toBe(false);

    await markAllRead(world.member);
    expect((await listInbox(world.member, null)).items[0].read).toBe(true);
    expect(await countUnread(world.member)).toBe(0);
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
    await befriend(world.admin, world.outsider);
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
    const rows = Array.from({ length: 51 }, () => ({ tripId: world.ours.id, fromUserId: world.admin, toUserId: world.member, tab: "dates" as const }));
    const nudges = await db.insert(schema.nudge).values(rows).returning({ id: schema.nudge.id });
    const href = tripHref(world.ours.id, "dates");
    const sent = await db.insert(schema.activity)
      .values(nudges.map(({ id }) => ({ kind: "nudge_sent" as const, tripId: world.ours.id, actorId: world.admin, subjectId: id, href })))
      .returning({ id: schema.activity.id });
    await db.insert(schema.notification).values(sent.map(({ id }) => ({ activityId: id, userId: world.member, loud: true })));
    const first = await listInbox(world.member, null);
    const second = await listInbox(world.member, first.next);

    expect(first.items).toHaveLength(50);
    expect(second.items).toHaveLength(1);
    expect(second.next).toBeNull();
    expect(new Set([...first.items, ...second.items].map((i) => i.id)).size).toBe(51);
  });

  it("opens at the newest for an Older link that is not one of its own", async () => {
    await nudge();
    for (const bent of ["99999999999999999999-1", "abc", "1-", ["1-2", "3-4"]]) {
      expect((await listInbox(world.member, bent)).items).toHaveLength(1);
    }
  });
});

describe("a notice that asks you to act", () => {
  const bookingWaits = async () => {
    const id = await insertWaiting({ userId: world.member, name: "flight.pdf", storageKey: "flight.pdf", mimeType: "application/pdf", sizeBytes: 1, category: "travel", bookingDetails: null });
    await db.transaction((tx) =>
      recordActivity(tx, { kind: "booking_waiting", tripId: null, actorId: world.member, subjectId: null, href: "/bookings", affected: [world.member] }),
    );
    return id;
  };

  it("shows a waiting booking while it still has no trip", async () => {
    await bookingWaits();
    expect((await listInbox(world.member, null)).items).toHaveLength(1);
  });

  it("hides a waiting booking once it has a trip", async () => {
    const id = await bookingWaits();
    await closeWaiting(world.member, id, true);
    expect((await listInbox(world.member, null)).items).toEqual([]);
    expect(await countUnread(world.member)).toBe(0);
  });

  it("keeps a friend request once answered, with no link left to follow", async () => {
    await openPendingRequest(world.outsider, world.member);
    expect((await listInbox(world.member, null)).items[0].href).toBe("/friends");

    await acceptPendingRequest(world.outsider, world.member);
    const [item] = (await listInbox(world.member, null)).items;
    expect(item).toMatchObject({ text: "Ozz sent you a friend request", href: null });
    expect(await openNotification(world.member, item.id)).toBeNull();
  });

  it("keeps a trip invite once answered, with no link left to follow", async () => {
    await befriend(world.admin, world.outsider);
    await inviteToTrip({ tripId: world.ours.id, fromUserId: world.admin, toUserIds: [world.outsider] });
    await declineInvite(world.ours.id, world.outsider);
    const [item] = (await listInbox(world.outsider, null)).items;
    expect(item.href).toBeNull();
  });
});

describe("the account menu's preview", () => {
  it("shows the newest few you have not seen, up to the cap", async () => {
    await nudge("dates");
    await nudge("money");
    await nudge("dates");

    const shown = await listUnseen(world.member, 2);
    expect(shown).toHaveLength(2);
    expect(shown[0].id).toBeGreaterThan(shown[1].id);
    expect(shown[0]).toMatchObject({ text: "Ada nudged you to mark your days on the trip Ours" });
  });

  it("empties once the inbox has been landed on", async () => {
    await nudge();
    await markInboxSeen(world.member);
    expect(await listUnseen(world.member, 3)).toEqual([]);
  });
});

describe("the unread count", () => {
  it("finds a person's unseen notifications through an index, not by reading all of theirs", async () => {
    const plan = await db.all<{ detail: string }>(
      sql`EXPLAIN QUERY PLAN SELECT id FROM notification WHERE user_id = ${"someone"} AND seen_at IS NULL AND deleted_at IS NULL`,
    );
    expect(plan.map((step) => step.detail).join(" ")).toContain("notification_user_seen_idx (user_id=? AND seen_at=?)");
  });
});
