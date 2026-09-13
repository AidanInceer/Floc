/** #346: date reminders reach every member once, obey the switch, and chase only who owes. */
import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { addDays } from "@floc/core/dates/dates";
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

  it("chases only the person who still owes, naming who and how much", async () => {
    await dateOurs(addDays(today, -6), addDays(today, -3));
    await writeExpense({
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

    await sendDueReminders(now);
    expect(await inboxText(world.member)).toContain("You still owe Ada £15.00 for Ours");
    expect((await inboxText(world.admin)).some((t) => t.startsWith("You still owe"))).toBe(false);
  });

  it("gives an undated trip nothing", async () => {
    expect(await sendDueReminders(now)).toBe(0);
  });
});
