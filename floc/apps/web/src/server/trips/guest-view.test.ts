/**
 * What somebody on a share link may read (#330, #442).
 *
 * These are the privacy boundary, not a feature: every assertion here is about
 * something a member can see that a non-member must not. A field added to a
 * projection without a test is exactly how one leaks.
 */
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { guestIdeas, guestOwnDates } from "@/server/trips/guest-view";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

describe("guestIdeas (#442)", () => {
  it("shows each idea's title and count, the viewer's own vote, and no names", async () => {
    const { insertIdea, toggleIdeaVote } = await import("@/server/ideas/ideas");
    const ideaId = await insertIdea({ tripId: world.ours.id, createdBy: world.admin, title: "Lisbon" });
    await toggleIdeaVote(ideaId, world.member);
    await db.insert(schema.user).values({ id: "g-sam", name: "Sam", email: "g@guest.test", isAnonymous: true });
    await toggleIdeaVote(ideaId, "g-sam");

    expect(await guestIdeas(world.ours.id, "g-sam")).toEqual([{ id: ideaId, title: "Lisbon", votes: 2, mine: true }]);
    expect(await guestIdeas(world.ours.id, null)).toEqual([{ id: ideaId, title: "Lisbon", votes: 2, mine: false }]);
  });
});

describe("guestOwnDates (#442)", () => {
  it("returns only the guest's own free days, never the group's", async () => {
    const { setAvailability } = await import("@/server/itinerary/availability");
    await db.insert(schema.user).values({ id: "g-sam", name: "Sam", email: "g@guest.test", isAnonymous: true });
    await setAvailability(world.ours.id, "g-sam", ["2026-09-01"], true);
    await setAvailability(world.ours.id, "g-sam", ["2026-09-02"], false);
    await setAvailability(world.ours.id, world.member, ["2026-09-03"], true);

    expect(await guestOwnDates(world.ours.id, "g-sam")).toEqual(["2026-09-01"]);
    expect(await guestOwnDates(world.ours.id, null)).toEqual([]);
  });
});
