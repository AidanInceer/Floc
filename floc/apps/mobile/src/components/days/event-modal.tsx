/**
 * One event, opened (ticket 325) — the phone's half of the web's event modal.
 *
 * ONE SCROLL, NOT TABS. Variant B of #255: the facts, then its files, then the
 * talk about it, in one column. Tabs would hide two thirds of an event behind
 * a control, and an event is small enough that all of it fits in a thumb's
 * travel.
 *
 * IT REPLACES EDITING IN PLACE. The grid used to swap itself for a form, which
 * meant opening an event lost sight of the day and left nowhere to put the
 * event's files or the talk about it.
 *
 * THE FACTS ARRIVE AS A CHILD, the other two fetch their own. The screen owns
 * the event's own mutations already — it drew the form before this existed —
 * whereas files and comments are nothing the Days screen otherwise knows.
 */
import type { ReactNode } from "react";
import { View } from "react-native";

import { EventSheet } from "./event-sheet";
import { EventTalk } from "../comments/event-talk";
import { EventFiles } from "../files/event-files";
import { Label } from "../system/ui";
import { space } from "@/lib/theme";

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
  /** The event's own facts — the screen's form, which already owns its mutations. */
  children: ReactNode;
}) {
  return (
    <EventSheet open={open} title={title} onClose={onClose}>
      {children}

      <EventFiles tripId={tripId} dayEventId={dayEventId} />

      <View style={{ gap: space.sm }}>
        <Label>Talk about this</Label>
        <EventTalk tripId={tripId} dayEventId={dayEventId} viewerId={viewerId} />
      </View>
    </EventSheet>
  );
}
