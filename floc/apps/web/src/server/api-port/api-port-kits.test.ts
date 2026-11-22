import { beforeAll, beforeEach, expect, it, vi } from "vitest";

const revalidatePath = vi.hoisted(() => vi.fn());
vi.mock("next/cache", () => ({ revalidatePath, revalidateTag: () => {} }));

import { webPort } from "@/server/api-port/api-port";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  revalidatePath.mockClear();
});

it("refreshes the packing lists page when a bag is saved as a list from a trip", async () => {
  expect(await webPort.savePackingKit(world.admin, world.ours.id, "Camping")).toBe(true);

  expect(revalidatePath).toHaveBeenCalledWith("/lists/packing");
});

it("refreshes the packing lists page when a saved list is deleted", async () => {
  const made = await webPort.createKit(world.member, "Gym");
  revalidatePath.mockClear();

  await webPort.deleteKit(world.member, made!.id);

  expect(revalidatePath).toHaveBeenCalledWith("/lists/packing");
});
