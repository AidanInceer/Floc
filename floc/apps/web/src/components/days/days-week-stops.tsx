"use client";

import { StopPill, tripStops } from "@/components/days/days-stop-strip";
import type { CalendarDay } from "@/components/days/days-calendar-shared";
import { stopSegments } from "@floc/core/itinerary/stop-weeks";
import type { BandSpan } from "@floc/core/itinerary/overnight-band";

export function WeekStops({
  days,
  tripEnd,
  indices,
  onStop,
}: {
  days: CalendarDay[];
  tripEnd: string | null;
  indices: number[];
  onStop: (span: BandSpan) => void;
}) {
  const segments = stopSegments(tripStops(days, tripEnd), indices[0], indices[indices.length - 1]);
  return (
    <div
      data-days-row
      className="grid border-b border-rule bg-sheet py-1.5 max-lg:hidden"
      style={{ gridTemplateColumns: "var(--days-gutter) var(--days-week)" }}
    >
      <span className="row-start-1" />
      {segments.map((segment) => (
        <StopPill key={segment.stop.startDate} segment={{ ...segment, column: segment.column + 1 }} onStop={onStop} className="mx-1" />
      ))}
    </div>
  );
}
