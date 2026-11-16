import type { ReactNode } from "react";

import { EventSheet } from "./event-sheet";
import { EventTalk } from "../comments/event-talk";
import { EventFiles } from "../files/event-files";

export function EventModal({
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
