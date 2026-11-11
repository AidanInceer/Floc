import { addDays, formatDateRange, type IsoDate } from "@floc/core/dates/dates";

import { ToggleRow } from "@/components/auth/account-ui";
import { panelTitleClass } from "@/components/system/ui";

/** Step three (ADR-025): the dates as picked, then the two switches, both on by default. */
export function ExtrasStep({ start, nights, onChange }: { start: IsoDate | null; nights: number; onChange: () => void }) {
  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3 rounded-sm border border-rule bg-sheet-2 px-3 py-2.5">
        <span className="nums text-sm text-ink">{start ? <>{formatDateRange(start, addDays(start, nights))} <span className="whitespace-nowrap">· {nights} nights</span></> : null}</span>
        <button type="button" onClick={onChange} className="text-sm text-pen hover:underline">
          Change
        </button>
      </div>
      <h3 tabIndex={-1} className={`${panelTitleClass} text-center`}>What else comes across?</h3>
      <fieldset className="grid gap-3.5">
        <legend className="sr-only">Also bring</legend>
        <ToggleRow name="ideas" label="Add ideas" hint="Other things to do at each stop, and other stops to swap in." defaultChecked />
        <ToggleRow name="events" label="Add events to the calendar" hint="Each day's plan, with times." defaultChecked />
      </fieldset>
    </div>
  );
}
