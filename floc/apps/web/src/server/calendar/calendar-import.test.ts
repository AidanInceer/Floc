/**
 * Fill from Google Calendar (#444, ADR-031). Google's API is mocked: no test signs in to Google.
 */
import { and, eq } from "drizzle-orm";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { GOOGLE_CALENDAR_SCOPE } from "@floc/core/dates/calendar-import";

const google = vi.hoisted(() => ({
  enabled: true,
  token: vi.fn(),
}));

vi.mock("@/server/auth/auth", () => ({
  auth: { api: { getAccessToken: google.token } },
  enabledProviders: {
    get google() {
      return google.enabled;
    },
  },
}));

import {
  fillFromCalendar,
  hasCalendarAccess,
  removeCalendarAccess,
  revokeGoogleGrant,
} from "@/server/calendar/calendar-import";
import { setAvailability } from "@/server/itinerary/availability";

let world: Scenario;
const fetchMock = vi.fn();

const trip = { startDate: "2027-09-04", endDate: "2027-09-08", month: "2027-09" };
const timed = (day: string, extra = {}) => ({
  start: { dateTime: `${day}T10:00:00+01:00` },
  end: { dateTime: `${day}T11:00:00+01:00` },
  ...extra,
});
const answer = (items: unknown[], status = 200) =>
  Promise.resolve(new Response(JSON.stringify({ items }), { status }));

async function link(scope: string | null, userId = world.member) {
  await db.insert(schema.account).values({
    id: `acc-${userId}`,
    accountId: `g-${userId}`,
    providerId: "google",
    userId,
    scope,
    accessToken: "cipher",
    refreshToken: "cipher",
  });
}
const marks = (userId = world.member) =>
  db
    .select({ date: schema.availability.date, available: schema.availability.available })
    .from(schema.availability)
    .where(and(eq(schema.availability.tripId, world.ours.id), eq(schema.availability.userId, userId)))
    .orderBy(schema.availability.date)
    .all();
const run = (extra: Partial<typeof trip> = {}, userId = world.member) =>
  fillFromCalendar({ tripId: world.ours.id, userId, ...trip, ...extra });

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  google.enabled = true;
  google.token.mockReset().mockResolvedValue({ accessToken: "tok" });
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe("fillFromCalendar", () => {
  it("marks busy days unavailable and empty days available, over the trip's dates", async () => {
    await link(`openid,${GOOGLE_CALENDAR_SCOPE}`);
    fetchMock.mockReturnValueOnce(answer([timed("2027-09-05"), { start: { date: "2027-09-07" }, end: { date: "2027-09-08" } }]));

    expect(await run()).toEqual({ status: "filled", free: 3, busy: 2 });
    expect(await marks()).toEqual([
      { date: "2027-09-04", available: true },
      { date: "2027-09-05", available: false },
      { date: "2027-09-06", available: true },
      { date: "2027-09-07", available: false },
      { date: "2027-09-08", available: true },
    ]);
  });

  it("keeps days marked by hand, either way", async () => {
    await link(GOOGLE_CALENDAR_SCOPE);
    await setAvailability(world.ours.id, world.member, ["2027-09-05"], true);
    await setAvailability(world.ours.id, world.member, ["2027-09-06"], false);
    fetchMock.mockReturnValueOnce(answer([timed("2027-09-05")]));

    expect(await run()).toEqual({ status: "filled", free: 3, busy: 0 });
    const m = await marks();
    expect(m.find((x) => x.date === "2027-09-05")?.available).toBe(true);
    expect(m.find((x) => x.date === "2027-09-06")?.available).toBe(false);
  });

  it("covers the month on screen when the trip has no dates", async () => {
    await link(GOOGLE_CALENDAR_SCOPE);
    fetchMock.mockReturnValueOnce(answer([]));
    const out = await run({ startDate: null, endDate: null, month: "2027-02" } as never);
    expect(out).toEqual({ status: "filled", free: 28, busy: 0 });
  });

  it("asks for start, end, status and your own reply, from the primary calendar only", async () => {
    await link(GOOGLE_CALENDAR_SCOPE);
    fetchMock.mockReturnValueOnce(answer([]));
    await run();

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const u = new URL(url);
    expect(u.pathname).toBe("/calendar/v3/calendars/primary/events");
    expect(u.searchParams.get("singleEvents")).toBe("true");
    expect(u.searchParams.get("fields")).toBe("nextPageToken,items(status,start,end,attendees(self,responseStatus))");
    expect(u.searchParams.get("timeMin")).toBe("2027-09-03T00:00:00Z");
    expect(u.searchParams.get("timeMax")).toBe("2027-09-10T00:00:00Z");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tok");
  });

  it("follows pages", async () => {
    await link(GOOGLE_CALENDAR_SCOPE);
    fetchMock
      .mockReturnValueOnce(Promise.resolve(new Response(JSON.stringify({ items: [timed("2027-09-05")], nextPageToken: "p2" }))))
      .mockReturnValueOnce(answer([timed("2027-09-06")]));
    expect(await run()).toEqual({ status: "filled", free: 3, busy: 2 });
    expect(new URL(fetchMock.mock.calls[1][0]).searchParams.get("pageToken")).toBe("p2");
  });

  it("asks for consent when Floc has no calendar scope", async () => {
    await link("openid,email,profile");
    expect(await run()).toEqual({ status: "needs-access" });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(await marks()).toEqual([]);
  });

  it("asks for consent from a password-only member with no Google account", async () => {
    expect(await run()).toEqual({ status: "needs-access" });
  });

  it("asks again when Google rejects the token, and writes nothing", async () => {
    await link(GOOGLE_CALENDAR_SCOPE);
    fetchMock.mockReturnValueOnce(Promise.resolve(new Response("{}", { status: 401 })));
    expect(await run()).toEqual({ status: "needs-access" });
    expect(await marks()).toEqual([]);
  });

  it("asks again when no usable token can be had", async () => {
    await link(GOOGLE_CALENDAR_SCOPE);
    google.token.mockRejectedValueOnce(new Error("nope"));
    expect(await run()).toEqual({ status: "needs-access" });
  });

  it("says so and writes nothing when Google fails or is unreachable", async () => {
    await link(GOOGLE_CALENDAR_SCOPE);
    fetchMock.mockReturnValueOnce(Promise.resolve(new Response("{}", { status: 500 })));
    expect(await run()).toMatchObject({ status: "error" });
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    expect(await run()).toMatchObject({ status: "error" });
    expect(await marks()).toEqual([]);
  });

  it("does nothing without a Google key (rule 11)", async () => {
    await link(GOOGLE_CALENDAR_SCOPE);
    google.enabled = false;
    expect(await run()).toMatchObject({ status: "error" });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(await hasCalendarAccess(world.member)).toBe(false);
  });

  it("refuses a month that is not one", async () => {
    await link(GOOGLE_CALENDAR_SCOPE);
    expect(await run({ month: "2027-13" })).toMatchObject({ status: "error" });
  });

  it("writes only the caller's own marks", async () => {
    await link(GOOGLE_CALENDAR_SCOPE);
    fetchMock.mockReturnValueOnce(answer([]));
    await run();
    expect(await marks(world.admin)).toEqual([]);
  });
});

describe("removeCalendarAccess", () => {
  it("revokes at Google, then drops the scope and the tokens", async () => {
    await link(`openid,${GOOGLE_CALENDAR_SCOPE}`);
    fetchMock.mockReturnValueOnce(Promise.resolve(new Response("{}", { status: 200 })));

    expect(await removeCalendarAccess(world.member)).toBeNull();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://oauth2.googleapis.com/revoke");
    expect(String(init.body)).toBe("token=tok");
    const row = await db.select().from(schema.account).where(eq(schema.account.userId, world.member)).get();
    expect(row).toMatchObject({ scope: "openid", accessToken: null, refreshToken: null });
    expect(await hasCalendarAccess(world.member)).toBe(false);
  });

  it("still lets go when Google says the token is already dead", async () => {
    await link(GOOGLE_CALENDAR_SCOPE);
    fetchMock.mockReturnValueOnce(Promise.resolve(new Response("{}", { status: 400 })));
    expect(await removeCalendarAccess(world.member)).toBeNull();
    expect(await hasCalendarAccess(world.member)).toBe(false);
  });

  it("keeps access on, and says why, when Google cannot be reached", async () => {
    await link(GOOGLE_CALENDAR_SCOPE);
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    expect(await removeCalendarAccess(world.member)).toMatch(/still on/);
    expect(await hasCalendarAccess(world.member)).toBe(true);
  });

  it("is a no-op when nothing was granted", async () => {
    expect(await removeCalendarAccess(world.member)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("revokeGoogleGrant, when an account is deleted", () => {
  it("revokes the calendar grant at Google", async () => {
    await link(`openid,${GOOGLE_CALENDAR_SCOPE}`);
    fetchMock.mockReturnValueOnce(Promise.resolve(new Response("{}", { status: 200 })));

    await revokeGoogleGrant(world.member);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://oauth2.googleapis.com/revoke");
    expect(String(init.body)).toBe("token=tok");
  });

  it("never stops the deletion: Google being unreachable or no token is not an error", async () => {
    await link(GOOGLE_CALENDAR_SCOPE);
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    await expect(revokeGoogleGrant(world.member)).resolves.toBeUndefined();

    google.token.mockRejectedValueOnce(new Error("nope"));
    await expect(revokeGoogleGrant(world.member)).resolves.toBeUndefined();
  });

  it("asks nothing of Google when no calendar was granted", async () => {
    await revokeGoogleGrant(world.member);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
