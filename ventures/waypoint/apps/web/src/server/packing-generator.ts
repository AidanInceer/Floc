/**
 * The packing generator's I/O half (ticket 221): reads the trip window and the
 * forecast, hands both to the pure catalogue, writes what comes back.
 *
 * Nothing new is persisted for weather (rule 10) — this reads the same cached
 * Open-Meteo aggregate the Overview does. Every read can come back empty and
 * the answer is still a list, never a throw (rule 11).
 *
 * It owns its own SQL rather than calling the packing aggregate, because the
 * read and the write have to be one transaction: see `fillPersonalBag`.
 */
import "server-only";

import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { packingLine, tripMembership } from "@/db/schema";
import { nightsBetween, type IsoDate } from "@/lib/dates";
import {
  generatePackingList,
  newSuggestionsOnly,
  summariseClimate,
  type PackClimate,
} from "@/lib/packing-catalogue";
import type { PackTier } from "@/lib/packing";
import { LIMITS } from "@/server/limits";
import { getTripForecast, tripForecastAnchor } from "@/server/weather";

export type PackingPlan = {
  nights: number | null;
  climate: PackClimate | null;
  /**
   * Why the list came out generic, when it did. Three separate answers because
   * they need three separate things from the reader: dates, a place on the
   * itinerary, or simply patience. One "no forecast" for all three sends
   * someone with no places on their trip off to wait for weather that is never
   * coming.
   */
  gap: "no-dates" | "no-place" | "no-forecast" | null;
};

/**
 * What we know about this trip, as much or as little as that is. An undated
 * trip skips the forecast entirely: with no window there is nothing to
 * intersect a forecast against, and a place's next fortnight is not this trip's
 * weather.
 */
export async function packingPlanFor(trip: {
  id: number;
  startDate: string | null;
  endDate: string | null;
}): Promise<PackingPlan> {
  const { startDate, endDate } = trip;
  if (!startDate || !endDate) {
    return { nights: null, climate: null, gap: "no-dates" };
  }

  const nights = nightsBetween(startDate, endDate);

  // Asked before the forecast so "nowhere to get weather for" doesn't read as
  // "the weather isn't in yet". Costs one indexed lookup that `getTripForecast`
  // then repeats, which is cheaper than the wrong nudge.
  if (!(await tripForecastAnchor(trip.id))) {
    return { nights, climate: null, gap: "no-place" };
  }

  const forecast = await getTripForecast(trip.id);
  const climate = forecast
    ? summariseClimate(
        forecast.days.filter(
          (d: { date: IsoDate }) => d.date >= startDate && d.date <= endDate,
        ),
      )
    : null;

  // Beyond the fortnight horizon and provider-unreachable land here together:
  // to a packer they are the same fact, that we can't tell you the weather, so
  // here's a list that doesn't assume any.
  return { nights, climate, gap: climate ? null : "no-forecast" };
}

type FillArgs = {
  tripId: number;
  ownerId: string;
  tier: PackTier;
  plan: PackingPlan;
};

/**
 * Fill the bag with whatever isn't in it yet, and return how many that was.
 *
 * Additive by construction, which is what makes this safe to press twice: a
 * label already on the list is skipped whole, so its count, its tick and any
 * rename survive untouched.
 *
 * One transaction, and that is load-bearing rather than tidiness. Read-then-
 * insert across two statements lets a double-press — or a second tab — read the
 * same empty bag twice and write the whole catalogue twice, which no later
 * press can undo, since the duplicates then read as "already there". SQLite
 * serialises write transactions, so the second one sees the first one's rows.
 */
export async function fillPersonalBag(args: FillArgs): Promise<number> {
  return fill(args, { onlyIfNever: false });
}

/**
 * The first-open fill, when the profile asks for one. The claim is a
 * conditional UPDATE inside the same transaction as the insert, so it is both
 * a race guard and all-or-nothing: an insert that fails rolls the mark back
 * rather than burning the single auto-fill this bag ever gets.
 *
 * Safe to call on every render of the tab — it writes at most once per bag.
 */
export async function autoFillPersonalBag(args: FillArgs): Promise<void> {
  await fill(args, { onlyIfNever: true });
}

/**
 * A lock, not a fault. Two fills of the same bag are the only thing that
 * contends here, and the one holding the write lock is doing the identical
 * work — so the loser reports "added nothing", which is exactly true, rather
 * than throwing a 500 at somebody who pressed a button twice (rule 11).
 */
function isLockContention(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return message.includes("SQLITE_BUSY") || message.includes("database is locked");
}

async function fill(
  args: FillArgs,
  { onlyIfNever }: { onlyIfNever: boolean },
): Promise<number> {
  try {
    return await fillInTransaction(args, { onlyIfNever });
  } catch (err) {
    if (isLockContention(err)) return 0;
    throw err;
  }
}

async function fillInTransaction(
  args: FillArgs,
  { onlyIfNever }: { onlyIfNever: boolean },
): Promise<number> {
  const { tripId, ownerId, tier, plan } = args;

  return db.transaction(async (tx) => {
    const membership = and(
      eq(tripMembership.tripId, tripId),
      eq(tripMembership.userId, ownerId),
      isNull(tripMembership.deletedAt),
    );

    // Null is "never auto-filled". An emptied bag carries a date, which is what
    // stops the generator refilling one somebody deliberately cleared.
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
    );
    if (fresh.length === 0) return 0;

    await tx.insert(packingLine).values(
      fresh.map((item) => ({
        tripId,
        createdBy: ownerId,
        ownerId,
        label: item.label,
        quantity: item.quantity,
      })),
    );

    return fresh.length;
  });
}
