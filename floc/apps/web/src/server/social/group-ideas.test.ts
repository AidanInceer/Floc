import { GROUP_FIT } from "@floc/core/trip/explore/fit/group-fit";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { ensureProfile, updateProfileFields } from "@/server/auth/profile";
import { saveTravelStyle } from "@/server/auth/travel-style";
import { listWishListsFor, wishListFor } from "@/server/wish-lists/wish-lists";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";

import { groupIdeasFor, sendGroupIdeas } from "./group-ideas";
import { createGroup } from "./groups";

let world: Scenario;
let groupId: number;

async function style(userId: string, vibeTags: string[]): Promise<void> {
  await ensureProfile(userId);
  await updateProfileFields(userId, { vibeTags });
  await saveTravelStyle(userId, { travelStay: "mid", travelPace: "balanced" });
}

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  groupId = await createGroup(world.admin, { name: "Uni lot", memberIds: [world.member] });
});

describe("trip ideas for a group (#177, ADR-074)", () => {
  it("is not there for a group the viewer does not own", async () => {
    expect(await groupIdeasFor(world.member, groupId)).toBeNull();
  });

  it("has no ideas while nobody has a travel style", async () => {
    expect(await groupIdeasFor(world.admin, groupId)).toMatchObject({ name: "Uni lot", people: 1, withStyle: 0, you: false, ideas: [] });
  });

  it("lists up to ten trips, best match first, once the owner has a travel style", async () => {
    await style(world.admin, ["food first", "hiking"]);

    const found = await groupIdeasFor(world.admin, groupId);
    expect(found?.you).toBe(true);
    expect(found?.ideas).toHaveLength(GROUP_FIT.ideas);
    const matches = found!.ideas.map((idea) => idea.match);
    expect(matches).toEqual([...matches].sort((a, b) => b - a));
  });

  it("counts the members who have a travel style", async () => {
    await style(world.admin, ["food first"]);
    await style(world.member, ["beaches"]);

    expect(await groupIdeasFor(world.admin, groupId)).toMatchObject({ people: 1, withStyle: 1 });
  });

  it("changes with a member's travel style", async () => {
    await style(world.admin, ["food first", "museums"]);
    const alone = await groupIdeasFor(world.admin, groupId);
    await style(world.member, ["hiking", "beaches"]);

    expect((await groupIdeasFor(world.admin, groupId))?.ideas).not.toEqual(alone?.ideas);
  });

  it("treats a member who turned it off as having no travel style", async () => {
    await style(world.admin, ["food first", "museums"]);
    const alone = await groupIdeasFor(world.admin, groupId);
    await style(world.member, ["hiking", "beaches"]);
    await saveTravelStyle(world.member, { styleInGroupIdeas: false });

    const found = await groupIdeasFor(world.admin, groupId);
    expect(found).toMatchObject({ people: 1, withStyle: 0 });
    expect(found?.ideas).toEqual(alone?.ideas);
  });
});

describe("asking a group to vote", () => {
  it("makes a wish list of the ideas and invites the group's members", async () => {
    await style(world.admin, ["food first", "hiking"]);
    const ideas = (await groupIdeasFor(world.admin, groupId))!.ideas;

    const sent = await sendGroupIdeas(world.admin, groupId);
    const list = await wishListFor(world.admin, sent.listId);

    expect(list?.name).toBe("Trip ideas for Uni lot");
    expect(list?.invited.map((p) => p.id)).toEqual([world.member]);
    expect(list?.items.map((i) => i.presetId).sort()).toEqual(ideas.map((i) => i.presetId).sort());
    expect(sent.items.map((i) => i.presetId).sort()).toEqual(ideas.map((i) => i.presetId).sort());
    expect((await listWishListsFor(world.member)).invites.map((i) => i.id)).toEqual([sent.listId]);
  });

  it("refuses when there are no ideas to send", async () => {
    await expect(sendGroupIdeas(world.admin, groupId)).rejects.toThrow("There are no trip ideas to send yet.");
  });

  it("refuses a group the viewer does not own", async () => {
    await expect(sendGroupIdeas(world.member, groupId)).rejects.toThrow("That group is gone.");
  });
});
