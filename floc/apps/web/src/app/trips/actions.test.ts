import { and, eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { inviteToTrip } from "@/server/trips/invites";
import { REDIRECT } from "@/test/setup";
import { migrateTestDb, resetDb, seedScenario, signIn, type Scenario } from "@/test/db";

import {
  acceptTripInvite,
  archiveTrip,
  createTrip,
  declineTripInvite,
  deleteTrip,
  renameTripFromMenu,
  restoreTrip,
  setTripColor,
} from "./actions";

let world: Scenario;

function form(fields: Record<string, string | string[]>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    for (const v of [value].flat()) fd.append(key, v);
  }
  return fd;
}

const tripRow = (tripId: number) => db.select().from(schema.trip).where(eq(schema.trip.id, tripId)).get();
const invite = (tripId: number, userId: string) =>
  db
    .select()
    .from(schema.tripInvite)
    .where(and(eq(schema.tripInvite.tripId, tripId), eq(schema.tripInvite.toUserId, userId)))
    .get();

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

describe("creating a trip", () => {
  beforeEach(() => signIn(world.admin));

  it("makes the creator admin, invites the ticked friends and opens the trip", async () => {
    const created = createTrip(
      form({ name: "Rome", startDate: "2026-10-01", endDate: "", friendIds: [world.member, world.member] }),
    );
    await expect(created).rejects.toThrow(new RegExp(`${REDIRECT}:/trip/\\d+/overview`));

    const rome = await db.select().from(schema.trip).where(eq(schema.trip.name, "Rome")).get();
    expect(rome).toMatchObject({ startDate: "2026-10-01", endDate: null, createdBy: world.admin });
    const [membership] = await db
      .select()
      .from(schema.tripMembership)
      .where(eq(schema.tripMembership.tripId, rome!.id))
      .all();
    expect(membership).toMatchObject({ userId: world.admin, role: "admin" });
    expect((await invite(rome!.id, world.member))?.status).toBe("pending");
  });

  it("refuses a trip with no name", async () => {
    await expect(createTrip(form({ name: "  " }))).rejects.toThrow("A trip needs a name");
  });

  it("refuses a date that is not a day, rather than dropping it", async () => {
    await expect(createTrip(form({ name: "Rome", startDate: "2026-02-31" }))).rejects.toThrow(
      "Those dates aren't days",
    );
  });

  it("sends a signed-out visitor to log in", async () => {
    signIn(null);
    await expect(createTrip(form({ name: "Rome" }))).rejects.toThrow(`${REDIRECT}:/login`);
  });
});

describe("answering an invite", () => {
  beforeEach(async () => {
    await inviteToTrip({ tripId: world.ours.id, fromUserId: world.admin, toUserIds: [world.outsider] });
    signIn(world.outsider);
  });

  it("joins on accept and opens the trip", async () => {
    await expect(acceptTripInvite(form({ tripId: String(world.ours.id) }))).rejects.toThrow(
      `${REDIRECT}:/trip/${world.ours.id}/overview`,
    );
    expect((await invite(world.ours.id, world.outsider))?.status).toBe("accepted");
  });

  it("stays put when there was nothing to accept (rule 5)", async () => {
    signIn(world.member);
    await expect(acceptTripInvite(form({ tripId: String(world.theirs.id) }))).resolves.toBeUndefined();
  });

  it("closes the invite on decline, joining nothing", async () => {
    await declineTripInvite(form({ tripId: String(world.ours.id) }));
    expect((await invite(world.ours.id, world.outsider))?.status).toBe("declined");
  });

  it("ignores a trip id that is not a number", async () => {
    await expect(acceptTripInvite(form({ tripId: "abc" }))).resolves.toBeUndefined();
    await expect(declineTripInvite(form({ tripId: "abc" }))).resolves.toBeUndefined();
    expect((await invite(world.ours.id, world.outsider))?.status).toBe("pending");
  });
});

describe("the card menu", () => {
  it("renames, and ignores a blank name", async () => {
    signIn(world.member);
    await renameTripFromMenu(form({ tripId: String(world.ours.id), name: "Porto" }));
    await renameTripFromMenu(form({ tripId: String(world.ours.id), name: "" }));
    expect((await tripRow(world.ours.id))?.name).toBe("Porto");
  });

  it("clears an unknown colour back to the default", async () => {
    signIn(world.member);
    await db.update(schema.trip).set({ colorKey: "peri" }).where(eq(schema.trip.id, world.ours.id));
    await setTripColor(form({ tripId: String(world.ours.id), color: "neon" }));
    expect((await tripRow(world.ours.id))?.colorKey).toBeNull();
  });
});

describe("archiving, restoring and deleting", () => {
  it("archives and lands where the form asked", async () => {
    signIn(world.admin);
    await expect(archiveTrip(form({ tripId: String(world.ours.id), redirectTo: "/trips" }))).rejects.toThrow(
      `${REDIRECT}:/trips`,
    );
    expect((await tripRow(world.ours.id))?.archivedAt).not.toBeNull();
  });

  it("ignores an off-site redirect", async () => {
    signIn(world.admin);
    await expect(
      archiveTrip(form({ tripId: String(world.ours.id), redirectTo: "//evil.example" })),
    ).rejects.toThrow(`${REDIRECT}:/trips/archived`);
  });

  it("restores an archived trip", async () => {
    signIn(world.admin);
    await db.update(schema.trip).set({ archivedAt: new Date() }).where(eq(schema.trip.id, world.ours.id));
    await restoreTrip(world.ours.id);
    expect((await tripRow(world.ours.id))?.archivedAt).toBeNull();
  });

  it("soft-deletes", async () => {
    signIn(world.admin);
    await expect(deleteTrip(form({ tripId: String(world.ours.id) }))).rejects.toThrow(`${REDIRECT}:/trips`);
    expect((await tripRow(world.ours.id))?.deletedAt).not.toBeNull();
  });

  it("is admin only", async () => {
    signIn(world.member);
    const admin = "Only a trip admin can do that";
    const tripId = String(world.ours.id);

    await expect(archiveTrip(form({ tripId }))).rejects.toThrow(admin);
    await expect(restoreTrip(world.ours.id)).rejects.toThrow(admin);
    await expect(deleteTrip(form({ tripId }))).rejects.toThrow(admin);
    expect(await tripRow(world.ours.id)).toMatchObject({ archivedAt: null, deletedAt: null });
  });
});
