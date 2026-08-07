"use client";

/*
 * The add/edit event form — one form, two mount points (ticket 103).
 *
 * It used to live inside `days/page.tsx`, which was fine while the only way to
 * add an event was a server-rendered sheet on a day card. The calendar has two
 * ways in and they sit on opposite sides of the boundary: **editing** happens
 * in an event's detail panel, which the page renders on the server, and
 * **adding** happens in a dialog the grid opens at whatever quarter hour you
 * clicked, which only the client knows. Two copies of a nine-field form is two
 * places to forget a field, so it is one client component and the server
 * renders it too.
 *
 * `dayId` and `eventId` ride in the form as hidden fields rather than being
 * bound into the action, because on the calendar both are things the client
 * picked. `submitEvent` re-checks each against the trip (rule 5).
 */

import type { ComponentProps } from "react";

import { SubmitButton } from "@/components/client-ui";
import { EventTimeFields } from "@/components/event-time-fields";
import { EventTypeFields } from "@/components/event-type-fields";
import { PlacePicker } from "@/components/place-picker";
import { Field, Input, Stack, Textarea } from "@/components/ui";
import type { DayEventType, TransportType } from "@/db/schema";

/** The place search action, as `PlacePicker` itself declares it. */
export type PlaceSearch = ComponentProps<typeof PlacePicker>["search"];

export type EventFormDefaults = {
  dayId: number;
  eventId?: number;
  type?: DayEventType;
  transportType?: TransportType | null;
  time?: string | null;
  endTime?: string | null;
  allDay?: boolean;
  title?: string | null;
  note?: string | null;
  placeName?: string | null;
};

export function EventForm({
  action,
  searchPlaces,
  defaults,
}: {
  action: (formData: FormData) => Promise<void>;
  searchPlaces: PlaceSearch;
  defaults: EventFormDefaults;
}) {
  /*
   * The name comes first (ticket 74). You know what you're adding before you
   * know how to file it — "mini golf" is the thought, "activity" is the
   * paperwork — and a required field at the top also makes the form's one
   * mandatory answer the first thing you meet rather than something you scroll
   * back up for. Then: type, how (transport only), place, time, notes.
   *
   * Place is optional because plenty of events don't have one worth pinning
   * ("pack up and check out"), and Notes sits last and secondary so the name
   * carries the meaning and the notes carry the detail.
   */
  return (
    <form action={action}>
      <input type="hidden" name="dayId" value={defaults.dayId} />
      {defaults.eventId ? (
        <input type="hidden" name="eventId" value={defaults.eventId} />
      ) : null}
      <Stack gap={3}>
        <Field label="Event name">
          <Input
            name="title"
            required
            maxLength={120}
            defaultValue={defaults.title ?? ""}
            placeholder="Mini golf"
          />
        </Field>
        <EventTypeFields
          defaultType={defaults.type ?? "activity"}
          defaultTransportType={defaults.transportType}
        />
        <PlacePicker
          name="place"
          label="Place (optional)"
          defaultName={defaults.placeName ?? ""}
          search={searchPlaces}
        />
        {/* Minute steps. The grid places to the minute, so the picker has to
            reach every time the grid can hold — a quarter-hour picker quietly
            rounded somebody's 10:50 train to 10:45. */}
        <EventTimeFields
          defaultTime={defaults.time}
          defaultEndTime={defaults.endTime}
          defaultAllDay={defaults.allDay}
          step={60}
        />
        <Field
          label="Notes"
          hint="Optional — booking references, who's meeting where, the fact it shuts at four."
        >
          <Textarea name="note" defaultValue={defaults.note ?? ""} rows={2} />
        </Field>
        <SubmitButton>{defaults.eventId ? "Save event" : "Add event"}</SubmitButton>
      </Stack>
    </form>
  );
}
