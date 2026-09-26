/**
 * The port the phone reads a trip through (ticket 287), against a real
 * database.
 *
 * The point of these is not that the queries work — `trips.test.ts` and the
 * rest already prove that. It is that the *same rules* survive the new door.
 * Rule 5 in particular: `requireTripAccess` keeps it by leaving through
 * `notFound()`, and the port cannot do that, so it has to keep it another way.
 * A rule with two enforcement paths needs a test on both.
 */
import { parseTagNames } from "@floc/core/trip/tags";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { webPort } from "@/server/api-port/api-port";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

describe("who can see a trip (rule 5)", () => {
  it("gives a member the trip", async () => {
    const trip = await webPort.loadTrip(world.member, world.ours.id);
    expect(trip?.name).toBe("Ours");
    expect(trip?.role).toBe("member");
  });

  it("says whether booking links come filled in, which is Pro", async () => {
    expect((await webPort.loadTrip(world.member, world.ours.id))?.bookingPrefill).toBe(false);

    await db.insert(schema.subscription).values({
      userId: world.admin,
      status: "active",
      source: "comp",
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      stripeSubscriptionId: `sub_${world.admin}`,
    });

    expect((await webPort.loadTrip(world.member, world.ours.id))?.bookingPrefill).toBe(true);
  });

  it("answers a non-member and a nonexistent trip identically", async () => {
    const foreign = await webPort.loadTrip(world.outsider, world.ours.id);
    const missing = await webPort.loadTrip(world.outsider, 999_999);
    expect(foreign).toBeNull();
    expect(missing).toBeNull();
  });

  it("refuses a non-member every trip-scoped read, not only the trip itself", async () => {
    await expect(webPort.listDays(world.outsider, world.ours.id)).rejects.toThrow();
    await expect(webPort.loadLedger(world.outsider, world.ours.id)).rejects.toThrow();
  });

  it("never returns another person's trips from the list", async () => {
    const mine = await webPort.listTrips(world.member, { archived: false });
    expect(mine.map((t) => t.name)).toEqual(["Ours"]);
  });
});

describe("starring a trip", () => {
  it("stars it for the viewer alone", async () => {
    await webPort.setTripStarred(world.member, world.ours.id, true);

    const mine = await webPort.listTrips(world.member, { archived: false });
    const theirs = await webPort.listTrips(world.admin, { archived: false });
    expect(mine.find((t) => t.id === world.ours.id)?.starred).toBe(true);
    expect(theirs.find((t) => t.id === world.ours.id)?.starred).toBe(false);
  });

  it("takes the star off again", async () => {
    await webPort.setTripStarred(world.member, world.ours.id, true);
    await webPort.setTripStarred(world.member, world.ours.id, false);

    const mine = await webPort.listTrips(world.member, { archived: false });
    expect(mine.find((t) => t.id === world.ours.id)?.starred).toBe(false);
  });

  it("refuses a non-member (rule 5)", async () => {
    await expect(
      webPort.setTripStarred(world.outsider, world.ours.id, true),
    ).rejects.toThrow();
  });
});

describe("muting a trip (#346)", () => {
  it("mutes it for the viewer alone, and unmutes again", async () => {
    await webPort.setTripMuted(world.member, world.ours.id, true);

    const mine = await webPort.listTrips(world.member, { archived: false });
    const theirs = await webPort.listTrips(world.admin, { archived: false });
    expect(mine.find((t) => t.id === world.ours.id)?.muted).toBe(true);
    expect(theirs.find((t) => t.id === world.ours.id)?.muted).toBe(false);

    await webPort.setTripMuted(world.member, world.ours.id, false);
    const again = await webPort.listTrips(world.member, { archived: false });
    expect(again.find((t) => t.id === world.ours.id)?.muted).toBe(false);
  });

  it("refuses a non-member (rule 5)", async () => {
    await expect(webPort.setTripMuted(world.outsider, world.ours.id, true)).rejects.toThrow();
  });
});

describe("the admin powers (rule 6)", () => {
  it("lets an admin archive, promote and remove", async () => {
    await webPort.archiveTrip(world.admin, world.ours.id, true);
    await webPort.promoteMember(world.admin, world.ours.id, world.member);

    const trip = await webPort.loadTrip(world.admin, world.ours.id);
    expect(trip?.archived).toBe(true);
    expect(trip?.members.find((m) => m.userId === world.member)?.role).toBe("admin");
  });

  it("lets an admin reset the invite link, retiring the old token (#358)", async () => {
    const minted = await webPort.resetInviteLink(world.admin, world.ours.id);

    expect(minted).not.toBe("token-ours");
    expect(await webPort.previewInvite("token-ours")).toBeNull();
    expect((await webPort.previewInvite(minted))?.name).toBe("Ours");
    // Re-locking the door does not put anybody outside it.
    expect(await webPort.loadTrip(world.member, world.ours.id)).not.toBeNull();
  });

  it("refuses a member all four", async () => {
    await expect(
      webPort.archiveTrip(world.member, world.ours.id, true),
    ).rejects.toThrow(/admin/i);
    await expect(
      webPort.promoteMember(world.member, world.ours.id, world.admin),
    ).rejects.toThrow(/admin/i);
    await expect(
      webPort.removeMember(world.member, world.ours.id, world.admin),
    ).rejects.toThrow(/admin/i);
    await expect(
      webPort.resetInviteLink(world.member, world.ours.id),
    ).rejects.toThrow(/admin/i);
  });

  it("refuses the reset to a non-member, without saying the trip exists (rule 5)", async () => {
    await expect(
      webPort.resetInviteLink(world.outsider, world.ours.id),
    ).rejects.toThrow();
    expect((await webPort.previewInvite("token-ours"))?.name).toBe("Ours");
  });

  it("lets any member leave, because leaving is not an admin power", async () => {
    await webPort.leaveTrip(world.member, world.ours.id);
    expect(await webPort.loadTrip(world.member, world.ours.id)).toBeNull();
    // The trip itself is untouched — the admin is still on it.
    expect(await webPort.loadTrip(world.admin, world.ours.id)).not.toBeNull();
  });

  it("treats an admin removing themselves as leaving, so succession still runs", async () => {
    await webPort.removeMember(world.admin, world.ours.id, world.admin);

    const trip = await webPort.loadTrip(world.member, world.ours.id);
    // The sole remaining member inherits admin rather than the trip being left
    // with nobody who can administer it.
    expect(trip?.members.find((m) => m.userId === world.member)?.role).toBe("admin");
  });
});

describe("joining", () => {
  it("joins by the share token", async () => {
    const joined = await webPort.joinByToken(world.outsider, "token-ours");
    expect(joined).toEqual({ id: world.ours.id });
    expect(await webPort.loadTrip(world.outsider, world.ours.id)).not.toBeNull();
  });

  it("answers null for a token that resolves to nothing", async () => {
    expect(await webPort.joinByToken(world.outsider, "not-a-token")).toBeNull();
  });
});

describe("creating and patching a trip", () => {
  it("makes the creator an admin", async () => {
    const { id } = await webPort.createTrip(world.member, {
      name: "Faroes",
      startDate: null,
      endDate: null,
    });
    const trip = await webPort.loadTrip(world.member, id);
    expect(trip?.role).toBe("admin");
    // A trip with no dates is a normal trip (rule 9).
    expect(trip?.startDate).toBeNull();
  });

  it("clears tags when the wire says null", async () => {
    await webPort.updateTrip(world.admin, world.ours.id, { tags: ["beach"] });
    expect((await webPort.loadTrip(world.admin, world.ours.id))?.tags).toEqual(["beach"]);

    await webPort.updateTrip(world.admin, world.ours.id, { tags: null });
    expect((await webPort.loadTrip(world.admin, world.ours.id))?.tags).toEqual([]);
  });

  it("reads colour, mark and tags through the same rules as the web form", async () => {
    await webPort.updateTrip(world.admin, world.ours.id, {
      colorKey: "not-a-colour",
      mark: "not-a-mark",
      tags: ["  Beach ", "beach", "", "x".repeat(500)],
    });
    const trip = await webPort.loadTrip(world.admin, world.ours.id);
    expect(trip?.colorKey).toBeNull();
    expect(trip?.mark).toBeNull();
    expect(trip?.tags).toEqual(parseTagNames(["  Beach ", "beach", "", "x".repeat(500)]));
  });

  it("leaves a field alone when the patch omits it", async () => {
    await webPort.updateTrip(world.admin, world.ours.id, { name: "Renamed" });
    const trip = await webPort.loadTrip(world.admin, world.ours.id);
    expect(trip?.name).toBe("Renamed");
    expect(trip?.colorKey).toBeNull();
  });
});

describe("money", () => {
  it("writes an expense with its whole split set, and reads both back", async () => {
    await webPort.writeExpense(world.admin, world.ours.id, {
      description: "Dinner",
      amountMinor: 4000,
      currency: "GBP",
      category: "food",
      splitType: "shares",
      paidBy: world.admin,
      dayId: null,
      notes: null,
      splits: [
        { userId: world.admin, owedAmountMinor: 2000 },
        { userId: world.member, owedAmountMinor: 2000 },
      ],
    });

    const ledger = await webPort.loadLedger(world.member, world.ours.id);
    expect(ledger.expenses).toHaveLength(1);
    expect(ledger.expenses[0].amountMinor).toBe(4000);
    expect(ledger.splits).toHaveLength(2);
  });

  it("refuses to edit an expense belonging to another trip", async () => {
    await webPort.writeExpense(world.outsider, world.theirs.id, {
      description: "Theirs",
      amountMinor: 100,
      currency: "GBP",
      category: "other",
      splitType: "shares",
      paidBy: world.outsider,
      dayId: null,
      notes: null,
      splits: [{ userId: world.outsider, owedAmountMinor: 100 }],
    });
    const theirs = await webPort.loadLedger(world.outsider, world.theirs.id);
    const stolenId = theirs.expenses[0].id;

    await expect(
      webPort.writeExpense(world.admin, world.ours.id, {
        expenseId: stolenId,
        description: "Hijacked",
        amountMinor: 1,
        currency: "GBP",
        category: "other",
        splitType: "shares",
        paidBy: world.admin,
        dayId: null,
        notes: null,
        splits: [{ userId: world.admin, owedAmountMinor: 1 }],
      }),
    ).rejects.toThrow();

    // And the other trip's row is untouched.
    const after = await webPort.loadLedger(world.outsider, world.theirs.id);
    expect(after.expenses[0].description).toBe("Theirs");
  });

  const bill = (patch: Partial<Parameters<typeof webPort.writeExpense>[2]> = {}) => ({
    description: "Dinner",
    amountMinor: 4000,
    currency: "GBP" as const,
    category: "food" as const,
    splitType: "shares" as const,
    paidBy: world.admin,
    dayId: null,
    notes: null,
    splits: [
      { userId: world.admin, owedAmountMinor: 2000 },
      { userId: world.member, owedAmountMinor: 2000 },
    ],
    ...patch,
  });

  it("refuses a share for somebody who is not on the trip", async () => {
    const splits = [
      { userId: world.admin, owedAmountMinor: 2000 },
      { userId: world.outsider, owedAmountMinor: 2000 },
    ];
    await expect(webPort.writeExpense(world.admin, world.ours.id, bill({ splits }))).rejects.toThrow(
      /on the trip/,
    );
  });

  it("refuses shares that do not add up, or a negative one", async () => {
    const short = [{ userId: world.admin, owedAmountMinor: 100 }];
    await expect(webPort.writeExpense(world.admin, world.ours.id, bill({ splits: short }))).rejects.toThrow(
      /add up/,
    );
    const negative = [
      { userId: world.admin, owedAmountMinor: 5000 },
      { userId: world.member, owedAmountMinor: -1000 },
    ];
    await expect(
      webPort.writeExpense(world.admin, world.ours.id, bill({ splits: negative })),
    ).rejects.toThrow(/negative/);
    expect((await webPort.loadLedger(world.admin, world.ours.id)).expenses).toEqual([]);
  });

  it("refuses a day from another trip", async () => {
    await expect(
      webPort.writeExpense(world.admin, world.ours.id, bill({ dayId: world.theirs.dayId })),
    ).rejects.toThrow(/day/);
  });

  it("keeps a former member's share when the expense is edited", async () => {
    await webPort.writeExpense(world.admin, world.ours.id, bill());
    const [written] = (await webPort.loadLedger(world.admin, world.ours.id)).expenses;
    await webPort.leaveTrip(world.member, world.ours.id);

    await webPort.writeExpense(world.admin, world.ours.id, bill({ expenseId: written.id, description: "Supper" }));

    const after = await webPort.loadLedger(world.admin, world.ours.id);
    expect(after.expenses[0].description).toBe("Supper");
    expect(after.splits.map((s) => s.userId).sort()).toEqual([world.admin, world.member].sort());
  });

  it("lets only the payer or the receiver record a settlement", async () => {
    await webPort.joinByToken(world.outsider, "token-ours");
    const between = [
      { fromUserId: world.admin, toUserId: world.outsider, amountMinor: 500, currency: "GBP" as const },
    ];

    await expect(webPort.settleUp(world.member, world.ours.id, between)).rejects.toThrow(
      /payer or receiver/i,
    );
    expect((await webPort.loadLedger(world.admin, world.ours.id)).settlements).toHaveLength(0);

    await webPort.settleUp(world.outsider, world.ours.id, between);
    expect((await webPort.loadLedger(world.admin, world.ours.id)).settlements).toHaveLength(1);
  });

  it("soft-deletes an expense rather than removing the row (rule 8)", async () => {
    await webPort.writeExpense(world.admin, world.ours.id, {
      description: "Taxi",
      amountMinor: 500,
      currency: "GBP",
      category: "transport",
      splitType: "shares",
      paidBy: world.admin,
      dayId: null,
      notes: null,
      splits: [{ userId: world.admin, owedAmountMinor: 500 }],
    });
    const before = await webPort.loadLedger(world.admin, world.ours.id);
    await webPort.deleteExpense(world.admin, world.ours.id, before.expenses[0].id);

    expect((await webPort.loadLedger(world.admin, world.ours.id)).expenses).toHaveLength(0);
    const rows = await db.select().from(schema.expense).all();
    expect(rows).toHaveLength(1);
    expect(rows[0].deletedAt).not.toBeNull();
  });
});

describe("the itinerary", () => {
  it("returns days with their events attached", async () => {
    const days = await webPort.listDays(world.admin, world.ours.id);
    expect(days).toHaveLength(1);
    expect(days[0].events).toHaveLength(2);
  });

  it("adds, edits and soft-deletes an event", async () => {
    await webPort.addEvent(world.admin, world.ours.id, world.ours.dayId, {
      type: "activity",
      title: "Museum",
      transportType: null,
      time: "11:00",
      endTime: null,
      allDay: false,
      note: null,
    });

    let days = await webPort.listDays(world.admin, world.ours.id);
    const added = days[0].events.find((e) => e.title === "Museum");
    expect(added).toBeDefined();

    await webPort.updateEvent(world.admin, world.ours.id, added!.id, {
      type: "activity",
      title: "Gallery",
      transportType: null,
      time: "11:00",
      endTime: null,
      allDay: false,
      note: null,
    });
    days = await webPort.listDays(world.admin, world.ours.id);
    expect(days[0].events.find((e) => e.id === added!.id)?.title).toBe("Gallery");

    await webPort.deleteEvent(world.admin, world.ours.id, added!.id);
    days = await webPort.listDays(world.admin, world.ours.id);
    expect(days[0].events.find((e) => e.id === added!.id)).toBeUndefined();
  });

  it("refuses to put an event on another trip's day", async () => {
    await expect(
      webPort.addEvent(world.admin, world.ours.id, world.theirs.dayId, {
        type: "activity",
        title: "Trespass",
        transportType: null,
        time: null,
        endTime: null,
        allDay: true,
        note: null,
      }),
    ).rejects.toThrow();
  });

  it("refuses to edit another trip's event", async () => {
    await expect(
      webPort.updateEvent(world.admin, world.ours.id, world.theirs.eventId, {
        type: "activity",
        title: "Trespass",
        transportType: null,
        time: null,
        endTime: null,
        allDay: true,
        note: null,
      }),
    ).rejects.toThrow();
  });
});

describe("packing through the port (#220's two lists)", () => {
  it("keeps your bag out of the group's list, and out of everybody else's read", async () => {
    await webPort.addPackingLine(world.admin, world.ours.id, {
      label: "Sun cream",
      category: "essentials",
      mine: false,
    });
    await webPort.addPackingLine(world.admin, world.ours.id, {
      label: "Ada's inhaler",
      category: "essentials",
      mine: true,
    });

    const ada = await webPort.loadPacking(world.admin, world.ours.id);
    expect(ada.shared.map((l) => l.label)).toEqual(["Sun cream"]);
    expect(ada.mine.map((l) => l.label)).toEqual(["Ada's inhaler"]);

    // Mo sees the group's line and nothing of Ada's bag.
    const mo = await webPort.loadPacking(world.member, world.ours.id);
    expect(mo.shared.map((l) => l.label)).toEqual(["Sun cream"]);
    expect(mo.mine).toEqual([]);
  });

  it("lets several people claim one line, and ticks only the caller's own claim", async () => {
    await webPort.addPackingLine(world.admin, world.ours.id, {
      label: "Speaker",
      category: "other",
      mine: false,
    });
    const [line] = (await webPort.loadPacking(world.admin, world.ours.id)).shared;

    await webPort.claimPackingLine(world.admin, world.ours.id, line.id, true);
    await webPort.claimPackingLine(world.member, world.ours.id, line.id, true);
    await webPort.setPackingPacked(world.admin, world.ours.id, line.id, true);

    const claims = (await webPort.loadPacking(world.member, world.ours.id)).shared[0].claims;
    expect(claims).toHaveLength(2);
    expect(claims.find((c) => c.userId === world.admin)?.packed).toBe(true);
    expect(claims.find((c) => c.userId === world.member)?.packed).toBe(false);
  });

  it("refuses an outsider every packing call, the same way as a trip that does not exist (rule 5)", async () => {
    await expect(webPort.loadPacking(world.outsider, world.ours.id)).rejects.toThrow();
    await expect(
      webPort.addPackingLine(world.outsider, world.ours.id, {
        label: "Crowbar",
        category: "other",
        mine: false,
      }),
    ).rejects.toThrow();
  });

  it("soft-deletes a line rather than removing it (rule 8)", async () => {
    await webPort.addPackingLine(world.admin, world.ours.id, {
      label: "Tent",
      category: "other",
      mine: false,
    });
    const [line] = (await webPort.loadPacking(world.admin, world.ours.id)).shared;

    // Anyone on the trip may drop a shared line — the list is the group's.
    await webPort.removePackingLine(world.member, world.ours.id, line.id);

    expect((await webPort.loadPacking(world.admin, world.ours.id)).shared).toEqual([]);
    const rows = await db.select().from(schema.packingLine).all();
    expect(rows).toHaveLength(1);
    expect(rows[0].deletedAt).not.toBeNull();
  });
});

describe("renaming a packing line through the port (#362)", () => {
  it("renames a shared line and keeps its claims", async () => {
    await webPort.addPackingLine(world.admin, world.ours.id, { label: "Sun cream", category: "other", mine: false });
    const [line] = (await webPort.loadPacking(world.admin, world.ours.id)).shared;
    await webPort.claimPackingLine(world.member, world.ours.id, line.id, true);

    await webPort.renamePackingLine(world.member, world.ours.id, line.id, "Factor 50");

    const [renamed] = (await webPort.loadPacking(world.admin, world.ours.id)).shared;
    expect(renamed).toMatchObject({ id: line.id, label: "Factor 50" });
    expect(renamed.claims.map((c) => c.userId)).toEqual([world.member]);
  });

  it("never reaches another member's bag", async () => {
    await webPort.addPackingLine(world.member, world.ours.id, { label: "Meds", category: "other", mine: true });
    const [line] = (await webPort.loadPacking(world.member, world.ours.id)).mine;

    await expect(webPort.renamePackingLine(world.admin, world.ours.id, line.id, "Mine now")).rejects.toThrow();
    expect((await webPort.loadPacking(world.member, world.ours.id)).mine[0].label).toBe("Meds");
  });
});

describe("packing setup through the port (#220, #229)", () => {
  const add = (viewer: string, label: string, mine: boolean) =>
    webPort.addPackingLine(viewer, world.ours.id, { label, category: "other", mine });

  it("keeps the tier on the trip, not on the profile — Light here leaves elsewhere alone", async () => {
    await webPort.setPackTier(world.admin, world.ours.id, "light");

    const ours = await webPort.loadPacking(world.admin, world.ours.id);
    expect(ours.tier).toBe("light");
    // The other member's own view of the same trip is their own choice, which
    // they have not made — so it falls through to their profile default.
    const theirs = await webPort.loadPacking(world.member, world.ours.id);
    expect(theirs.tier).toBe("balanced");
  });

  it("refuses a bulk remove holding somebody else's bag line, whole rather than in part", async () => {
    await add(world.admin, "Group speaker", false);
    await add(world.member, "Mo's razor", true);

    const shared = (await webPort.loadPacking(world.admin, world.ours.id)).shared;
    const mosLine = (await webPort.loadPacking(world.member, world.ours.id)).mine;

    await expect(
      webPort.removePackingLines(world.admin, world.ours.id, [shared[0].id, mosLine[0].id]),
    ).rejects.toThrow();

    // Nothing went — not even the line Ada was allowed to remove.
    expect((await webPort.loadPacking(world.admin, world.ours.id)).shared).toHaveLength(1);
    expect((await webPort.loadPacking(world.member, world.ours.id)).mine).toHaveLength(1);
  });

  it("makes a kit out of the bag, and it is only ever the maker's", async () => {
    await add(world.admin, "Head torch", true);
    await add(world.admin, "Dry bag", true);

    expect(await webPort.savePackingKit(world.admin, world.ours.id, "Camping")).toBe(true);

    const ada = await webPort.loadPacking(world.admin, world.ours.id);
    expect(ada.kits).toEqual([expect.objectContaining({ name: "Camping", itemCount: 2 })]);
    // A kit belongs to the account, not the trip — Mo sees none of it.
    expect((await webPort.loadPacking(world.member, world.ours.id)).kits).toEqual([]);
  });

  it("cannot delete a kit that is not yours, and says nothing about whose it is", async () => {
    await add(world.admin, "Head torch", true);
    await webPort.savePackingKit(world.admin, world.ours.id, "Camping");
    const kitId = (await webPort.loadPacking(world.admin, world.ours.id)).kits[0].id;

    // Resolved by owner inside, so this is a no-op rather than a refusal —
    // the same answer Mo would get for an id that never existed (rule 5).
    await webPort.deletePackingKit(world.member, kitId);

    expect((await webPort.loadPacking(world.admin, world.ours.id)).kits).toHaveLength(1);
  });

  it("removes several in one call when every one of them resolves", async () => {
    await add(world.admin, "Tent", false);
    await add(world.admin, "Poles", false);
    const shared = (await webPort.loadPacking(world.admin, world.ours.id)).shared;

    await webPort.removePackingLines(world.member, world.ours.id, shared.map((l) => l.id));

    expect((await webPort.loadPacking(world.admin, world.ours.id)).shared).toEqual([]);
  });

  it("empties one list and leaves the other standing", async () => {
    await add(world.admin, "Group stove", false);
    await add(world.admin, "Ada's boots", true);

    await webPort.resetPackingList(world.admin, world.ours.id, true);

    const after = await webPort.loadPacking(world.admin, world.ours.id);
    expect(after.mine).toEqual([]);
    expect(after.shared.map((l) => l.label)).toEqual(["Group stove"]);
  });

  it("cannot be aimed at another person's bag — resetting yours never touches theirs", async () => {
    await add(world.member, "Mo's towel", true);

    await webPort.resetPackingList(world.admin, world.ours.id, true);

    expect((await webPort.loadPacking(world.member, world.ours.id)).mine).toHaveLength(1);
  });

  it("refuses an outsider the setup calls too (rule 5)", async () => {
    await expect(
      webPort.setPackTier(world.outsider, world.ours.id, "comfort"),
    ).rejects.toThrow();
    await expect(
      webPort.resetPackingList(world.outsider, world.ours.id, false),
    ).rejects.toThrow();
  });
});

describe("the signed-in person (ticket 302)", () => {
  it("reads back a name, the trips they are on, and nobody else's", async () => {
    const ada = await webPort.loadMe(world.admin);
    expect(ada.id).toBe(world.admin);
    expect(ada.tripCount).toBe(1);

    const ozz = await webPort.loadMe(world.outsider);
    expect(ozz.tripCount).toBe(1);
    expect(ozz.id).toBe(world.outsider);
  });

  it("lets you rename yourself, and the display name wins over the signup name", async () => {
    await webPort.renameMe(world.admin, "Ada L");
    expect((await webPort.loadMe(world.admin)).name).toBe("Ada L");
    // Mo is untouched — a rename is scoped to the caller, never taken on trust.
    expect((await webPort.loadMe(world.member)).name).toBe("Mo");
  });
});
