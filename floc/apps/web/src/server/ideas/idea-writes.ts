import "server-only";

import { and, count, eq, isNotNull, isNull } from "drizzle-orm";

import { db } from "@/db";
import { dayEvent, idea } from "@/db/schema";
import type { TripAccess } from "@/server/access";
import { touch } from "@/server/audit";
import { refresh } from "@/server/freshness";
import { openIdeas } from "@/server/ideas/open-ideas";
import { eventCount, insertEvent } from "@/server/itinerary/itinerary";
import { assertRoom } from "@/server/limits";
import { ideaEventType, readIdeaCategory } from "@floc/core/trip/idea-categories";
import { capText } from "@floc/core/text/text";

type Access = Pick<TripAccess, "trip" | "day">;

const CLOCK = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function renameIdea(access: Access, ideaId: number, title: string): Promise<void> {
  const name = capText(title, "ideaTitle");
  if (!name) return;
  await db
    .update(idea)
    .set({ title: name, ...touch() })
    .where(and(eq(idea.id, ideaId), eq(idea.tripId, access.trip.id), isNull(idea.deletedAt)));
  refresh({ kind: "ideas", tripId: access.trip.id });
}

export async function restoreIdea(access: Access, ideaId: number): Promise<void> {
  const tripId = access.trip.id;
  const [{ n }] = await db.select({ n: count() }).from(idea).where(and(eq(idea.tripId, tripId), isNull(idea.deletedAt)));
  assertRoom("ideas", n);
  await db
    .update(idea)
    .set({ deletedAt: null, ...touch() })
    .where(and(eq(idea.id, ideaId), eq(idea.tripId, tripId), isNotNull(idea.deletedAt)));
  refresh({ kind: "ideas", tripId });
}

export async function addIdeaToDays(access: Access, ideaId: number, dayId: number, time: string | null): Promise<void> {
  const tripId = access.trip.id;
  const [target, row] = await Promise.all([
    db.select({ id: idea.id, title: idea.title, category: idea.category }).from(idea).where(and(eq(idea.id, ideaId), openIdeas(tripId))).get(),
    access.day(dayId),
  ]);
  if (!target) return;

  const clock = time && CLOCK.test(time) ? time : null;
  const soFar = await eventCount(row.id);
  await db.transaction(async (tx) => {
    const eventId = await insertEvent(
      row.id,
      { type: ideaEventType(readIdeaCategory(target.category)), title: target.title, time: clock, allDay: !clock },
      soFar,
      tx,
    );
    await tx.update(idea).set({ dayEventId: eventId, ...touch() }).where(eq(idea.id, target.id));
  });
  refresh({ kind: "ideas", tripId }, { kind: "itinerary", tripId });
}

export async function takeIdeaOffDays(access: Access, ideaId: number): Promise<void> {
  const tripId = access.trip.id;
  const row = await db
    .select({ eventId: idea.dayEventId })
    .from(idea)
    .where(and(eq(idea.id, ideaId), eq(idea.tripId, tripId), isNull(idea.deletedAt)))
    .get();
  if (!row?.eventId) return;
  const eventId = row.eventId;

  await db.transaction(async (tx) => {
    await tx.update(dayEvent).set({ deletedAt: new Date(), ...touch() }).where(and(eq(dayEvent.id, eventId), isNull(dayEvent.deletedAt)));
    await tx.update(idea).set({ dayEventId: null, ...touch() }).where(eq(idea.id, ideaId));
  });
  refresh({ kind: "ideas", tripId }, { kind: "itinerary", tripId });
}
