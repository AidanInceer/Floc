"use client";

// Add/edit event form (tickets 103, 321). `autosave` is the modal's edit mode:
// no submit button, saves on change. dayId/eventId ride as hidden fields since
// the client picked them; submitEvent re-checks (rule 5).

import { useCallback, useRef, type ComponentProps } from "react";
import { useFormStatus } from "react-dom";

import { SubmitButton } from "@/components/system/client-ui";
import { EventTimeFields } from "@/components/days/event-time-fields";
import { EventTypeFields } from "@/components/days/event-type-fields";
import { PlacePicker } from "@/components/social/place-picker";
import { Field, Input, Stack, Textarea } from "@/components/system/ui";
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
  autosave = false,
}: {
  action: (formData: FormData) => Promise<void>;
  searchPlaces: PlaceSearch;
  defaults: EventFormDefaults;
  /** In the event modal: no submit button, saves on change (ticket 321). */
  autosave?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    formRef.current?.requestSubmit();
  }, []);
  const saveSoon = useCallback(() => {
    if (!autosave) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => formRef.current?.requestSubmit(), 700);
  }, [autosave]);

  // Name first (ticket 74): the thought before the paperwork, and the form's
  // one required field is the first thing you meet.
  return (
    <form
      ref={formRef}
      action={action}
      onChange={autosave ? saveSoon : undefined}
      onBlur={autosave ? save : undefined}
    >
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
          onSelect={autosave ? save : undefined}
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
        {autosave ? (
          <SaveStatus />
        ) : (
          <SubmitButton>{defaults.eventId ? "Save event" : "Add event"}</SubmitButton>
        )}
      </Stack>
    </form>
  );
}

/** The autosave form's only feedback — a word, never colour alone. */
function SaveStatus() {
  const { pending } = useFormStatus();
  return (
    <p className="text-sm text-ink-faint" role="status" aria-live="polite">
      {pending ? "Saving…" : "Saved automatically"}
    </p>
  );
}
