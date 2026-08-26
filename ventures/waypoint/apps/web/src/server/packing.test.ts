/**
 * The packing aggregate's two things worth pinning (ticket 219): a re-claim
 * after an unclaim has to survive the unique index, and every read has to be
 * blind to soft-deleted rows (rule 8).
 */
import { and, eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import {
  claimPackingLine,
  insertPackingLine,
  listPackingClaims,
  listPackingLines,
  setClaimPacked,
  softDeletePackingLine,
  unclaimPackingLine,
} from "@/server/packing";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

async function addLine(label: string) {
  await insertPackingLine(world.ours.id, world.admin, label);
  const lines = await listPackingLines(world.ours.id);
  return lines[lines.length - 1].id;
}

describe("the shared list", () => {
  it("keeps a line to its own trip", async () => {
    await addLine("Sun cream");
    expect(await listPackingLines(world.ours.id)).toHaveLength(1);
    expect(await listPackingLines(world.theirs.id)).toHaveLength(0);
  });

  it("drops a removed line, and its claims with it", async () => {
    const lineId = await addLine("Speaker");
    await claimPackingLine(lineId, world.admin);

    await softDeletePackingLine(lineId);

    expect(await listPackingLines(world.ours.id)).toHaveLength(0);
    expect(await listPackingClaims(world.ours.id)).toHaveLength(0);
  });
});

describe("claims", () => {
  it("lets several people claim the same line", async () => {
    const lineId = await addLine("First-aid kit");
    await claimPackingLine(lineId, world.admin);
    await claimPackingLine(lineId, world.member);

    const claims = await listPackingClaims(world.ours.id);
    expect(claims.map((c) => c.userId).sort()).toEqual([
      world.admin,
      world.member,
    ]);
  });

  it("re-claims after an unclaim rather than being blocked by the index", async () => {
    const lineId = await addLine("Kettle");
    await claimPackingLine(lineId, world.admin);
    await unclaimPackingLine(lineId, world.admin);
    expect(await listPackingClaims(world.ours.id)).toHaveLength(0);

    await claimPackingLine(lineId, world.admin);
    expect(await listPackingClaims(world.ours.id)).toHaveLength(1);
  });

  it("starts a re-claim unpacked, whatever the last one ended as", async () => {
    const lineId = await addLine("Towels");
    await claimPackingLine(lineId, world.admin);
    await setClaimPacked(lineId, world.admin, true);
    await unclaimPackingLine(lineId, world.admin);
    await claimPackingLine(lineId, world.admin);

    const [claim] = await listPackingClaims(world.ours.id);
    expect(claim.packedAt).toBeNull();
  });

  it("ticks only the claim belonging to the person doing it", async () => {
    const lineId = await addLine("Cool box");
    await claimPackingLine(lineId, world.admin);
    await claimPackingLine(lineId, world.member);

    await setClaimPacked(lineId, world.admin, true);

    const claims = await listPackingClaims(world.ours.id);
    const byUser = new Map(claims.map((c) => [c.userId, c.packedAt]));
    expect(byUser.get(world.admin)).not.toBeNull();
    expect(byUser.get(world.member)).toBeNull();
  });

  it("does not revive a soft-deleted claim by ticking it", async () => {
    const lineId = await addLine("Tent");
    await claimPackingLine(lineId, world.admin);
    await unclaimPackingLine(lineId, world.admin);

    await setClaimPacked(lineId, world.admin, true);

    const row = await db
      .select()
      .from(schema.packingClaim)
      .where(
        and(
          eq(schema.packingClaim.packingLineId, lineId),
          eq(schema.packingClaim.userId, world.admin),
        ),
      )
      .get();
    expect(row?.packedAt).toBeNull();
  });
});
