import "server-only";

import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { estimateOverride, tripMembership, userProfile } from "@/db/schema";
import { touch } from "@/server/audit";
import { liveMembership } from "@/server/trips/roster";
import type { Currency } from "@floc/core/money/currency";
import type { EstimateLine } from "@floc/core/money/estimate/lines";
import type { Cabin, Pace, StayStyle, StyleChoice } from "@floc/core/money/estimate/style";
import type { TravelMode } from "@floc/core/money/estimate/travel";

export type Money = { amountMinor: number; currency: Currency };
export type OwnRow = { figure: number | null; budget: number | null; currency: Currency; notNeeded: boolean };
export type EstimateChoices = {
  style: { cabin: Cabin | null; stay: StayStyle | null; pace: Pace | null };
  nights: number | null;
  travel: TravelMode | null;
  budget: Money | null;
  own: Partial<Record<EstimateLine, OwnRow>>;
};
export type TravelProfile = { homeAirport: string | null; cabin: Cabin | null; stay: StayStyle | null; pace: Pace | null };
export type OwnLinePatch = { figure?: number | null; budget?: number | null; notNeeded?: boolean };

export async function readEstimateChoices(tripId: number, userId: string): Promise<EstimateChoices> {
  const [member, rows] = await Promise.all([
    db
      .select({
        cabin: tripMembership.estCabin,
        stay: tripMembership.estStay,
        pace: tripMembership.estPace,
        nights: tripMembership.estNights,
        travel: tripMembership.estTravel,
        budgetMinor: tripMembership.budgetMinor,
        budgetCurrency: tripMembership.budgetCurrency,
      })
      .from(tripMembership)
      .where(liveMembership(tripId, userId))
      .get(),
    db
      .select({ line: estimateOverride.line, figure: estimateOverride.figureMinor, budget: estimateOverride.budgetMinor, currency: estimateOverride.currency, notNeeded: estimateOverride.notNeeded })
      .from(estimateOverride)
      .where(and(eq(estimateOverride.tripId, tripId), eq(estimateOverride.userId, userId), isNull(estimateOverride.deletedAt)))
      .all(),
  ]);
  const own: EstimateChoices["own"] = {};
  for (const r of rows) own[r.line] = { figure: r.figure, budget: r.budget, currency: r.currency, notNeeded: r.notNeeded };
  return {
    style: { cabin: member?.cabin ?? null, stay: member?.stay ?? null, pace: member?.pace ?? null },
    nights: member?.nights ?? null,
    travel: member?.travel ?? null,
    budget: member?.budgetMinor != null && member.budgetCurrency ? { amountMinor: member.budgetMinor, currency: member.budgetCurrency } : null,
    own,
  };
}

export async function setTripStyle(tripId: number, userId: string, choice: StyleChoice | null): Promise<void> {
  const set = choice === null
    ? { estCabin: null, estStay: null, estPace: null }
    : {
      ...(choice.cabin !== undefined && { estCabin: choice.cabin }),
      ...(choice.stay !== undefined && { estStay: choice.stay }),
      ...(choice.pace !== undefined && { estPace: choice.pace }),
    };
  await db.update(tripMembership).set({ ...set, ...touch() }).where(liveMembership(tripId, userId));
}

export async function setTripNights(tripId: number, userId: string, nights: number | null): Promise<void> {
  await db.update(tripMembership).set({ estNights: nights, ...touch() }).where(liveMembership(tripId, userId));
}

export async function setTripTravel(tripId: number, userId: string, travel: TravelMode): Promise<void> {
  const held = await readEstimateChoices(tripId, userId);
  if ((held.travel ?? "flights") === travel) return;
  const row = held.own.flights;
  await db.transaction(async (tx) => {
    await tx
      .update(tripMembership)
      .set({ estTravel: travel === "flights" ? null : travel, ...touch() })
      .where(liveMembership(tripId, userId));
    if (!row) return;
    const gone = row.budget == null && !row.notNeeded;
    await tx
      .update(estimateOverride)
      .set({ figureMinor: null, deletedAt: gone ? new Date() : null, ...touch() })
      .where(and(eq(estimateOverride.tripId, tripId), eq(estimateOverride.userId, userId), eq(estimateOverride.line, "flights")));
  });
}

export async function setBudget(tripId: number, userId: string, budget: Money | null): Promise<void> {
  await db
    .update(tripMembership)
    .set({ budgetMinor: budget?.amountMinor ?? null, budgetCurrency: budget?.currency ?? null, ...touch() })
    .where(liveMembership(tripId, userId));
}

export async function setOwnLine(
  tripId: number,
  userId: string,
  line: EstimateLine,
  patch: OwnLinePatch,
  currency: Currency,
): Promise<void> {
  const held = (await readEstimateChoices(tripId, userId)).own[line];
  const figure = patch.figure !== undefined ? patch.figure : (held?.figure ?? null);
  const budget = patch.budget !== undefined ? patch.budget : (held?.budget ?? null);
  const notNeeded = patch.notNeeded ?? held?.notNeeded ?? false;
  const gone = figure == null && budget == null && !notNeeded;
  await db
    .insert(estimateOverride)
    .values({ tripId, userId, line, figureMinor: figure, budgetMinor: budget, notNeeded, currency })
    .onConflictDoUpdate({
      target: [estimateOverride.tripId, estimateOverride.userId, estimateOverride.line],
      set: { figureMinor: figure, budgetMinor: budget, notNeeded, currency, deletedAt: gone ? new Date() : null, ...touch() },
    });
}

export async function readTravelProfile(userId: string): Promise<TravelProfile> {
  const row = await db
    .select({ homeAirport: userProfile.homeAirport, cabin: userProfile.travelCabin, stay: userProfile.travelStay, pace: userProfile.travelPace })
    .from(userProfile)
    .where(eq(userProfile.userId, userId))
    .get();
  return { homeAirport: row?.homeAirport ?? null, cabin: row?.cabin ?? null, stay: row?.stay ?? null, pace: row?.pace ?? null };
}

export async function setTravelProfile(userId: string, patch: Partial<TravelProfile>): Promise<void> {
  await db
    .update(userProfile)
    .set({
      ...(patch.homeAirport !== undefined && { homeAirport: patch.homeAirport?.toUpperCase() ?? null }),
      ...(patch.cabin !== undefined && { travelCabin: patch.cabin }),
      ...(patch.stay !== undefined && { travelStay: patch.stay }),
      ...(patch.pace !== undefined && { travelPace: patch.pace }),
      ...touch(),
    })
    .where(eq(userProfile.userId, userId));
}
