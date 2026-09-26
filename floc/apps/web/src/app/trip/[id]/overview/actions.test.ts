import { and, eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { db, schema } from "@/db";
import { REDIRECT } from "@/test/setup";
import { expectNotFound, migrateTestDb, resetDb, seedScenario, signIn, type Scenario, befriend } from "@/test/db";

const { sendEmails } = vi.hoisted(() => ({ sendEmails: vi.fn() }));

vi.mock("next/server", () => ({ after: (task: () => unknown) => void task() }));
vi.mock("@/server/auth/email", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/auth/email")>()),
  sendEmails,
}));

import {
  inviteFriends,
  kickMember,
  leaveTrip,
  markTourSeen,
  promoteMember,
  renameTrip,
  resetInviteLink,
  sendNudge,
  setTripTags,
} from "./actions";

let world: Scenario;

function form(fields: Record<string, string | string[]>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    for (const v of [value].flat()) fd.append(key, v);
  }
  return fd;
}

const ours = () => String(world.ours.id);

const membership = (tripId: number, userId: string) =>
  db
    .select()
    .from(schema.tripMembership)
    .where(and(eq(schema.tripMembership.tripId, tripId), eq(schema.tripMembership.userId, userId)))
    .get();

const tripRow = (tripId: number) => db.select().from(schema.trip).where(eq(schema.trip.id, tripId)).get();

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  sendEmails.mockReset();
});

describe("nudging", () => {
  beforeEach(() => signIn(world.member));

  it("records the nudge and puts it in the member's inbox, with no email (#344)", async () => {
    await sendNudge(form({ tripId: ours(), toUserId: world.admin, tab: "money", message: "Pay up" }));

    const [row] = await db.select().from(schema.nudge).all();
    expect(row).toMatchObject({ fromUserId: world.member, toUserId: world.admin, tab: "money", message: "Pay up" });
    const [told] = await db.select().from(schema.notification).all();
    expect(told).toMatchObject({ userId: world.admin, loud: true });
    expect(sendEmails).not.toHaveBeenCalled();
  });

  it("falls back to the first tab for one it does not know", async () => {
    await sendNudge(form({ tripId: ours(), toUserId: world.admin, tab: "nowhere" }));
    expect((await db.select().from(schema.nudge).get())?.tab).toBe("notes");
  });

  it("refuses someone who is not on the trip", async () => {
    await expect(sendNudge(form({ tripId: ours(), toUserId: world.outsider, tab: "money" }))).rejects.toThrow(
      "Not a member of this trip",
    );
    expect(await db.select().from(schema.nudge).all()).toEqual([]);
  });
});

describe("inviting (#312)", () => {
  it("lets a member invite friends by name, once each", async () => {
    await befriend(world.member, world.outsider);
    signIn(world.member);
    await inviteFriends(form({ tripId: ours(), friendIds: [world.outsider, world.outsider, ""] }));

    const invites = await db.select().from(schema.tripInvite).all();
    expect(invites.map((i) => i.toUserId)).toEqual([world.outsider]);
  });

  it("does nothing when nobody was ticked", async () => {
    signIn(world.admin);
    await inviteFriends(form({ tripId: ours() }));
    expect(await db.select().from(schema.tripInvite).all()).toEqual([]);
  });

  it("is refused on a trip the viewer is not on (rule 5)", async () => {
    signIn(world.outsider);
    await expectNotFound(() => inviteFriends(form({ tripId: ours(), friendIds: world.admin })));
  });
});

describe("the admin powers", () => {
  it("kicks and promotes", async () => {
    signIn(world.admin);

    await promoteMember(form({ tripId: ours(), userId: world.member }));
    expect((await membership(world.ours.id, world.member))?.role).toBe("admin");

    await kickMember(form({ tripId: ours(), userId: world.member }));
    expect((await membership(world.ours.id, world.member))?.deletedAt).not.toBeNull();
  });

  it("are refused to a member", async () => {
    signIn(world.member);
    const admin = "Only a trip admin can do that";

    await expect(kickMember(form({ tripId: ours(), userId: world.admin }))).rejects.toThrow(admin);
    await expect(promoteMember(form({ tripId: ours(), userId: world.member }))).rejects.toThrow(admin);

    expect((await membership(world.ours.id, world.admin))?.deletedAt).toBeNull();
    expect((await membership(world.ours.id, world.member))?.role).toBe("member");
  });

  it("are refused on a trip the viewer is not on (rule 5)", async () => {
    signIn(world.outsider);
    await expectNotFound(() => kickMember(form({ tripId: ours(), userId: world.member })));
  });
});

describe("resetting the invite link (#358)", () => {
  it("re-locks the trip, leaving the people already in it", async () => {
    signIn(world.admin);
    const before = (await tripRow(world.ours.id))?.inviteToken;

    await resetInviteLink(form({ tripId: ours() }));

    expect((await tripRow(world.ours.id))?.inviteToken).not.toBe(before);
    expect((await membership(world.ours.id, world.member))?.deletedAt).toBeNull();
  });

  it("is refused to a member — it is an admin power (#358)", async () => {
    signIn(world.member);
    const before = (await tripRow(world.ours.id))?.inviteToken;

    await expect(resetInviteLink(form({ tripId: ours() }))).rejects.toThrow(
      "Only a trip admin can do that",
    );
    expect((await tripRow(world.ours.id))?.inviteToken).toBe(before);
  });

  it("is refused on a trip the viewer is not on (rule 5)", async () => {
    signIn(world.outsider);
    const before = (await tripRow(world.ours.id))?.inviteToken;

    await expectNotFound(() => resetInviteLink(form({ tripId: ours() })));
    expect((await tripRow(world.ours.id))?.inviteToken).toBe(before);
  });
});

describe("the tour (#314)", () => {
  it("marks the signed-in person as having seen it", async () => {
    signIn(world.member);
    await markTourSeen();
    const profile = await db
      .select()
      .from(schema.userProfile)
      .where(eq(schema.userProfile.userId, world.member))
      .get();
    expect(profile?.tourSeenAt).toBeInstanceOf(Date);
  });
});

describe("renaming and tagging", () => {
  beforeEach(() => signIn(world.member));

  it("renames, open to any member", async () => {
    expect(await renameTrip(form({ tripId: ours(), name: "  Lisbon  " }))).toBeUndefined();
    expect((await tripRow(world.ours.id))?.name).toBe("Lisbon");
  });

  it("proper-cases renamed trip names", async () => {
    await renameTrip(form({ tripId: ours(), name: "portugal and france" }));
    expect((await tripRow(world.ours.id))?.name).toBe("Portugal And France");
  });

  it("refuses a blank or overlong name without writing", async () => {
    expect(await renameTrip(form({ tripId: ours(), name: "   " }))).toEqual({ error: "A trip needs a name." });
    expect(await renameTrip(form({ tripId: ours(), name: "x".repeat(1000) }))).toEqual({
      error: "That name is too long.",
    });
    expect((await tripRow(world.ours.id))?.name).toBe("Ours");
  });

  it("sets and clears the tags", async () => {
    await setTripTags(form({ tripId: ours(), tag: ["beach", "food"] }));
    expect((await tripRow(world.ours.id))?.tags).toHaveLength(2);

    await setTripTags(form({ tripId: ours() }));
    expect((await tripRow(world.ours.id))?.tags).toEqual([]);
  });
});

describe("leaving", () => {
  it("takes a member off the roster and sends them to their trips", async () => {
    signIn(world.member);
    await expect(leaveTrip(form({ tripId: ours() }))).rejects.toThrow(`${REDIRECT}:/trips`);
    expect((await membership(world.ours.id, world.member))?.deletedAt).not.toBeNull();
  });

  it("passes admin on when the last admin leaves", async () => {
    signIn(world.admin);
    await expect(leaveTrip(form({ tripId: ours() }))).rejects.toThrow(REDIRECT);
    expect((await membership(world.ours.id, world.member))?.role).toBe("admin");
  });

  it("archives a trip when its last member leaves", async () => {
    signIn(world.outsider);
    await expect(leaveTrip(form({ tripId: String(world.theirs.id) }))).rejects.toThrow(REDIRECT);
    expect((await tripRow(world.theirs.id))?.archivedAt).not.toBeNull();
  });
});
