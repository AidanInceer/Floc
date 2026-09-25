/**
 * What a notes page can link to (#408): the trip's days, events, places,
 * expenses, packing items and files, each with its current name and a line
 * that tells two alike apart. The `/` menu lists these; a chip reads its name
 * from here, so a rename shows everywhere and a deleted thing reads "Removed".
 */
import "server-only";
import { and, asc, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { day, dayEvent, document, expense, packingLine, place, user } from "@/db/schema";
import { formatDate } from "@floc/core/dates/dates";
import { EVENT_CATEGORIES } from "@floc/core/itinerary/event-categories";
import { formatMoney } from "@floc/core/money/money";
import type { TripLinkItem } from "@floc/core/notes/pages/trip-links";

const firstName = (name: string | null) => name?.split(" ")[0] ?? "";

async function days(tripId: number): Promise<TripLinkItem[]> {
  const rows = await db.select({ id: day.id, date: day.date, place: place.name }).from(day)
    .leftJoin(place, eq(place.id, day.overnightPlaceId))
    .where(and(eq(day.tripId, tripId), isNull(day.deletedAt))).orderBy(asc(day.date)).all();
  return rows.map((row, i) => ({ kind: "day", id: row.id, label: formatDate(row.date), detail: [`Day ${i + 1}`, row.place].filter(Boolean).join(" · ") }));
}

async function eventsAndPlaces(tripId: number): Promise<TripLinkItem[]> {
  const rows = await db
    .select({ id: dayEvent.id, title: dayEvent.title, type: dayEvent.type, time: dayEvent.time, date: day.date, placeId: place.id, place: place.name })
    .from(dayEvent)
    .innerJoin(day, eq(day.id, dayEvent.dayId))
    .leftJoin(place, eq(place.id, dayEvent.placeId))
    .where(and(eq(day.tripId, tripId), isNull(day.deletedAt), isNull(dayEvent.deletedAt)))
    .orderBy(asc(day.date), asc(dayEvent.orderIndex)).all();
  const stays = await db.select({ id: place.id, name: place.name, date: day.date }).from(day)
    .innerJoin(place, eq(place.id, day.overnightPlaceId))
    .where(and(eq(day.tripId, tripId), isNull(day.deletedAt))).orderBy(asc(day.date)).all();
  const events: TripLinkItem[] = rows.map((row) => ({
    kind: "event",
    id: row.id,
    label: row.title ?? row.place ?? EVENT_CATEGORIES[row.type].label,
    detail: [formatDate(row.date), row.time].filter(Boolean).join(", "),
  }));
  const places = new Map<number, TripLinkItem>();
  for (const row of [...stays, ...rows.map((r) => ({ id: r.placeId, name: r.place, date: r.date }))]) {
    if (row.id !== null && row.name !== null && !places.has(row.id)) {
      places.set(row.id, { kind: "place", id: row.id, label: row.name, detail: `From ${formatDate(row.date)}` });
    }
  }
  return [...events, ...places.values()];
}

async function money(tripId: number): Promise<TripLinkItem[]> {
  const rows = await db.select({ id: expense.id, label: expense.description, amount: expense.amountMinor, currency: expense.currency, payer: user.name })
    .from(expense).leftJoin(user, eq(user.id, expense.paidBy))
    .where(and(eq(expense.tripId, tripId), isNull(expense.deletedAt))).orderBy(asc(expense.createdAt)).all();
  return rows.map((row) => ({ kind: "expense", id: row.id, label: row.label, detail: `${formatMoney(row.amount, row.currency)} · ${firstName(row.payer)} paid` }));
}

async function packing(tripId: number): Promise<TripLinkItem[]> {
  const rows = await db.select({ id: packingLine.id, label: packingLine.label, owner: user.name })
    .from(packingLine).leftJoin(user, eq(user.id, packingLine.ownerId))
    .where(and(eq(packingLine.tripId, tripId), isNull(packingLine.deletedAt))).orderBy(asc(packingLine.label)).all();
  return rows.map((row) => ({ kind: "packing", id: row.id, label: row.label, detail: row.owner ? firstName(row.owner) : "Everyone" }));
}

async function files(tripId: number): Promise<TripLinkItem[]> {
  const rows = await db.select({ id: document.id, label: document.name, by: user.name })
    .from(document).leftJoin(user, eq(user.id, document.uploadedBy))
    .where(and(eq(document.tripId, tripId), isNull(document.deletedAt))).orderBy(asc(document.name)).all();
  return rows.map((row) => ({ kind: "file", id: row.id, label: row.label, detail: firstName(row.by) }));
}

export async function loadTripLinkItems(tripId: number): Promise<TripLinkItem[]> {
  return (await Promise.all([days(tripId), eventsAndPlaces(tripId), money(tripId), packing(tripId), files(tripId)])).flat();
}
