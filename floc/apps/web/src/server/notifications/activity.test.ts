/**
 * #344: every writer that changes a fact people hear about writes its activity
 * row, and the rows turn into the right notifications. Driven through the
 * writers themselves, so a writer that forgets to log fails here.
 */
import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario, befriend } from "@/test/db";
import { insertNote } from "@/server/notes/notes";
import { writeExpense, writeSettlement } from "@/server/money/money";
import { claimPackingLine, insertPackingLine, softDeletePackingLine } from "@/server/packing/packing";
import { extendTripDays, setTripWindow, softDeleteDay } from "@/server/itinerary/itinerary";
import { addMember, insertNudge, removeMembership } from "@/server/trips/roster";
import { inviteToTrip } from "@/server/trips/invites";
import { acceptPendingRequest, openPendingRequest } from "@/server/social/friends";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

const activities = () => db.select().from(schema.activity).all();

async function inboxOf(userId: string) {
  return db
    .select({ kind: schema.activity.kind, loud: schema.notification.loud })
    .from(schema.notification)
    .innerJoin(schema.activity, eq(schema.activity.id, schema.notification.activityId))
    .where(eq(schema.notification.userId, userId))
    .all();
}

function comment(parentId: number | null, by: string) {
  return insertNote({
    tripId: world.ours.id,
    createdBy: by,
    scope: "trip",
    scopeId: world.ours.id,
    parentId,
    body: "Hello",
  });
}

describe("each writer logs its change", () => {
  it("a comment, and a reply that is loud for the parent's author", async () => {
    await comment(null, world.admin);
    const parent = await db.select({ id: schema.note.id }).from(schema.note).get();
    await comment(parent!.id, world.member);

    expect((await activities()).map((a) => a.kind)).toEqual(["comment_added", "comment_replied"]);
    expect(await inboxOf(world.admin)).toEqual([{ kind: "comment_replied", loud: true }]);
    expect(await inboxOf(world.member)).toEqual([{ kind: "comment_added", loud: false }]);
  });

  it("an expense, loud for the people in its split", async () => {
    await writeExpense({
      tripId: world.ours.id,
      createdBy: world.admin,
      fields: {
        dayId: null,
        paidBy: world.admin,
        description: "Dinner",
        amountMinor: 2000,
        currency: "GBP",
        splitType: "even",
        category: "food",
        notes: null,
      },
      splits: [
        { userId: world.admin, owedAmountMinor: 1000 },
        { userId: world.member, owedAmountMinor: 1000 },
      ],
    });

    expect((await activities())[0]).toMatchObject({ kind: "expense_added", href: `/trip/${world.ours.id}/money` });
    expect(await inboxOf(world.member)).toEqual([{ kind: "expense_added", loud: true }]);
    expect(await inboxOf(world.admin)).toEqual([]);
  });

  it("a settlement, loud for both ends", async () => {
    await writeSettlement({
      tripId: world.ours.id,
      createdBy: world.admin,
      fromUserId: world.admin,
      toUserId: world.member,
      amountMinor: 500,
      currency: "GBP",
    });
    expect(await inboxOf(world.member)).toEqual([{ kind: "settlement_recorded", loud: true }]);
  });

  it("a nudge, heard only by the person nudged", async () => {
    await insertNudge({
      tripId: world.ours.id,
      fromUserId: world.admin,
      toUserId: world.member,
      tab: "money",
      message: null,
    });
    expect((await activities())[0].href).toBe(`/trip/${world.ours.id}/money`);
    expect(await inboxOf(world.member)).toEqual([{ kind: "nudge_sent", loud: true }]);
  });

  it("removing a line someone claimed, loud for the claimer", async () => {
    await insertPackingLine(world.ours.id, world.admin, "Sun cream", "toiletries");
    const line = await db.select({ id: schema.packingLine.id }).from(schema.packingLine).get();
    await claimPackingLine(line!.id, world.member);
    await softDeletePackingLine(line!.id, world.admin);

    expect(await inboxOf(world.member)).toEqual([{ kind: "packing_claim_changed", loud: true }]);
  });

  it("trip dates, loud for every other member", async () => {
    await setTripWindow(world.ours.id, "2026-09-01", "2026-09-03", world.admin);
    expect(await inboxOf(world.member)).toEqual([{ kind: "trip_dates_changed", loud: true }]);
  });

  it("days added and removed, inbox only", async () => {
    const trip = { id: world.ours.id, startDate: null, endDate: null };
    await extendTripDays(trip, "2026-09-01", 1, world.admin);
    await softDeleteDay(world.ours.dayId, world.admin);
    expect(await inboxOf(world.member)).toEqual([
      { kind: "days_added", loud: false },
      { kind: "days_removed", loud: false },
    ]);
  });

  it("members joining and leaving, inbox only", async () => {
    await addMember(world.ours.id, world.outsider);
    await removeMembership(world.ours.id, world.outsider, world.outsider);
    expect(await inboxOf(world.member)).toEqual([
      { kind: "member_joined", loud: false },
      { kind: "member_left", loud: false },
    ]);
  });

  it("an invite, loud for the person asked", async () => {
    await befriend(world.admin, world.outsider);
    await inviteToTrip({ tripId: world.ours.id, fromUserId: world.admin, toUserIds: [world.outsider] });
    expect(await inboxOf(world.outsider)).toEqual([{ kind: "trip_invited", loud: true }]);
    expect(await inboxOf(world.member)).toEqual([]);
  });

  it("a friend request and its acceptance, with no trip", async () => {
    await openPendingRequest(world.admin, world.outsider);
    await acceptPendingRequest(world.admin, world.outsider);

    expect((await activities()).every((a) => a.tripId === null)).toBe(true);
    expect(await inboxOf(world.outsider)).toEqual([{ kind: "friend_requested", loud: true }]);
    expect(await inboxOf(world.admin)).toEqual([{ kind: "friend_accepted", loud: true }]);
  });
});

describe("grouping", () => {
  it("folds rapid edits by one person to one thing into one row, and a row you have read stays read", async () => {
    const edit = () =>
      insertNudge({ tripId: world.ours.id, fromUserId: world.admin, toUserId: world.member, tab: "dates", message: null });
    await setTripWindow(world.ours.id, "2026-09-01", "2026-09-02", world.admin);
    await db.update(schema.notification).set({ readAt: new Date(), seenAt: new Date() });
    await setTripWindow(world.ours.id, "2026-09-01", "2026-09-03", world.admin);

    expect(await activities()).toHaveLength(1);
    const [row] = await db.select().from(schema.notification).all();
    expect(row.readAt).not.toBeNull();
    expect(row.seenAt).not.toBeNull();

    await edit();
    await edit();
    expect(await activities()).toHaveLength(3);
  });
});
