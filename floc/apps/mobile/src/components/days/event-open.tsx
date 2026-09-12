/**
 * The event the Days screen has open (ticket 325) — the modal, with the
 * screen's own form inside it.
 *
 * ITS OWN FILE SO THE SCREEN STAYS READABLE. `Days` already holds the day
 * strip, the grid, the add form and four mutations; the picking-out of one
 * event and the shell around it is a separate job, and leaving it inline took
 * the screen past what one function is allowed to branch on.
 *
 * AN EVENT THAT HAS GONE DRAWS NOTHING. Deleting one leaves its id selected
 * for the frame before the day is refetched.
 */
import type { DayEventType } from "@floc/core/vocabulary";

import { EventForm, type EventDraft } from "./event-form";
import { EventModal } from "./event-modal";

export type OpenableEvent = {
  id: number;
  type: DayEventType;
  title: string | null;
  time: string | null;
  allDay: boolean;
  note: string | null;
};

export function EventOpen({
  events,
  eventId,
  tripId,
  viewerId,
  busy,
  problem,
  onSave,
  onDelete,
  onClose,
}: {
  events: OpenableEvent[];
  eventId: number;
  tripId: number;
  viewerId: string;
  busy: boolean;
  problem: string | null;
  onSave: (draft: EventDraft) => void;
  onDelete: (eventId: number) => void;
  onClose: () => void;
}) {
  const event = events.find((row) => row.id === eventId);
  if (!event) return null;

  const named = event.title ?? "Untitled";

  return (
    <EventModal
      open
      title={named}
      tripId={tripId}
      dayEventId={event.id}
      viewerId={viewerId}
      onClose={onClose}
    >
      <EventForm
        initial={{
          type: event.type,
          title: event.title ?? "",
          time: event.time,
          allDay: event.allDay,
          note: event.note,
        }}
        busy={busy}
        problem={problem}
        onSave={onSave}
        onDelete={() => onDelete(event.id)}
      />
    </EventModal>
  );
}
