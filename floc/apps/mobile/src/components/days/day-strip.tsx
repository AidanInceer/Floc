/**
 * Why: one trip week at a time, as on the web (wireframe/days-week A), so a long trip never
 * scrolls sideways. Stops come from the `day` rows, never stored (rule 3); today is marked, not centred on (rule 4).
 */
import { dayParts } from "@floc/core/dates/dates";
import { deriveStops, nightsLabel } from "@floc/core/itinerary/stops";
import { stopWeek, type WeekSegment } from "@floc/core/itinerary/stop-weeks";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { BedGlyph, ChevronGlyph, MoonGlyph } from "../system/glyphs";
import { IconButton } from "../system/ui";
import { useTheme } from "../system/theme";
import { stopLabel } from "@/lib/days/stop-label";
import { fonts, radius, size, space } from "@/lib/theme";

const GAP = 3;
const PILL = 28;

type StripDay = { id: number; date: string; overnightPlaceId: number | null; overnightPlaceName: string | null };

function DayChip({ date, on, isToday, onPress }: { date: string; on: boolean; isToday: boolean; onPress?: () => void }) {
  const { c } = useTheme();
  const { weekday, day } = dayParts(date);
  const out = !onPress;
  return (
    <Pressable
      accessibilityRole={out ? undefined : "tab"}
      accessibilityState={out ? undefined : { selected: on }}
      accessibilityLabel={out ? undefined : isToday ? `${weekday} ${day}, today` : `${weekday} ${day}`}
      accessibilityElementsHidden={out}
      importantForAccessibility={out ? "no-hide-descendants" : "auto"}
      disabled={out}
      onPress={onPress}
      style={{ flex: 1, alignItems: "center", paddingVertical: space.sm, borderRadius: radius.sm, backgroundColor: on ? c["pen-2"] : "transparent", opacity: out ? 0.4 : 1 }}
    >
      <Text style={{ color: on ? c["pen-deep"] : c["ink-3"], fontFamily: fonts.type, fontSize: size.label }}>{weekday}</Text>
      <Text
        style={{
          color: on ? c["pen-deep"] : c.ink,
          fontFamily: fonts.typeBold,
          fontSize: size.body + 2,
          fontVariant: ["tabular-nums"],
          textDecorationLine: isToday ? "underline" : "none",
        }}
      >
        {day}
      </Text>
    </Pressable>
  );
}

function StopPill({ segment, column, onPress }: { segment: WeekSegment; column: number; onPress: () => void }) {
  const { c } = useTheme();
  const { stop, span, cutLeft, cutRight } = segment;
  const width = span * column + (span - 1) * GAP;
  const label = stopLabel(stop.placeName, width);
  const named = !!stop.placeName;
  const ink = named ? c["pastel-blue-ink"] : c["highlight-ink"];
  const edge = named ? c["pastel-blue-edge"] : c["highlight-edge"];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={named ? `Overnight: ${stop.placeName}, ${nightsLabel(stop.nights)} — change it` : "Overnight: not set — say where you are sleeping"}
      onPress={onPress}
      hitSlop={{ top: 8 }}
      style={({ pressed }) => ({
        position: "absolute",
        left: segment.column * (column + GAP),
        width,
        height: PILL,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: label.kind === "bed" ? "center" : "flex-start",
        gap: space.xs,
        paddingHorizontal: 6,
        borderWidth: 1,
        borderStyle: named ? "solid" : "dashed",
        borderColor: pressed ? ink : edge,
        borderLeftWidth: cutLeft ? 0 : 1,
        borderRightWidth: cutRight ? 0 : 1,
        borderTopLeftRadius: cutLeft ? 0 : radius.sm,
        borderBottomLeftRadius: cutLeft ? 0 : radius.sm,
        borderTopRightRadius: cutRight ? 0 : radius.sm,
        borderBottomRightRadius: cutRight ? 0 : radius.sm,
        backgroundColor: named ? c["pastel-blue"] : c.highlight,
      })}
    >
      {cutLeft ? <CutEdge side="left" color={edge} /> : null}
      {cutRight ? <CutEdge side="right" color={edge} /> : null}
      <BedGlyph color={ink} />
      {label.kind === "bed" ? null : (
        <Text numberOfLines={1} style={{ flex: 1, color: ink, fontFamily: label.kind === "place" ? fonts.sansBold : fonts.sans, fontSize: size.label }}>
          {label.text}
        </Text>
      )}
      {named && stop.nights > 0 && span > 2 ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
          <Text style={{ color: ink, fontFamily: fonts.type, fontSize: size.label, fontVariant: ["tabular-nums"] }}>{stop.nights}</Text>
          <MoonGlyph color={ink} />
        </View>
      ) : null}
    </Pressable>
  );
}

// Why: React Native cannot dash one side of a border, so a stop that runs on into the next week draws its cut side as dashes.
function CutEdge({ side, color }: { side: "left" | "right"; color: string }) {
  return (
    <View pointerEvents="none" style={{ position: "absolute", top: 0, bottom: 0, [side]: 0, width: 1, justifyContent: "space-between", paddingVertical: 1 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <View key={i} style={{ height: 3, backgroundColor: color }} />
      ))}
    </View>
  );
}

function WeekStep({ side, onPress }: { side: "left" | "right"; onPress?: () => void }) {
  return (
    <IconButton label={side === "left" ? "Week before" : "Week after"} disabled={!onPress} onPress={() => onPress?.()}>
      {(color) => (
        <View style={{ transform: [{ rotate: side === "left" ? "90deg" : "-90deg" }] }}>
          <ChevronGlyph color={color} />
        </View>
      )}
    </IconButton>
  );
}

export function DayStrip({
  days,
  selected,
  todayDate,
  tripEnd,
  onSelect,
  onStop,
}: {
  days: StripDay[];
  /** The trip's end date, so the strip counts nights as the Overview does. */
  tripEnd?: string | null;
  selected: string;
  /** The real today, passed in so the component itself reads no clock. */
  todayDate: string;
  onSelect: (date: string) => void;
  /** The first date of the pressed stop, so the overnight editor opens on that run. */
  onStop: (startDate: string) => void;
}) {
  const { c } = useTheme();
  const [weekWidth, setWeekWidth] = useState(0);
  const stops = deriveStops(days.map((d) => ({ dayId: d.id, date: d.date, overnightPlaceId: d.overnightPlaceId, overnightPlaceName: d.overnightPlaceName })), tripEnd);
  const week = stopWeek(days.map((d) => d.date), stops, days.findIndex((d) => d.date === selected));
  const many = week.weeks > 1;
  const column = (weekWidth - 6 * GAP) / 7;
  const step = (to: number | null) => (to === null ? undefined : () => onSelect(days[to]!.date));

  return (
    <View style={{ paddingHorizontal: space.md, paddingBottom: space.sm, gap: space.xs }}>
      {many ? (
        <Text style={{ textAlign: "center", color: c["ink-3"], fontFamily: fonts.type, fontSize: size.label, fontVariant: ["tabular-nums"] }}>{week.note}</Text>
      ) : null}
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.xs }}>
        {many ? <WeekStep side="left" onPress={step(week.before)} /> : null}
        <View style={{ flex: 1, gap: space.xs }} onLayout={(e) => setWeekWidth(e.nativeEvent.layout.width)}>
          <View style={{ height: PILL }}>
            {weekWidth > 0
              ? week.segments.map((segment) => (
                  <StopPill key={segment.stop.startDate} segment={segment} column={column} onPress={() => onStop(segment.stop.startDate)} />
                ))
              : null}
          </View>
          <View style={{ flexDirection: "row", gap: GAP }}>
            {week.dates.map((date) => (
              <DayChip key={date} date={date} on={date === selected} isToday={date === todayDate} onPress={() => onSelect(date)} />
            ))}
            {week.pad.map((date) => (
              <DayChip key={date} date={date} on={false} isToday={false} />
            ))}
          </View>
        </View>
        {many ? <WeekStep side="right" onPress={step(week.after)} /> : null}
      </View>
    </View>
  );
}
