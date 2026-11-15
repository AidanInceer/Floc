import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { ensureProfile, updateProfileFields } from "@/server/auth/profile";
import { clearRatesMemo } from "@/server/money/fx";
import { writeExpense } from "@/server/money/money";
import { setBudget, setOwnLine, setTravelProfile } from "@/server/money/estimate/estimate-store";
import { readEstimate } from "@/server/money/estimate/estimate-view";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  clearRatesMemo();
  world = await seedScenario();
  await ensureProfile(world.admin);
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ date: "2026-11-01", rates: { GBP: 0.85, USD: 1.04 } }) })));
});
afterEach(() => vi.unstubAllGlobals());

async function placeLisbon() {
  const place = await db.insert(schema.place).values({ name: "Lisbon", countryCode: "PT", lat: 38.72, lng: -9.14 }).returning({ id: schema.place.id }).get();
  await db.update(schema.day).set({ overnightPlaceId: place.id }).run();
  await db.insert(schema.day).values({ tripId: world.ours.id, date: "2026-09-02", overnightPlaceId: place.id }).run();
}
const trip = () => ({ id: world.ours.id, startDate: null, endDate: null });

describe("readEstimate", () => {
  it("asks for a place when the trip sleeps nowhere yet", async () => {
    const view = await readEstimate(trip(), world.admin);
    expect(view.places).toBe(false);
    expect(view.plan.lines.every((l) => l.missing === "place")).toBe(true);
  });

  it("builds a guide in the member's home currency from their style and home airport", async () => {
    await placeLisbon();
    await setTravelProfile(world.admin, { homeAirport: "LHR" });
    const view = await readEstimate(trip(), world.admin);
    expect(view.currency).toBe("GBP");
    expect(view.home).toEqual({ code: "LHR", name: "London Heathrow", inferred: false });
    expect(view.nights).toEqual({ count: 1, from: "days" });
    expect(view.plan.lines.every((l) => l.plan !== null)).toBe(true);
  });

  it("names a home airport that has no flight guide", async () => {
    await setTravelProfile(world.admin, { homeAirport: "INV" });
    const view = await readEstimate(trip(), world.admin);
    expect(view.home).toEqual({ code: "INV", name: "Inverness", inferred: false });
  });

  it("suggests a home airport from the member's own flight files", async () => {
    await placeLisbon();
    await db.insert(schema.document).values({
      tripId: world.ours.id, uploadedBy: world.admin, name: "Flight", storageKey: "k", mimeType: "application/pdf", sizeBytes: 1,
      bookingDetails: JSON.stringify({ kind: "flight", flightNumber: "TP1351", date: "2026-09-01", from: "MAN", to: "LIS", departTime: null, arriveTime: null, reference: null }),
    }).run();
    const view = await readEstimate(trip(), world.admin);
    expect(view.home).toEqual({ code: "MAN", name: "Manchester", inferred: true });
  });

  it("counts only the member's own share of the group's spend, with their budget and figures", async () => {
    await placeLisbon();
    await setTravelProfile(world.admin, { homeAirport: "LHR" });
    await writeExpense({
      tripId: world.ours.id, createdBy: world.member,
      fields: { dayId: null, paidBy: world.member, description: "Flat", amountMinor: 20000, currency: "GBP", splitType: "even", category: "lodging", notes: null },
      splits: [{ userId: world.admin, owedAmountMinor: 9800 }, { userId: world.member, owedAmountMinor: 10200 }],
    });
    await setBudget(world.ours.id, world.admin, { amountMinor: 110000, currency: "GBP" });
    await setOwnLine(world.ours.id, world.admin, "food", { figure: 30000 }, "GBP");

    const view = await readEstimate(trip(), world.admin);
    const stay = view.plan.lines.find((l) => l.line === "stay")!;
    const food = view.plan.lines.find((l) => l.line === "food")!;
    expect(stay.spent).toBe(9800);
    expect(food.plan).toEqual([30000, 30000]);
    expect(view.plan.budget).toBe(110000);
    expect(view.plan.left).toBe(110000 - 9800);
  });

  it("converts the guide and an older budget to a new home currency", async () => {
    await placeLisbon();
    await setBudget(world.ours.id, world.admin, { amountMinor: 100000, currency: "GBP" });
    await updateProfileFields(world.admin, { homeCurrency: "EUR" });
    const view = await readEstimate(trip(), world.admin);
    expect(view.currency).toBe("EUR");
    expect(view.plan.budget).toBe(Math.round(100000 / 0.85));
  });
});
