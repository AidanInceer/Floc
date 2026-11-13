/**
 * A trip on My trips as one bar: the date, the name and who is going on the left, the route on its right as the
 * Overview draws it (smaller, no names). Every bar is the same size; the soonest one's status says Next up. Opens from
 * anywhere on it (trip-open.ts).
 */
import { formatDateRange, fromIsoDate } from "@floc/core/dates/dates";
import { tripPastel } from "@floc/core/trip/trip-color";

import { AvatarRow, PASTEL_BY_KEY, cx } from "@/components/system/ui";
import { TripMarkIcon } from "@/components/system/icons/trip-mark";
import { NavGlyph } from "@/components/system/icons/nav";
import { TripCardActions, type TripCardData } from "@/components/trip/trip-card";
import { tripBarStatus } from "@/lib/trips/trip-bar-status";
import { BarMap } from "./bar-map";
import { TripOpenLink } from "./trip-open-link";

// Why: on a narrow card the line breaks after the dot ("Next up ·" / "in 38 days"), never leaving one word alone.
function StatusLine({ trip, next }: { trip: TripCardData; next: boolean }) {
  const [lead, rest] = tripBarStatus(trip, next).split(" · ");
  return (
    <p className="typed flex flex-wrap items-center gap-x-1.5 pr-24">
      {trip.mark ? <TripMarkIcon mark={trip.mark} size={14} /> : null}
      <span className="whitespace-nowrap">{rest ? `${lead} ·` : lead}</span>
      {rest ? <span className="whitespace-nowrap">{rest}</span> : null}
    </p>
  );
}

function DateTile({ trip, tone }: { trip: TripCardData; tone: string }) {
  const size = "size-14 sm:size-[4.5rem]";
  if (!trip.startDate) {
    return (
      // The words are beside it ("Dates not set"), so the tile keeps only the calendar.
      <div aria-hidden="true" className={cx(size, "flex items-center justify-center rounded-sm border border-rule-strong bg-sheet-2 text-ink-faint")}>
        <NavGlyph name="dates" />
      </div>
    );
  }
  const date = fromIsoDate(trip.startDate);
  return (
    <div aria-hidden="true" className={cx(size, "flex flex-col items-center justify-center rounded-sm border border-rule-strong", tone)}>
      <span className="nums text-xl leading-none">{date.getUTCDate()}</span>
      <span className="typed !text-current">{date.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" })}</span>
    </div>
  );
}

export function TripBar({ trip, next = false }: { trip: TripCardData; next?: boolean }) {
  const colour = tripPastel(trip.color ?? null, trip.id);
  const href = `/trip/${trip.id}/overview`;

  // Why: the card must not clip, or its … menu is cut off at the edge; the map pane clips and rounds itself.
  return (
    <li
      className="lift relative grid rounded-md border border-rule bg-sheet hover:shadow-none! has-[[data-open=true]]:z-20 sm:min-h-[8.5rem] sm:grid-cols-[minmax(0,1fr)_44%]"
    >
      <div className="grid grid-cols-[3.5rem_minmax(0,1fr)] content-start gap-3 p-4 sm:grid-cols-[4.5rem_minmax(0,1fr)] sm:gap-4 sm:p-5">
        <DateTile trip={trip} tone={PASTEL_BY_KEY[colour]} />
        <div className="min-w-0">
          <StatusLine trip={trip} next={next} />
          <TripOpenLink href={href} className="mt-1 inline-block text-ink after:absolute after:inset-0 after:content-['']">
            <h3 className="text-lg leading-tight sm:text-xl">{trip.name}</h3>
          </TripOpenLink>
          <p className="mt-1 flex flex-wrap gap-x-2 text-sm text-ink-soft">
            <span className="nums text-xs">{formatDateRange(trip.startDate, trip.endDate)}</span>
            <span>{trip.where ?? "Place not set"}</span>
          </p>
          <div className="mt-3">
            <AvatarRow people={trip.members} size={22} />
          </div>
        </div>
      </div>

      <div className="pointer-events-none relative order-first h-28 overflow-hidden rounded-t-md border-b border-rule bg-sheet-2 sm:order-none sm:h-auto sm:rounded-tl-none sm:rounded-r-md sm:border-b-0 sm:border-l">
        <BarMap route={trip.route ?? null} tone={colour} />
      </div>

      <div className="absolute right-3 top-[7.75rem] z-10 sm:right-[calc(44%+0.75rem)] sm:top-3">
        <TripCardActions trip={trip} />
      </div>
    </li>
  );
}
