"use client";

// Add/edit event form (tickets 103, 321), drawn as wireframe/modal-forms B3. `autosave`
// is the modal's edit mode: no submit button, saves on change. dayId/eventId ride as
// hidden fields since the client picked them; submitEvent re-checks (rule 5).

import { useState, type ComponentProps } from "react";
import { useFormStatus } from "react-dom";

import { EventHead, EventWhen } from "@/components/days/event-sheet/event-head";
import { EventTypeTiles } from "@/components/days/event-sheet/event-type-tiles";
import { useEventAutosave } from "@/components/days/use-event-autosave";
import { PlacePicker } from "@/components/social/place-picker";
import { SubmitButton } from "@/components/system/client-ui";
import { DialogClose } from "@/components/system/dialog";
import { buttonClass, cx, panelBandClass, panelFieldClass, panelTitleClass } from "@/components/system/ui";
import type { DayEventType, TransportType } from "@/db/schema";
import { TEXT_CAPS } from "@floc/core/text/text";

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
  dateLabel,
  autosave = false,
}: {
  action: (formData: FormData) => Promise<void>;
  searchPlaces: PlaceSearch;
  defaults: EventFormDefaults;
  /** "Sat 1 May" — the day the event sits on, in the form's head. */
  dateLabel: string;
  /** In the event modal: no submit button, saves on change (ticket 321). */
  autosave?: boolean;
}) {
  const [type, setType] = useState<DayEventType>(defaults.type ?? "activity");
  const [how, setHow] = useState<TransportType | null>(defaults.transportType ?? null);
  const [allDay, setAllDay] = useState(defaults.allDay ?? false);
  const [title, setTitle] = useState(defaults.title ?? "");
  const { formRef, changed, formProps } = useEventAutosave({ autosave, eventId: defaults.eventId, action });

  const pickType = (next: DayEventType) => {
    setType(next);
    if (next !== "transport") setHow(null);
    changed({ type: next, transportType: next === "transport" ? how : null });
  };

  return (
    <form ref={formRef} {...formProps}>
      <input type="hidden" name="dayId" value={defaults.dayId} />
      {defaults.eventId ? <input type="hidden" name="eventId" value={defaults.eventId} /> : null}
      <EventHead
        dateLabel={dateLabel}
        type={type}
        how={how}
        title={title}
        onTitle={setTitle}
        aside={autosave ? <SaveStatus /> : null}
        autoFocus={!autosave}
        when={
          <EventWhen
            time={defaults.time}
            endTime={defaults.endTime}
            allDay={allDay}
            onAllDay={() => { setAllDay(!allDay); changed({ allDay: !allDay }); }}
          />
        }
      />
      <div className="px-5 py-4 max-sm:px-4">
        <EventTypeTiles type={type} how={how} onType={pickType} onHow={(next) => { setHow(next); changed({ transportType: next }); }} />
      </div>
      <div className={panelBandClass}>
        <PlacePicker
          name="place"
          look="panel"
          defaultName={defaults.placeName ?? ""}
          search={searchPlaces}
          onSelect={autosave ? (picked) => { if (picked.providerId) changed({}); } : undefined}
        />
      </div>
      <label className={cx("block", panelBandClass)}>
        <span className={cx(panelTitleClass, "mb-2")}>Notes</span>
        <textarea name="note" rows={2} maxLength={TEXT_CAPS.eventNote} defaultValue={defaults.note ?? ""} className={cx(panelFieldClass, "min-h-16 resize-y")} />
      </label>
      {autosave ? null : (
        <footer className="flex items-center justify-end gap-2 border-t border-rule px-5 py-3 max-sm:px-4">
          <DialogClose className={buttonClass("secondary")}>Cancel</DialogClose>
          <SubmitButton disabled={!title.trim()}>{defaults.eventId ? "Save event" : "Add event"}</SubmitButton>
        </footer>
      )}
    </form>
  );
}

/** The autosave form's only feedback — a word, never colour alone. */
function SaveStatus() {
  const { pending } = useFormStatus();
  return (
    <span className="opacity-75" role="status" aria-live="polite">
      {pending ? "Saving…" : "Saved"}
    </span>
  );
}
