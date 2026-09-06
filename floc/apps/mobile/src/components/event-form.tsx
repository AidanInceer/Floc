/**
 * Add or edit one thing on a day (ticket 298).
 *
 * ONE FORM, BOTH JOBS. Add and edit differ only in what the fields start as
 * and where the result is sent, so two components would be the same component
 * twice — and the second one would drift.
 *
 * A BLANK TIME IS ALL-DAY, not an empty time. The API refuses `""`, and
 * rightly: a person who typed nothing did not mean midnight.
 *
 * TIMES ARE LOCAL TO THE ITINERARY (rule 10). `HH:MM` in, `HH:MM` out, and the
 * device clock is never asked what it thinks.
 */
import { DAY_EVENT_TYPES, type DayEventType } from "@floc/core/vocabulary";
import { useState } from "react";
import { View } from "react-native";

import { Body, Button, Card, Field, Segmented } from "./ui";
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
  label: type === "activity" ? "Doing" : type === "food" ? "Eating" : "Travel",
}));

export function EventForm({
  initial,
  busy,
  problem,
  onSave,
  onCancel,
  onDelete,
}: {
  initial?: EventDraft;
  busy: boolean;
  problem: string | null;
  onSave: (draft: EventDraft) => void;
  onCancel: () => void;
  /** Absent when adding — there is nothing yet to delete. */
  onDelete?: () => void;
}) {
  const [type, setType] = useState<DayEventType>(initial?.type ?? "activity");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [time, setTime] = useState(initial?.time ?? "");
  const [note, setNote] = useState(initial?.note ?? "");

  return (
    <Card>
      <View style={{ gap: space.md }}>
        <Segmented options={TYPES} value={type} onChange={setType} />
        <Field label="What" value={title} onChangeText={setTitle} autoFocus />
        <Field
          label="Time (optional)"
          value={time}
          onChangeText={setTime}
          placeholder="09:30"
          keyboardType="numbers-and-punctuation"
        />
        <Field
          label="Anything to remember (optional)"
          value={note}
          onChangeText={setNote}
          multiline
        />
        {problem ? <Body tone="red">{problem}</Body> : null}
        <Button
          label="Save"
          busy={busy}
          onPress={() =>
            onSave({
              type,
              title: title.trim(),
              allDay: time.trim() === "",
              time: time.trim() || null,
              note: note.trim() || null,
            })
          }
        />
        <Button label="Cancel" variant="quiet" onPress={onCancel} />
        {onDelete ? (
          <Button label="Delete this" variant="danger" onPress={onDelete} />
        ) : null}
      </View>
    </Card>
  );
}
