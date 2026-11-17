"use client";

import type { CSSProperties, ReactNode } from "react";

import { Menu } from "@/components/system/client-ui";
import { cx } from "@/components/system/ui";
import { OUTSIDE_DAY_CLASS, onlyClass, type CalendarDay } from "@/components/days/days-calendar-shared";
import { shortPlace } from "@floc/core/itinerary/names/place-name";

export type FocusFacts = {
  day: CalendarDay;
  dayNumber: number;
  tripLength: number;
  stay: { placeName: string; night: number | null; nights: number } | null;
  eventCount: number;
};

const HEAD = "flex min-w-0 flex-col items-center justify-center gap-px border-l border-rule px-1 py-2 sm:items-start sm:px-3";

function DayDate({ day }: { day: CalendarDay }) {
  return (
    <span className="flex flex-col items-center sm:flex-row sm:items-baseline sm:gap-1.5">
      <span className="typed">{day.weekday}</span>
      <b className="nums text-sm font-medium sm:text-base">{day.dayOfMonth}</b>
    </span>
  );
}

export function FocusHeads({
  slots,
  focus,
  counts,
  rowStyle,
  onGoTo,
  removeControl,
}: {
  slots: CalendarDay[];
  focus: FocusFacts;
  counts: Map<number, number>;
  rowStyle: CSSProperties;
  onGoTo: (dayId: number) => void;
  removeControl: ReactNode;
}) {
  const focusAt = slots.findIndex((d) => d.id === focus.day.id);
  return (
    <div style={rowStyle} data-days-row className="border-b border-rule bg-sheet">
      <div className="border-r border-rule bg-sheet" />
      {slots.map((day, i) => {
        if (day.id === focus.day.id) {
          return <FocusHead key={day.id} focus={focus} removeControl={removeControl} />;
        }
        if (day.outside) {
          return (
            <div key={day.id} className={cx(HEAD, "text-ink-faint", OUTSIDE_DAY_CLASS, onlyClass(day.only))}>
              <DayDate day={day} />
              <span className="text-balance text-xs leading-tight max-sm:hidden">{i < focusAt ? "Before the trip" : "After the trip"}</span>
            </div>
          );
        }
        const count = counts.get(day.id) ?? 0;
        return (
          <button
            key={day.id}
            type="button"
            onClick={() => onGoTo(day.id)}
            aria-label={`Show ${day.longLabel}`}
            className={cx(HEAD, "bg-sheet-2 text-left text-ink-soft transition-colors hover:bg-pen-soft hover:text-pen-deep", onlyClass(day.only))}
          >
            <DayDate day={day} />
            <span className="text-xs text-ink-faint max-sm:hidden">{count ? `${count} planned` : "Nothing planned"}</span>
          </button>
        );
      })}
    </div>
  );
}

function FocusHead({ focus, removeControl }: { focus: FocusFacts; removeControl: ReactNode }) {
  const { day, stay } = focus;
  return (
    <div className={cx("flex min-w-0 items-center justify-between gap-2 border-l border-rule py-2 pl-2.5 pr-1 sm:py-2.5 sm:pl-3.5 sm:pr-2", day.isToday && "bg-pen-soft", onlyClass(day.only))}>
      <div className="min-w-0">
        <h2 className="truncate lg:whitespace-normal font-display text-[15px] font-semibold tracking-[-0.01em] sm:text-lg">
          <span className="max-sm:hidden">{day.longLabel}</span>
          <span className="nums sm:hidden">{day.shortLabel}</span>
          {day.isToday ? <span className="text-pen"> · today</span> : null}
        </h2>
        <p className="truncate text-[13px] text-ink-soft lg:whitespace-normal lg:text-pretty">
          Day {focus.dayNumber} of {focus.tripLength}
          <span className="max-sm:hidden">
            {" · "}
            {stay ? (
              `${shortPlace(stay.placeName)}, ${stay.night === null ? "day home" : `night ${stay.night} of ${stay.nights}`}`
            ) : (
              <span className="text-highlight-ink">No overnight place</span>
            )}
          </span>
          {" · "}
          {focus.eventCount ? `${focus.eventCount} planned` : "Nothing planned"}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Menu label={`${day.longLabel} actions`}>{removeControl}</Menu>
      </div>
    </div>
  );
}
