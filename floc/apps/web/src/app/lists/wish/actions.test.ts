import { PRESET_TRIPS } from "@floc/core/trip/explore/preset-trips";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { listWishListsFor, wishListFor } from "@/server/wish-lists/wish-lists";
import { REDIRECT } from "@/test/setup";
import { befriend, migrateTestDb, resetDb, seedScenario, signIn, type Scenario } from "@/test/db";

import {
  addWishItemAction,
  createWishListAction,
  inviteToWishListAction,
  leaveWishListAction,
  removeWishItemAction,
  renameWishListAction,
  respondToWishInviteAction,
  startWishListWithAction,
  toggleWishVoteAction,
} from "./actions";

let world: Scenario;
const listing = PRESET_TRIPS[0].id;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  await befriend(world.admin, world.member);
  await befriend(world.admin, world.outsider);
  signIn(world.admin);
});

async function makeList(inviteIds: string[] = []) {
  const result = await createWishListAction(inviteIds);
  if (result.id === undefined) throw new Error(result.error);
  return result.id;
}

describe("wish lists through their actions", () => {
  it("makes a list for the signed-in person and returns its id", async () => {
    const id = await makeList([world.member]);
    const list = await wishListFor(world.admin, id);
    expect(list?.members.map((m) => m.id)).toEqual([world.admin]);
    expect(list?.invited.map((m) => m.id)).toEqual([world.member]);
  });

  it("starts a list with one friend", async () => {
    const result = await startWishListWithAction(world.member);
    expect(result.id).toBeDefined();
    expect((await wishListFor(world.admin, result.id!))?.invited.map((m) => m.id)).toEqual([world.member]);
  });

  it("invites more friends to a list", async () => {
    const id = await makeList();
    expect((await inviteToWishListAction(id, [world.outsider])).error).toBeUndefined();
    expect((await wishListFor(world.admin, id))?.invited.map((m) => m.id)).toEqual([world.outsider]);
  });

  it("returns the list id when an invite is accepted", async () => {
    const id = await makeList([world.member]);
    signIn(world.member);
    await expect(respondToWishInviteAction(id, true)).resolves.toEqual({ id });
    expect((await wishListFor(world.member, id))?.members.map((m) => m.id).sort()).toEqual([world.admin, world.member].sort());
  });

  it("returns no id when an invite is declined", async () => {
    const id = await makeList([world.member]);
    signIn(world.member);
    await expect(respondToWishInviteAction(id, false)).resolves.toEqual({});
    expect((await listWishListsFor(world.member)).invites).toEqual([]);
    expect(await wishListFor(world.member, id)).toBeNull();
  });

  it("lets a member leave a list", async () => {
    const id = await makeList([world.member]);
    signIn(world.member);
    await respondToWishInviteAction(id, true);
    await expect(leaveWishListAction(id)).resolves.toEqual({});
    expect(await wishListFor(world.member, id)).toBeNull();
  });

  it("renames a list", async () => {
    const id = await makeList();
    await expect(renameWishListAction(id, "Summer ideas")).resolves.toEqual({});
    expect((await wishListFor(world.admin, id))?.title).toBe("Summer ideas");
  });

  it("adds an item, votes for it, and takes it off", async () => {
    const id = await makeList();
    expect((await addWishItemAction(id, { kind: "explore", presetId: listing })).error).toBeUndefined();
    const [item] = (await wishListFor(world.admin, id))!.items;
    expect(item).toMatchObject({ presetId: listing, voted: false });

    expect((await toggleWishVoteAction(id, item!.id)).error).toBeUndefined();
    expect((await wishListFor(world.admin, id))!.items[0]).toMatchObject({ votes: 1, voted: true });

    expect((await removeWishItemAction(id, item!.id)).error).toBeUndefined();
    expect((await wishListFor(world.admin, id))!.items).toEqual([]);
  });

  it("returns the refusal as an error when someone is not a friend", async () => {
    signIn(world.member);
    await expect(createWishListAction([world.outsider])).resolves.toEqual({
      error: "You can only add friends and people on a trip with you.",
    });
  });

  it("sends a signed-out visitor to sign in, back to Lists", async () => {
    signIn(null);
    const back = encodeURIComponent("/lists/wish");
    await expect(createWishListAction([])).rejects.toThrow(`${REDIRECT}:/login?redirect=${back}`);
  });
});
