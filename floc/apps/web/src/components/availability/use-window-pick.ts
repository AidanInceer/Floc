"use client";

import { useState } from "react";

import { advanceRangePick, pickedRange } from "@floc/core/dates/calendar-gestures";
import { windowCost, windowCostLabel, type DayLoad } from "@floc/core/trip/trip-window";

export function useWindowPick(tripStart: string | null, tripEnd: string | null, dayLoads: DayLoad[]) {
  const [range, setRange] = useState<{ start: string | null; end: string | null }>({ start: tripStart, end: tripEnd });
  const [rangeDrag, setRangeDrag] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [armedKey, setArmedKey] = useState<string | null>(null);

  const end = range.end ?? range.start;
  const halfMade = range.start !== null && range.end === null;
  const changed = range.start !== tripStart || end !== tripEnd;
  const previewTo = halfMade && !rangeDrag && hover && hover > range.start! ? hover : null;
  const costLabel = windowCostLabel(windowCost(dayLoads, range.start, end));
  const key = `${range.start}|${end}`;

  return {
    start: range.start,
    end,
    halfMade,
    changed,
    editing: changed || halfMade,
    costLabel,
    armed: !!costLabel && armedKey === key,
    dragging: rangeDrag !== null,
    inPick: (date: string) => range.start !== null && !!end && date >= range.start && date <= end,
    pending: (date: string) => !!previewTo && date > range.start! && date <= previewTo,
    press(date: string) {
      if (!halfMade) setRangeDrag(date);
      setHover(null);
      setRange((r) => advanceRangePick(r, date));
    },
    extend(date: string) {
      if (rangeDrag) setRange(pickedRange(rangeDrag, date));
    },
    hoverOn: setHover,
    release: () => setRangeDrag(null),
    arm: () => setArmedKey(key),
    disarm: () => setArmedKey(null),
    discard: () => {
      setRange({ start: tripStart, end: tripEnd });
      setArmedKey(null);
    },
  };
}
