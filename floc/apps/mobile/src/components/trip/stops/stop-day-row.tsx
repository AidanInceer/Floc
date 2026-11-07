// Why a fold, as the web's `stop-day.tsx`: a day opens in place to show what is on it; Days stays one tap further.
import type { DayEvent } from "@floc/api/port";
import { dayParts } from "@floc/core/dates/dates";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { KindTile } from "../../system/event-glyph";
import { ChevronGlyph } from "../../system/glyphs";
import { useTheme } from "../../system/theme";
import { DATE_INDENT, KIND_SLOT } from "./columns";
import { fonts, radius, size, space } from "@/lib/theme";

const label = (e: DayEvent) => e.title ?? e.placeName ?? "Untitled";

export function StopDayRow({ date, events, onOpen }: { date: string; events: DayEvent[]; onOpen: () => void }) {
  const { c } = useTheme();
  const [open, setOpen] = useState(false);
  const { weekday, day } = dayParts(date);
  const sorted = [...events].sort((a, b) => a.orderIndex - b.orderIndex);
  const [first] = sorted;
  const said = `${weekday} ${day}: ${first ? label(first) : "nothing planned"}${events.length > 1 ? `, and ${events.length - 1} more` : ""}`;
  return (
    <View style={{ borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.rule }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={said}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(!open)}
        style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: space.md, minHeight: 48, paddingVertical: space.sm, opacity: pressed ? 0.6 : 1 })}
      >
        <View style={{ width: 32, height: 32, borderRadius: radius.sm, backgroundColor: open ? c["pen-2"] : c["sheet-2"], alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: open ? c["pen-deep"] : c["ink-2"], fontFamily: fonts.type, fontSize: size.label - 2, textTransform: "uppercase", letterSpacing: 0.6 }}>{weekday}</Text>
          <Text style={{ color: open ? c["pen-deep"] : c["ink-2"], fontFamily: fonts.type, fontSize: size.small, lineHeight: 15, fontVariant: ["tabular-nums"] }}>{day}</Text>
        </View>
        {first ? <KindTile type={first.type} transportType={first.transportType} /> : <View style={{ width: KIND_SLOT }} />}
        <Text numberOfLines={1} style={{ flex: 1, color: first ? c.ink : c["ink-3"], fontFamily: fonts.sans, fontSize: size.small }}>
          {first ? label(first) : "Nothing planned"}
        </Text>
        {events.length > 1 ? (
          <Text style={{ color: c["ink-3"], fontFamily: fonts.sans, fontSize: size.small }}>
            <Text style={{ fontFamily: fonts.type, fontVariant: ["tabular-nums"] }}>{`+${events.length - 1}`}</Text>
            {" more"}
          </Text>
        ) : null}
        <ChevronGlyph color={c["ink-3"]} open={open} />
      </Pressable>
      {open ? (
        <View style={{ paddingLeft: DATE_INDENT, paddingBottom: space.md, gap: space.sm }}>
          {sorted.map((e) => (
            <View key={e.id} style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
              <KindTile type={e.type} transportType={e.transportType} />
              <Text style={{ flex: 1, color: c.ink, fontFamily: fonts.sans, fontSize: size.small }}>{label(e)}</Text>
              <Text style={{ color: c["ink-3"], fontFamily: fonts.type, fontSize: size.label, fontVariant: ["tabular-nums"] }}>{e.time ?? "All day"}</Text>
            </View>
          ))}
          <Pressable accessibilityRole="link" onPress={onOpen} hitSlop={12} style={{ alignSelf: "flex-start", paddingVertical: space.xs }}>
            <Text style={{ color: c.pen, fontFamily: fonts.sans, fontSize: size.small }}>{events.length > 0 ? "Open on Days →" : "Plan it on Days →"}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
