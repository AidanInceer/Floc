import { TEXT_CAPS } from "@floc/core/text/text";
import { EVENT_CATEGORIES } from "@floc/core/itinerary/event-categories";
import { DAY_EVENT_TYPES, type DayEventType } from "@floc/core/vocabulary";
import { useState } from "react";
import { View } from "react-native";

import { TimeField } from "./time-field";
import { Body, Button, Card, Field, Segmented } from "../system/ui";
import { space } from "@/lib/theme";

export type EventDraft = {
  type: DayEventType;
  title: string;
  time: string | null;
  allDay: boolean;
  note: string | null;
};

const TYPES = DAY_EVENT_TYPES.map((type) => ({
  value: type,
  label: EVENT_CATEGORIES[type].label,
}));

export function EventForm({
  initial,
  busy,
  problem,
  onSave,
  onDelete,
}: {
  initial?: EventDraft;
  busy: boolean;
  problem: string | null;
  onSave: (draft: EventDraft) => void;
  onDelete?: () => void;
}) {
  const [type, setType] = useState<DayEventType>(initial?.type ?? "activity");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [time, setTime] = useState<string | null>(initial?.time ?? null);
  const [note, setNote] = useState(initial?.note ?? "");

  return (
    <Card>
      <View style={{ gap: space.md }}>
        <Segmented options={TYPES} value={type} onChange={setType} />
        <Field label="What" value={title} onChangeText={setTitle} maxLength={TEXT_CAPS.eventTitle} autoFocus />
        <TimeField value={time} onChange={setTime} />
        <Field
          label="Notes"
          value={note}
          onChangeText={setNote}
          maxLength={TEXT_CAPS.eventNote}
          multiline
        />
        {problem ? <Body tone="red">{problem}</Body> : null}
        <View style={{ flexDirection: "row", gap: space.sm }}>
          {onDelete ? (
            <View style={{ flex: 1 }}>
              <Button label="Delete" variant="danger" onPress={onDelete} />
            </View>
          ) : null}
          <View style={{ flex: 2 }}>
            <Button
              label="Save"
              busy={busy}
              onPress={() =>
                onSave({
                  type,
                  title: title.trim(),
                  allDay: time === null,
                  time,
                  note: note.trim() || null,
                })
              }
            />
          </View>
        </View>
      </View>
    </Card>
  );
}
