import "server-only";

import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { packingLine, tripMembership } from "@/db/schema";
import { nightsBetween, type IsoDate } from "@floc/core/dates/dates";
import {
  generatePackingList,
  newSuggestionsOnly,
  summariseClimate,
  type PackClimate,
} from "@floc/core/packing/packing-catalogue";
import type { PackTier } from "@floc/core/packing/packing";
import { LIMITS } from "@/server/limits";
import { listOvernightPlaces } from "@/server/itinerary/itinerary";
import { getTripForecast, tripForecastAnchor } from "@/server/itinerary/weather";
import { shortPlace } from "@floc/core/itinerary/names/place-name";

export type PackingPlan = {
  nights: number | null;
  climate: PackClimate | null;
  gap: "no-dates" | "no-place" | "no-forecast" | null;
  places: string[];
  hottest: number | null;
  firstRain: IsoDate | null;
};

const NO_WEATHER = { hottest: null, firstRain: null };

export async function packingPlanFor(trip: {
  id: number;
  startDate: string | null;
  endDate: string | null;
}): Promise<PackingPlan> {
  const { startDate, endDate } = trip;
  if (!startDate || !endDate) {
    return { nights: null, climate: null, gap: "no-dates", places: [], ...NO_WEATHER };
  }

  const nights = nightsBetween(startDate, endDate);

  const [anchor, forecast, overnight] = await Promise.all([
    tripForecastAnchor(trip.id),
    getTripForecast(trip.id),
    listOvernightPlaces(trip.id),
  ]);
  if (!anchor) {
    return { nights, climate: null, gap: "no-place", places: [], ...NO_WEATHER };
  }

  const places = [...new Set(overnight.map((p) => shortPlace(p.name)))];
  const window = (forecast?.days ?? []).filter((d) => d.date >= startDate && d.date <= endDate);
  const climate = forecast ? summariseClimate(window) : null;
  const weather = climate
    ? { hottest: Math.round(Math.max(...window.map((d) => d.hi))), firstRain: window.find((d) => d.condition === "rain")?.date ?? null }
    : NO_WEATHER;

  return { nights, climate, gap: climate ? null : "no-forecast", places, ...weather };
}

type FillArgs = {
  tripId: number;
  ownerId: string;
  tier: PackTier;
  plan: PackingPlan;
};

export async function fillPersonalBag(args: FillArgs): Promise<number> {
  return fill(args, { onlyIfNever: false });
}

export async function autoFillPersonalBag(args: FillArgs): Promise<number> {
  return fill(args, { onlyIfNever: true });
}

export async function takePackingIdea(args: FillArgs & { label: string }): Promise<number> {
  const label = args.label.trim().toLowerCase();
  return fill(args, { onlyIfNever: false, only: label });
}

function isLockContention(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return message.includes("SQLITE_BUSY") || message.includes("database is locked");
}

type FillMode = { onlyIfNever: boolean; only?: string };

async function fill(args: FillArgs, mode: FillMode): Promise<number> {
  try {
    return await fillInTransaction(args, mode);
  } catch (err) {
    if (isLockContention(err)) return 0;
    throw err;
  }
}

async function fillInTransaction(
  args: FillArgs,
  { onlyIfNever, only }: FillMode,
): Promise<number> {
  const { tripId, ownerId, tier, plan } = args;

  return db.transaction(async (tx) => {
    const membership = and(
      eq(tripMembership.tripId, tripId),
      eq(tripMembership.userId, ownerId),
      isNull(tripMembership.deletedAt),
    );

    const marked = await tx
      .update(tripMembership)
      .set({ packGeneratedAt: new Date(), lastModifiedAt: new Date() })
      .where(
        onlyIfNever
          ? and(membership, isNull(tripMembership.packGeneratedAt))
          : membership,
      )
      .returning({ tripId: tripMembership.tripId })
      .all();

    if (marked.length === 0) return 0;

    const existing = await tx
      .select({ label: packingLine.label })
      .from(packingLine)
      .where(
        and(
          eq(packingLine.tripId, tripId),
          eq(packingLine.ownerId, ownerId),
          isNull(packingLine.deletedAt),
        ),
      )
      .limit(LIMITS.packingLines)
      .all();

    const fresh = newSuggestionsOnly(
      generatePackingList({ nights: plan.nights, climate: plan.climate, tier }),
      existing.map((l) => l.label),
    ).filter((item) => only === undefined || item.label === only);
    if (fresh.length === 0) return 0;

    await tx.insert(packingLine).values(
      fresh.map((item) => ({
        tripId,
        createdBy: ownerId,
        ownerId,
        label: item.label,
        category: item.category,
        quantity: item.quantity,
        origin: "suggested" as const,
      })),
    );

    return fresh.length;
  });
}
