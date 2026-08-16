"use client";

// Add/edit event form — one form, two mount points (ticket 103): editing
// happens server-side in a detail panel, adding happens client-side wherever
// the grid was clicked. dayId/eventId ride as hidden fields rather than bound
// into the action, since the client picked them; submitEvent re-checks (rule 5).

import type { ComponentProps } from "react";

import { SubmitButton } from "@/components/client-ui";
import { EventTimeFields } from "@/components/event-time-fields";
import { EventTypeFields } from "@/components/event-type-fields";
import { PlacePicker } from "@/components/place-picker";
import { Field, Input, Stack, Textarea } from "@/components/ui";
import type { DayEventType, TransportType } from "@/db/schema";

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
  // Name first (ticket 74): the thought before the paperwork, and the form's
  // one required field is the first thing you meet.
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
        {/* step={60}: a quarter-hour picker quietly rounded 10:50 to 10:45. */}
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
