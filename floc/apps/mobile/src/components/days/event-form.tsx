/**
 * Add or edit one thing on a day (ticket 298).
 *
 * ONE FORM, BOTH JOBS. Add and edit differ only in what the fields start as
 * and where the result is sent, so two components would be the same component
 * twice — and the second one would drift.
 *
 * ALL DAY IS AN ANSWER, not an empty field. `TimeField` asks it outright, so
 * "no time" is something chosen rather than something left blank — and the
 * time itself can no longer be typed wrongly (see that file).
 *
 * NO CANCEL. The form only ever opens in a sheet, and the sheet's own X is the
 * way out — a second one is the same door twice (#325 feedback).
 *
 * SAVE AND DELETE SHARE THE ROW. Delete sits where Cancel did, narrow and on
 * the left, so the thumb that reached for Save still lands on Save.
 *
 * TIMES ARE LOCAL TO THE ITINERARY (rule 10). `HH:MM` in, `HH:MM` out, and the
 * device clock is never asked what it thinks.
 */
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

// The same words the website uses, out of the same table — the phone used to
// say "Doing / Travel / Eating", which is a second vocabulary for one thing.
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
  /** Absent when adding — there is nothing yet to delete. */
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
        <Field label="What" value={title} onChangeText={setTitle} autoFocus />
        <TimeField value={time} onChange={setTime} />
        <Field
          label="Notes"
          value={note}
          onChangeText={setNote}
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
