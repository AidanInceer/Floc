import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { findTripAccess } from "@/server/access";
import { getPackTier, listPackingClaims, listPackingLines, listPersonalPackingLines } from "@/server/packing/packing";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";

import {
  addLine,
  removeLine,
  removeLines,
  renameLine,
  resetList,
  setClaim,
  setPacked,
  setTier,
  stepQuantity,
} from "./packing-save";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

async function as(viewerId: string) {
  const access = await findTripAccess(world.ours.id, viewerId);
  if (!access) throw new Error("no access");
  return access;
}

const shared = () => listPackingLines(world.ours.id);
const bag = (viewerId: string) => listPersonalPackingLines(world.ours.id, viewerId);
const add = async (viewerId: string, label: string, mine: boolean) => addLine(await as(viewerId), { label, category: "other", mine });

describe("adding a packing line", () => {
  it("puts a shared line on the group's list", async () => {
    expect(await add(world.admin, "Sun cream", false)).toBeNull();
    expect((await shared()).map((line) => line.label)).toEqual(["Sun cream"]);
    expect(await bag(world.admin)).toEqual([]);
  });

  it("puts a personal line in the viewer's bag only", async () => {
    await add(world.admin, "Meds", true);
    expect((await bag(world.admin)).map((line) => line.label)).toEqual(["Meds"]);
    expect(await bag(world.member)).toEqual([]);
    expect(await shared()).toEqual([]);
  });

  it("refuses a blank name in the same words from either door, and writes nothing", async () => {
    expect(await add(world.admin, "   ", false)).toMatchObject({ message: "A thing to pack needs a name.", kind: "invalid" });
    expect(await shared()).toEqual([]);
  });
});

describe("renaming a packing line", () => {
  it("trims and saves the new name", async () => {
    await add(world.admin, "Sun cream", false);
    const [line] = await shared();
    expect(await renameLine(await as(world.member), line!.id, "  Factor 50 ")).toBeNull();
    expect((await shared())[0]!.label).toBe("Factor 50");
  });

  it("refuses a blank name and keeps the old one", async () => {
    await add(world.admin, "Sun cream", false);
    const [line] = await shared();
    expect(await renameLine(await as(world.admin), line!.id, "")).toMatchObject({ message: "A thing to pack needs a name." });
    expect((await shared())[0]!.label).toBe("Sun cream");
  });
});

describe("ticking a line as packed", () => {
  it("ticks the viewer's own claim on a shared line", async () => {
    await add(world.admin, "Sun cream", false);
    const [line] = await shared();
    await setClaim(await as(world.admin), line!.id, true);
    await setClaim(await as(world.member), line!.id, true);
    await setPacked(await as(world.admin), line!.id, true);
    const packedBy = (await listPackingClaims(world.ours.id)).filter((claim) => claim.packedAt !== null).map((claim) => claim.userId);
    expect(packedBy).toEqual([world.admin]);
  });

  it("ticks the line itself in a personal bag", async () => {
    await add(world.admin, "Meds", true);
    const [line] = await bag(world.admin);
    await setPacked(await as(world.admin), line!.id, true);
    expect((await bag(world.admin))[0]!.packedAt).not.toBeNull();
  });

  it("drops a claim when it is taken back", async () => {
    await add(world.admin, "Sun cream", false);
    const [line] = await shared();
    await setClaim(await as(world.member), line!.id, true);
    await setClaim(await as(world.member), line!.id, false);
    expect(await listPackingClaims(world.ours.id)).toEqual([]);
  });
});

describe("a personal bag's quantities and tier", () => {
  it("steps a quantity by one", async () => {
    await add(world.admin, "Socks", true);
    const [line] = await bag(world.admin);
    await stepQuantity(await as(world.admin), line!.id, 1);
    expect((await bag(world.admin))[0]!.quantity).toBe(2);
  });

  it("sets the tier for this trip", async () => {
    await setTier(await as(world.admin), "light");
    expect(await getPackTier(world.ours.id, world.admin)).toBe("light");
  });
});

describe("removing packing lines", () => {
  it("lets any member drop a shared line", async () => {
    await add(world.admin, "Sun cream", false);
    const [line] = await shared();
    await removeLine(await as(world.member), line!.id);
    expect(await shared()).toEqual([]);
  });

  it("refuses a set holding somebody else's personal line, whole", async () => {
    await add(world.admin, "Sun cream", false);
    await add(world.member, "Meds", true);
    const ids = [(await shared())[0]!.id, (await bag(world.member))[0]!.id];
    await expect(removeLines(await as(world.admin), ids)).rejects.toThrow();
    expect(await shared()).toHaveLength(1);
    expect(await bag(world.member)).toHaveLength(1);
  });

  it("does nothing for an empty set", async () => {
    await add(world.admin, "Sun cream", false);
    await removeLines(await as(world.admin), []);
    expect(await shared()).toHaveLength(1);
  });

  it("resets only the viewer's own bag when asked for theirs", async () => {
    await add(world.admin, "Socks", true);
    await add(world.member, "Meds", true);
    await add(world.admin, "Sun cream", false);
    await resetList(await as(world.admin), true);
    expect(await bag(world.admin)).toEqual([]);
    expect(await bag(world.member)).toHaveLength(1);
    expect(await shared()).toHaveLength(1);
  });
});
