import "server-only";

import { today as todayIso, type IsoDate } from "@floc/core/dates/dates";
import { bulletPage, serialisePage } from "@floc/core/notes/pages/page-blocks";
import { capRequiredText, capText } from "@floc/core/text/text";
import type { CopyChoice } from "@floc/core/trip/explore/copy/copy-choice";
import { copyPlan, type CopyPlan } from "@floc/core/trip/explore/copy/copy-plan";
import { IDEAS_PAGE_TITLE, ideasPage } from "@floc/core/trip/explore/copy/ideas-page";
import { windowOf } from "@floc/core/trip/explore/copy/start-months";
import { presetDetail } from "@floc/core/trip/explore/detail/preset-details";
import { PRESET_TRIPS } from "@floc/core/trip/explore/preset-trips";

import { db } from "@/db";
import { day, dayEvent, place, tripPage } from "@/db/schema";
import { ensureProfile } from "@/server/auth/profile";
import { refresh } from "@/server/freshness";
import type { Tx } from "@/server/notifications/activity";
import { inviteToTrip } from "@/server/trips/invites";
import { insertTripWithAdmin } from "@/server/trips/trips";

async function insertPlan(tx: Tx, tripId: number, plan: CopyPlan): Promise<void> {
  const places = await tx
    .insert(place)
    .values(plan.places.map((p) => ({ providerId: null, name: capRequiredText(p.name, "placeName"), lat: p.lat, lng: p.lng, countryCode: p.countryCode })))
    .returning({ id: place.id });
  const days = await tx
    .insert(day)
    .values(plan.days.map((d) => ({ tripId, date: d.date, overnightPlaceId: places[d.place].id })))
    .returning({ id: day.id });
  const events = plan.days.flatMap((d, i) =>
    d.events.map((e, orderIndex) => ({
      dayId: days[i].id,
      orderIndex,
      type: e.type,
      title: capRequiredText(e.title, "eventTitle"),
      transportType: e.transportType,
      time: e.time,
      allDay: e.time === null,
      note: capText(e.note, "eventNote"),
    })),
  );
  if (events.length) await tx.insert(dayEvent).values(events);
}

export async function copyListing(viewerId: string, choice: CopyChoice, today: IsoDate = todayIso()): Promise<number | null> {
  const listing = PRESET_TRIPS.find((p) => p.id === choice.presetId);
  if (!listing) return null;
  const detail = presetDetail(listing.id);
  const window = windowOf(listing, choice, today);

  return db.transaction(async (tx) => {
    const tripId = await insertTripWithAdmin(tx, {
      name: choice.name ?? listing.title,
      startDate: window?.startDate ?? null,
      endDate: window?.endDate ?? null,
      createdBy: viewerId,
      firstPage: bulletPage(listing.highlights),
    });
    if (!window) return tripId;
    if (choice.ideas && detail) {
      await tx.insert(tripPage).values({ tripId, title: IDEAS_PAGE_TITLE, position: 1, body: serialisePage(ideasPage(detail.ideas)), updatedBy: viewerId });
    }
    await insertPlan(tx, tripId, copyPlan(listing, detail, window.startDate, { events: choice.events }));
    return tripId;
  });
}

export async function startTripFromListing(viewerId: string, choice: CopyChoice, along: string[]): Promise<number | null> {
  await ensureProfile(viewerId);
  const tripId = await copyListing(viewerId, choice);
  if (tripId === null) return null;
  refresh({ kind: "tripList" });
  if (along.length && (await inviteToTrip({ tripId, fromUserId: viewerId, toUserIds: along }))) refresh({ kind: "invites" });
  return tripId;
}
