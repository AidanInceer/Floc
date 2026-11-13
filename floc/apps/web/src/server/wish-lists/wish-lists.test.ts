/**
 * Wish lists (#623, ADR-049). The rules worth failing on: you join only by accepting, an invite or a stranger
 * reads nothing, only friends and co-members can be asked, every member is equal, the last one out ends it,
 * and a link is only ever http or https.
 */
import { PRESET_TRIPS } from "@floc/core/trip/explore/preset-trips";
import { and, eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { befriend, migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";

import { listWishListsFor, wishListFor, wishListPeopleToAsk } from "./wish-lists";
import {
  addWishItem,
  createWishList,
  inviteToWishList,
  leaveWishList,
  removeWishItem,
  renameWishList,
  respondToWishInvite,
} from "./wish-list-writes";

let world: Scenario;
const listing = PRESET_TRIPS[0].id;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  await befriend(world.admin, world.outsider);
});

const joined = async (listId: number, userId: string) => respondToWishInvite(userId, listId, true);

describe("making a list", () => {
  it("puts its maker on it and only invites the others", async () => {
    const id = await createWishList(world.admin, { inviteIds: [world.member] });

    const mine = await wishListFor(world.admin, id);
    expect(mine?.members.map((m) => m.id)).toEqual([world.admin]);
    expect(mine?.invited.map((m) => m.id)).toEqual([world.member]);
    expect(mine?.title).toBe("Wish list with Mo");
  });

  it("refuses anyone you could not ask onto a trip", async () => {
    await expect(createWishList(world.member, { inviteIds: [world.outsider] })).rejects.toThrow(
      "You can only add friends and people on a trip with you.",
    );
  });

  it("can start with items", async () => {
    const id = await createWishList(world.admin, {
      inviteIds: [],
      items: [{ kind: "explore", presetId: listing }, { kind: "country", code: "PT" }],
    });
    expect((await wishListFor(world.admin, id))?.items.map((i) => i.kind).sort()).toEqual(["country", "explore"]);
  });
});

describe("an invite", () => {
  it("shows on the invitee's lists but does not let them read it", async () => {
    const id = await createWishList(world.admin, { inviteIds: [world.member] });

    const theirs = await listWishListsFor(world.member);
    expect(theirs.lists).toEqual([]);
    expect(theirs.invites.map((i) => ({ id: i.id, from: i.from?.id }))).toEqual([{ id, from: world.admin }]);
    expect(await wishListFor(world.member, id)).toBeNull();
  });

  it("tells the invitee", async () => {
    await createWishList(world.admin, { inviteIds: [world.member] });
    const told = await db
      .select({ kind: schema.activity.kind })
      .from(schema.notification)
      .innerJoin(schema.activity, eq(schema.activity.id, schema.notification.activityId))
      .where(eq(schema.notification.userId, world.member))
      .all();
    expect(told.map((t) => t.kind)).toContain("wish_list_invited");
  });

  it("once accepted, makes them a member and names the list after the others", async () => {
    const id = await createWishList(world.admin, { inviteIds: [world.member] });
    await joined(id, world.member);

    expect((await wishListFor(world.member, id))?.title).toBe("Wish list with Ada");
    expect((await listWishListsFor(world.admin)).lists[0]).toMatchObject({ id, title: "Wish list with Mo", itemCount: 0 });
  });

  it("once declined, is gone", async () => {
    const id = await createWishList(world.admin, { inviteIds: [world.member] });
    await respondToWishInvite(world.member, id, false);

    expect((await listWishListsFor(world.member)).invites).toEqual([]);
    expect((await wishListFor(world.admin, id))?.invited).toEqual([]);
  });

  it("cannot be accepted when there was none", async () => {
    const id = await createWishList(world.admin, { inviteIds: [] });
    await expect(respondToWishInvite(world.outsider, id, true)).rejects.toThrow("That wish list is gone.");
  });

  it("can come from any member, not only the maker", async () => {
    const id = await createWishList(world.admin, { inviteIds: [world.member] });
    await joined(id, world.member);
    await expect(inviteToWishList(world.admin, id, [world.outsider])).resolves.toBe(1);
  });
});

describe("a stranger", () => {
  it("gets the same answer as for a list that does not exist (rule 5)", async () => {
    const id = await createWishList(world.admin, { inviteIds: [] });
    expect(await wishListFor(world.outsider, id)).toBeNull();
    await expect(addWishItem(world.outsider, id, { kind: "text", text: "Lakes" })).rejects.toThrow("That wish list is gone.");
    await expect(addWishItem(world.outsider, 999_999, { kind: "text", text: "Lakes" })).rejects.toThrow("That wish list is gone.");
  });
});

describe("items", () => {
  it("any member adds and removes any item", async () => {
    const id = await createWishList(world.admin, { inviteIds: [world.member] });
    await joined(id, world.member);
    const itemId = await addWishItem(world.admin, id, { kind: "link", url: "https://www.gadventures.com/peru", label: "Peru" });
    await removeWishItem(world.member, id, itemId);

    expect((await wishListFor(world.admin, id))?.items).toEqual([]);
    const row = await db.select().from(schema.wishListItem).where(eq(schema.wishListItem.id, itemId)).get();
    expect(row?.deletedAt).not.toBeNull();
  });

  it("refuses a link that is not http or https", async () => {
    const id = await createWishList(world.admin, { inviteIds: [] });
    await expect(addWishItem(world.admin, id, { kind: "link", url: "javascript:alert(1)" })).rejects.toThrow(
      "Paste a web address that starts with http or https.",
    );
  });

  it("refuses an Explore id that is no listing", async () => {
    const id = await createWishList(world.admin, { inviteIds: [] });
    await expect(addWishItem(world.admin, id, { kind: "explore", presetId: "nope" })).rejects.toThrow("That trip is not on Explore.");
  });

  it("keeps one of each listing and country", async () => {
    const id = await createWishList(world.admin, { inviteIds: [] });
    await addWishItem(world.admin, id, { kind: "country", code: "PT" });
    await addWishItem(world.admin, id, { kind: "country", code: "PT" });
    expect((await wishListFor(world.admin, id))?.items).toHaveLength(1);
  });

  it("names who added each", async () => {
    const id = await createWishList(world.admin, { inviteIds: [] });
    await addWishItem(world.admin, id, { kind: "text", text: "Somewhere with a lake" });
    expect((await wishListFor(world.admin, id))?.items[0]).toMatchObject({ text: "Somewhere with a lake", addedBy: { id: world.admin } });
  });
});

describe("renaming", () => {
  it("any member renames; empty goes back to the people's names", async () => {
    const id = await createWishList(world.admin, { inviteIds: [world.member] });
    await joined(id, world.member);
    await renameWishList(world.member, id, "Uni lot");
    expect((await wishListFor(world.admin, id))?.title).toBe("Uni lot");
    await renameWishList(world.admin, id, " ");
    expect((await wishListFor(world.admin, id))?.title).toBe("Wish list with Mo");
  });
});

describe("leaving", () => {
  it("takes you off; the others keep the list", async () => {
    const id = await createWishList(world.admin, { inviteIds: [world.member] });
    await joined(id, world.member);
    await leaveWishList(world.admin, id);

    expect(await wishListFor(world.admin, id)).toBeNull();
    expect((await wishListFor(world.member, id))?.members.map((m) => m.id)).toEqual([world.member]);
  });

  it("by the last member ends the list, and its open invites with it", async () => {
    const id = await createWishList(world.admin, { inviteIds: [world.member] });
    await leaveWishList(world.admin, id);

    const list = await db.select().from(schema.wishList).where(eq(schema.wishList.id, id)).get();
    expect(list?.deletedAt).not.toBeNull();
    expect((await listWishListsFor(world.member)).invites).toEqual([]);
  });

  it("then a new invite brings you back", async () => {
    const id = await createWishList(world.admin, { inviteIds: [world.member] });
    await joined(id, world.member);
    await leaveWishList(world.member, id);
    await inviteToWishList(world.admin, id, [world.member]);
    const row = await db
      .select({ status: schema.wishListMember.status })
      .from(schema.wishListMember)
      .where(and(eq(schema.wishListMember.listId, id), eq(schema.wishListMember.userId, world.member)))
      .get();
    expect(row?.status).toBe("invited");
  });
});

describe("starting a trip from a list", () => {
  it("asks the other members you can still ask", async () => {
    const id = await createWishList(world.admin, { inviteIds: [world.member, world.outsider] });
    await joined(id, world.member);
    expect((await wishListPeopleToAsk(world.admin, id)).map((p) => p.id)).toEqual([world.member]);
  });

  it("asks nobody for a stranger", async () => {
    const id = await createWishList(world.admin, { inviteIds: [world.member] });
    await joined(id, world.member);
    expect(await wishListPeopleToAsk(world.outsider, id)).toEqual([]);
  });
});
