import { countdownLabel, formatDateRange } from "@floc/core/dates/dates";
import { tripListStage } from "@floc/core/trip/list-stage";
import { titleCase } from "@floc/core/text/title-case";
import Link from "next/link";

import { AvatarRow, PASTEL_BY_KEY, PASTEL_SKINS } from "@/components/system/ui";
import { TripCardActions, type TripCardData } from "@/components/trip/trip-card";
import { TripMarkIcon } from "@/components/trip/trip-mark";

export function TripShelfCard({ trip, past = false }: { trip: TripCardData; past?: boolean }) {
  const swatch = trip.color
    ? PASTEL_BY_KEY[trip.color]
    : PASTEL_SKINS[trip.id % PASTEL_SKINS.length];
  const stage = tripListStage({ ...trip, archived: past });
  const status = stage === "Planning" ? countdownLabel(trip.startDate) ?? stage : stage;

  return (
    <li className="lift relative flex min-h-40 flex-col rounded-lg border border-rule bg-sheet p-4 hover:shadow-[var(--shadow-lifted)]">
      <div className="flex items-center gap-2 pr-14">
        <span aria-hidden="true" className={`size-2.5 shrink-0 rounded-[3px] border border-rule-strong ${swatch}`} />
        {trip.mark ? <TripMarkIcon mark={trip.mark} size={14} /> : null}
        <span className="typed">{status}</span>
      </div>
      <Link
        href={`/trip/${trip.id}/overview`}
        className="mt-2 text-ink after:absolute after:inset-0"
      >
        <h3 className="text-xl">{titleCase(trip.name)}</h3>
      </Link>
      <p className="nums mt-1 text-xs text-ink-soft">{formatDateRange(trip.startDate, trip.endDate)}</p>
      <p className="text-sm text-ink-soft">{trip.where ?? "Place not set"}</p>
      <div className="mt-auto pt-4">
        <AvatarRow people={trip.members} size={22} />
      </div>
      <div className="absolute right-2 top-2 z-10">
        <TripCardActions trip={trip} />
      </div>
    </li>
  );
}
