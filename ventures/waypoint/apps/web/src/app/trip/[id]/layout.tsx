/**
 * The persistent trip header + tab bar (ticket 05). Overview is both the
 * default tab and the trip's landing — there is no separate dashboard route.
 * Identical routes and tab set at every size; only the bar's chrome changes
 * (bottom bar on mobile, under-header bar on desktop).
 */
import Link from "next/link";

import { AvatarRow, Badge } from "@/components/ui";
import { TripTabs } from "@/components/trip-tabs";
import { requireTripAccess } from "@/lib/access";
import { formatDateRange, hasEnded, countdownLabel } from "@/lib/dates";
import { tabStates } from "@/lib/tabs";

export default async function TripLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const access = await requireTripAccess(id, `/trip/${id}/overview`);
  const { trip, members, isAdmin } = access;
  const ended = hasEnded(trip.endDate);
  const countdown = ended ? null : countdownLabel(trip.startDate);

  return (
    <div>
      {/* bg-paper, not bg-sheet — the folder tabs below need to sit on the
          page background so the active one reads as "the sheet, poking up".
          Deliberately no bottom border: the tabs and the sheet's own top edge
          supply the line, and a third one across the full width read as a
          toolbar rule rather than a notebook. The container's width and padding
          must stay in step with `Page wide`, or the tabs stop lining up with
          the sheet they're attached to. */}
      <div className="bg-paper">
        <div className="mx-auto w-full max-w-6xl px-4 pt-5 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-xl font-semibold tracking-tight">
                  {trip.name}
                </h1>
                {trip.archivedAt ? <Badge tone="neutral">Archived</Badge> : null}
                {ended ? <Badge tone="action">Ended</Badge> : null}
                {countdown ? <Badge tone="marine">{countdown}</Badge> : null}
                {isAdmin ? <Badge tone="marine">Admin</Badge> : null}
              </div>
              {/* Undated is a normal state, not an error — but the header is
                  where you notice it, so it links to the tab that fixes it. */}
              {trip.startDate || trip.endDate ? (
                <p className="mt-1 text-sm text-ink-soft">
                  {formatDateRange(trip.startDate, trip.endDate)}
                </p>
              ) : (
                <Link
                  href={`/trip/${trip.id}/dates`}
                  className="mt-1 block text-sm text-ink-faint underline decoration-dotted underline-offset-2 hover:text-pen"
                >
                  Dates not set — pick them
                </Link>
              )}
            </div>
            <AvatarRow people={members} />
          </div>

          <TripTabs tripId={trip.id} tabs={tabStates(trip)} />
        </div>
      </div>
      {children}
    </div>
  );
}
