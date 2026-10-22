"use client";

import { formatDateRange, today } from "@floc/core/dates/dates";
import { startMonths, type StartMonth } from "@floc/core/trip/explore/copy/start-months";
import { MONTH_SHORT } from "@floc/core/trip/explore/finder/finder-words";
import type { PresetTrip } from "@floc/core/trip/explore/preset-trips";
import { useState, type ReactNode } from "react";

import { startTripFromPreset } from "@/app/explore/actions";
import { ToggleRow } from "@/components/auth/account-ui";
import { Sheet, SubmitButton } from "@/components/system/client-ui";
import { SheetFooter, cx } from "@/components/system/ui";

const LATER = "later";

const chip = cx(
  "grid min-w-[4.25rem] place-items-center rounded-sm border border-rule-strong bg-sheet px-2.5 py-1.5 text-ink-soft",
  "peer-checked:border-ink peer-checked:bg-ink peer-checked:text-sheet hover:border-ink-faint",
  "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-pen",
);

function MonthChip({ month, picked, onPick }: { month: StartMonth; picked: boolean; onPick: () => void }) {
  return (
    <label className="cursor-pointer">
      <input type="radio" name="month" value={month.month} checked={picked} onChange={onPick} className="peer sr-only" />
      <span className={chip}>
        <b className="text-sm font-semibold">{MONTH_SHORT[month.month - 1]}</b>
        <span className="nums text-[11px] opacity-75">{month.year}</span>
      </span>
    </label>
  );
}

function CopyForm({ trip }: { trip: PresetTrip }) {
  const months = startMonths(trip, today());
  const [picked, setPicked] = useState<number | null>(months[0]?.month ?? null);
  const chosen = months.find((m) => m.month === picked);

  return (
    <form action={startTripFromPreset} className="flex min-h-0 flex-1 flex-col">
      <input type="hidden" name="presetId" value={trip.id} />
      <div className="grid gap-5 p-4">
        <fieldset>
          <legend className="typed">Start on the 1st of</legend>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {months.map((m) => (
              <MonthChip key={m.month} month={m} picked={picked === m.month} onPick={() => setPicked(m.month)} />
            ))}
            <label className="cursor-pointer">
              <input type="radio" name="month" value={LATER} checked={picked === null} onChange={() => setPicked(null)} className="peer sr-only" />
              <span className={cx(chip, "h-full px-3 text-sm")}>Decide later</span>
            </label>
          </div>
          <p className="nums mt-2.5 text-sm text-ink-soft">
            {chosen
              ? `${formatDateRange(chosen.startDate, chosen.endDate)} · ${trip.nights} nights`
              : "No dates yet, so only the highlights come across. Days and events need dates."}
          </p>
        </fieldset>
        <fieldset className="grid gap-3.5 border-t border-dashed border-rule-strong pt-4">
          <legend className="sr-only">Also bring</legend>
          <ToggleRow name="ideas" label="Add ideas" hint="Other things to do at each stop, and other stops to swap in." defaultChecked disabled={!chosen} />
          <ToggleRow name="events" label="Add events to the calendar" hint="Each day's plan, with times." defaultChecked disabled={!chosen} />
        </fieldset>
      </div>
      <SheetFooter note="You can change all of it later.">
        <SubmitButton pendingLabel="Starting…">Start trip</SubmitButton>
      </SheetFooter>
    </form>
  );
}

/** "Start this trip" on Explore (ADR-025): pick a best month, or decide later, then what else comes across. */
export function CopySheet({
  trip,
  children,
  className,
  defaultOpen,
}: {
  trip: PresetTrip;
  /** The trigger's words. */
  children: ReactNode;
  className?: string;
  /** Open on arrival: a link from the landing page asked for it. */
  defaultOpen?: boolean;
}) {
  return (
    <Sheet trigger={children} title="Start this trip" triggerClassName={className} defaultOpen={defaultOpen} body="flush" keepOpenOnSubmit>
      <CopyForm trip={trip} />
    </Sheet>
  );
}
