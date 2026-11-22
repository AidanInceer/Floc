import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { day, dayEvent, idea } from "@/db/schema";
import { findTripAccess, type TripAccess } from "@/server/access";
import { insertIdea, softDeleteIdea, toggleIdeaVote } from "@/server/ideas/ideas";
import { ideaVoters, listIdeas } from "@/server/ideas/ideas-read";
import { addIdeaToDays, renameIdea, restoreIdea, takeIdeaOffDays } from "@/server/ideas/idea-writes";
import { softDeleteEvent } from "@/server/itinerary/itinerary";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";

let world: Scenario;
let access: TripAccess;
let dayId: number;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  access = (await findTripAccess(world.ours.id, world.admin))!;
  const row = await db.insert(day).values({ tripId: world.ours.id, date: "2027-05-01" }).returning({ id: day.id }).get();
  dayId = row.id;
});

const put = (title: string, category?: string) =>
  insertIdea({ tripId: world.ours.id, createdBy: world.admin, title, category });
const shown = async () => (await listIdeas(world.ours.id, world.admin)).map((r) => r.title);
const events = () =>
  db.select().from(dayEvent).where(and(eq(dayEvent.dayId, dayId), isNull(dayEvent.deletedAt))).all();

describe("category", () => {
  it("stores the category it was given and reads it back", async () => {
    await put("Time Out Market", "food");
    expect((await listIdeas(world.ours.id, world.admin))[0].category).toBe("food");
  });

  it("shows an idea with no category under Other, without rewriting it", async () => {
    const id = await put("Old idea");
    expect((await listIdeas(world.ours.id, world.admin))[0].category).toBe("other");
    expect((await db.select({ category: idea.category }).from(idea).where(eq(idea.id, id)).get())?.category).toBeNull();
  });
});

describe("renameIdea", () => {
  it("changes the name", async () => {
    const id = await put("Sintra");
    await renameIdea(access, id, "Day train to Sintra");
    expect(await shown()).toEqual(["Day train to Sintra"]);
  });

  it("ignores another trip's idea", async () => {
    const theirs = await insertIdea({ tripId: world.theirs.id, createdBy: world.outsider, title: "Peaks" });
    await renameIdea(access, theirs, "Mine now");
    expect((await db.select({ title: idea.title }).from(idea).where(eq(idea.id, theirs)).get())?.title).toBe("Peaks");
  });
});

describe("restoreIdea", () => {
  it("brings a removed idea back with its votes", async () => {
    const id = await put("Fado night");
    await toggleIdeaVote(id, world.member);
    await softDeleteIdea(world.ours.id, id);

    await restoreIdea(access, id);

    expect((await listIdeas(world.ours.id, world.admin))[0]).toMatchObject({ title: "Fado night", votes: 1 });
  });
});

describe("addIdeaToDays", () => {
  it("makes an event of the category's type and takes the idea out of the list", async () => {
    const id = await put("Time Out Market", "drinks");

    await addIdeaToDays(access, id, dayId, "19:30");

    expect(await events()).toMatchObject([{ title: "Time Out Market", type: "food", time: "19:30", allDay: false }]);
    expect(await shown()).toEqual([]);
  });

  it("makes an all-day event when no time is chosen", async () => {
    const id = await put("Pena Palace", "activities");
    await addIdeaToDays(access, id, dayId, null);
    expect(await events()).toMatchObject([{ type: "activity", time: null, allDay: true }]);
  });

  it("does not add the same idea twice", async () => {
    const id = await put("Tram 28", "travel");
    await addIdeaToDays(access, id, dayId, null);
    await addIdeaToDays(access, id, dayId, null);
    expect(await events()).toHaveLength(1);
  });

  it("refuses a day from another trip", async () => {
    const id = await put("Tram 28", "travel");
    const other = await db.insert(day).values({ tripId: world.theirs.id, date: "2027-05-01" }).returning({ id: day.id }).get();
    await expect(addIdeaToDays(access, id, other.id, null)).rejects.toThrow();
    expect(await shown()).toEqual(["Tram 28"]);
  });

  it("returns the idea to the list when its event is deleted on Days", async () => {
    const id = await put("Kayak", "activities");
    await addIdeaToDays(access, id, dayId, null);
    const [event] = await events();

    await softDeleteEvent(event.id);

    expect(await shown()).toEqual(["Kayak"]);
  });

  it("can go to Days again after its event was deleted", async () => {
    const id = await put("Kayak", "activities");
    await addIdeaToDays(access, id, dayId, null);
    await softDeleteEvent((await events())[0].id);

    await addIdeaToDays(access, id, dayId, "09:00");

    expect(await events()).toMatchObject([{ title: "Kayak", time: "09:00" }]);
    expect(await shown()).toEqual([]);
  });

  it("does not count an idea in the plan as one the group still has to vote on", async () => {
    const planned = await put("Kayak", "activities");
    await put("Surf");
    await toggleIdeaVote(planned, world.member);
    await addIdeaToDays(access, planned, dayId, null);

    expect(await ideaVoters(world.ours.id)).toEqual({ count: 1, voterIds: [] });
  });
});

describe("takeIdeaOffDays", () => {
  it("removes the event and returns the idea", async () => {
    const id = await put("Kayak", "activities");
    await addIdeaToDays(access, id, dayId, null);

    await takeIdeaOffDays(access, id);

    expect(await events()).toEqual([]);
    expect(await shown()).toEqual(["Kayak"]);
  });

  it("leaves an event alone when the idea is from another trip", async () => {
    const id = await put("Kayak", "activities");
    await addIdeaToDays(access, id, dayId, null);
    const outsider = (await findTripAccess(world.theirs.id, world.outsider))!;

    await takeIdeaOffDays(outsider, id);

    expect(await events()).toHaveLength(1);
  });
});
