import type { DayEvent } from "@floc/api/port";
import { dayParts } from "@floc/core/dates/dates";
import { Fragment, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ChangeWords } from "../../notifications/change-words";
import { KindTile } from "../../system/event-glyph";
import { ChevronGlyph } from "../../system/glyphs";
import { useTheme } from "../../system/theme";
import { Pill } from "../../system/ui";
import type { StopMark } from "../overview/change-note";
import { DATE_INDENT, KIND_SLOT } from "./columns";
import { fonts, radius, size, space } from "@/lib/theme";
import { eventName } from "@floc/core/itinerary/names/event-name";


export function StopDayRow({
  date,
  events,
  onOpen,
  mark,
  onMarked,
}: {
  date: string;
  events: DayEvent[];
  onOpen: () => void;
  mark?: StopMark | null;
  onMarked?: (row: View) => void;
}) {
  const { c } = useTheme();
  const [open, setOpen] = useState(Boolean(mark));
  const row = useRef<View>(null);
  const markId = mark?.id;
  useEffect(() => {
    setOpen(Boolean(markId));
    if (markId && row.current) onMarked?.(row.current);
  }, [markId, onMarked]);
  const { weekday, day } = dayParts(date);
  const sorted = [...events].sort((a, b) => a.orderIndex - b.orderIndex);
  const [first] = sorted;
  const onRow = sorted.some((e) => e.id === mark?.eventId);
  const said = `${weekday} ${day}: ${first ? eventName(first) : "nothing planned"}${events.length > 1 ? `, and ${events.length - 1} more` : ""}`;
  return (
    <View ref={row} style={{ borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.rule }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={said}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((was) => !was)}
        style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: space.md, minHeight: 48, paddingVertical: space.sm, opacity: pressed ? 0.6 : 1 })}
      >
        <View style={{ width: 32, height: 32, borderRadius: radius.sm, backgroundColor: open ? c["pen-2"] : c["sheet-2"], alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: open ? c["pen-deep"] : c["ink-2"], fontFamily: fonts.type, fontSize: size.label - 2, textTransform: "uppercase", letterSpacing: 0.6 }}>{weekday}</Text>
          <Text style={{ color: open ? c["pen-deep"] : c["ink-2"], fontFamily: fonts.type, fontSize: size.small, lineHeight: 15, fontVariant: ["tabular-nums"] }}>{day}</Text>
        </View>
        {first ? <KindTile type={first.type} transportType={first.transportType} /> : <View style={{ width: KIND_SLOT }} />}
        <Text numberOfLines={1} style={{ flex: 1, color: first ? c.ink : c["ink-3"], fontFamily: fonts.sans, fontSize: size.small }}>
          {first ? eventName(first) : "Nothing planned"}
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
          {sorted.map((e) => {
            const changed = mark?.eventId === e.id;
            return (
              <Fragment key={e.id}>
                <View
                  style={[
                    { flexDirection: "row", alignItems: "center", gap: space.md },
                    changed ? { marginHorizontal: -space.xs, padding: space.xs, borderRadius: radius.sm, backgroundColor: c["highlight-2"] } : null,
                  ]}
                >
                  {changed ? (
                    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius.sm, borderWidth: 1.5, borderColor: c.pen, opacity: 0.6 }]} />
                  ) : null}
                  <KindTile type={e.type} transportType={e.transportType} />
                  <View style={{ flex: 1, gap: space.xs }}>
                    <Text style={{ color: c.ink, fontFamily: fonts.sans, fontSize: size.small }}>{eventName(e)}</Text>
                    {changed && mark ? (
                      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: space.sm }}>
                        <Pill word={mark.tag} tone="pastel-yellow" sentence />
                        {mark.was ? <ChangeWords was={mark.was} now={null} /> : null}
                      </View>
                    ) : null}
                  </View>
                  <Text style={{ color: c["ink-3"], fontFamily: fonts.type, fontSize: size.label, fontVariant: ["tabular-nums"] }}>{e.time ?? "All day"}</Text>
                </View>
                {changed && mark ? mark.note(true) : null}
              </Fragment>
            );
          })}
          {mark && !onRow ? mark.note(false) : null}
          <Pressable accessibilityRole="link" onPress={onOpen} hitSlop={12} style={{ alignSelf: "flex-start", paddingVertical: space.xs }}>
            <Text style={{ color: c.pen, fontFamily: fonts.sans, fontSize: size.small }}>{events.length > 0 ? "Open on Days →" : "Plan it on Days →"}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
