import { and, desc, eq, isNull } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { db, schema } from "@/db";
import { REDIRECT } from "@/test/setup";
import { expectNotFound, migrateTestDb, resetDb, seedScenario, signIn, type Scenario } from "@/test/db";

const { sendEmails } = vi.hoisted(() => ({ sendEmails: vi.fn() }));
vi.mock("next/server", () => ({ after: (task: () => unknown) => void task() }));
vi.mock("@/server/auth/email", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/auth/email")>()),
  sendEmails,
}));

import { planNextTrip } from "./next-trip-actions";

let world: Scenario;

function form(fields: Record<string, string | string[]>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) for (const v of [value].flat()) fd.append(key, v);
  return fd;
}

const newest = () => db.select().from(schema.trip).orderBy(desc(schema.trip.id)).get();
const invitesTo = (tripId: number) =>
  db.select().from(schema.tripInvite).where(and(eq(schema.tripInvite.tripId, tripId), isNull(schema.tripInvite.deletedAt))).all();
const membersOf = (tripId: number) =>
  db.select().from(schema.tripMembership).where(and(eq(schema.tripMembership.tripId, tripId), isNull(schema.tripMembership.deletedAt))).all();

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  sendEmails.mockReset();
});

describe("planNextTrip (#443)", () => {
  it("starts an undated trip with you in it and opens it", async () => {
    signIn(world.admin);
    await expect(planNextTrip(form({ tripId: String(world.ours.id), name: "Lisbon", friendIds: [] }))).rejects.toThrow(REDIRECT);

    const next = await newest();
    expect(next).toMatchObject({ name: "Lisbon", startDate: null, endDate: null, createdBy: world.admin });
    expect((await membersOf(next!.id)).map((m) => m.userId)).toEqual([world.admin]);
  });

  it("invites the ticked members to their inbox, with no email", async () => {
    signIn(world.admin);
    await expect(planNextTrip(form({ tripId: String(world.ours.id), name: "Lisbon", friendIds: [world.member] }))).rejects.toThrow(
      REDIRECT,
    );

    const next = await newest();
    expect((await invitesTo(next!.id)).map((i) => [i.toUserId, i.status])).toEqual([[world.member, "pending"]]);
    expect(sendEmails).not.toHaveBeenCalled();
  });

  it("invites nobody who is not on this trip, however they got into the form", async () => {
    signIn(world.admin);
    await expect(
      planNextTrip(form({ tripId: String(world.ours.id), name: "Lisbon", friendIds: [world.outsider] })),
    ).rejects.toThrow(REDIRECT);

    expect(await invitesTo((await newest())!.id)).toEqual([]);
  });

  it("copies nothing from this trip", async () => {
    signIn(world.admin);
    await expect(planNextTrip(form({ tripId: String(world.ours.id), name: "Lisbon" }))).rejects.toThrow(REDIRECT);

    const next = (await newest())!;
    expect(await db.select().from(schema.day).where(eq(schema.day.tripId, next.id)).all()).toEqual([]);
    expect(await db.select().from(schema.expense).where(eq(schema.expense.tripId, next.id)).all()).toEqual([]);
  });

  it("refuses a trip you are not on (rule 5)", async () => {
    signIn(world.outsider);
    await expectNotFound(() => planNextTrip(form({ tripId: String(world.ours.id), name: "Lisbon" })));
  });

  it("asks for a name rather than starting a trip without one", async () => {
    signIn(world.admin);
    const before = await newest();
    expect(await planNextTrip(form({ tripId: String(world.ours.id), name: "  " }))).toEqual({ error: expect.any(String) });
    expect((await newest())?.id).toBe(before?.id);
  });
});
