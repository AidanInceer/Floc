import "server-only";

import { and, asc, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { day, dayEvent, place } from "@/db/schema";
import { orderEvents } from "@floc/core/itinerary/event-order";
import { bounded, LIMITS } from "@/server/limits";
import type { DayEventRow, DayTransport, DayWithEvents, RouteDay } from "@/server/itinerary/itinerary";

export type TripDays = {
  days: DayWithEvents[];
  routeDays: RouteDay[];
  transport: Map<number, DayTransport>;
};

export async function readTripDays(tripId: number): Promise<TripDays> {
  const [dayRows, events] = await Promise.all([
    db
      .select({
        id: day.id,
        date: day.date,
        overnightPlaceId: day.overnightPlaceId,
        placeName: place.name,
        lat: place.lat,
        lng: place.lng,
        countryCode: place.countryCode,
      })
      .from(day)
      .leftJoin(place, eq(place.id, day.overnightPlaceId))
      .where(and(eq(day.tripId, tripId), isNull(day.deletedAt)))
      .orderBy(asc(day.date))
      .limit(LIMITS.days)
      .all(),
    db
      .select({
        id: dayEvent.id,
        dayId: dayEvent.dayId,
        orderIndex: dayEvent.orderIndex,
        type: dayEvent.type,
        title: dayEvent.title,
        transportType: dayEvent.transportType,
        time: dayEvent.time,
        endTime: dayEvent.endTime,
        allDay: dayEvent.allDay,
        note: dayEvent.note,
        placeName: place.name,
      })
      .from(dayEvent)
      .innerJoin(day, eq(day.id, dayEvent.dayId))
      .leftJoin(place, eq(place.id, dayEvent.placeId))
      .where(and(eq(day.tripId, tripId), isNull(day.deletedAt), isNull(dayEvent.deletedAt)))
      .orderBy(asc(dayEvent.orderIndex))
      .limit(LIMITS.days * LIMITS.eventsPerDay)
      .all(),
  ]);

  const kept = bounded(dayRows, "days", `trip ${tripId}`);
  return {
    days: kept.map(({ id, date, overnightPlaceId, placeName }) => ({
      id,
      date,
      overnightPlaceId,
      overnightPlaceName: placeName,
      events: orderEvents(events.filter((e) => e.dayId === id)),
    })),
    routeDays: kept.map(({ id, ...rest }) => ({ dayId: id, ...rest })),
    transport: firstTransportByDay(events),
  };
}

function firstTransportByDay(events: DayEventRow[]): Map<number, DayTransport> {
  const byDay = new Map<number, DayTransport>();
  for (const e of events) {
    if (e.type === "transport" && e.transportType && !byDay.has(e.dayId)) {
      byDay.set(e.dayId, { mode: e.transportType, time: e.time, endTime: e.endTime });
    }
  }
  return byDay;
}
