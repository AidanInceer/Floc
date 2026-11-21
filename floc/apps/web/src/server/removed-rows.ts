import "server-only";

import { and, eq, isNotNull, isNull, or } from "drizzle-orm";

import { db } from "@/db";
import { day, dayEvent, packingLine } from "@/db/schema";

export class AlreadyRemoved extends Error {
  constructor() {
    super("A member already removed that.");
    this.name = "AlreadyRemoved";
  }
}

export async function stillThere<T>(row: Promise<T>): Promise<T | null> {
  try {
    return await row;
  } catch (error) {
    if (error instanceof AlreadyRemoved) return null;
    throw error;
  }
}

export async function isRemovedDay(tripId: number, dayId: number): Promise<boolean> {
  const row = await db
    .select({ id: day.id })
    .from(day)
    .where(and(eq(day.id, dayId), eq(day.tripId, tripId), isNotNull(day.deletedAt)))
    .get();
  return row !== undefined;
}

export async function isRemovedEvent(tripId: number, eventId: number): Promise<boolean> {
  const row = await db
    .select({ id: dayEvent.id })
    .from(dayEvent)
    .innerJoin(day, eq(day.id, dayEvent.dayId))
    .where(
      and(
        eq(dayEvent.id, eventId),
        eq(day.tripId, tripId),
        or(isNotNull(dayEvent.deletedAt), isNotNull(day.deletedAt)),
      ),
    )
    .get();
  return row !== undefined;
}

export async function isRemovedPackingLine(tripId: number, viewerId: string, lineId: number): Promise<boolean> {
  const row = await db
    .select({ id: packingLine.id })
    .from(packingLine)
    .where(
      and(
        eq(packingLine.id, lineId),
        eq(packingLine.tripId, tripId),
        or(isNull(packingLine.ownerId), eq(packingLine.ownerId, viewerId)),
        isNotNull(packingLine.deletedAt),
      ),
    )
    .get();
  return row !== undefined;
}
