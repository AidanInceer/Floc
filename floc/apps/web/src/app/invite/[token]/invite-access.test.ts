/**
 * Who a share link is answering (#330).
 *
 * The four states decide what the page shows and, for a member, whether it
 * shows anything at all — so each one is worth failing on. `inviteTrip` is the
 * door itself: it must open for a live token and for nothing else.
 */
import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import {
  migrateTestDb,
  resetDb,
  seedScenario,
  signIn,
  type Scenario,
} from "@/test/db";
import {
  inviteAuthHrefs,
  inviteTrip,
  inviteViewer,
} from "@/app/invite/[token]/invite-access";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

const verify = (userId: string) =>
  db
    .update(schema.user)
    .set({ emailVerified: true })
    .where(eq(schema.user.id, userId));

const MAIL_ON = true;
const MAIL_OFF = false;

describe("the token", () => {
  it("opens the trip it belongs to", async () => {
    expect((await inviteTrip("token-ours"))?.id).toBe(world.ours.id);
  });

  it("answers nothing for a token that never existed", async () => {
    expect(await inviteTrip("not-a-token")).toBeUndefined();
  });

  it("answers nothing once the trip is gone", async () => {
    await db
      .update(schema.trip)
      .set({ deletedAt: new Date() })
      .where(eq(schema.trip.id, world.ours.id));

    expect(await inviteTrip("token-ours")).toBeUndefined();
  });
});

describe("who is looking", () => {
  it("is a stranger when nobody is signed in", async () => {
    signIn(null);
    expect(await inviteViewer(world.ours.id, MAIL_ON)).toEqual({
      kind: "stranger",
    });
  });

  it("is a member for somebody already on the trip", async () => {
    signIn(world.member);
    expect(await inviteViewer(world.ours.id, MAIL_ON)).toEqual({
      kind: "member",
      tripId: world.ours.id,
    });
  });

  it("is a member before it is anything else, verified inbox or not", async () => {
    // The admin's address is unverified in the seed, and it must not matter:
    // they are already in, so there is nothing to gate.
    signIn(world.admin);
    expect(await inviteViewer(world.ours.id, MAIL_ON)).toMatchObject({
      kind: "member",
    });
  });

  it("is unverified for a signed-in stranger whose inbox is unconfirmed", async () => {
    signIn(world.outsider);
    expect(await inviteViewer(world.ours.id, MAIL_ON)).toEqual({
      kind: "unverified",
      email: "u-outsider@example.test",
    });
  });

  it("can join once the inbox is confirmed", async () => {
    await verify(world.outsider);
    signIn(world.outsider);

    expect(await inviteViewer(world.ours.id, MAIL_ON)).toEqual({
      kind: "canJoin",
    });
  });

  it("can join with an unconfirmed inbox when no mail is set up", async () => {
    // Rule 11: a gate on a link that could never arrive is a dead end.
    signIn(world.outsider);
    expect(await inviteViewer(world.ours.id, MAIL_OFF)).toEqual({
      kind: "canJoin",
    });
  });

  it("is not a member of a trip they are only looking at", async () => {
    signIn(world.member);
    expect(await inviteViewer(world.theirs.id, MAIL_OFF)).toMatchObject({
      kind: "canJoin",
    });
  });

  it("stops being a member once they are removed", async () => {
    await db
      .update(schema.tripMembership)
      .set({ deletedAt: new Date() })
      .where(eq(schema.tripMembership.userId, world.member));
    signIn(world.member);

    expect(await inviteViewer(world.ours.id, MAIL_OFF)).toMatchObject({
      kind: "canJoin",
    });
  });
});

describe("where the link sends somebody", () => {
  it("comes back to the link after signing up or in", () => {
    const { signUpHref, signInHref } = inviteAuthHrefs("abc");

    expect(signUpHref).toContain(encodeURIComponent("/invite/abc"));
    expect(signInHref).toContain(encodeURIComponent("/invite/abc"));
  });

  it("marks a sign-up that arrived on a link", () => {
    expect(inviteAuthHrefs("abc").signUpHref).toContain("via=link");
  });

  it("escapes a token rather than letting it shape the URL", () => {
    const { signInHref } = inviteAuthHrefs("a/b?c=d");
    expect(signInHref).toBe(`/login?redirect=${encodeURIComponent("/invite/a/b?c=d")}`);
  });
});
