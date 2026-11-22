import { PRESET_TRIPS } from "@floc/core/trip/explore/preset-trips";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";

import { toggleWishVote } from "./wish-list-votes";
import { createWishList, respondToWishInvite } from "./wish-list-writes";
import { wishListFor } from "./wish-lists";

let world: Scenario;
let listId: number;
const [first, second] = PRESET_TRIPS.map((t) => t.id);

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  listId = await createWishList(world.admin, {
    inviteIds: [world.member],
    items: [
      { kind: "explore", presetId: first },
      { kind: "explore", presetId: second },
    ],
  });
});

const itemFor = async (userId: string, presetId: string) => {
  const list = await wishListFor(userId, listId);
  const item = list?.items.find((i) => i.presetId === presetId);
  if (!item) throw new Error("item not on the list");
  return item;
};

describe("a vote on a wish list item (#177)", () => {
  it("starts every item with no votes", async () => {
    expect(await itemFor(world.admin, first)).toMatchObject({ votes: 0, voted: false });
  });

  it("counts a member's vote and marks it as theirs", async () => {
    const item = await itemFor(world.admin, first);
    await toggleWishVote(world.admin, listId, item.id);

    expect(await itemFor(world.admin, first)).toMatchObject({ votes: 1, voted: true });
    expect(await itemFor(world.admin, second)).toMatchObject({ votes: 0, voted: false });
  });

  it("shows another member the count but not as their own vote", async () => {
    await respondToWishInvite(world.member, listId, true);
    const item = await itemFor(world.admin, first);
    await toggleWishVote(world.admin, listId, item.id);

    expect(await itemFor(world.member, first)).toMatchObject({ votes: 1, voted: false });
  });

  it("takes the vote back on a second press, and gives it again on a third", async () => {
    const item = await itemFor(world.admin, first);
    await toggleWishVote(world.admin, listId, item.id);
    await toggleWishVote(world.admin, listId, item.id);
    expect(await itemFor(world.admin, first)).toMatchObject({ votes: 0, voted: false });

    await toggleWishVote(world.admin, listId, item.id);
    expect(await itemFor(world.admin, first)).toMatchObject({ votes: 1, voted: true });
  });

  it("refuses a person who was only invited", async () => {
    const item = await itemFor(world.admin, first);
    await expect(toggleWishVote(world.member, listId, item.id)).rejects.toThrow("That wish list is gone.");
  });

  it("refuses a person who is not on the list", async () => {
    const item = await itemFor(world.admin, first);
    await expect(toggleWishVote(world.outsider, listId, item.id)).rejects.toThrow("That wish list is gone.");
  });

  it("refuses an item from another list", async () => {
    const other = await createWishList(world.admin, { inviteIds: [], items: [{ kind: "explore", presetId: first }] });
    const stray = (await wishListFor(world.admin, other))?.items[0];
    await expect(toggleWishVote(world.admin, listId, stray?.id ?? 0)).rejects.toThrow("That is no longer on the list.");
  });
});
