/**
 * Joining by link. The link is the credential: an unconfirmed inbox does not
 * stop somebody who holds it, on the web or the phone.
 */
import { and, eq, isNull } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, signIn, type Scenario } from "@/test/db";
import { joinTrip } from "./actions";

let world: Scenario;

beforeAll(migrateTestDb);

beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

const membershipRow = (tripId: number, userId: string) =>
  db
    .select({ userId: schema.tripMembership.userId })
    .from(schema.tripMembership)
    .where(
      and(
        eq(schema.tripMembership.tripId, tripId),
        eq(schema.tripMembership.userId, userId),
        isNull(schema.tripMembership.deletedAt),
      ),
    )
    .get();

describe("joining by link", () => {
  it("lets somebody with an unconfirmed inbox join", async () => {
    signIn(world.outsider);

    await expect(joinTrip("token-ours")).rejects.toThrow(
      `NEXT_REDIRECT:/trip/${world.ours.id}/overview`,
    );
    expect(await membershipRow(world.ours.id, world.outsider)).toBeDefined();
  });

  it("takes a current member straight to the trip", async () => {
    signIn(world.member);

    await expect(joinTrip("token-ours")).rejects.toThrow(
      `NEXT_REDIRECT:/trip/${world.ours.id}/overview`,
    );
  });

  it("sends a signed-out visitor to sign in, then back to the link", async () => {
    signIn(null);

    await expect(joinTrip("token-ours")).rejects.toThrow(
      `NEXT_REDIRECT:/login?redirect=${encodeURIComponent("/invite/token-ours")}`,
    );
  });
});
