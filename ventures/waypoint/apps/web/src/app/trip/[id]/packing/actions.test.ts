/**
 * Rule 5 at the packing actions' door (ticket 219): a line id posted by a
 * member of another trip must read as nonexistent, not as a refusal, and must
 * leave no write behind.
 */
import { and, eq, isNull } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import {
  expectNotFound,
  migrateTestDb,
  resetDb,
  seedScenario,
  signIn,
  type Scenario,
} from "@/test/db";
import {
  insertPackingLine,
  insertPersonalPackingLine,
  listPackingLines,
  listPersonalPackingLines,
} from "@/server/packing";
import { getPackTier } from "@/server/membership";
import {
  addPackingLine,
  addPersonalPackingLine,
  removePackingLine,
  setPackingClaim,
  setPackingPacked,
  setPersonalPackingPacked,
  setTripPackTier,
  stepPersonalPackingQuantity,
} from "./actions";

let world: Scenario;
let ourLineId: number;

const form = (fields: Record<string, string>): FormData => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
};

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  await insertPackingLine(world.ours.id, world.admin, "Sun cream");
  ourLineId = (await listPackingLines(world.ours.id))[0].id;
});

const liveClaims = (lineId: number) =>
  db
    .select()
    .from(schema.packingClaim)
    .where(
      and(
        eq(schema.packingClaim.packingLineId, lineId),
        isNull(schema.packingClaim.deletedAt),
      ),
    )
    .all();

describe("across trips", () => {
  beforeEach(() => signIn(world.outsider));

  it("refuses to claim a line belonging to another trip", async () => {
    await expectNotFound(() =>
      setPackingClaim(world.theirs.id, ourLineId, true),
    );
    expect(await liveClaims(ourLineId)).toHaveLength(0);
  });

  it("refuses to remove a line belonging to another trip", async () => {
    await expectNotFound(() => removePackingLine(world.theirs.id, ourLineId));
    expect(await listPackingLines(world.ours.id)).toHaveLength(1);
  });
});

describe("within a trip", () => {
  beforeEach(() => signIn(world.member));

  it("adds, claims, ticks and unclaims", async () => {
    const form = new FormData();
    form.set("label", "Speaker");
    await addPackingLine(world.ours.id, form);
    expect(await listPackingLines(world.ours.id)).toHaveLength(2);

    await setPackingClaim(world.ours.id, ourLineId, true);
    await setPackingPacked(world.ours.id, ourLineId, true);
    const [claim] = await liveClaims(ourLineId);
    expect(claim.userId).toBe(world.member);
    expect(claim.packedAt).not.toBeNull();

    await setPackingClaim(world.ours.id, ourLineId, false);
    expect(await liveClaims(ourLineId)).toHaveLength(0);
  });

  it("ticks nothing when the viewer has no claim of their own", async () => {
    await setPackingClaim(world.ours.id, ourLineId, true);
    signIn(world.admin);

    await setPackingPacked(world.ours.id, ourLineId, true);

    const [claim] = await liveClaims(ourLineId);
    expect(claim.userId).toBe(world.member);
    expect(claim.packedAt).toBeNull();
  });

  it("refuses an empty label rather than storing a blank line", async () => {
    const form = new FormData();
    form.set("label", "   ");
    await expect(addPackingLine(world.ours.id, form)).rejects.toThrow();
    expect(await listPackingLines(world.ours.id)).toHaveLength(1);
  });
});

describe("the personal list", () => {
  async function mine(owner: string) {
    return listPersonalPackingLines(world.ours.id, owner);
  }

  it("adds, ticks and removes a line of your own", async () => {
    signIn(world.admin);

    await addPersonalPackingLine(world.ours.id, form({ label: "Boots" }));
    const [line] = await mine(world.admin);
    expect(line.label).toBe("Boots");

    await setPersonalPackingPacked(world.ours.id, line.id, true);
    expect((await mine(world.admin))[0].packedAt).not.toBeNull();

    await removePackingLine(world.ours.id, line.id);
    expect(await mine(world.admin)).toHaveLength(0);
  });

  it("steps the count, and rejects a step it never offered", async () => {
    signIn(world.admin);
    await addPersonalPackingLine(world.ours.id, form({ label: "T-shirt" }));
    const [line] = await mine(world.admin);

    await stepPersonalPackingQuantity(world.ours.id, line.id, form({ step: "1" }));
    expect((await mine(world.admin))[0].quantity).toBe(2);

    await expect(
      stepPersonalPackingQuantity(world.ours.id, line.id, form({ step: "40" })),
    ).rejects.toThrow();
    expect((await mine(world.admin))[0].quantity).toBe(2);
  });

  // Rule 5 again, one table deeper: same trip, so membership passes — it is
  // the owner scope that has to refuse, and refuse as a missing id.
  it("refuses another member's line as though it did not exist", async () => {
    await insertPersonalPackingLine(world.ours.id, world.member, "Their meds");
    const [theirs] = await listPersonalPackingLines(world.ours.id, world.member);

    signIn(world.admin);
    await expectNotFound(() => setPersonalPackingPacked(world.ours.id, theirs.id, true));
    await expectNotFound(() => removePackingLine(world.ours.id, theirs.id));
    await expectNotFound(() =>
      stepPersonalPackingQuantity(world.ours.id, theirs.id, form({ step: "1" })),
    );

    const still = await listPersonalPackingLines(world.ours.id, world.member);
    expect(still).toHaveLength(1);
    expect(still[0].packedAt).toBeNull();
  });
});

describe("the trip's packing tier", () => {
  it("saves the choice on this trip and nowhere else", async () => {
    signIn(world.admin);
    expect(await getPackTier(world.ours.id, world.admin)).toBeNull();

    await setTripPackTier(world.ours.id, form({ packTier: "light" }));

    expect(await getPackTier(world.ours.id, world.admin)).toBe("light");
    expect(await getPackTier(world.ours.id, world.member)).toBeNull();
  });

  it("refuses a tier that isn't one of the three", async () => {
    signIn(world.admin);
    await expect(
      setTripPackTier(world.ours.id, form({ packTier: "featherweight" })),
    ).rejects.toThrow();
    expect(await getPackTier(world.ours.id, world.admin)).toBeNull();
  });
});
