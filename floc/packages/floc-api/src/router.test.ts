/**
 * What this router is *for* is the gate, so that is what is tested: who gets
 * refused, and what a refusal gives away. The data behind it is a port, driven
 * here by a fake — asserting the query would be asserting the web app's
 * `server/` modules a second time, which their own tests already do.
 */
import { describe, expect, it, vi } from "vitest";

import { appRouter } from "./router";
import type { Context, FlocPort, TripDetail } from "./port";

const TRIP: TripDetail = {
  id: 1,
  name: "Lisbon",
  startDate: "2026-05-01",
  endDate: "2026-05-05",
  tags: null,
  colorKey: null,
  archived: false,
  role: "member",
  members: [
    {
      userId: "u1",
      role: "member",
      name: "Ana",
      email: "ana@example.com",
      avatarIcon: null,
      tone: "who-1",
      dietary: null,
    },
  ],
};

function fakePort(overrides: Partial<FlocPort> = {}): FlocPort {
  const unused = () => Promise.reject(new Error("not used in this test"));
  return {
    loadMe: vi.fn().mockResolvedValue({
      id: "u1",
      name: "Ana",
      email: "ana@example.com",
      avatarIcon: null,
      been: 2,
      wantToGo: 1,
      tripCount: 1,
    }),
    renameMe: vi.fn().mockResolvedValue(undefined),
    tourSeen: vi.fn().mockResolvedValue(false),
    markTourSeen: vi.fn().mockResolvedValue(undefined),
    loadPacking: vi.fn().mockResolvedValue({ shared: [], mine: [] }),
    addPackingLine: vi.fn().mockResolvedValue(undefined),
    claimPackingLine: vi.fn().mockResolvedValue(undefined),
    setPackingPacked: vi.fn().mockResolvedValue(undefined),
    removePackingLine: vi.fn().mockResolvedValue(undefined),
    listTrips: vi.fn().mockResolvedValue([]),
    setTripStarred: vi.fn().mockResolvedValue(undefined),
    // Only member "u1" is in trip 1; everyone and everything else is null.
    loadTrip: vi.fn(async (viewerId: string, tripId: number) =>
      viewerId === "u1" && tripId === 1 ? TRIP : null,
    ),
    listDays: vi.fn().mockResolvedValue([]),
    listAvailability: vi.fn().mockResolvedValue([]),
    setAvailability: vi.fn().mockResolvedValue(undefined),
    listFiles: vi.fn().mockResolvedValue([]),
    listPlaces: vi.fn().mockResolvedValue([]),
    searchPlaces: vi.fn().mockResolvedValue([]),
    setOvernight: vi.fn().mockResolvedValue(undefined),
    loadLedger: vi.fn().mockResolvedValue({ expenses: [], splits: [], settlements: [] }),
    createTrip: vi.fn().mockResolvedValue({ id: 2 }),
    startTripFromPreset: vi.fn().mockResolvedValue({ id: 3 }),
    updateTrip: vi.fn().mockResolvedValue(undefined),
    archiveTrip: vi.fn().mockResolvedValue(undefined),
    leaveTrip: vi.fn().mockResolvedValue(undefined),
    removeMember: vi.fn().mockResolvedValue(undefined),
    promoteMember: vi.fn().mockResolvedValue(undefined),
    joinByToken: vi.fn().mockResolvedValue(null),
    writeExpense: vi.fn().mockResolvedValue(undefined),
    deleteExpense: vi.fn().mockResolvedValue(undefined),
    settleUp: vi.fn().mockResolvedValue(undefined),
    loadNotes: vi.fn().mockResolvedValue(null),
    saveNotes: vi.fn().mockResolvedValue(undefined),
    addEvent: unused,
    updateEvent: unused,
    deleteEvent: unused,
    ...overrides,
  } as FlocPort;
}

function caller(viewerId: string | null, port = fakePort()) {
  const ctx: Context = {
    viewer: viewerId
      ? { id: viewerId, name: "Ana", email: "ana@example.com", image: null }
      : null,
    port,
  };
  return { caller: appRouter.createCaller(ctx), port };
}

describe("being signed in", () => {
  it("lets anyone reach health, so a client can tell down from signed out", async () => {
    const { caller: anon } = caller(null);
    await expect(anon.health()).resolves.toEqual({ ok: true });
  });

  it("refuses a signed-out caller everywhere else", async () => {
    const { caller: anon } = caller(null);
    await expect(anon.trips.list({ archived: false })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("never lets a viewer ask for somebody else's trips", async () => {
    const { caller: ana, port } = caller("u1");
    await ana.trips.list({ archived: false });
    expect(port.listTrips).toHaveBeenCalledWith("u1", { archived: false });
  });
});

describe("starring a trip", () => {
  it("stars only for the caller", async () => {
    const { caller: ana, port } = caller("u1");
    await ana.trips.setStarred({ tripId: 1, starred: true });
    expect(port.setTripStarred).toHaveBeenCalledWith("u1", 1, true);
  });

  it("refuses a trip the caller is not on", async () => {
    const { caller: bo, port } = caller("u2");
    await expect(bo.trips.setStarred({ tripId: 1, starred: true })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    expect(port.setTripStarred).not.toHaveBeenCalled();
  });
});

describe("the tour (#314)", () => {
  it("reads and marks only the caller's own record", async () => {
    const { caller: ana, port } = caller("u1");
    await expect(ana.me.tourSeen()).resolves.toBe(false);
    await ana.me.markTourSeen();
    expect(port.tourSeen).toHaveBeenCalledWith("u1");
    expect(port.markTourSeen).toHaveBeenCalledWith("u1");
  });

  it("refuses a signed-out caller", async () => {
    const { caller: anon } = caller(null);
    await expect(anon.me.markTourSeen()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

describe("trip access (rule 5)", () => {
  it("gives a member the trip", async () => {
    const { caller: ana } = caller("u1");
    await expect(ana.trips.get({ tripId: 1 })).resolves.toMatchObject({ name: "Lisbon" });
  });

  it("answers a non-member exactly as it answers a trip that does not exist", async () => {
    const { caller: mal } = caller("intruder");
    const nonMember = await mal.trips.get({ tripId: 1 }).catch((e) => e);
    const nonExistent = await mal.trips.get({ tripId: 999 }).catch((e) => e);

    expect(nonMember.code).toBe("NOT_FOUND");
    expect(nonMember.message).toBe(nonExistent.message);
    expect(nonMember.code).toBe(nonExistent.code);
  });

  it("gates every trip-scoped procedure, not just the one that loads it", async () => {
    const { caller: mal } = caller("intruder");
    await expect(mal.money.ledger({ tripId: 1 })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(mal.itinerary.days({ tripId: 1 })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(mal.roster.remove({ tripId: 1, userId: "u1" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});

describe("what the input rules refuse", () => {
  it("refuses a float amount — money is integer minor units (rule 1)", async () => {
    const { caller: ana } = caller("u1");
    await expect(
      ana.money.write({
        tripId: 1,
        description: "Coffee",
        amountMinor: 3.5,
        currency: "EUR",
        category: "drinks",
        splitType: "shares",
        paidBy: "u1",
        splits: [{ userId: "u1", owedAmountMinor: 350 }],
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("refuses an expense with no splits, so a snapshot is never empty (rule 2)", async () => {
    const { caller: ana } = caller("u1");
    await expect(
      ana.money.write({
        tripId: 1,
        description: "Coffee",
        amountMinor: 350,
        currency: "EUR",
        category: "drinks",
        splitType: "shares",
        paidBy: "u1",
        splits: [],
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("refuses a date that is not YYYY-MM-DD, and an offset with it (rule 10)", async () => {
    const { caller: ana } = caller("u1");
    await expect(
      ana.trips.create({ name: "Porto", startDate: "2026-05-01T00:00:00Z", endDate: null }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("accepts a trip with no dates at all (rule 9)", async () => {
    const { caller: ana, port } = caller("u1");
    await expect(ana.trips.create({ name: "Someday" })).resolves.toEqual({ id: 2 });
    expect(port.createTrip).toHaveBeenCalledWith("u1", {
      name: "Someday",
      startDate: null,
      endDate: null,
    });
  });

  it("refuses a blank trip name", async () => {
    const { caller: ana } = caller("u1");
    await expect(ana.trips.create({ name: "   " })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  it("refuses a time carrying an offset (rule 10)", async () => {
    const { caller: ana } = caller("u1");
    await expect(
      ana.itinerary.addEvent({
        tripId: 1,
        dayId: 1,
        event: { type: "activity", title: "Museum", time: "09:00+01:00" },
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe("joining", () => {
  it("goes by the share token, never the trip id", async () => {
    const { caller: ana, port } = caller("u1");
    await ana.trips.join({ token: "abc" });
    expect(port.joinByToken).toHaveBeenCalledWith("u1", "abc");
  });

  it("answers null for a bad token rather than saying what was wrong", async () => {
    const { caller: ana } = caller("u1");
    await expect(ana.trips.join({ token: "nope" })).resolves.toBeNull();
  });
});

describe("what Overview reads (ticket 296)", () => {
  it("refuses files and places on a trip the viewer is not in, the same way as one that does not exist", async () => {
    const { caller: ana } = caller("u1");
    await expect(ana.files.list({ tripId: 2 })).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "No such trip.",
    });
    await expect(ana.places.list({ tripId: 2 })).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "No such trip.",
    });
  });

  it("passes the viewer down, so the port can drop somebody else's private file", async () => {
    const { caller: ana, port } = caller("u1");
    await ana.files.list({ tripId: 1 });
    expect(port.listFiles).toHaveBeenCalledWith("u1", 1);
  });

  it("reads the trip's places for the map", async () => {
    const { caller: ana, port } = caller("u1");
    await ana.places.list({ tripId: 1 });
    expect(port.listPlaces).toHaveBeenCalledWith("u1", 1);
  });
});

describe("availability (ticket 297)", () => {
  it("writes the caller's own marks, with no way to name anybody else", async () => {
    const { caller: ana, port } = caller("u1");
    await ana.availability.set({ tripId: 1, dates: ["2026-05-01"], available: true });
    expect(port.setAvailability).toHaveBeenCalledWith("u1", 1, ["2026-05-01"], true);
  });

  it("refuses a date that is not YYYY-MM-DD, as a message rather than a crash", async () => {
    const { caller: ana } = caller("u1");
    await expect(
      ana.availability.set({ tripId: 1, dates: ["01/05/2026"], available: true }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("refuses an empty set — saying nothing is not a mark", async () => {
    const { caller: ana } = caller("u1");
    await expect(
      ana.availability.set({ tripId: 1, dates: [], available: true }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("hides the group's marks from somebody not on the trip", async () => {
    const { caller: ana } = caller("u1");
    await expect(ana.availability.list({ tripId: 2 })).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "No such trip.",
    });
  });
});

describe("where the group sleeps (ticket 308)", () => {
  it("writes the span day-first — no stop is ever named (rule 3)", async () => {
    const { caller: ana, port } = caller("u1");
    await ana.itinerary.setOvernight({
      tripId: 1,
      startDate: "2026-05-01",
      endDate: "2026-05-03",
      place: { name: "Tokyo", providerId: null, lat: null, lng: null, countryCode: null },
    });
    expect(port.setOvernight).toHaveBeenCalledWith("u1", 1, {
      startDate: "2026-05-01",
      endDate: "2026-05-03",
      place: { name: "Tokyo", providerId: null, lat: null, lng: null, countryCode: null },
    });
  });

  it("takes null as a clear, which is not the same as a missing place", async () => {
    const { caller: ana, port } = caller("u1");
    await ana.itinerary.setOvernight({
      tripId: 1,
      startDate: "2026-05-01",
      endDate: "2026-05-01",
      place: null,
    });
    expect(port.setOvernight).toHaveBeenCalledWith("u1", 1, {
      startDate: "2026-05-01",
      endDate: "2026-05-01",
      place: null,
    });
  });

  it("refuses a timestamp where a date belongs (rule 10)", async () => {
    const { caller: ana } = caller("u1");
    await expect(
      ana.itinerary.setOvernight({
        tripId: 1,
        startDate: "2026-05-01T00:00:00Z",
        endDate: "2026-05-02",
        place: null,
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("refuses a non-member exactly as it refuses a trip that is not there (rule 5)", async () => {
    const { caller: mal } = caller("intruder");
    await expect(
      mal.itinerary.setOvernight({
        tripId: 1,
        startDate: "2026-05-01",
        endDate: "2026-05-01",
        place: null,
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("keeps the geocoder behind a sign-in — it is somebody else's budget", async () => {
    const { caller: anon } = caller(null);
    await expect(anon.places.search({ query: "Tokyo" })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});

describe("the forecast (#148)", () => {
  it("gives a member the trip's forecast", async () => {
    const view = { locked: true, forecast: null };
    const { caller: ana, port } = caller("u1", fakePort({ loadTripForecast: vi.fn().mockResolvedValue(view) }));
    await expect(ana.itinerary.forecast({ tripId: 1 })).resolves.toEqual(view);
    expect(port.loadTripForecast).toHaveBeenCalledWith("u1", 1);
  });

  it("refuses a non-member exactly as it refuses a trip that is not there (rule 5)", async () => {
    const { caller: mal } = caller("intruder");
    await expect(mal.itinerary.forecast({ tripId: 1 })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("buying Pro in the app", () => {
  const claim = { platform: "ios" as const, productId: "floc_pro_yearly", token: "jws" };

  it("refuses a signed-out caller", async () => {
    const { caller: anon } = caller(null);
    await expect(anon.billing.status()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(anon.billing.claim(claim)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("claims a purchase for the caller and nobody else", async () => {
    const claimStorePurchase = vi.fn().mockResolvedValue("recorded");
    const { caller: ana } = caller("u1", fakePort({ claimStorePurchase }));
    await expect(ana.billing.claim(claim)).resolves.toBe("recorded");
    expect(claimStorePurchase).toHaveBeenCalledWith("u1", claim);
  });

  it("refuses a platform that is not a store we sell on", async () => {
    const { caller: ana } = caller("u1");
    await expect(
      ana.billing.claim({ ...claim, platform: "web" as never }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("refuses an empty token rather than asking the store about nothing", async () => {
    const { caller: ana } = caller("u1");
    await expect(ana.billing.claim({ ...claim, token: "" })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });
});
