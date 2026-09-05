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
      avatarUrl: null,
      tone: "who-1",
      dietary: null,
    },
  ],
};

function fakePort(overrides: Partial<FlocPort> = {}): FlocPort {
  const unused = () => Promise.reject(new Error("not used in this test"));
  return {
    listTrips: vi.fn().mockResolvedValue([]),
    // Only member "u1" is in trip 1; everyone and everything else is null.
    loadTrip: vi.fn(async (viewerId: string, tripId: number) =>
      viewerId === "u1" && tripId === 1 ? TRIP : null,
    ),
    listDays: vi.fn().mockResolvedValue([]),
    loadLedger: vi.fn().mockResolvedValue({ expenses: [], splits: [], settlements: [] }),
    createTrip: vi.fn().mockResolvedValue({ id: 2 }),
    updateTrip: vi.fn().mockResolvedValue(undefined),
    archiveTrip: vi.fn().mockResolvedValue(undefined),
    leaveTrip: vi.fn().mockResolvedValue(undefined),
    removeMember: vi.fn().mockResolvedValue(undefined),
    promoteMember: vi.fn().mockResolvedValue(undefined),
    joinByToken: vi.fn().mockResolvedValue(null),
    writeExpense: vi.fn().mockResolvedValue(undefined),
    deleteExpense: vi.fn().mockResolvedValue(undefined),
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
