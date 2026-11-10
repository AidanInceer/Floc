/**
 * The persistent trip bar (ticket 05; flattened 209). Overview is both the
 * default tab and the trip's landing — there is no separate dashboard route.
 *
 * ONE row: the tabs centred, the trip's settings cog last in the row.
 * The trip's name, dates and badges are not here — they are the Overview
 * hero's, and printing them twice a hand's width apart was ticket 89.
 */
import type { Metadata } from "next";
import { TripTabs } from "@/components/chrome/trip-tabs";
import { TripMenu } from "@/components/trip/trip-menu";
import { requireTripAccess } from "@/server/access";
import { leaveCostFor } from "@floc/core/trip/trip-state";
import { readTripColor } from "@floc/core/trip/trip-color";
import { readTripMark } from "@floc/core/trip/mark/trip-mark";
import { TABS } from "@/lib/tabs";

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

  // Only the leave sentence, not the whole trip state — see `leaveCostFor`.
  const { warning: leaveWarning } = leaveCostFor({
    trip,
    members,
    viewerId: viewer.id,
    viewerIsAdmin: isAdmin,
  });

  return (
    <div>
      {/* ONE ROW, not three (ticket 209). */}
      <div className="bg-paper">
        {/* Same width as `Page wide` and the header bar — see the note in
            `components/ui.tsx`. The trip's settings cog ends the tab row. */}
        <div className="mx-auto flex w-full max-w-[84rem] items-center px-4 py-2 sm:px-6">
          <TripTabs tripId={trip.id} tabs={TABS}>
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
      {children}
    </div>
  );
}
