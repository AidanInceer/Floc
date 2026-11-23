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
import { groupedActivityWrites, liveMemberIds } from "@/server/notifications/activity";

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

function clearDayWrites(dayId: number, now: Date) {
  const liveOnDay = and(eq(dayEvent.dayId, dayId), isNull(dayEvent.deletedAt));
  return [
    db
      .update(document)
      .set({ dayEventId: null })
      .where(inArray(document.dayEventId, db.select({ id: dayEvent.id }).from(dayEvent).where(liveOnDay))),
    db.update(dayEvent).set({ deletedAt: now, lastModifiedAt: now }).where(liveOnDay),
    db.update(expense).set({ dayId: null }).where(eq(expense.dayId, dayId)),
    db.update(document).set({ dayId: null }).where(eq(document.dayId, dayId)),
  ] as const;
}

function movePlanWrites(from: number, to: number, overnightPlaceId: number | null) {
  return [
    db.update(dayEvent).set({ dayId: to, ...touch() }).where(and(eq(dayEvent.dayId, from), isNull(dayEvent.deletedAt))),
    db.update(expense).set({ dayId: to }).where(eq(expense.dayId, from)),
    db.update(document).set({ dayId: to }).where(eq(document.dayId, from)),
    db.update(day).set({ overnightPlaceId, ...touch() }).where(eq(day.id, to)),
  ];
}

export async function removeTripDay(target: TripWindow, dayId: number, by: string): Promise<void> {
  const [days, members] = await Promise.all([listDays(target.id), liveMemberIds(db, target.id)]);
  const plan = planDayRemoval(days, dayId, target, []);
  if (!plan) return;
  const index = days.findIndex((d) => d.id === dayId);
  const moving = plan.position === "first" ? [] : days.slice(index);
  const lastRow = plan.position === "first" || plan.position === "only" ? days[0] : days[days.length - 1];
  const now = new Date();

  const movesWindow = plan.position === "only" || Boolean(target.startDate && target.endDate);

  await db.batch([
    ...clearDayWrites(dayId, now),
    ...moving.slice(1).flatMap((row, i) => movePlanWrites(row.id, moving[i].id, row.overnightPlaceId)),
    db.update(day).set({ deletedAt: now, lastModifiedAt: now }).where(eq(day.id, lastRow.id)),
    ...(movesWindow
      ? [
          db
            .update(trip)
            .set({ startDate: plan.start, endDate: plan.end, ...touch() })
            .where(and(eq(trip.id, target.id), isNull(trip.deletedAt))),
        ]
      : []),
    ...groupedActivityWrites(
      {
        kind: "days_removed",
        tripId: target.id,
        actorId: by,
        subjectId: null,
        href: tripHref(target.id, "days"),
        affected: [],
      },
      members,
    ),
  ]);

  refresh({ kind: "tripWindow", tripId: target.id });
}
