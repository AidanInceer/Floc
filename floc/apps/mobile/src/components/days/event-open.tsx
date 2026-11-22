import type { ReactNode } from "react";

import { EventForm, type EventDraft } from "./event-form";
import { EventSheet } from "./event-sheet";
import { EventTalk } from "../comments/event-talk";
import { EventFiles } from "../files/event-files";
import { eventName } from "@floc/core/itinerary/names/event-name";
import type { DayEventType } from "@floc/core/vocabulary";

function EventModal({
  open,
  title,
  tripId,
  dayEventId,
  viewerId,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  tripId: number;
  dayEventId: number;
  viewerId: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <EventSheet open={open} title={title} onClose={onClose}>
      {children}

      <EventFiles tripId={tripId} dayEventId={dayEventId} />

      <EventTalk tripId={tripId} dayEventId={dayEventId} viewerId={viewerId} />
    </EventSheet>
  );
}

export type OpenableEvent = {
  id: number;
  type: DayEventType;
  title: string | null;
  placeName: string | null;
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

  const named = eventName(event);

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
