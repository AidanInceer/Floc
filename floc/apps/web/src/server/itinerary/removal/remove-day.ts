import "server-only";

import { and, eq, inArray, isNull, or } from "drizzle-orm";

import { db } from "@/db";
import { day, dayEvent, document, expense, trip } from "@/db/schema";
import { planDayRemoval, type DayBooking, type DayRemovalPlan } from "@floc/core/itinerary/day-removal";
import { tripHref } from "@floc/core/notifications/notification-href";
import { touch } from "@/server/audit";
import { refresh } from "@/server/freshness";
import { listDays } from "@/server/itinerary/itinerary";
import { LIMITS } from "@/server/limits";
import { recordActivity, type Tx } from "@/server/notifications/activity";

type TripWindow = { id: number; startDate: string | null; endDate: string | null };

const BOOKING_FILES = ["travel", "hotel", "tickets"] as const;

export async function listDayBookings(tripId: number, viewerId: string): Promise<DayBooking[]> {
  const [events, files] = await Promise.all([
    db
      .select({ dayId: dayEvent.dayId, label: dayEvent.title })
      .from(dayEvent)
      .innerJoin(day, eq(day.id, dayEvent.dayId))
      .where(
        and(
          eq(day.tripId, tripId),
          isNull(day.deletedAt),
          isNull(dayEvent.deletedAt),
          eq(dayEvent.type, "transport"),
        ),
      )
      .limit(LIMITS.days * LIMITS.eventsPerDay)
      .all(),
    db
      .select({ dayId: document.dayId, label: document.name })
      .from(document)
      .innerJoin(day, eq(day.id, document.dayId))
      .where(
        and(
          eq(document.tripId, tripId),
          isNull(document.deletedAt),
          isNull(day.deletedAt),
          inArray(document.category, BOOKING_FILES),
          or(isNull(document.ownerId), eq(document.ownerId, viewerId)),
        ),
      )
      .limit(LIMITS.documents)
      .all(),
  ]);
  return [
    ...events.map((e) => ({ dayId: e.dayId, label: e.label ?? "Transport" })),
    ...files.flatMap((f) => (f.dayId ? [{ dayId: f.dayId, label: f.label }] : [])),
  ];
}

export async function dayRemovalPlanFor(
  target: TripWindow,
  dayId: number,
  viewerId: string,
): Promise<DayRemovalPlan | null> {
  const [days, bookings] = await Promise.all([listDays(target.id), listDayBookings(target.id, viewerId)]);
  return planDayRemoval(days, dayId, target, bookings);
}

async function clearDay(tx: Tx, dayId: number, now: Date): Promise<void> {
  const gone = await tx
    .update(dayEvent)
    .set({ deletedAt: now, lastModifiedAt: now })
    .where(and(eq(dayEvent.dayId, dayId), isNull(dayEvent.deletedAt)))
    .returning({ id: dayEvent.id })
    .all();
  if (gone.length) {
    await tx.update(document).set({ dayEventId: null }).where(inArray(document.dayEventId, gone.map((e) => e.id)));
  }
  await tx.update(expense).set({ dayId: null }).where(eq(expense.dayId, dayId));
  await tx.update(document).set({ dayId: null }).where(eq(document.dayId, dayId));
}

async function movePlan(tx: Tx, from: number, to: number, overnightPlaceId: number | null): Promise<void> {
  await tx.update(dayEvent).set({ dayId: to, ...touch() }).where(and(eq(dayEvent.dayId, from), isNull(dayEvent.deletedAt)));
  await tx.update(expense).set({ dayId: to }).where(eq(expense.dayId, from));
  await tx.update(document).set({ dayId: to }).where(eq(document.dayId, from));
  await tx.update(day).set({ overnightPlaceId, ...touch() }).where(eq(day.id, to));
}

export async function removeTripDay(target: TripWindow, dayId: number, by: string): Promise<void> {
  const days = await listDays(target.id);
  const plan = planDayRemoval(days, dayId, target, []);
  if (!plan) return;
  const index = days.findIndex((d) => d.id === dayId);
  const moving = plan.position === "first" ? [] : days.slice(index);
  const lastRow = plan.position === "first" || plan.position === "only" ? days[0] : days[days.length - 1];
  const now = new Date();

  await db.transaction(async (tx) => {
    await clearDay(tx, dayId, now);
    for (let i = 1; i < moving.length; i++) {
      await movePlan(tx, moving[i].id, moving[i - 1].id, moving[i].overnightPlaceId);
    }
    await tx.update(day).set({ deletedAt: now, lastModifiedAt: now }).where(eq(day.id, lastRow.id));
    if (plan.position === "only" || (target.startDate && target.endDate)) {
      await tx
        .update(trip)
        .set({ startDate: plan.start, endDate: plan.end, ...touch() })
        .where(and(eq(trip.id, target.id), isNull(trip.deletedAt)));
    }
    await recordActivity(tx, {
      kind: "days_removed",
      tripId: target.id,
      actorId: by,
      subjectId: null,
      href: tripHref(target.id, "days"),
      affected: [],
    });
  });

  refresh({ kind: "tripWindow", tripId: target.id });
}
