// Why a link, not a fold: the web opens a day in place; on the phone the Days tab is one tap away and owns the day.
import type { DayEvent } from "@floc/api/port";
import { dayParts } from "@floc/core/dates/dates";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { KindTile } from "../../system/event-glyph";
import { ChevronGlyph } from "../../system/glyphs";
import { useTheme } from "../../system/theme";
import { fonts, radius, size, space } from "@/lib/theme";

const label = (e: DayEvent) => e.title ?? e.placeName ?? "Untitled";

export function StopDayRow({ date, events, onOpen }: { date: string; events: DayEvent[]; onOpen: () => void }) {
  const { c } = useTheme();
  const { weekday, day } = dayParts(date);
  const [first] = [...events].sort((a, b) => a.orderIndex - b.orderIndex);
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${weekday} ${day}: ${first ? label(first) : "nothing planned"}${events.length > 1 ? `, and ${events.length - 1} more` : ""}. Open on Days`}
      onPress={onOpen}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: space.md,
        minHeight: 48,
        paddingVertical: space.sm,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: c.rule,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <View style={{ width: 32, height: 32, borderRadius: radius.sm, backgroundColor: c["sheet-2"], alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: c["ink-2"], fontFamily: fonts.type, fontSize: 8, textTransform: "uppercase", letterSpacing: 0.6 }}>{weekday}</Text>
        <Text style={{ color: c["ink-2"], fontFamily: fonts.type, fontSize: size.small, lineHeight: 15, fontVariant: ["tabular-nums"] }}>{day}</Text>
      </View>
      {first ? (
        <KindTile type={first.type} transportType={first.transportType} />
      ) : (
        <View style={{ width: 26, height: 26, borderRadius: radius.sm, borderWidth: 1.5, borderStyle: "dashed", borderColor: c["rule-2"] }} />
      )}
      <Text numberOfLines={1} style={{ flex: 1, color: first ? c.ink : c["ink-3"], fontFamily: fonts.sans, fontSize: size.small }}>
        {first ? label(first) : "…"}
      </Text>
      {events.length > 1 ? (
        <Text style={{ color: c["ink-3"], fontFamily: fonts.type, fontSize: size.label, fontVariant: ["tabular-nums"] }}>+{events.length - 1}</Text>
      ) : null}
      <View style={{ transform: [{ rotate: "-90deg" }] }}>
        <ChevronGlyph color={c["ink-3"]} />
      </View>
    </Pressable>
  );
}
