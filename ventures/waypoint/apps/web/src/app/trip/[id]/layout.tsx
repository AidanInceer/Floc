/**
 * The persistent trip bar (ticket 05; flattened 209). Overview is both the
 * default tab and the trip's landing — there is no separate dashboard route.
 *
 * ONE row: the tab pills centred, the roster and the trip menu hard right.
 * The trip's name, dates and badges are not here — they are the Overview
 * hero's, and printing them twice a hand's width apart was ticket 89.
 */
import { AvatarRow } from "@/components/ui";
import { TripTabs } from "@/components/trip-tabs";
import { TripMenu } from "@/components/trip-menu";
import { requireTripAccess } from "@/server/access";
import { leaveCostFor } from "@/lib/trip-state";
import { readTripColor } from "@/lib/trip-color";
import { TABS } from "@/lib/tabs";

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
      {/* ONE ROW, not three (ticket 209). The roster and the trip menu used to
          sit on their own line above the tabs, which stacked a header, a
          controls row and a tab row on top of each other before any content.
          Same three-column grid as the app header: tabs centred, the people
          and the menu hard right, nothing on the left. */}
      <div className="bg-paper">
        {/* Same width as `Page wide` and the header bar — see the note in
            `components/ui.tsx`. */}
        {/* Narrow: one flex row, the track scrolling under a pinned right
            cluster. Wide: three columns, so the pills centre on the PAGE and
            not on the space the avatars leave over. */}
        <div className="mx-auto flex w-full max-w-[84rem] flex-col gap-3 px-4 py-4 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-3 sm:px-6">
          <span className="hidden sm:block" />
          <TripTabs tripId={trip.id} tabs={TABS} />
          <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto sm:justify-self-end">
            <AvatarRow people={members} />
            {/* Archive, delete and leave used to be two separate blocks on the
                Overview tab — one on the hero, one inside a "Trip settings"
                fold. One menu, on every tab. */}
            <TripMenu
              tripId={trip.id}
              tripName={trip.name}
              isAdmin={isAdmin}
              archived={Boolean(trip.archivedAt)}
              leaveWarning={leaveWarning}
              color={readTripColor(trip.colorKey)}
            />
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
