import { desc } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { findTripAccess } from "@/server/access";
import { removeEvent, saveEvent } from "@/server/itinerary/event-save";
import { withEventMoves } from "@/server/itinerary/event-log";
import { rescheduleEvent } from "@/server/itinerary/itinerary";
import { writeExpense } from "@/server/money/money";
import { listInbox, listUnread, markAllRead, openNotification } from "@/server/notifications/inbox";
import { logFileAdded } from "@/server/notifications/file-log";
import { readPlanNote } from "@/server/notifications/plan-note";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

const access = async (userId: string) => (await findTripAccess(world.ours.id, userId))!;
const caves = { type: "activity", title: "Benagil caves", time: "10:30" } as const;
const inbox = async (userId: string) => (await listInbox(userId, null)).items;

async function addCaves(by = world.admin) {
  await saveEvent(await access(by), { dayId: world.ours.dayId }, caves);
  const row = await db.select({ id: schema.dayEvent.id }).from(schema.dayEvent).orderBy(desc(schema.dayEvent.id)).get();
  return row!.id;
}

describe("a change to the plan", () => {
  it("reaches the other members quietly, and not the person who made it", async () => {
    await addCaves();

    expect(await inbox(world.admin)).toEqual([]);
    const [item] = await inbox(world.member);
    expect(item).toMatchObject({ kind: "event_added", loud: false, text: "Ada added Benagil caves to Ours", tripId: world.ours.id, tripName: "Ours" });
    expect(item.change?.title).toBe("Benagil caves");
  });

  it("creates no push or email", async () => {
    await addCaves();
    expect(await db.select().from(schema.notificationDelivery).all()).toEqual([]);
  });

  it("keeps the old time when an event moves", async () => {
    const id = await addCaves();
    await markAllRead(world.member);
    await saveEvent(await access(world.admin), { eventId: id }, { ...caves, time: "11:00" });

    const [moved] = await inbox(world.member);
    expect(moved).toMatchObject({ kind: "event_moved", words: { was: "10:30", now: "11:00" }, read: false });
  });

  it("logs no move when only the name changes", async () => {
    const id = await addCaves();
    await saveEvent(await access(world.admin), { eventId: id }, { ...caves, title: "Benagil boat" });

    expect((await inbox(world.member)).map((i) => i.kind)).toEqual(["event_added"]);
  });

  it("keeps the first old time across quick moves, and shows it as new again", async () => {
    const id = await addCaves();
    const by = await access(world.admin);
    await saveEvent(by, { eventId: id }, { ...caves, time: "11:00" });
    const [first] = (await inbox(world.member)).filter((i) => i.kind === "event_moved");
    await openNotification(world.member, first.id);
    await saveEvent(by, { eventId: id }, { ...caves, time: "12:00" });

    const moves = (await inbox(world.member)).filter((i) => i.kind === "event_moved");
    expect(moves).toHaveLength(1);
    expect(moves[0]).toMatchObject({ words: { was: "10:30", now: "12:00" }, read: false });
  });

  it("logs a drag to a new time", async () => {
    const id = await addCaves();
    await markAllRead(world.member);
    await withEventMoves(world.admin, [id], () => rescheduleEvent(id, world.ours.dayId, "15:00", null));

    expect((await inbox(world.member))[0]).toMatchObject({ kind: "event_moved", words: { was: "10:30", now: "15:00" } });
  });

  it("still names an event after it is removed", async () => {
    const id = await addCaves();
    await removeEvent(await access(world.admin), id);

    expect((await inbox(world.member))[0]).toMatchObject({ kind: "event_removed", text: "Ada removed Benagil caves from Ours" });
  });
});

describe("a file", () => {
  it("a shared file reaches the other members", async () => {
    await logFileAdded({ tripId: world.ours.id, by: world.admin, name: "Hotel.pdf", shared: true });
    expect((await inbox(world.member))[0]).toMatchObject({ kind: "file_added", text: "Ada added Hotel.pdf to Ours", loud: false });
  });

  it("a private file records nothing", async () => {
    await logFileAdded({ tripId: world.ours.id, by: world.admin, name: "Passport.pdf", shared: false });
    expect(await db.select().from(schema.activity).all()).toEqual([]);
  });
});

describe("a cost", () => {
  const cost = (splits: { userId: string; owedAmountMinor: number }[]) =>
    writeExpense({
      tripId: world.ours.id,
      createdBy: world.admin,
      fields: { dayId: null, paidBy: world.admin, description: "Dinner", amountMinor: 2000, currency: "GBP", splitType: "even", category: "food", notes: null },
      splits,
    });

  it("shows your exact share when it includes you", async () => {
    await cost([{ userId: world.admin, owedAmountMinor: 1250 }, { userId: world.member, owedAmountMinor: 750 }]);
    expect((await inbox(world.member))[0].share).toBe("£7.50");
  });

  it("stays out of the inbox when it does not include you", async () => {
    await cost([{ userId: world.admin, owedAmountMinor: 2000 }]);
    expect(await inbox(world.member)).toEqual([]);
  });
});

describe("clearing a change", () => {
  it("pressing one clears only that one and opens its row", async () => {
    await addCaves();
    await saveEvent(await access(world.admin), { dayId: world.ours.dayId }, { ...caves, title: "Lunch" });
    const [one] = await inbox(world.member);

    expect(await openNotification(world.member, one.id)).toBe(`/trip/${world.ours.id}/overview?change=${one.id}`);
    expect(await listUnread(world.member, 10)).toHaveLength(1);
  });

  it("the unread list leaves out what was pressed", async () => {
    await addCaves();
    const [one] = await inbox(world.member);
    await openNotification(world.member, one.id);
    expect(await listUnread(world.member, 10)).toEqual([]);
  });
});

describe("the note on a changed row", () => {
  async function twoChanges() {
    await saveEvent(await access(world.admin), { dayId: world.ours.dayId }, { ...caves, title: "Late", time: "18:00" });
    await saveEvent(await access(world.admin), { dayId: world.ours.dayId }, { ...caves, title: "Early", time: "08:00" });
    return (await inbox(world.member)).sort((a, b) => a.change!.time!.localeCompare(b.change!.time!));
  }

  it("steps through the trip's changes in plan order", async () => {
    const [early, late] = await twoChanges();
    await openNotification(world.member, early.id);

    expect(await readPlanNote(world.member, world.ours.id, early.id)).toMatchObject({ index: 0, total: 2, prevId: null, nextId: late.id, actor: "Ada" });
    expect(await readPlanNote(world.member, world.ours.id, late.id)).toMatchObject({ index: 1, total: 2, prevId: early.id, nextId: null });
  });

  it("keeps a just-read change in the steps", async () => {
    const [early, late] = await twoChanges();
    await openNotification(world.member, early.id);
    await openNotification(world.member, late.id);

    expect((await readPlanNote(world.member, world.ours.id, late.id))?.total).toBe(2);
  });

  it("gives nothing for another person's change or another trip", async () => {
    const [early] = await twoChanges();

    expect(await readPlanNote(world.admin, world.ours.id, early.id)).toBeNull();
    expect(await readPlanNote(world.member, world.theirs.id, early.id)).toBeNull();
  });
});
