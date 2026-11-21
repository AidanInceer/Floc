import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { findTripAccess } from "@/server/access";
import { setAvailability } from "@/server/itinerary/availability";
import { insertIdea, toggleIdeaVote } from "@/server/ideas/ideas";
import { writeExpense } from "@/server/money/money";
import { listInbox } from "@/server/notifications/inbox";
import { LIMITS } from "@/server/limits";
import { addMember } from "@/server/trips/roster";
import { insertNudge, nudgeTargetsFor, sendNudges } from "@/server/trips/nudges";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

const as = async (userId: string) => {
  const access = await findTripAccess(world.ours.id, userId);
  if (!access) throw new Error("not a member");
  return access;
};

const nudges = () => db.select().from(schema.nudge).all();

describe("sendNudges (#705)", () => {
  it("nudges someone to mark their days, with no message, and tells them what to do", async () => {
    expect(await sendNudges(await as(world.admin), "dates", [world.member])).toEqual({ send: [world.member], capped: false });

    expect(await nudges()).toMatchObject([{ toUserId: world.member, tab: "dates", message: null }]);
    const [activity] = await db.select().from(schema.activity).where(eq(schema.activity.kind, "nudge_sent")).all();
    expect(activity).toMatchObject({ detail: "dates", href: `/trip/${world.ours.id}/dates` });
    const inbox = await listInbox(world.member, null);
    expect(inbox.items[0].text).toBe("Ada nudged you to mark your days on the trip Ours");
  });

  it("sends nothing to someone who has already marked their days", async () => {
    await setAvailability(world.ours.id, world.member, ["2026-09-01"], true);
    expect((await sendNudges(await as(world.admin), "dates", [world.member])).send).toEqual([]);
    expect(await nudges()).toEqual([]);
  });

  it("nudges a person once a day for a task, whoever asks (rule 5)", async () => {
    await addMember(world.ours.id, world.outsider);
    await sendNudges(await as(world.admin), "dates", [world.member]);
    expect((await sendNudges(await as(world.outsider), "dates", [world.member])).send).toEqual([]);
    expect(await nudges()).toHaveLength(1);
  });

  it("never nudges you, or anyone outside the trip", async () => {
    expect((await sendNudges(await as(world.admin), "dates", [world.admin, world.outsider])).send).toEqual([]);
  });

  it("lets only the person owed nudge about a debt", async () => {
    await writeExpense({
      tripId: world.ours.id,
      createdBy: world.admin,
      fields: { dayId: null, paidBy: world.admin, description: "Dinner", amountMinor: 2000, currency: "GBP", splitType: "even", category: "food", notes: null },
      splits: [
        { userId: world.admin, owedAmountMinor: 1000 },
        { userId: world.member, owedAmountMinor: 1000 },
      ],
    });
    expect((await sendNudges(await as(world.member), "money", [world.admin])).send).toEqual([]);
    expect((await sendNudges(await as(world.admin), "money", [world.member])).send).toEqual([world.member]);
    expect((await listInbox(world.member, null)).items[0].text).toBe("Ada nudged you to settle up on the trip Ours");
  });

  it("nudges someone who has voted on no idea, and opens Ideas", async () => {
    const ideaId = await insertIdea({ tripId: world.ours.id, createdBy: world.admin, title: "Lisbon" });
    await toggleIdeaVote(ideaId, world.admin);
    expect((await sendNudges(await as(world.admin), "ideas", [world.member])).send).toEqual([world.member]);
    const [activity] = await db.select().from(schema.activity).where(eq(schema.activity.kind, "nudge_sent")).all();
    expect(activity.href).toBe(`/trip/${world.ours.id}/overview#ideas`);
  });

  it("stops at the daily cap and says so", async () => {
    for (let i = 0; i < LIMITS.nudgesPerDay; i++) await insertNudge({ tripId: world.ours.id, fromUserId: world.admin, toUserId: world.member, tab: "money" });
    expect(await sendNudges(await as(world.admin), "dates", [world.member])).toEqual({ send: [], capped: true });
  });
});

describe("nudgeTargetsFor", () => {
  it("names who can be nudged for each task, and who already was today", async () => {
    await sendNudges(await as(world.admin), "dates", [world.member]);
    const targets = await nudgeTargetsFor(await as(world.admin));
    expect(targets.dates).toEqual([{ userId: world.member, name: "Mo", nudged: true }]);
    expect(targets.money).toEqual([]);
  });
});
