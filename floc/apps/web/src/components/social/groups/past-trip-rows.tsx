"use client";

import { formatMonth, monthOf } from "@floc/core/dates/availability";
import { peopleCount } from "@floc/core/people/group-ticks";

import { AvatarRow } from "@/components/system/ui";
import type { PastTrip } from "@/server/social/groups";

const ROW =
  "flex w-full items-center gap-3 rounded-sm px-2.5 py-2 text-left transition-colors hover:bg-pen-soft hover:text-pen-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pen";

export function PastTripRows({ trips, onPick }: { trips: PastTrip[]; onPick: (trip: PastTrip) => void }) {
  if (trips.length === 0) return <p className="text-sm text-ink-soft">No past trips with people to add.</p>;
  return (
    <ul className="flex flex-col gap-0.5">
      {trips.map((trip) => (
        <li key={trip.id}>
          <button type="button" onClick={() => onPick(trip)} className={ROW}>
            <span className="flex min-w-0 flex-1 flex-col leading-tight">
              <span className="truncate text-sm font-semibold">{trip.name}</span>
              <span className="nums mt-0.5 font-mono text-xs text-ink-soft">
                {formatMonth(monthOf(trip.endDate))} · {peopleCount(trip.people.length)}
              </span>
            </span>
            <AvatarRow people={trip.people} size={22} max={5} />
          </button>
        </li>
      ))}
    </ul>
  );
}

export function tripsWithPeople(trips: PastTrip[]): PastTrip[] {
  return trips.filter((trip) => trip.people.length > 0);
}
