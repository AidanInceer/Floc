"use client";

import type { PlanStop } from "@floc/core/trip/explore/detail/preset-plan";
import type { PresetTrip } from "@floc/core/trip/explore/preset-trips";

import { CopySheet } from "@/components/explore/copy/copy-sheet";
import { AddToWishList } from "@/components/lists/wish/listing-wish";
import { listingStartHref } from "@/lib/landing/start-trip";
import { CopyIcon } from "@/components/system/icons/explore-trip";
import { CheckIcon, ChevronIcon } from "@/components/system/icons";
import { ButtonLink, cx } from "@/components/system/ui";

function CopyAction({ trip, signedIn, className, defaultOpen }: { trip: PresetTrip; signedIn: boolean; className?: string; defaultOpen?: boolean }) {
  if (!signedIn) {
    return (
      <ButtonLink href={listingStartHref(false, trip.id)} variant="primary" className={className}>
        <CopyIcon />
        Sign up to copy
      </ButtonLink>
    );
  }
  return (
    <CopySheet trip={trip} className={className} defaultOpen={defaultOpen}>
      <CopyIcon />
      Copy to my trips
    </CopySheet>
  );
}

const COMES_ACROSS = [
  "Dates, from the month you pick",
  "The days and stops",
  "The travel between stops",
  "Each day's events, if you want them",
  "An Ideas page, if you want it",
  "The highlights, as a notes page",
];

function OpenDays({ stops, open, onJump }: { stops: PlanStop[]; open: number[]; onJump: (day: number) => void }) {
  const total = stops.reduce((sum, s) => sum + s.days.length, 0);
  return (
    <div className="mt-3.5 border-t border-dashed border-rule-strong pt-3.5">
      <p className="typed">
        Open <b className="font-medium text-ink">{open.length}</b> of {total} days
      </p>
      <ul className="mt-2.5 grid gap-2" aria-label="Open a day">
        {stops
          .filter((s) => s.days.length > 0)
          .map((s) => (
            <li key={s.no} className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-2">
              <span className="truncate text-sm text-ink-soft">{s.place}</span>
              <span className="flex flex-wrap gap-1">
                {s.days.map((d) => (
                  <button
                    key={d.n}
                    type="button"
                    onClick={() => onJump(d.n)}
                    aria-label={`Day ${d.n}, ${s.place}${d.highlight ? `, highlight: ${d.highlight}` : ""}`}
                    aria-pressed={open.includes(d.n)}
                    className={cx(
                      "nums relative h-10 min-w-10 rounded-sm border px-1.5 text-xs lg:h-7 lg:min-w-7",
                      open.includes(d.n) ? "border-pen-edge bg-pen-soft text-pen-deep" : "border-rule-strong bg-sheet text-ink-soft hover:border-ink-faint hover:text-ink",
                      d.highlight && "after:absolute after:-right-[3px] after:-top-[3px] after:size-[7px] after:rounded-full after:border-[1.5px] after:border-sheet after:bg-highlight-ink",
                    )}
                  >
                    {d.n}
                  </button>
                ))}
              </span>
            </li>
          ))}
      </ul>
    </div>
  );
}

export function TripCopyCard({
  trip,
  stops,
  open,
  onJump,
  signedIn,
  startOpen,
}: {
  trip: PresetTrip;
  stops: PlanStop[];
  open: number[];
  onJump: (day: number) => void;
  signedIn: boolean;
  /** The copy sheet opens on arrival: the landing page's "Start" sent you here. */
  startOpen?: boolean;
}) {
  return (
    <aside className="rounded-md border border-rule-strong bg-sheet p-5 shadow-raised lg:sticky lg:top-20">
      <h2 className="text-xl">Copy this trip</h2>
      {stops.some((s) => s.days.length > 0) ? <OpenDays stops={stops} open={open} onJump={onJump} /> : null}
      <CopyAction trip={trip} signedIn={signedIn} className="mt-4 w-full" defaultOpen={startOpen} />
      {signedIn ? <AddToWishList presetId={trip.id} className="mt-2 w-full justify-center" /> : null}
      <p className="mt-2.5 text-center text-xs text-ink-faint">Free. Nothing is booked.</p>
      <details className="group mt-3.5 border-t border-dashed border-rule-strong pt-3">
        <summary className="flex cursor-pointer list-none items-center justify-between text-sm text-ink-soft [&::-webkit-details-marker]:hidden">
          What comes across
          <ChevronIcon direction="down" size={14} className="text-ink-faint group-open:rotate-180" />
        </summary>
        <ul className="mt-2.5 grid gap-1.5 text-sm">
          {COMES_ACROSS.map((line) => (
            <li key={line} className="flex items-start gap-2.5">
              <CheckIcon className="mt-1 text-green" />
              {line}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-ink-faint">With no dates yet, only the name and highlights come across. You bring the people and the money.</p>
      </details>
    </aside>
  );
}

/**
 * Phones only: the card sits below the days there, so the action stays in reach.
 * Why it floats clear of the edges: a phone's curved screen corners cut into a bar that runs edge to edge.
 */
export function TripCopyBar({ trip, signedIn }: { trip: PresetTrip; signedIn: boolean }) {
  return (
    <div className="trip-copy-bar fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 flex items-center justify-between gap-3 rounded-md border border-rule-strong bg-sheet py-1 pl-4 pr-1 shadow-lifted lg:hidden">
      <span className="grid min-w-0 text-sm">
        <b className="truncate font-semibold">{trip.title}</b>
        <span className="nums text-[11.5px] text-ink-soft">{trip.nights} nights</span>
      </span>
      <CopyAction trip={trip} signedIn={signedIn} className="shrink-0" />
    </div>
  );
}
