import { and, eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db } from "@/db";
import { tripMembership } from "@/db/schema";
import { memberSessionStart } from "@/server/access";
import { mintShareToken } from "@/server/trips/invite-link";
import { migrateTestDb, resetDb, seedScenario, signIn, type Scenario } from "@/test/db";
import { currentUser } from "@/test/setup";

import { GET } from "./route";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

async function arrive(token: string, headers: Record<string, string> = {}) {
  const answer = await GET(new NextRequest(`http://floc.test/invite/${token}/join`, { headers }), { params: Promise.resolve({ token }) });
  return { status: answer.status, to: new URL(answer.headers.get("location") ?? "").pathname + new URL(answer.headers.get("location") ?? "").search };
}

async function isMember(tripId: number, userId: string) {
  const row = await db.select().from(tripMembership).where(and(eq(tripMembership.tripId, tripId), eq(tripMembership.userId, userId))).get();
  return Boolean(row);
}

describe("signing up from an invite link joins the trip (#707)", () => {
  it("joins a fresh session and opens the trip's overview", async () => {
    signIn(world.outsider);
    const token = mintShareToken("token-ours");
    expect(await arrive(token)).toEqual({ status: 303, to: `/trip/${world.ours.id}/overview` });
    expect(await isMember(world.ours.id, world.outsider)).toBe(true);
  });

  it("does not join from a request that is not a page visit, such as an image on another site", async () => {
    signIn(world.outsider);
    const token = mintShareToken("token-ours");
    expect((await arrive(token, { "sec-fetch-mode": "no-cors" })).to).toBe(`/invite/${token}`);
    expect(await isMember(world.ours.id, world.outsider)).toBe(false);
  });

  it("joins on a page visit the browser marks as one", async () => {
    signIn(world.outsider);
    const token = mintShareToken("token-ours");
    expect((await arrive(token, { "sec-fetch-mode": "navigate" })).to).toBe(`/trip/${world.ours.id}/overview`);
  });

  it("sends someone with no session back to the invite page", async () => {
    const token = mintShareToken("token-ours");
    expect(await arrive(token)).toEqual({ status: 303, to: `/invite/${token}` });
  });

  it("does not join a session that started long ago", async () => {
    signIn(world.outsider);
    currentUser.startedAt = new Date(Date.now() - 60 * 60 * 1000);
    const token = mintShareToken("token-ours");
    expect((await arrive(token)).to).toBe(`/invite/${token}`);
    expect(await isMember(world.ours.id, world.outsider)).toBe(false);
  });

  it("sends an unknown link back to the invite page", async () => {
    signIn(world.outsider);
    expect((await arrive("nope.zz.bad")).to).toBe("/invite/nope.zz.bad");
  });
});

describe("the member's session start", () => {
  it("is null with no one signed in", async () => {
    expect(await memberSessionStart()).toBeNull();
  });

  it("gives the member and when the session began", async () => {
    signIn(world.member);
    const startedAt = new Date("2026-11-20T10:00:00Z");
    currentUser.startedAt = startedAt;
    expect(await memberSessionStart()).toEqual({ userId: world.member, startedAt });
  });
});
