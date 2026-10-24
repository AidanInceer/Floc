// Why: a hub, not a copy of Days — legs per stop replaced the day track, whose five-night stop drew five identical cards.
import { Suspense } from "react";

import { requireTripAccess } from "@/server/access";
import { listDocuments } from "@/server/documents/documents";
import { documentsEnabled } from "@/server/documents/document-store";
import { listDaysWithEvents, listRouteDays, transportByDay } from "@/server/itinerary/itinerary";
import { groupRoutes } from "@/server/route/group-routes";
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
import { ideasTucked } from "@floc/core/trip/ideas";
import { overviewRoute } from "@floc/core/trip/overview/route";
import { todayPlan } from "@floc/core/trip/route/today-plan";
import { underway } from "@floc/core/trip/route/route-track";
import { IdeasPanel } from "@/components/trip/ideas/ideas-panel";
import { IdeasRow } from "@/components/trip/ideas/ideas-row";
import { OverviewCard } from "@/components/trip/overview/overview-card";
import { OverviewFiles } from "@/components/trip/overview/overview-files";
import { OverviewStops } from "@/components/trip/overview/stops/overview-stops";
import { OverviewMap } from "@/components/trip/overview/overview-map";
import { RefreshWhileLive } from "@/components/trip/overview/route/refresh-while-live";
import { RouteLegend } from "@/components/trip/overview/route/route-legend";
import { TodayBlock } from "@/components/trip/overview/today/today-block";
import { deleteMyRoute } from "./actions";
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

  const now = today();
  const [availabilityRows, expenseRows, dayRows, splitRows, settlementRows, routeDays, transport, tourSeen, prefill, ideas, docs, tracks] =
    await Promise.all([
      listAvailability(tripId),
      listExpenses(tripId),
      listDaysWithEvents(tripId),
      listSplits(tripId),
      listSettlements(tripId),
      listRouteDays(tripId),
      transportByDay(tripId),
      tourSeenAt(viewer.id),
      canUseFeature("booking.prefill", tripId),
      listIdeas(tripId, viewer.id),
      // Rule 11: no storage volume, no files — and no query for them.
      files ? listDocuments(tripId, viewer.id) : Promise.resolve([]),
      groupRoutes(access, now),
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

  const modes = new Map([...transport].map(([dayId, t]) => [dayId, t.mode]));
  const { legs, wholeTrip } = tripLegs({ days: routeDays, modes, files: docs });
  const route = overviewRoute({ legs, days: routeDays, hops: transport });
  // Stay searches only while the trip is still ahead — nobody books last night's hotel.
  const ahead = trip.startDate !== null && now < trip.startDate;
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
  const plan = todayPlan({ trip, days: dayRows, files: docs, today: now });
  const tucked = ideasTucked({ days: routeDays, today: plan !== null });

  return (
    <div className="mx-auto flex w-full max-w-[72rem] flex-col gap-7 px-4 pb-20 pt-6 sm:px-6">
      {plan ? <TodayBlock tripId={tripId} plan={plan} /> : null}
      {underway(trip, now) ? <RefreshWhileLive /> : null}
      {/* Why: the card floats over the globe on a wide screen, as on Explore; the map keeps its route clear of it (clear-area.ts). */}
      <section className="rounded-xl bg-sheet shadow-raised ring-1 ring-rule">
        <div data-overview-band className="relative grid rounded-t-xl bg-sheet-2 lg:min-h-[34rem] lg:grid-cols-[minmax(0,1fr)_23.5rem]">
          <OverviewMap
            tripId={tripId}
            route={route}
            tone={tone}
            datesUnset={datesUnset}
            tracks={tracks}
            legend={<RouteLegend routes={tracks} viewerId={viewer.id} now={Date.now()} deleteMine={deleteMyRoute.bind(null, tripId)} />}
          />
          <div data-overview-card className="relative z-10 bg-sheet lg:col-start-2 lg:m-5 lg:self-start lg:rounded-xl lg:shadow-lift lg:ring-1 lg:ring-rule">
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
              spent={spend ? formatMoney(spend.total, spend.currency) : null}
            ideas={tucked ? <IdeasRow tripId={tripId} ideas={ideas} /> : null}
            />
          </div>
        </div>
        <div className="flex items-center gap-x-7 gap-y-3 rounded-b-xl border-t border-rule px-3 py-2.5 max-md:flex-col max-md:items-stretch">
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
        </div>
      </section>

      {tucked ? null : <IdeasPanel tripId={tripId} ideas={ideas} datesUnset={datesUnset} />}

      <OverviewStops tripId={tripId} legs={legs} wholeTrip={wholeTrip} files={files} stays={stays} events={new Map(dayRows.map((d) => [d.id, d.events]))} />

      {shouldStartTour({ seen: tourSeen !== null }) ? (
        <Suspense fallback={null}>
          <TourWhenReady targets={[groupExtras]} stops={tourStopsFor({ hasFiles: files })} />
        </Suspense>
      ) : null}
    </div>
  );
}
