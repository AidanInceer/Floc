import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { ensureProfile, updateProfileFields } from "@/server/auth/profile";
import { saveTravelStyle } from "@/server/auth/travel-style";
import { wishListFor } from "@/server/wish-lists/wish-lists";
import { friendCodeFor } from "@/server/social/friend-code";
import { friendStateWith } from "@/server/social/friends";
import { createGroup } from "@/server/social/groups";
import { befriend, migrateTestDb, resetDb, seedScenario, signIn, type Scenario } from "@/test/db";

import {
  acceptFriend,
  cancelRequest,
  declineFriend,
  removeFriend,
  requestFriendByCode,
  requestFriendById,
  sendGroupIdeasAction,
} from "./actions";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

const form = (fields: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
};

describe("friend requests through their actions", () => {
  it("asks someone you share a trip with", async () => {
    signIn(world.admin);
    await expect(requestFriendById(form({ targetId: world.member }))).resolves.toEqual({});
    expect(await friendStateWith(world.admin, world.member)).toBe("outgoing");
    expect(await friendStateWith(world.member, world.admin)).toBe("incoming");
  });

  it("asks nobody when the person is a stranger, and says nothing", async () => {
    signIn(world.admin);
    await expect(requestFriendById(form({ targetId: world.outsider, viaId: world.member }))).resolves.toEqual({});
    expect(await friendStateWith(world.admin, world.outsider)).toBe("none");
  });

  it("asks someone by their friend code", async () => {
    const code = await friendCodeFor(world.outsider);
    signIn(world.member);
    await requestFriendByCode(form({ code }));
    expect(await friendStateWith(world.member, world.outsider)).toBe("outgoing");
  });

  it("accepts a request that came in", async () => {
    signIn(world.admin);
    await requestFriendById(form({ targetId: world.member }));
    signIn(world.member);
    await acceptFriend(form({ requesterId: world.admin }));
    expect(await friendStateWith(world.member, world.admin)).toBe("friends");
  });

  it("declines a request that came in", async () => {
    signIn(world.admin);
    await requestFriendById(form({ targetId: world.member }));
    signIn(world.member);
    await declineFriend(form({ requesterId: world.admin }));
    expect(await friendStateWith(world.member, world.admin)).toBe("none");
  });

  it("takes back a request you sent", async () => {
    signIn(world.admin);
    await requestFriendById(form({ targetId: world.member }));
    await cancelRequest(form({ targetId: world.member }));
    expect(await friendStateWith(world.admin, world.member)).toBe("none");
  });

  it("removes a friend", async () => {
    await befriend(world.admin, world.member);
    signIn(world.admin);
    await removeFriend(form({ otherId: world.member }));
    expect(await friendStateWith(world.admin, world.member)).toBe("none");
  });
});

describe("sending a group's trip ideas", () => {
  beforeEach(async () => {
    await befriend(world.admin, world.member);
    signIn(world.admin);
  });

  it("makes a wish list of the ideas for the group to vote on", async () => {
    await ensureProfile(world.admin);
    await updateProfileFields(world.admin, { vibeTags: ["food first", "hiking"] });
    await saveTravelStyle(world.admin, { travelStay: "mid", travelPace: "balanced" });
    const groupId = await createGroup(world.admin, { name: "Weekend crew", memberIds: [world.member] });

    const result = await sendGroupIdeasAction(groupId);
    expect(result.error).toBeUndefined();
    const list = await wishListFor(world.admin, result.sent!.listId);
    expect(list?.invited.map((p) => p.id)).toEqual([world.member]);
    expect(list?.items.length).toBeGreaterThan(0);
  });

  it("returns the refusal as an error when there are no ideas to send", async () => {
    const groupId = await createGroup(world.admin, { name: "Weekend crew", memberIds: [world.member] });
    await expect(sendGroupIdeasAction(groupId)).resolves.toEqual({ error: "There are no trip ideas to send yet." });
  });
});
