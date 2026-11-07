"use client";

// Add/edit event form (tickets 103, 321), drawn as wireframe/modal-forms B3. `autosave`
// is the modal's edit mode: no submit button, saves on change. dayId/eventId ride as
// hidden fields since the client picked them; submitEvent re-checks (rule 5).

import { useCallback, useEffect, useRef, useState, type ComponentProps } from "react";
import { useFormStatus } from "react-dom";

import { EventHead, EventWhen } from "@/components/days/event-sheet/event-head";
import { EventTypeTiles } from "@/components/days/event-sheet/event-type-tiles";
import { PlacePicker } from "@/components/social/place-picker";
import { SubmitButton } from "@/components/system/client-ui";
import { DialogClose } from "@/components/system/dialog";
import { buttonClass } from "@/components/system/ui";
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

const NOTE =
  "block min-h-14 w-full resize-y border-0 border-b border-rule-strong bg-transparent py-1.5 text-[15px] leading-snug text-ink transition-colors hover:border-ink-faint focus:border-pen focus:shadow-[0_1px_0_var(--pen)] focus:outline-none";

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
  const formRef = useRef<HTMLFormElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = useRef(false);
  const [type, setType] = useState<DayEventType>(defaults.type ?? "activity");
  const [how, setHow] = useState<TransportType | null>(defaults.transportType ?? null);
  const [allDay, setAllDay] = useState(defaults.allDay ?? false);
  const [title, setTitle] = useState(defaults.title ?? "");

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  // A nameless event is never sent: the add button waits for a name, and the
  // edit form simply holds its save until there is one again.
  const save = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    const form = formRef.current;
    const name = form?.elements.namedItem("title") as HTMLInputElement | null;
    if (!form || !dirty.current || !name?.value.trim()) return;
    dirty.current = false;
    form.requestSubmit();
  }, []);
  const saveSoon = useCallback(() => {
    if (!autosave) return;
    dirty.current = true;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(save, 700);
  }, [autosave, save]);

  const pickType = (next: DayEventType) => {
    setType(next);
    if (next !== "transport") setHow(null);
    saveSoon();
  };

  return (
    <form ref={formRef} action={action} onChange={autosave ? saveSoon : undefined} onBlur={autosave ? save : undefined}>
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
            onAllDay={() => { setAllDay(!allDay); saveSoon(); }}
          />
        }
      />
      <div className="space-y-[18px] px-5 pb-5 pt-[18px] max-sm:px-4">
        <EventTypeTiles type={type} how={how} onType={pickType} onHow={(next) => { setHow(next); saveSoon(); }} />
        <PlacePicker
          name="place"
          look="line"
          defaultName={defaults.placeName ?? ""}
          search={searchPlaces}
          onSelect={autosave ? (picked) => { if (picked.providerId) saveSoon(); } : undefined}
        />
        <label className="block">
          <span className="mb-1 block font-mono text-xs text-ink-faint">Notes</span>
          <textarea name="note" rows={2} maxLength={TEXT_CAPS.eventNote} defaultValue={defaults.note ?? ""} className={NOTE} />
        </label>
      </div>
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
