"use client";

import type { IsoMonth } from "@floc/core/dates/availability";
import type { IsoDate } from "@floc/core/dates/dates";

import { StartCalendar } from "@/components/explore/copy/start-calendar";
import { Button } from "@/components/system/ui";
import { RangeCalendar } from "../range-calendar";

export function StartDates({ nights, month, start, end, onMonth, onPick, onNone }: {
  nights: number | null;
  month: IsoMonth;
  start: IsoDate | null;
  end: IsoDate | null;
  onMonth: (month: IsoMonth) => void;
  onPick: (date: IsoDate) => void;
  onNone: () => void;
}) {
  return (
    <div className="grid gap-2">
      {nights !== null ? (
        <StartCalendar month={month} onMonth={onMonth} start={start} nights={nights} onPick={onPick} />
      ) : (
        <RangeCalendar month={month} onMonth={onMonth} start={start} end={end} onPick={onPick} />
      )}
      <Button type="button" variant="ghost" className="justify-self-center" onClick={onNone}>
        No dates yet
      </Button>
    </div>
  );
}
