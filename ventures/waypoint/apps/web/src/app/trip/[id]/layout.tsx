/**
 * The persistent trip header + tab bar (ticket 05). Overview is both the
 * default tab and the trip's landing — there is no separate dashboard route.
 * Identical routes and tab set at every size; only the bar's chrome changes
 * (bottom bar on mobile, under-header bar on desktop).
 */
import { AvatarRow } from "@/components/ui";
import { TripTabs } from "@/components/trip-tabs";
import { requireTripAccess } from "@/lib/access";
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
  const { trip, members } = access;

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
          {/* The trip's name, dates and state badges used to sit here as well
              as on the Overview hero, which said everything twice a hand's
              width apart (ticket 89). They live on the hero now — name first,
              rename still inline on it (ticket 37) — and this row keeps only
              the roster, which is the one thing the hero doesn't repeat. */}
          <div className="flex flex-wrap items-start justify-end gap-3">
            <AvatarRow people={members} />
          </div>

          <TripTabs tripId={trip.id} tabs={tabStates(trip)} />
        </div>
      </div>
      {children}
    </div>
  );
}
