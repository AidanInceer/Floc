import { countdownLabel, formatDateRange, fromIsoDate } from "@floc/core/dates/dates";
import { tripListStage } from "@floc/core/trip/list-stage";
import { titleCase } from "@floc/core/text/title-case";
import Link from "next/link";

import { AvatarRow, PASTEL_BY_KEY, PASTEL_SKINS } from "@/components/system/ui";
import { TripCardActions, type TripCardData } from "@/components/trip/trip-card";
import { TripMarkIcon } from "@/components/trip/trip-mark";

export function TripFeature({ trip }: { trip: TripCardData }) {
  if (!trip.startDate) return null;

  const date = fromIsoDate(trip.startDate);
  const month = date.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" });
  const dateSkin = trip.color
    ? PASTEL_BY_KEY[trip.color]
    : PASTEL_SKINS[trip.id % PASTEL_SKINS.length];
  const stage = tripListStage(trip);
  const when = countdownLabel(trip.startDate);
  const status = stage === "Happening now" ? stage : when ? `Next up · ${when}` : "Next up";
  const href = `/trip/${trip.id}/overview`;

  return (
    <article className="lift relative mt-6 grid grid-cols-[4.5rem_minmax(0,1fr)] gap-4 rounded-lg border border-rule-strong bg-sheet p-4 hover:shadow-[var(--shadow-lifted)] sm:grid-cols-[5.25rem_minmax(0,1fr)] sm:gap-5 sm:p-5">
      <div
        aria-hidden="true"
        className={`flex size-[4.5rem] flex-col items-center justify-center rounded-md border border-rule-strong sm:size-[5.25rem] ${dateSkin}`}
      >
        <span className="nums text-[28px] leading-none sm:text-[32px]">{date.getUTCDate()}</span>
        <span className="typed !text-current">{month}</span>
      </div>

      <div className="min-w-0">
        <p className="typed flex items-center gap-1.5 pr-16">
          {trip.mark ? <TripMarkIcon mark={trip.mark} size={14} /> : null}
          {status}
        </p>
        <Link href={href} className="mt-1 inline-block text-ink">
          <h2 className="text-2xl leading-tight sm:text-3xl">{titleCase(trip.name)}</h2>
        </Link>
        <p className="mt-1 flex flex-wrap gap-x-2 text-sm text-ink-soft">
          <span className="nums text-xs">{formatDateRange(trip.startDate, trip.endDate)}</span>
          {trip.where ? <span>· {trip.where}</span> : null}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <AvatarRow people={trip.members} size={24} />
          <Link href={href} className="text-sm font-semibold text-ink">
            Open trip <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="inline-block align-[-2px]"><path d="m5.6 4.2 2.8 2.8-2.8 2.8" /></svg>
          </Link>
        </div>
      </div>

      <div className="absolute right-3 top-3">
        <TripCardActions trip={trip} />
      </div>
    </article>
  );
}
