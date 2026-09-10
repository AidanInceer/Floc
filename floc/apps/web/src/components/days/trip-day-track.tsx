/**
 * The day track (ticket 195) — the trip's week across the top of Overview, one
 * card per day, coloured by where the group sleeps that night. It replaces the
 * old planning trail: a trail said how far along the *planning* was, this says
 * what the *trip* looks like, which is what a member came to see.
 *
 * Two silences, both normal rather than broken (rules 9, 11): no days at all
 * (undated trip) draws nothing, and a day with no overnight place draws as a
 * gap, not an error.
 *
 * NO WEATHER HERE (ticket 208). It sat on every card and made the strip the
 * loudest thing on a page that is meant to lead with who is going and where.
 * The forecast is not gone — it is on Dates, where it changes a decision.
 */
import Link from "next/link";

import type { TransportType } from "@/db/schema";
import type { RouteDay } from "@/server/itinerary/itinerary";
import { formatDate } from "@floc/core/dates/dates";
import { TravelModeIcon } from "@/components/map/travel-mode-icon";
import { ButtonLink, PASTEL_SKINS, cx } from "@/components/system/ui";

// Colour here means "the same bed", not a domain — so the rotation is
// `PASTEL_SKINS` by the order places first appear, and the track's own caption
// says what it encodes.
export function TripDayTrack({
  tripId,
  days,
  transportModes,
}: {
  tripId: number;
  days: RouteDay[];
  transportModes: Map<number, TransportType>;
}) {
  // No days at all — an undated trip. The strip stays rather than leaving a
  // void under the columns; it names what's missing and links to the fix (rule
  // 11), where the dates are actually set.
  if (days.length === 0) {
    return (
      <section
        className="mt-4 rounded-lg bg-sheet p-4 ring-1 ring-rule"
        aria-label="The trip, day by day"
      >
        <h2 className="px-2 pb-3 font-display text-lg">The trip</h2>
        <div className="flex flex-col items-center rounded-md bg-sheet-2 p-8 text-center">
          <p className="text-sm text-ink-soft">
            No days yet — set the dates and the week fills in here.
          </p>
          <ButtonLink
            href={`/trip/${tripId}/dates`}
            variant="primary"
            className="mt-4"
          >
            Pick the dates
          </ButtonLink>
        </div>
      </section>
    );
  }

  const skins = new Map<number, string>();
  for (const d of days) {
    if (d.overnightPlaceId === null || skins.has(d.overnightPlaceId)) continue;
    skins.set(d.overnightPlaceId, PASTEL_SKINS[skins.size % PASTEL_SKINS.length]);
  }

  return (
    <section
      className="mt-4 rounded-lg bg-sheet p-4 ring-1 ring-rule"
      aria-label="The trip, day by day"
    >
      {/* No caption explaining that colour means "the same bed", and no
          "open Days" link — the cards are the link, and six cards in two
          colours explain themselves. */}
      <h2 className="px-2 pb-3 font-display text-lg">The trip</h2>

      <ol className="flex gap-2 overflow-x-auto pb-1">
        {days.map((d) => {
          const skin =
            d.overnightPlaceId === null ? null : skins.get(d.overnightPlaceId);
          const mode = transportModes.get(d.dayId);
          return (
            <li key={d.dayId} className="min-w-[7.5rem] flex-1">
              <Link
                href={`/trip/${tripId}/days`}
                className={cx(
                  "lift flex h-full min-h-[7rem] flex-col gap-2 rounded-md p-3",
                  // A gap in the plan is drawn as a gap: white, outlined, no name.
                  skin ??
                    "bg-sheet-2 text-ink-soft shadow-[inset_0_0_0_1.5px_var(--rule)]",
                )}
              >
                <span className="nums text-[11px] uppercase tracking-[0.08em] opacity-60">
                  {formatDate(d.date)}
                </span>
                {d.placeName ? (
                  <span className="font-display text-lg leading-tight font-semibold tracking-tight text-ink">
                    {d.placeName}
                  </span>
                ) : null}
                {mode ? (
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-sheet/70 px-2 py-0.5 text-[11px] font-semibold">
                    <TravelModeIcon mode={mode} />
                    {mode}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
