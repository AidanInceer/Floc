import { addDays, formatDateRange, type IsoDate } from "@floc/core/dates/dates";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../system/theme";
import { Toggle } from "../../system/ui";
import { fonts, radius, size, space } from "@/lib/theme";

/** Step three (ADR-025), as on the web: the dates as picked, then the two switches. */
export function ExtrasStep({ start, nights, ideas, events, onIdeas, onEvents, onChange }: {
  start: IsoDate;
  nights: number;
  ideas: boolean;
  events: boolean;
  onIdeas: (on: boolean) => void;
  onEvents: (on: boolean) => void;
  onChange: () => void;
}) {
  const { c } = useTheme();
  return (
    <View style={{ gap: space.md }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: space.sm,
          paddingVertical: space.sm + 2,
          paddingHorizontal: space.md,
          borderRadius: radius.sm,
          borderWidth: StyleSheet.hairlineWidth * 2,
          borderColor: c.rule,
          backgroundColor: c["sheet-2"],
        }}
      >
        <Text style={{ flex: 1, color: c.ink, fontFamily: fonts.type, fontSize: size.small }}>
          {formatDateRange(start, addDays(start, nights))} ·{" "}{nights}{" "}nights
        </Text>
        <Pressable accessibilityRole="button" onPress={onChange} style={{ minHeight: 44, minWidth: 44, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: c.pen, fontFamily: fonts.sans, fontSize: size.small }}>Change</Text>
        </Pressable>
      </View>
      <Text accessibilityRole="header" style={{ textAlign: "center", color: c.ink, fontFamily: fonts.sansBold, fontSize: size.body }}>
        What else comes across?
      </Text>
      <View>
        <Toggle label="Add ideas" hint="Other things to do at each stop, and other stops to swap in." value={ideas} onChange={onIdeas} />
        <Toggle label="Add events to the calendar" hint="Each day's plan, with times." value={events} onChange={onEvents} />
      </View>
    </View>
  );
}
