/** #346, #626: date reminders reach every member once, obey the switch, and chase only who owes. */
import { and, eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { addDays } from "@floc/core/dates/dates";
import { START_TRIP_HREF } from "@floc/core/notifications/notification-href";
import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { writeExpense } from "@/server/money/money";
import { listInbox } from "@/server/notifications/inbox";
import { sendDueReminders } from "@/server/notifications/reminders";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

const now = new Date("2026-09-13T09:00:00Z");
const today = "2026-09-13";

const dateOurs = (startDate: string | null, endDate: string | null) =>
  db.update(schema.trip).set({ startDate, endDate }).where(eq(schema.trip.id, world.ours.id));

const inboxText = async (userId: string) => (await listInbox(userId, null)).items.map((i) => i.text);

const dinnerSplitWithMo = () =>
  writeExpense({
    tripId: world.ours.id,
    createdBy: world.admin,
    fields: {
      dayId: null,
      paidBy: world.admin,
      description: "Dinner",
      amountMinor: 3000,
      currency: "GBP",
      splitType: "even",
      category: "other",
      notes: null,
    },
    splits: [
      { userId: world.admin, owedAmountMinor: 1500 },
      { userId: world.member, owedAmountMinor: 1500 },
    ],
  });

const owes = async (userId: string) => (await inboxText(userId)).filter((t) => t.startsWith("You still owe"));

describe("date reminders", () => {
  it("sends nothing before 08:00 UTC", async () => {
    await dateOurs(addDays(today, 7), addDays(today, 10));
    expect(await sendDueReminders(new Date("2026-09-13T07:00:00Z"))).toBe(0);
  });

  it("tells every member a week ahead, once, however often it runs", async () => {
    await dateOurs(addDays(today, 7), addDays(today, 10));

    expect(await sendDueReminders(now)).toBe(2);
    expect(await sendDueReminders(now)).toBe(0);

    expect(await inboxText(world.admin)).toEqual(["Ours starts in a week"]);
    expect(await inboxText(world.member)).toEqual(["Ours starts in a week"]);
    expect(await inboxText(world.outsider)).toEqual([]);
  });

  it("skips someone with reminders switched off", async () => {
    await dateOurs(today, addDays(today, 3));
    await db.insert(schema.userProfile).values({ userId: world.member, notifyReminders: false });
    await sendDueReminders(now);
    expect(await inboxText(world.member)).toEqual([]);
    expect(await inboxText(world.admin)).toEqual(["Ours starts today"]);
  });

  it("chases only the person who still owes a week after, naming who and how much", async () => {
    await dateOurs(addDays(today, -10), addDays(today, -7));
    await dinnerSplitWithMo();

    await sendDueReminders(now);
    expect(await sendDueReminders(now)).toBe(0);
    expect(await owes(world.member)).toEqual(["You still owe Ada £15.00 for Ours"]);
    expect(await owes(world.admin)).toEqual([]);
  });

  it("chases again a month after the end", async () => {
    await dateOurs(addDays(today, -33), addDays(today, -30));
    await dinnerSplitWithMo();
    await sendDueReminders(now);
    expect(await owes(world.member)).toEqual(["You still owe Ada £15.00 for Ours"]);
  });

  it("no longer chases 3 days after the end", async () => {
    await dateOurs(addDays(today, -6), addDays(today, -3));
    await dinnerSplitWithMo();
    await sendDueReminders(now);
    expect(await owes(world.member)).toEqual([]);
  });

  it("gives an undated trip nothing", async () => {
    expect(await sendDueReminders(now)).toBe(0);
  });
});

describe("the next trip prompt (#626)", () => {
  const ASK = "Have you thought about your next trip yet?";
  const asked = async (userId: string) => (await listInbox(userId, null)).items.filter((i) => i.text === ASK);

  const dateTheirs = (startDate: string | null, endDate: string | null) =>
    db.update(schema.trip).set({ startDate, endDate }).where(eq(schema.trip.id, world.theirs.id));

  it("asks each member 60 days after their last trip ended, once, and opens Start a trip", async () => {
    await dateOurs(addDays(today, -65), addDays(today, -60));

    await sendDueReminders(now);
    expect(await sendDueReminders(now)).toBe(0);

    for (const userId of [world.admin, world.member]) {
      const rows = await asked(userId);
      expect(rows).toHaveLength(1);
      expect(rows[0].href).toBe(START_TRIP_HREF);
    }
    expect(await asked(world.outsider)).toEqual([]);
  });

  it("asks again 180 days after", async () => {
    await dateOurs(addDays(today, -185), addDays(today, -180));
    await sendDueReminders(now);
    expect(await asked(world.admin)).toHaveLength(1);
  });

  it("counts only the last finished trip", async () => {
    await dateOurs(addDays(today, -65), addDays(today, -60));
    await db.insert(schema.tripMembership).values({ tripId: world.theirs.id, userId: world.member, role: "member" });
    await dateTheirs(addDays(today, -20), addDays(today, -10));

    await sendDueReminders(now);
    expect(await asked(world.member)).toEqual([]);
    expect(await asked(world.admin)).toHaveLength(1);
  });

  it("asks nobody who has a trip ahead, dated or not", async () => {
    await dateOurs(addDays(today, -65), addDays(today, -60));
    await db.insert(schema.tripMembership).values({ tripId: world.theirs.id, userId: world.member, role: "member" });

    await sendDueReminders(now);
    expect(await asked(world.member)).toEqual([]);

    await dateTheirs(addDays(today, 30), addDays(today, 35));
    await sendDueReminders(now);
    expect(await asked(world.member)).toEqual([]);
    expect(await asked(world.admin)).toHaveLength(1);
  });

  it("skips a trip the person left, and someone with the switch off", async () => {
    await dateOurs(addDays(today, -65), addDays(today, -60));
    await db
      .update(schema.tripMembership)
      .set({ deletedAt: new Date() })
      .where(and(eq(schema.tripMembership.tripId, world.ours.id), eq(schema.tripMembership.userId, world.member)));
    await db.insert(schema.userProfile).values({ userId: world.admin, notifyNextTrip: false });

    await sendDueReminders(now);
    expect(await asked(world.member)).toEqual([]);
    expect(await asked(world.admin)).toEqual([]);
  });

  it("is about no one trip, so a muted trip does not hold it back", async () => {
    await dateOurs(addDays(today, -65), addDays(today, -60));
    await db
      .update(schema.tripMembership)
      .set({ mutedAt: new Date() })
      .where(eq(schema.tripMembership.tripId, world.ours.id));

    await sendDueReminders(now);
    const [row] = await db
      .select({ tripId: schema.activity.tripId })
      .from(schema.activity)
      .where(eq(schema.activity.kind, "next_trip_2m"))
      .all();
    expect(row.tripId).toBeNull();
  });
});
