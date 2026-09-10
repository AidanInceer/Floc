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
  givePro,
} from "@/test/db";
import {
  insertPackingLine,
  insertPersonalPackingLine,
  listPackingLines,
  listPersonalPackingLines,
} from "@/server/packing/packing";
import { getPackTier } from "@/server/packing/packing";
import {
  addPackingLine,
  fillMyPackingList,
  removePackingLines,
  resetPackingList,
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
  await insertPackingLine(world.ours.id, world.admin, "Sun cream", "toiletries");
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
    await insertPersonalPackingLine(world.ours.id, world.member, "Their meds", "toiletries");
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

describe("suggesting what to pack", () => {
  it("fills the presser's own bag, following the trip's tier", async () => {
    signIn(world.admin);
    await givePro(world.admin);
    await setTripPackTier(world.ours.id, form({ packTier: "light" }));

    await fillMyPackingList(world.ours.id);

    const mine = await listPersonalPackingLines(world.ours.id, world.admin);
    expect(mine.length).toBeGreaterThan(0);
    expect(await listPersonalPackingLines(world.ours.id, world.member)).toEqual([]);
  });

  it("refuses a trip you're not on (rule 5)", async () => {
    signIn(world.outsider);
    await expectNotFound(() => fillMyPackingList(world.ours.id));
    expect(await listPersonalPackingLines(world.ours.id, world.outsider)).toEqual([]);
  });

  it("refuses a free trip — Pro buys the generating (ticket 248)", async () => {
    signIn(world.admin);

    await expect(fillMyPackingList(world.ours.id)).rejects.toThrow(
      "Floc Pro",
    );
    expect(await listPersonalPackingLines(world.ours.id, world.admin)).toEqual([]);
  });

  it("leaves a list generated while Pro editable once Pro lapses", async () => {
    signIn(world.admin);
    await givePro(world.admin);
    await fillMyPackingList(world.ours.id);
    const before = await listPersonalPackingLines(world.ours.id, world.admin);

    await db.delete(schema.subscription);

    const after = await listPersonalPackingLines(world.ours.id, world.admin);
    expect(after).toHaveLength(before.length);

    // Still editable: the gate is on generating, never on the content.
    await setPersonalPackingPacked(world.ours.id, after[0].id, true);
    const packed = await listPersonalPackingLines(world.ours.id, world.admin);
    expect(packed[0].packedAt).not.toBeNull();
  });
});

describe("clearing lines in bulk", () => {
  /** The ids the form would carry, as `getAll("lineId")` delivers them. */
  const ticked = (...ids: number[]) => {
    const fd = new FormData();
    for (const id of ids) fd.append("lineId", String(id));
    return fd;
  };

  const liveLabels = async (owner: string | null) =>
    owner === null
      ? (await listPackingLines(world.ours.id)).map((l) => l.label)
      : (await listPersonalPackingLines(world.ours.id, owner)).map((l) => l.label);

  async function addMine(label: string) {
    await insertPersonalPackingLine(world.ours.id, world.admin, label, "other");
    const mine = await listPersonalPackingLines(world.ours.id, world.admin);
    return mine[mine.length - 1].id;
  }

  it("removes only the lines that were ticked", async () => {
    signIn(world.admin);
    const keep = await addMine("Keep me");
    const drop = await addMine("Drop me");

    await removePackingLines(world.ours.id, ticked(drop));

    expect(await liveLabels(world.admin)).toEqual(["Keep me"]);
    expect(keep).toBeDefined();
  });

  it("does nothing at all when nothing was ticked", async () => {
    signIn(world.admin);
    await addMine("Keep me");

    await removePackingLines(world.ours.id, ticked());

    expect(await liveLabels(world.admin)).toEqual(["Keep me"]);
  });

  /*
   * The bulk shape is a convenience, never a way round the per-line check: one
   * bad id refuses the whole set rather than quietly removing the allowed part,
   * so a hand-made POST can't use a legitimate id as cover for someone else's.
   */
  it("refuses the whole set if any line isn't the presser's to touch (rule 5)", async () => {
    signIn(world.member);
    await insertPersonalPackingLine(world.ours.id, world.admin, "Their meds", "other");
    const [theirs] = await listPersonalPackingLines(world.ours.id, world.admin);

    await expectNotFound(() =>
      removePackingLines(world.ours.id, ticked(ourLineId, theirs.id)),
    );

    expect(await liveLabels(null)).toContain("Sun cream");
    expect(await liveLabels(world.admin)).toEqual(["Their meds"]);
  });

  it("refuses a trip you're not on (rule 5)", async () => {
    signIn(world.outsider);
    await expectNotFound(() => removePackingLines(world.ours.id, ticked(ourLineId)));
    expect(await liveLabels(null)).toContain("Sun cream");
  });

  // A hand-made POST is the only way to send more ids than the list can hold,
  // and each one costs a round trip — so the set is capped like every read is.
  it("ignores ids past what a list could hold, and ids that are not ids", async () => {
    signIn(world.admin);
    const drop = await addMine("Drop me");
    const flood = Array.from({ length: 600 }, (_, i) => i + 10_000);

    await expectNotFound(() => removePackingLines(world.ours.id, ticked(...flood)));

    await removePackingLines(world.ours.id, ticked(0, -1, drop));
    expect(await liveLabels(world.admin)).toEqual([]);
  });
});

describe("clearing a whole list", () => {
  it("wipes your bag and leaves the shared list standing", async () => {
    signIn(world.admin);
    await insertPersonalPackingLine(world.ours.id, world.admin, "My socks", "clothes");

    await resetPackingList(world.ours.id, true);

    expect(await listPersonalPackingLines(world.ours.id, world.admin)).toEqual([]);
    expect(await listPackingLines(world.ours.id)).toHaveLength(1);
  });

  it("wipes the shared list and leaves every bag alone", async () => {
    signIn(world.admin);
    await insertPersonalPackingLine(world.ours.id, world.admin, "My socks", "clothes");

    await resetPackingList(world.ours.id, false);

    expect(await listPackingLines(world.ours.id)).toEqual([]);
    expect(await listPersonalPackingLines(world.ours.id, world.admin)).toHaveLength(1);
  });

  it("never reaches another member's bag", async () => {
    await insertPersonalPackingLine(world.ours.id, world.member, "Their meds", "other");

    signIn(world.admin);
    await resetPackingList(world.ours.id, true);

    expect(await listPersonalPackingLines(world.ours.id, world.member)).toHaveLength(1);
  });

  it("refuses a trip you're not on (rule 5)", async () => {
    signIn(world.outsider);
    await expectNotFound(() => resetPackingList(world.ours.id, false));
    expect(await listPackingLines(world.ours.id)).toHaveLength(1);
  });
});
