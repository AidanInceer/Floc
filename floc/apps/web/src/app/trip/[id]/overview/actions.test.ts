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
  addIdea,
  inviteFriends,
  kickMember,
  leaveTrip,
  nudge,
  promoteMember,
  removeIdea,
  renameTrip,
  resetInviteLink,
  setTripTags,
  voteIdea,
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

describe("nudging (#705)", () => {
  beforeEach(() => signIn(world.admin));

  it("nudges in one press, with no message, and puts it in the inbox with no email (#344)", async () => {
    expect(await nudge(world.ours.id, "dates", [world.member])).toEqual({ sent: 1, capped: false });

    const [row] = await db.select().from(schema.nudge).all();
    expect(row).toMatchObject({ fromUserId: world.admin, toUserId: world.member, tab: "dates", message: null });
    const [told] = await db.select().from(schema.notification).all();
    expect(told).toMatchObject({ userId: world.member, loud: true });
    expect(sendEmails).not.toHaveBeenCalled();
  });

  it("refuses a task it does not know", async () => {
    await expect(nudge(world.ours.id, "notes", [world.member])).rejects.toThrow();
    expect(await db.select().from(schema.nudge).all()).toEqual([]);
  });

  it("sends nothing to someone who is not on the trip", async () => {
    expect(await nudge(world.ours.id, "dates", [world.outsider])).toEqual({ sent: 0, capped: false });
    expect(await db.select().from(schema.nudge).all()).toEqual([]);
  });

  it("hides a trip you are not on (rule 5)", async () => {
    signIn(world.outsider);
    await expectNotFound(() => nudge(world.ours.id, "dates", [world.member]));
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

  it("caps a trip name at 50 characters", async () => {
    expect(await renameTrip(form({ tripId: ours(), name: "x".repeat(51) }))).toEqual({ error: "That name is too long." });
    await renameTrip(form({ tripId: ours(), name: "x".repeat(50) }));
    expect((await tripRow(world.ours.id))?.name).toHaveLength(50);
  });

  it("sets and clears the tags", async () => {
    await setTripTags(form({ tripId: ours(), tag: ["beach", "food"] }));
    expect((await tripRow(world.ours.id))?.tags).toHaveLength(2);

    await setTripTags(form({ tripId: ours() }));
    expect((await tripRow(world.ours.id))?.tags).toEqual([]);
  });
});

describe("ideas", () => {
  beforeEach(() => signIn(world.member));

  const ideas = () => db.select().from(schema.idea).where(eq(schema.idea.tripId, world.ours.id)).all();
  const votes = () => db.select().from(schema.ideaVote).all();

  async function pitch(title = "Boat day") {
    await addIdea(form({ tripId: ours(), title }));
    const [row] = await ideas();
    return row!;
  }

  it("adds an idea from any member", async () => {
    const row = await pitch();
    expect(row).toMatchObject({ title: "Boat day", createdBy: world.member, deletedAt: null });
  });

  it("refuses a blank idea without writing", async () => {
    await expect(addIdea(form({ tripId: ours(), title: "   " }))).resolves.toEqual({
      error: "An idea needs a line of text.",
    });
    expect(await ideas()).toEqual([]);
  });

  it("votes for an idea, and a second vote takes it back", async () => {
    const row = await pitch();
    await voteIdea(form({ tripId: ours(), ideaId: String(row.id) }));
    expect((await votes()).map((v) => [v.userId, v.deletedAt === null])).toEqual([[world.member, true]]);

    await voteIdea(form({ tripId: ours(), ideaId: String(row.id) }));
    expect((await votes())[0]?.deletedAt).not.toBeNull();
  });

  it("removes an idea", async () => {
    const row = await pitch();
    await removeIdea(form({ tripId: ours(), ideaId: String(row.id) }));
    expect((await ideas())[0]?.deletedAt).not.toBeNull();
  });

  it("is refused on a trip the viewer is not on (rule 5)", async () => {
    signIn(world.outsider);
    await expectNotFound(() => addIdea(form({ tripId: ours(), title: "Sneaky" })));
    expect(await ideas()).toEqual([]);
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
