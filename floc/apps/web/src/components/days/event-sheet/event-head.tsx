"use client";

import type { ReactNode } from "react";

import { EVENT_CATEGORIES } from "@floc/core/itinerary/event-categories";
import { TEXT_CAPS } from "@floc/core/text/text";
import type { DayEventType, TransportType } from "@floc/core/vocabulary";
import { DialogClose } from "@/components/system/dialog";
import { EventGlyph } from "@/components/system/icons/days";
import { cx } from "@/components/system/ui";

const NAME =
  "block w-full border-0 border-b-[1.5px] border-current/30 bg-transparent pb-1.5 pt-0.5 font-display text-[24px] font-semibold leading-tight tracking-[-0.015em] text-inherit transition-colors hover:border-current/55 focus:border-current focus:outline-none max-sm:text-[21px]";
const TIME =
  "rounded-sm border border-transparent bg-transparent px-1.5 py-1 font-mono text-[17px] tabular-nums text-inherit transition-colors hover:border-current/35 focus:border-current focus:outline-none max-sm:text-[15px] max-sm:[&::-webkit-calendar-picker-indicator]:hidden";

/**
 * The top of the event form is the block it makes (wireframe/modal-forms B3): the type's
 * wash, its glyph, and the name and times typed straight into it. `aside` sits beside
 * the ✕ — the edit form's save status.
 */
export function EventHead({
  dateLabel,
  type,
  how,
  title,
  onTitle,
  when,
  aside,
  autoFocus = false,
}: {
  dateLabel: string;
  type: DayEventType;
  how: TransportType | null;
  title: string;
  onTitle: (title: string) => void;
  when: ReactNode;
  aside?: ReactNode;
  /** Add puts the cursor in the name, not on the ✕ (ticket 74). */
  autoFocus?: boolean;
}) {
  return (
    <div className={cx("px-5 pb-4 pt-2.5 transition-colors max-sm:px-4", EVENT_CATEGORIES[type].tile)}>
      <div className="mb-1.5 flex items-center justify-between gap-3 font-mono text-[12.5px]">
        <span>{dateLabel}</span>
        <span className="flex items-center gap-2">
          {aside}
          <DialogClose />
        </span>
      </div>
      <div className="grid grid-cols-[34px_minmax(0,1fr)] items-end gap-3 pr-2">
        <span className="mb-1.5 grid size-[34px] place-items-center rounded-sm bg-sheet">
          <EventGlyph type={type} transportType={how} size={16} />
        </span>
        <label className="block">
          <span className="block font-mono text-xs opacity-75">Event name</span>
          <input
            name="title"
            maxLength={TEXT_CAPS.eventTitle}
            autoComplete="off"
            autoFocus={autoFocus}
            value={title}
            onChange={(e) => onTitle(e.target.value)}
            className={NAME}
          />
        </label>
      </div>
      <div className="mt-3 grid grid-cols-[34px_minmax(0,1fr)] items-center gap-3 pr-2">
        <span className="justify-self-center font-mono text-xs opacity-75" aria-hidden>
          When
        </span>
        {when}
      </div>
    </div>
  );
}

/** Start and end, or All day. Ticking All day takes the times away rather than disabling them. */
export function EventWhen({
  time,
  endTime,
  allDay,
  onAllDay,
}: {
  time: string | null | undefined;
  endTime: string | null | undefined;
  allDay: boolean;
  onAllDay: () => void;
}) {
  return (
    <div role="group" aria-label="When" className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
      {allDay ? (
        <input type="hidden" name="allDay" value="on" />
      ) : (
        <>
          {/* step={60}: a quarter-hour picker quietly rounded 10:50 to 10:45. */}
          <input type="time" name="time" required step={60} defaultValue={time ?? ""} aria-label="Starts" className={cx(TIME, "-ml-1.5")} />
          <span className="text-sm opacity-70">to</span>
          <input type="time" name="endTime" step={60} defaultValue={endTime ?? ""} aria-label="Ends" className={TIME} />
        </>
      )}
      <button
        type="button"
        aria-pressed={allDay}
        onClick={onAllDay}
        className={cx(
          "ml-auto h-[30px] rounded-sm border px-2.5 text-[13px] transition-colors",
          allDay ? "border-current bg-sheet" : "border-current/30 hover:border-current",
        )}
      >
        All day
      </button>
    </div>
  );
}
