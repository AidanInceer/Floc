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

function minuteOptions(current: string): { value: string; label: string }[] {
  const fives = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));
  const all = fives.includes(current) ? fives : [...fives, current].sort((a, b) => a.localeCompare(b));
  return all.map((value) => ({ value, label: value }));
}

export function TimeField({
  value,
  onChange,
}: {
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
