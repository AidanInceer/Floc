// Why: a hub, not a copy of Days — legs per stop replaced the day track, whose five-night stop drew five identical cards.
import { Suspense } from "react";

import { requireTripAccess } from "@/server/access";
import { listDocuments } from "@/server/documents/documents";
import { documentsEnabled } from "@/server/documents/document-store";
import { listDays, listRouteDays, transportModesByDay } from "@/server/itinerary/itinerary";
import { listAvailability } from "@/server/itinerary/availability";
import { listIdeas } from "@/server/ideas/ideas-read";
import { listDeclinedInvitees, listPendingInvitees } from "@/server/trips/invites";
import { listExpenses, listSettlements, listSplits } from "@/server/money/money";
import { tourSeenAt } from "@/server/auth/tour";
import { absoluteUrl } from "@/server/auth/email";
import { canUseFeature } from "@/server/billing/entitlements";
import { friendStatesFor, listFriendsFor } from "@/server/social/friends";
import { shouldStartTour, tourStopsFor } from "@floc/core/trip/tour";
import { formatMoney } from "@floc/core/money/money";
import { spendHeadline } from "@floc/core/money/spend";
import { tripStateFor } from "@floc/core/trip/trip-state";
import { readTripColor, tripPastel } from "@floc/core/trip/trip-color";
import { readTripMark } from "@floc/core/trip/mark/trip-mark";
import { readTags } from "@floc/core/trip/tags";
import { today } from "@floc/core/dates/dates";
import { stayLinks } from "@floc/core/trip/booking-links";
import { tripLegs } from "@floc/core/trip/overview/legs";
import { IdeasPanel } from "@/components/trip/ideas/ideas-panel";
import { OverviewCard } from "@/components/trip/overview/overview-card";
import { OverviewFiles } from "@/components/trip/overview/overview-files";
import { OverviewLegs } from "@/components/trip/overview/overview-legs";
import { OverviewMap } from "@/components/trip/overview/overview-map";
import { PanelPlaceholder, StreamedGroup, TourWhenReady } from "./streamed";

export const metadata = { title: "Overview" };

export default async function OverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = await requireTripAccess(id, `/trip/${id}/overview`);
  const { trip, members, isAdmin, viewer } = access;
  const tripId = trip.id;
  const files = documentsEnabled();

  // Why: the group streams in under Suspense, so its reads start now but never hold the page.
  const groupExtras = Promise.all([
    friendStatesFor(viewer.id, members.map((m) => m.userId)),
    listPendingInvitees(tripId),
    listDeclinedInvitees(tripId),
    listFriendsFor(viewer.id),
  ]).then(([friendStates, pendingInvitees, declinedInvitees, friends]) => ({
    friendStates,
    pendingInvitees,
    declinedInvitees,
    friends,
  }));

  const [availabilityRows, expenseRows, dayRows, splitRows, settlementRows, routeDays, modes, tourSeen, prefill, ideas, docs] =
    await Promise.all([
      listAvailability(tripId),
      listExpenses(tripId),
      listDays(tripId),
      listSplits(tripId),
      listSettlements(tripId),
      listRouteDays(tripId),
      transportModesByDay(tripId),
      tourSeenAt(viewer.id),
      canUseFeature("booking.prefill", tripId),
      listIdeas(tripId, viewer.id),
      // Rule 11: no storage volume, no files — and no query for them.
      files ? listDocuments(tripId, viewer.id) : Promise.resolve([]),
    ]);

  const { datesUnset, unresolved } = tripStateFor({
    trip,
    members,
    viewerId: viewer.id,
    viewerIsAdmin: isAdmin,
    availabilityUserIds: availabilityRows.map((r) => r.userId),
    days: dayRows,
    expenses: expenseRows,
    splits: splitRows,
    settlements: settlementRows,
  });

  const { legs, wholeTrip } = tripLegs({ days: routeDays, modes, files: docs });
  // Stay searches only while the trip is still ahead — nobody books last night's hotel.
  const ahead = trip.startDate !== null && today() < trip.startDate;
  const stays = new Map(
    ahead
      ? legs.map((l) => [
          l.placeId,
          stayLinks({ place: l.placeName, checkIn: l.arrive, checkOut: l.leave, adults: members.length, prefill }),
        ])
      : [],
  );
  const spend = spendHeadline(expenseRows);
  const color = readTripColor(trip.colorKey);
  const tone = tripPastel(color, tripId);

  return (
    <div className="mx-auto flex w-full max-w-[72rem] flex-col gap-7 px-4 pb-20 pt-6 sm:px-6">
      <section className="grid rounded-xl bg-sheet shadow-raised ring-1 ring-rule lg:grid-cols-[minmax(0,1fr)_21rem]">
        <OverviewMap tripId={tripId} legs={legs} days={routeDays} datesUnset={datesUnset} />
        <OverviewCard
          trip={{
            id: tripId,
            name: trip.name,
            startDate: trip.startDate,
            endDate: trip.endDate,
            archived: Boolean(trip.archivedAt),
            color,
            tone,
            mark: readTripMark(trip.mark),
            tags: readTags(trip.tags),
            // Same count as the legs: a day with a bed is a night (stops.ts).
            nights: routeDays.length,
          }}
          going={members}
          spent={spend ? formatMoney(spend.total, spend.currency) : null}
        />
      </section>

      <IdeasPanel tripId={tripId} ideas={ideas} datesUnset={datesUnset} />

      <section className="grid rounded-xl bg-sheet ring-1 ring-rule md:grid-cols-2 md:divide-x md:divide-rule max-md:divide-y max-md:divide-rule">
        <Suspense fallback={<PanelPlaceholder />}>
          <StreamedGroup
            tripId={tripId}
            viewerId={viewer.id}
            members={members}
            isAdmin={isAdmin}
            inviteUrl={absoluteUrl(`/invite/${trip.inviteToken}`)}
            needDates={new Set(unresolved.availability.map((m) => m.userId))}
            extras={groupExtras}
          />
        </Suspense>
        {files ? <OverviewFiles tripId={tripId} files={docs} /> : null}
      </section>

      <OverviewLegs tripId={tripId} legs={legs} wholeTrip={wholeTrip} files={files} stays={stays} tone={tone} />

      {shouldStartTour({ seen: tourSeen !== null }) ? (
        <Suspense fallback={null}>
          <TourWhenReady targets={[groupExtras]} stops={tourStopsFor({ hasFiles: files })} />
        </Suspense>
      ) : null}
    </div>
  );
}
