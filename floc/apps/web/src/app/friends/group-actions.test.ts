import { beforeAll, beforeEach, expect, it } from "vitest";

import { listGroupsFor } from "@/server/social/groups";
import { befriend, migrateTestDb, resetDb, seedScenario, signIn, type Scenario } from "@/test/db";

import { createGroupAction, deleteGroupAction, saveGroupAction, setGroupMemberAction } from "./actions";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  await befriend(world.admin, world.outsider);
  signIn(world.admin);
});

async function createGroup() {
  const result = await createGroupAction({ name: "Weekend crew", memberIds: [world.member] });
  if (result.id === undefined) throw new Error(result.error);
  return result.id;
}

it("creates a group for the signed-in person", async () => {
  const id = await createGroup();
  expect(await listGroupsFor(world.admin)).toMatchObject([{ id, name: "Weekend crew", members: [{ id: world.member }] }]);
  expect(await listGroupsFor(world.member)).toEqual([]);
});

it("saves a new name and member selection", async () => {
  const id = await createGroup();
  await expect(saveGroupAction(id, { name: "Coast crew", memberIds: [world.outsider] })).resolves.toEqual({});
  expect(await listGroupsFor(world.admin)).toMatchObject([{ id, name: "Coast crew", members: [{ id: world.outsider }] }]);
});

it("ticks a friend into a group through their row menu", async () => {
  const id = await createGroup();
  await expect(setGroupMemberAction(id, world.outsider, true)).resolves.toEqual({});
  const [group] = await listGroupsFor(world.admin);
  expect(group.members.map((member) => member.id).sort()).toEqual([world.member, world.outsider].sort());
});

it("deletes a group from the owner's list", async () => {
  const id = await createGroup();
  await expect(deleteGroupAction(id)).resolves.toEqual({});
  expect(await listGroupsFor(world.admin)).toEqual([]);
});

it("returns a form error when someone tries to change another person's group", async () => {
  const id = await createGroup();
  signIn(world.member);
  await expect(deleteGroupAction(id)).resolves.toEqual({ error: "That group is gone." });
  expect(await listGroupsFor(world.admin)).toMatchObject([{ id }]);
});
