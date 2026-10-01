"use client";

import type { PlanStop } from "@floc/core/trip/explore/detail/preset-plan";
import type { PresetTrip } from "@floc/core/trip/explore/preset-trips";

import { startTripFromPreset } from "@/app/explore/actions";
import type { RegionTone } from "@/components/explore/trip/region-tone";
import { CopyIcon } from "@/components/explore/trip/trip-glyphs";
import { SubmitButton } from "@/components/system/client-ui";
import { CheckIcon, ChevronIcon } from "@/components/system/icons";
import { ButtonLink, cx } from "@/components/system/ui";

function CopyAction({ tripId, signedIn, className }: { tripId: string; signedIn: boolean; className?: string }) {
  if (!signedIn) {
    return (
      <ButtonLink href="/signup" variant="primary" className={className}>
        <CopyIcon />
        Sign up to copy
      </ButtonLink>
    );
  }
  return (
    <form action={startTripFromPreset} className={className}>
      <input type="hidden" name="presetId" value={tripId} />
      <SubmitButton pendingLabel="Copying…" className="w-full">
        <CopyIcon />
        Copy to my trips
      </SubmitButton>
    </form>
  );
}

function DayStrip({ stops, now, onJump, tone }: { stops: PlanStop[]; now: number; onJump: (day: number) => void; tone: RegionTone }) {
  const days = stops.flatMap((s) => s.days.map((d) => ({ n: d.n, place: s.place })));
  const here = days.find((d) => d.n === now);
  return (
    <div className="mt-3.5 border-t border-dashed border-rule-strong pt-3.5">
      <p className="typed">
        You are on day <b className="font-medium text-ink">{now}</b> of {days.length}
        {here ? (
          <>
            {" "}
            · <b className="font-medium text-ink">{here.place}</b>
          </>
        ) : null}
      </p>
      <ol className="mt-2 grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${Math.min(days.length, 11)}, minmax(0, 1fr))` }} aria-label="Jump to a day">
        {days.map((d) => (
          <li key={d.n}>
            <button
              type="button"
              onClick={() => onJump(d.n)}
              aria-label={`Day ${d.n}, ${d.place}`}
              aria-current={d.n === now}
              className={cx(
                "nums h-[30px] w-full rounded-sm border text-xs transition-opacity",
                tone.mark,
                d.n === now ? cx(tone.ring, "ring-[1.5px] ring-offset-2 ring-offset-sheet") : "opacity-60 hover:opacity-90",
              )}
            >
              {d.n}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function TripCopyCard({
  trip,
  stops,
  now,
  onJump,
  signedIn,
  tone,
}: {
  trip: PresetTrip;
  stops: PlanStop[];
  now: number;
  onJump: (day: number) => void;
  signedIn: boolean;
  tone: RegionTone;
}) {
  return (
    <aside className="rounded-lg border border-rule-strong bg-sheet p-5 shadow-raised lg:sticky lg:top-20">
      <p className="typed">Make it yours</p>
      <h2 className="mt-1.5 text-xl">Copy this trip</h2>
      {now > 0 ? <DayStrip stops={stops} now={now} onJump={onJump} tone={tone} /> : null}
      <CopyAction tripId={trip.id} signedIn={signedIn} className="mt-4 w-full" />
      <p className="mt-2.5 text-center text-xs text-ink-faint">Free. Nothing is booked.</p>
      <details className="group mt-3.5 border-t border-dashed border-rule-strong pt-3">
        <summary className="flex cursor-pointer list-none items-center justify-between text-sm text-ink-soft [&::-webkit-details-marker]:hidden">
          What comes across
          <ChevronIcon direction="down" size={14} className="text-ink-faint group-open:rotate-180" />
        </summary>
        <ul className="mt-2.5 grid gap-1.5 text-sm">
          {["The trip name", "The highlights, as a notes page"].map((line) => (
            <li key={line} className="flex items-start gap-2.5">
              <CheckIcon className="mt-1 text-green" />
              {line}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-ink-faint">You bring the dates, the people and the money.</p>
      </details>
    </aside>
  );
}

/** Phones only: the card sits below the days there, so the action stays in reach. */
export function TripCopyBar({ trip, signedIn }: { trip: PresetTrip; signedIn: boolean }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-rule-strong bg-sheet px-4 py-2.5 shadow-lifted lg:hidden">
      <span className="grid min-w-0 text-sm">
        <b className="truncate font-semibold">{trip.title}</b>
        <span className="nums text-[11.5px] text-ink-soft">{trip.nights} nights</span>
      </span>
      <CopyAction tripId={trip.id} signedIn={signedIn} className="shrink-0" />
    </div>
  );
}
