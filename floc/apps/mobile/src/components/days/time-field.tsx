/**
 * When a thing on a day happens (#302).
 *
 * WHY IT IS NOT A TEXT FIELD ANY MORE. It was, with a `09:30` placeholder, and
 * typing `9:30` sent a string the API refuses — the screen fell over rather
 * than saying so. A control that can be typed into wrongly is a control that
 * will be. There is nothing to type here now.
 *
 * TWO LISTS, NOT A CLOCK DIAL. `@react-native-community/datetimepicker` is a
 * native module, so it means a rebuild and a store build, for a question two
 * dropdowns answer. The minute list is in fives; anything else already stored
 * is kept as its own option so an event written on the website does not shift
 * itself the first time a phone opens it.
 *
 * ALL DAY IS THE OTHER ANSWER, not an empty time — see `event-form`. The
 * segmented control asks that first, because it decides whether the rest of
 * the question exists at all.
 *
 * TIMES ARE LOCAL TO THE ITINERARY (rule 10). `HH:MM` in, `HH:MM` out, and the
 * device clock is never asked what it thinks.
 */
import { View } from "react-native";

import { Dropdown, Label, Segmented } from "../system/ui";
import { space } from "@/lib/theme";

const WHEN = [
  { value: "all-day" as const, label: "All day" },
  { value: "at" as const, label: "At a time" },
];

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const value = String(i).padStart(2, "0");
  return { value, label: value };
});

/** Fives, plus whatever this event already says — see the file's note. */
function minuteOptions(current: string): { value: string; label: string }[] {
  const fives = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));
  const all = fives.includes(current) ? fives : [...fives, current].sort();
  return all.map((value) => ({ value, label: value }));
}

export function TimeField({
  value,
  onChange,
}: {
  /** `HH:MM`, or null for all day. */
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  const [hour, minute] = (value ?? "09:00").split(":");

  return (
    <View style={{ gap: space.sm }}>
      <Label>When</Label>
      <Segmented
        options={WHEN}
        value={value === null ? "all-day" : "at"}
        onChange={(when) => onChange(when === "all-day" ? null : "09:00")}
      />
      {value !== null ? (
        <View style={{ flexDirection: "row", gap: space.sm }}>
          <View style={{ flex: 1 }}>
            <Dropdown
              label="Hour"
              options={HOURS}
              value={hour}
              onChange={(next) => onChange(`${next}:${minute}`)}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Dropdown
              label="Minute"
              options={minuteOptions(minute)}
              value={minute}
              onChange={(next) => onChange(`${hour}:${next}`)}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}
