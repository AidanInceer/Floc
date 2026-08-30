/**
 * The verified-inbox gate on joining a trip (ticket 149). Sign-in is never
 * blocked; landing in someone else's trip is, until the address is confirmed.
 */
import { and, eq, isNull } from "drizzle-orm";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, signIn, type Scenario } from "@/test/db";
import { joinTrip } from "./actions";

let world: Scenario;

beforeAll(migrateTestDb);

beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  // The gate only exists when mail can actually be sent.
  vi.stubEnv("RESEND_API_KEY", "test-key");
});

afterEach(() => {
  vi.unstubAllEnvs();
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

const setVerified = (userId: string, value: boolean) =>
  db.update(schema.user).set({ emailVerified: value }).where(eq(schema.user.id, userId)).run();

describe("join gate", () => {
  it("sends an unverified user to the verify notice, and does not join them", async () => {
    signIn(world.outsider);
    await setVerified(world.outsider, false);

    await expect(joinTrip("token-ours")).rejects.toThrow(
      "NEXT_REDIRECT:/invite/token-ours?verify=1",
    );
    expect(await membershipRow(world.ours.id, world.outsider)).toBeUndefined();
  });

  it("lets a verified user join", async () => {
    signIn(world.outsider);
    await setVerified(world.outsider, true);

    await expect(joinTrip("token-ours")).rejects.toThrow(
      `NEXT_REDIRECT:/trip/${world.ours.id}/overview`,
    );
    expect(await membershipRow(world.ours.id, world.outsider)).toBeDefined();
  });
});

describe("no mail provider", () => {
  it("lets an unverified user join — the link could never arrive", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    signIn(world.outsider);
    await setVerified(world.outsider, false);

    await expect(joinTrip("token-ours")).rejects.toThrow(
      `NEXT_REDIRECT:/trip/${world.ours.id}/overview`,
    );
    expect(await membershipRow(world.ours.id, world.outsider)).toBeDefined();
  });
});
