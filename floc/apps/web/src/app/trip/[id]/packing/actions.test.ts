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
import { getPackSettings, getPackTier } from "@/server/packing/packing";
import {
  addPackingLine,
  fillMyPackingList,
  removeSuggestedPackingLines,
  removeUnpackedPackingLines,
  setPackingIdeasShown,
  takePackingIdea,
  unpackMyPackingBag,
  removePackingLines,
  resetPackingList,
  addPersonalPackingLine,
  removePackingLine,
  renamePackingLine,
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

describe("acting on a line another member already removed", () => {
  beforeEach(async () => {
    signIn(world.admin);
    await removePackingLine(world.ours.id, ourLineId);
    signIn(world.member);
  });

  it("claims, ticks, renames and removes nothing, and keeps the page up", async () => {
    await expect(setPackingClaim(world.ours.id, ourLineId, true)).resolves.toBeUndefined();
    await expect(setPackingPacked(world.ours.id, ourLineId, true)).resolves.toBeUndefined();
    await expect(removePackingLine(world.ours.id, ourLineId)).resolves.toBeUndefined();
    expect(await renamePackingLine(world.ours.id, ourLineId, "Too late")).toEqual({});

    expect(await liveClaims(ourLineId)).toHaveLength(0);
    expect(await listPackingLines(world.ours.id)).toHaveLength(0);
  });

  it("removes the ticked lines that are still there", async () => {
    await insertPackingLine(world.ours.id, world.admin, "Speaker", "other");
    const [speaker] = await listPackingLines(world.ours.id);
    const ticked = new FormData();
    ticked.append("lineId", String(ourLineId));
    ticked.append("lineId", String(speaker.id));

    await removePackingLines(world.ours.id, ticked);

    expect(await listPackingLines(world.ours.id)).toHaveLength(0);
  });

  it("still answers from another trip as a line that does not exist (rule 5)", async () => {
    signIn(world.outsider);
    await expectNotFound(() => setPackingClaim(world.theirs.id, ourLineId, true));
  });

  it("still answers another member's removed bag line as one that does not exist", async () => {
    await insertPersonalPackingLine(world.ours.id, world.admin, "Their meds", "toiletries");
    const [theirs] = await listPersonalPackingLines(world.ours.id, world.admin);
    signIn(world.admin);
    await removePackingLine(world.ours.id, theirs.id);
    signIn(world.member);

    await expectNotFound(() => setPersonalPackingPacked(world.ours.id, theirs.id, true));
  });
});

describe("renaming a line (#362)", () => {
  beforeEach(() => signIn(world.member));

  it("renames in place and keeps every claim on it", async () => {
    await setPackingClaim(world.ours.id, ourLineId, true);

    expect(await renamePackingLine(world.ours.id, ourLineId, "  Factor 50 sun cream ")).toEqual({});

    const [line] = await listPackingLines(world.ours.id);
    expect(line).toMatchObject({ id: ourLineId, label: "Factor 50 sun cream" });
    expect((await liveClaims(ourLineId)).map((c) => c.userId)).toEqual([world.member]);
  });

  it.each([["", "blank"], ["   ", "only spaces"]])("refuses %j (%s) as a form error", async (label) => {
    expect(await renamePackingLine(world.ours.id, ourLineId, label)).toEqual({
      error: "A thing to pack needs a name.",
    });
    expect((await listPackingLines(world.ours.id))[0].label).toBe("Sun cream");
  });

  it("refuses a line on another trip as though it did not exist", async () => {
    signIn(world.outsider);
    await expectNotFound(() => renamePackingLine(world.theirs.id, ourLineId, "Mine now"));
    expect((await listPackingLines(world.ours.id))[0].label).toBe("Sun cream");
  });

  it("renames your own bag's line, and never another member's", async () => {
    await insertPersonalPackingLine(world.ours.id, world.admin, "Charger", "essentials");
    const [theirs] = await listPersonalPackingLines(world.ours.id, world.admin);

    await expectNotFound(() => renamePackingLine(world.ours.id, theirs.id, "Mine now"));

    signIn(world.admin);
    expect(await renamePackingLine(world.ours.id, theirs.id, "USB-C charger")).toEqual({});
    expect((await listPersonalPackingLines(world.ours.id, world.admin))[0].label).toBe("USB-C charger");
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

    await setPersonalPackingPacked(world.ours.id, after[0].id, true);
    const packed = await listPersonalPackingLines(world.ours.id, world.admin);
    expect(packed[0].packedAt).not.toBeNull();
  });
});

describe("taking ideas and taking them back (#469)", () => {
  it("adds one idea, marked, and removes it again after Pro lapses", async () => {
    signIn(world.admin);
    await givePro(world.admin);
    await takePackingIdea(world.ours.id, "toothbrush");
    expect((await listPersonalPackingLines(world.ours.id, world.admin)).map((l) => l.origin)).toEqual(["suggested"]);

    await db.delete(schema.subscription);
    await removeSuggestedPackingLines(world.ours.id);
    expect(await listPersonalPackingLines(world.ours.id, world.admin)).toEqual([]);
  });

  it("refuses a trip you're not on (rule 5)", async () => {
    signIn(world.outsider);
    await expectNotFound(() => takePackingIdea(world.ours.id, "toothbrush"));
    await expectNotFound(() => removeSuggestedPackingLines(world.ours.id));
  });
});

describe("your bag's menu", () => {
  const bag = () => listPersonalPackingLines(world.ours.id, world.admin);
  const labels = async () => (await bag()).map((l) => l.label).sort();
  const shownAt = async () => (await getPackSettings(world.ours.id, world.admin)).ideasShownAt;

  async function mixedBag() {
    await givePro(world.admin);
    await insertPersonalPackingLine(world.ours.id, world.admin, "Linen shirt", "clothes");
    await takePackingIdea(world.ours.id, "toothbrush");
    await takePackingIdea(world.ours.id, "passport");
    const passport = (await bag()).find((l) => l.label === "passport")!;
    await setPersonalPackingPacked(world.ours.id, passport.id, true);
    await setPackingIdeasShown(world.ours.id, true);
  }

  beforeEach(() => signIn(world.admin));

  it("empties the bag, packed or not, turns suggestions off and soft-deletes (rule 8)", async () => {
    await mixedBag();

    await resetPackingList(world.ours.id, true);

    expect(await bag()).toEqual([]);
    expect(await shownAt()).toBeNull();
    expect(await listPackingLines(world.ours.id)).toHaveLength(1);
    const rows = await db.select().from(schema.packingLine).where(eq(schema.packingLine.ownerId, world.admin)).all();
    expect(rows).toHaveLength(3);
  });

  it("removes everything not packed, yours or suggested, and turns suggestions off", async () => {
    await mixedBag();

    await removeUnpackedPackingLines(world.ours.id);

    expect(await labels()).toEqual(["passport"]);
    expect(await shownAt()).toBeNull();
  });

  it("removes unpacked suggestions only, and turns suggestions off", async () => {
    await mixedBag();

    await removeSuggestedPackingLines(world.ours.id);

    expect(await labels()).toEqual(["Linen shirt", "passport"]);
    expect(await shownAt()).toBeNull();
  });

  it("unpacks everything, keeps every line and leaves suggestions alone", async () => {
    await mixedBag();

    await unpackMyPackingBag(world.ours.id);

    const lines = await bag();
    expect(lines).toHaveLength(3);
    expect(lines.every((l) => l.packedAt === null)).toBe(true);
    expect(await shownAt()).toBeInstanceOf(Date);
  });

  it("leaves your suggestions on when the shared list is cleared", async () => {
    await mixedBag();

    await resetPackingList(world.ours.id, false);

    expect(await shownAt()).toBeInstanceOf(Date);
  });

  it("refuses to turn suggestions on without Pro", async () => {
    await expect(setPackingIdeasShown(world.ours.id, true)).rejects.toThrow("Floc Pro");
    expect(await shownAt()).toBeNull();
  });

  it("still turns suggestions off after Pro lapses", async () => {
    await mixedBag();
    await db.delete(schema.subscription);

    await setPackingIdeasShown(world.ours.id, false);

    expect(await shownAt()).toBeNull();
  });

  it("refuses a trip you're not on (rule 5)", async () => {
    signIn(world.outsider);
    await expectNotFound(() => setPackingIdeasShown(world.ours.id, false));
    await expectNotFound(() => removeUnpackedPackingLines(world.ours.id));
    await expectNotFound(() => unpackMyPackingBag(world.ours.id));
  });
});

describe("clearing lines in bulk", () => {
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
