/**
 * #442: answering from the invite page with a name and no account. The name
 * comes first; a guest then writes only their own answers, only on the trip the
 * link names. A dead link answers as it always did, and a member is sent to the
 * trip itself.
 */
import { and, eq, isNull } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { auth } from "@/server/auth/auth";
import { GUEST_CAP, GUEST_IP_LIMIT } from "@floc/core/people/guests";
import { NOT_FOUND, currentUser } from "@/test/setup";
import { migrateTestDb, resetDb, seedScenario, signIn, type Scenario } from "@/test/db";
import { insertIdea } from "@/server/ideas/ideas";
import { setAvailability } from "@/server/itinerary/availability";
import { guestSaveDates, guestStart, guestVoteIdea } from "./actions";

let world: Scenario;
let ideaId: number;
let made = 0;
let callerIp = "1.2.3.4";

// The stubbed Better Auth has no anonymous sign-in; this one does what the plugin does.
(auth.api as Record<string, unknown>).signInAnonymous = async () => {
  made += 1;
  const id = `g-made-${made}`;
  await db.insert(schema.user).values({ id, name: "Anonymous", email: `${id}@guest.test`, isAnonymous: true });
  await db.insert(schema.session).values({ id: `s-${id}`, token: `t-${id}`, userId: id, ipAddress: callerIp, expiresAt: new Date(Date.now() + 1e9) });
  currentUser.id = id;
  return { token: `t-${id}`, user: { id } };
};

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  ideaId = await insertIdea({ tripId: world.ours.id, createdBy: world.admin, title: "Lisbon" });
  callerIp = "1.2.3.4";
  made = 0;
  signIn(null);
});

const liveVotes = () =>
  db.select().from(schema.ideaVote).where(and(eq(schema.ideaVote.ideaId, ideaId), isNull(schema.ideaVote.deletedAt))).all();

const userRow = (id: string) => db.select().from(schema.user).where(eq(schema.user.id, id)).get();

describe("guestStart", () => {
  it("needs a name", async () => {
    expect(await guestStart("token-ours", "  ")).toEqual({ error: "Give your name first." });
    expect(made).toBe(0);
  });

  it("makes a named guest", async () => {
    expect(await guestStart("token-ours", "Sam")).toEqual({});
    expect((await userRow(`g-made-${made}`))?.name).toBe("Sam");
  });

  it("keeps the guest a returning visitor already is", async () => {
    await guestStart("token-ours", "Sam");
    expect(await guestStart("token-ours", "Someone else")).toEqual({});
    expect(made).toBe(1);
    expect((await userRow("g-made-1"))?.name).toBe("Sam");
  });

  it("answers a dead link as not found", async () => {
    await expect(guestStart("token-nope", "Sam")).rejects.toThrow(NOT_FOUND);
  });

  it("sends a member to the trip rather than making a guest", async () => {
    signIn(world.member);
    await expect(guestStart("token-ours", "Mo")).rejects.toThrow(`NEXT_REDIRECT:/trip/${world.ours.id}/overview`);
  });

  it("makes no guest once the trip has its cap, as a form error", async () => {
    for (let i = 0; i < GUEST_CAP; i++) {
      await db.insert(schema.user).values({ id: `g-${i}`, name: "G", email: `g-${i}@guest.test`, isAnonymous: true });
      await setAvailability(world.ours.id, `g-${i}`, ["2026-09-01"], true);
    }
    expect((await guestStart("token-ours", "Sam")).error).toMatch(/full/);
    expect(made).toBe(0);
  });

  it("refuses the guest past the hourly limit from one address, and keeps no row for it", async () => {
    callerIp = "9.9.9.9";
    for (let i = 0; i < GUEST_IP_LIMIT; i++) {
      signIn(null);
      expect(await guestStart("token-ours", `G${i}`)).toEqual({});
    }
    signIn(null);
    expect((await guestStart("token-ours", "One too many")).error).toMatch(/Too many/);
    expect(await userRow(`g-made-${made}`)).toBeUndefined();
  });
});

describe("guestVoteIdea", () => {
  it("refuses somebody who has not given a name", async () => {
    expect(await guestVoteIdea("token-ours", ideaId)).toEqual({ error: "Give your name first." });
    expect(await liveVotes()).toEqual([]);
  });

  it("casts and takes back a guest's vote", async () => {
    await guestStart("token-ours", "Sam");
    expect(await guestVoteIdea("token-ours", ideaId)).toEqual({});
    expect((await liveVotes()).map((v) => v.userId)).toEqual(["g-made-1"]);
    expect(await guestVoteIdea("token-ours", ideaId)).toEqual({});
    expect(await liveVotes()).toEqual([]);
  });

  it("answers an idea from another trip as gone", async () => {
    const foreign = await insertIdea({ tripId: world.theirs.id, createdBy: world.outsider, title: "Oslo" });
    await guestStart("token-ours", "Sam");
    await expect(guestVoteIdea("token-ours", foreign)).rejects.toThrow(NOT_FOUND);
  });

  it("refuses a guest new to a trip that filled up after they gave their name", async () => {
    await guestStart("token-ours", "Sam");
    for (let i = 0; i < GUEST_CAP; i++) {
      await db.insert(schema.user).values({ id: `g-${i}`, name: "G", email: `g-${i}@guest.test`, isAnonymous: true });
      await setAvailability(world.ours.id, `g-${i}`, ["2026-09-01"], true);
    }
    expect((await guestVoteIdea("token-ours", ideaId)).error).toMatch(/full/);
  });
});

describe("guestSaveDates", () => {
  it("marks and unmarks the guest's own days", async () => {
    await guestStart("token-ours", "Sam");
    expect(await guestSaveDates("token-ours", ["2026-09-01", "2026-09-02"], [])).toEqual({});
    expect(await guestSaveDates("token-ours", [], ["2026-09-02"])).toEqual({});
    const rows = await db.select().from(schema.availability).where(eq(schema.availability.tripId, world.ours.id)).all();
    expect(rows.filter((r) => r.available).map((r) => r.date)).toEqual(["2026-09-01"]);
  });

  it("refuses a date that is not a date, as a form error", async () => {
    await guestStart("token-ours", "Sam");
    expect(await guestSaveDates("token-ours", ["2026-02-31"], [])).toEqual({ error: "That is not a date." });
  });
});
