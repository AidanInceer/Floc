"use client";

/*
 * When an event happens: the start (required), the end (optional), and the one
 * escape hatch from both.
 *
 * A start time is mandatory now, because the day is a timeline and "we haven't
 * said when" was quietly becoming the answer for half a day's events — which
 * left the ordering to `order_index` and the group with a plan that couldn't
 * be read in sequence. All day is the honest way out: some things really are
 * on a day rather than at a time, and saying so is a decision, where leaving
 * the box empty was an omission.
 *
 * Client-side because ticking All day has to *take the time inputs away* — a
 * required field the user can't fill would deadlock the form, and disabling
 * without removing leaves a start time on screen that isn't going to be saved.
 */

import { useState } from "react";

import { Field, Input } from "@/components/ui";

export function EventTimeFields({
  defaultTime,
  defaultEndTime,
  defaultAllDay,
  step,
}: {
  defaultTime?: string | null;
  defaultEndTime?: string | null;
  defaultAllDay?: boolean;
  /** Seconds. 900 matches the calendar's quarter-hour snap (ticket 103). */
  step?: number;
}) {
  const [allDay, setAllDay] = useState(defaultAllDay ?? false);

  return (
    <>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="allDay"
          checked={allDay}
          onChange={(e) => setAllDay(e.target.checked)}
          className="size-4 accent-pen"
        />
        All day event
      </label>

      {allDay ? null : (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Starts" hint="Local to the itinerary — no timezone">
            <Input
              type="time"
              name="time"
              required
              step={step}
              defaultValue={defaultTime ?? ""}
            />
          </Field>
          <Field label="Ends" hint="Optional">
            <Input
              type="time"
              name="endTime"
              step={step}
              defaultValue={defaultEndTime ?? ""}
            />
          </Field>
        </div>
      )}
    </>
  );
}
