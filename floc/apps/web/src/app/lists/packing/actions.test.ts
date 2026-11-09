import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { listPackingKitsWithItems } from "@/server/packing/packing-kits";
import { REDIRECT } from "@/test/setup";
import { migrateTestDb, resetDb, seedScenario, signIn, type Scenario } from "@/test/db";

import { addKitItem, createPackingKit, deleteKit, removeKitItem, renameKit, stepKitItemQuantity } from "./actions";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  signIn(world.member);
});

const form = (fields: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
};

async function makeKit(name = "Beach") {
  await expect(createPackingKit(form({ name }))).rejects.toThrow(`${REDIRECT}:/lists/packing#kit-`);
  const [kit] = await listPackingKitsWithItems(world.member);
  return kit!;
}

describe("saved packing lists on Lists", () => {
  it("makes a list and opens it on the Packing page", async () => {
    const kit = await makeKit();
    expect(kit.name).toBe("Beach");
  });

  it("refuses a list with no name", async () => {
    await expect(createPackingKit(form({ name: "  " }))).rejects.toThrow("needs a name");
    await expect(renameKit(1, form({ name: "" }))).rejects.toThrow("needs a name");
  });

  it("renames a list, then deletes it", async () => {
    const kit = await makeKit();
    await renameKit(kit.id, form({ name: "Ski" }));
    expect((await listPackingKitsWithItems(world.member))[0]!.name).toBe("Ski");
    await deleteKit(kit.id);
    expect(await listPackingKitsWithItems(world.member)).toEqual([]);
  });

  it("adds a thing, steps its number, and takes it off", async () => {
    const kit = await makeKit();
    await addKitItem(kit.id, form({ label: "Sun cream", quantity: "2", category: "toiletries" }));
    const [item] = (await listPackingKitsWithItems(world.member))[0]!.items;
    expect(item).toMatchObject({ label: "Sun cream", quantity: 2 });

    await stepKitItemQuantity(item!.id, form({ step: "1" }));
    expect((await listPackingKitsWithItems(world.member))[0]!.items[0]!.quantity).toBe(3);

    await removeKitItem(item!.id);
    expect((await listPackingKitsWithItems(world.member))[0]!.items).toEqual([]);
  });

  it("refuses a thing with no name and a step that is not one", async () => {
    const kit = await makeKit();
    await expect(addKitItem(kit.id, form({ label: "" }))).rejects.toThrow("needs a name");
    await expect(stepKitItemQuantity(1, form({ step: "5" }))).rejects.toThrow("quantity step");
  });

  it("sends a signed-out visitor to sign in, back to Packing", async () => {
    signIn(null);
    const back = encodeURIComponent("/lists/packing");
    await expect(deleteKit(1)).rejects.toThrow(`${REDIRECT}:/login?redirect=${back}`);
  });
});
