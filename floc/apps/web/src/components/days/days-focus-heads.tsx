"use client";

/**
 * The heads over the clock's three slots (B5): the focus day says which day of
 * the trip it is, where you sleep and how much is planned; a neighbour is one
 * press away; a slot past either end of the trip is a hatched cap.
 */
import type { CSSProperties, ReactNode } from "react";

import { Menu } from "@/components/system/client-ui";
import { Button, cx } from "@/components/system/ui";
import { ChevronIcon, PlusIcon } from "@/components/system/icons";
import { OUTSIDE_DAY_CLASS, type CalendarDay } from "@/components/days/days-calendar-shared";
import { shortPlace } from "@/components/days/days-stop-strip";

export type FocusFacts = {
  day: CalendarDay;
  /** 1-based. */
  dayNumber: number;
  tripLength: number;
  stay: { placeName: string; night: number | null; nights: number } | null;
  eventCount: number;
};

export function FocusHeads({
  slots,
  focus,
  rowStyle,
  onGoTo,
  onAdd,
  removeControl,
}: {
  slots: CalendarDay[];
  focus: FocusFacts;
  rowStyle: CSSProperties;
  onGoTo: (dayId: number) => void;
  onAdd: () => void;
  removeControl: ReactNode;
}) {
  return (
    <div style={rowStyle} className="border-b border-rule bg-sheet">
      <div className="border-r border-rule bg-sheet" />
      {slots.map((day, i) => {
        const side = i === 0 ? "left" : "right";
        if (day.id === focus.day.id) {
          return <FocusHead key={day.id} focus={focus} onAdd={onAdd} removeControl={removeControl} />;
        }
        if (day.outside) {
          return (
            <div key={day.id} className={cx("flex items-center justify-center border-l border-rule px-1", OUTSIDE_DAY_CLASS)}>
              <span className="typed max-sm:hidden">{side === "left" ? "Trip starts" : "Last day"}</span>
            </div>
          );
        }
        return (
          <button
            key={day.id}
            type="button"
            onClick={() => onGoTo(day.id)}
            aria-label={`Show ${day.longLabel}`}
            className="flex flex-col items-center justify-center gap-px border-l border-rule bg-sheet-2 py-2 transition-colors hover:bg-sheet-3 sm:flex-row sm:items-baseline sm:gap-1.5"
          >
            {side === "left" ? <ChevronIcon direction="left" size={12} className="self-center text-ink-faint max-sm:hidden" /> : null}
            <span className="typed">{day.weekday}</span>
            <b className="nums text-sm font-medium sm:text-base">{day.dayOfMonth}</b>
            {side === "right" ? <ChevronIcon direction="right" size={12} className="self-center text-ink-faint max-sm:hidden" /> : null}
          </button>
        );
      })}
    </div>
  );
}

function FocusHead({
  focus,
  onAdd,
  removeControl,
}: {
  focus: FocusFacts;
  onAdd: () => void;
  removeControl: ReactNode;
}) {
  const { day, stay } = focus;
  return (
    <div className={cx("flex min-w-0 items-center justify-between gap-2 border-l border-rule py-2 pl-2.5 pr-1 sm:py-2.5 sm:pl-3.5 sm:pr-2", day.isToday && "bg-pen-soft")}>
      <div className="min-w-0">
        <h2 className="truncate font-display text-[15px] font-semibold tracking-[-0.01em] sm:text-[19px]">
          <span className="max-sm:hidden">{day.longLabel}</span>
          <span className="nums sm:hidden">{day.shortLabel}</span>
          {day.isToday ? <span className="text-pen"> · today</span> : null}
        </h2>
        <p className="truncate text-[12.5px] text-ink-soft">
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
          {focus.eventCount
            ? `${focus.eventCount} ${focus.eventCount === 1 ? "event" : "events"}`
            : "Nothing planned yet"}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button onClick={onAdd} className="!px-3 max-sm:hidden">
          <PlusIcon size={12} />
          Add
        </Button>
        <Menu label={`${day.longLabel} actions`}>{removeControl}</Menu>
      </div>
    </div>
  );
}
