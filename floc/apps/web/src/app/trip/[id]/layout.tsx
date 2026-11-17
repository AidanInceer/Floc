import type { Metadata } from "next";
import { TripTabs } from "@/components/chrome/trip-tabs";
import { TripMenu } from "@/components/trip/trip-menu";
import { TripLive } from "@/components/trip/trip-live";
import { requireTripAccess } from "@/server/access";
import { leaveCostFor } from "@floc/core/trip/trip-state";
import { readTripColor } from "@floc/core/trip/trip-color";
import { readTripMark } from "@floc/core/trip/mark/trip-mark";
import { TRIP_TAB_CLUSTERS } from "@/lib/tabs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { trip } = await requireTripAccess(id, `/trip/${id}/overview`);
  const name = trip.name;
  return { title: { default: name, template: `%s · ${name} · Floc` } };
}

export default async function TripLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const access = await requireTripAccess(id, `/trip/${id}/overview`);
  const { trip, members, isAdmin, viewer } = access;

  const { warning: leaveWarning } = leaveCostFor({
    trip,
    members,
    viewerId: viewer.id,
    viewerIsAdmin: isAdmin,
  });

  return (
    <div>
      <div className="bg-paper">
        <div className="mx-auto flex w-full max-w-[84rem] items-center px-4 py-2 sm:px-6">
          <TripTabs tripId={trip.id} clusters={TRIP_TAB_CLUSTERS}>
            <TripMenu
              tripId={trip.id}
              tripName={trip.name}
              isAdmin={isAdmin}
              archived={Boolean(trip.archivedAt)}
              leaveWarning={leaveWarning}
              color={readTripColor(trip.colorKey)}
              mark={readTripMark(trip.mark)}
            />
          </TripTabs>
        </div>
      </div>
      <TripLive tripId={trip.id} />
      {children}
    </div>
  );
}
