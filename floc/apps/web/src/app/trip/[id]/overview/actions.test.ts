import { and, eq } from "drizzle-orm";
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

import {
  inviteFriends,
  kickMember,
  leaveTrip,
  promoteMember,
  renameTrip,
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

  it("records the nudge and mails the member", async () => {
    await sendNudge(form({ tripId: ours(), toUserId: world.admin, tab: "money", message: "Pay up" }));

    const [row] = await db.select().from(schema.nudge).all();
    expect(row).toMatchObject({ fromUserId: world.member, toUserId: world.admin, tab: "money", message: "Pay up" });
    expect(sendEmails.mock.calls[0][0][0].to).toBe(`${world.admin}@example.test`);
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

describe("renaming and tagging", () => {
  beforeEach(() => signIn(world.member));

  it("renames, open to any member", async () => {
    expect(await renameTrip(form({ tripId: ours(), name: "  Lisbon  " }))).toBeUndefined();
    expect((await tripRow(world.ours.id))?.name).toBe("Lisbon");
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
