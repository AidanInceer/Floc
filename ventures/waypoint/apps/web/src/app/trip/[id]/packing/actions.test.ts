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
import { insertPackingLine, listPackingLines } from "@/server/packing";
import {
  addPackingLine,
  removePackingLine,
  setPackingClaim,
  setPackingPacked,
} from "./actions";

let world: Scenario;
let ourLineId: number;

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
