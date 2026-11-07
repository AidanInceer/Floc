/**
 * The row of days across the top of the Days screen (ticket 298), grouped under each stay as the web's
 * Days strip is: a band with the bed and the place, the stay's days under it.
 *
 * DAY-FIRST, DRAWN (rule 3). The stays come from `deriveStops` over the `day` rows; nothing about a stop
 * is stored. The strip scrolls sideways because a phone has one column and a trip has many days.
 *
 * TODAY IS MARKED, NOT CENTRED ON. A trip that has not started has no today in range (rule 4).
 */
import { dayParts } from "@floc/core/dates/dates";
import { deriveStops } from "@floc/core/itinerary/stops";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { BedGlyph, ChevronGlyph } from "../system/glyphs";
import { useTheme } from "../system/theme";
import { stopLabel } from "@/lib/days/stop-label";
import { fonts, radius, size, space } from "@/lib/theme";

const CHIP = 42;
const GAP = space.xs;

type StripDay = { id: number; date: string; overnightPlaceId: number | null; overnightPlaceName: string | null };

function DayChip({ date, on, isToday, onPress }: { date: string; on: boolean; isToday: boolean; onPress: () => void }) {
  const { c } = useTheme();
  const { weekday, day } = dayParts(date);
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: on }}
      accessibilityLabel={isToday ? `${weekday} ${day}, today` : `${weekday} ${day}`}
      onPress={onPress}
      style={{ width: CHIP, alignItems: "center", paddingVertical: space.sm, borderRadius: radius.sm, backgroundColor: on ? c["pen-2"] : "transparent" }}
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

function StayBand({ name, width, current, onPress }: { name: string | null; width: number; current: boolean; onPress: () => void }) {
  const { c } = useTheme();
  const tone = current ? c.ink : c["ink-3"];
  const label = stopLabel(name, width);
  return (
    <View style={{ width, gap: space.xs }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={name ? `Sleeping in ${name} — change it` : "Overnight: not set — say where you are sleeping"}
        onPress={onPress}
        hitSlop={{ top: 8, bottom: 8, left: 2, right: 2 }}
        style={({ pressed }) => ({ height: 28, flexDirection: "row", alignItems: "center", gap: space.xs, opacity: pressed ? 0.6 : 1 })}
      >
        <BedGlyph color={tone} />
        {label.kind === "bed" ? null : (
          <Text numberOfLines={1} style={{ flexShrink: 1, color: tone, fontFamily: label.kind === "place" ? fonts.sansBold : fonts.sans, fontSize: size.label }}>
            {label.text}
          </Text>
        )}
        {label.kind === "bed" || label.text === "—" ? null : <ChevronGlyph color={c["ink-3"]} />}
      </Pressable>
      <View
        style={{
          height: name ? 2 : StyleSheet.hairlineWidth,
          borderRadius: radius.pill,
          backgroundColor: name ? (current ? c["ink-3"] : c.rule) : c["rule-2"],
        }}
      />
    </View>
  );
}

export function DayStrip({
  days,
  selected,
  todayDate,
  onSelect,
  onStop,
}: {
  days: StripDay[];
  selected: string;
  /** The real today, passed in so the component itself reads no clock. */
  todayDate: string;
  onSelect: (date: string) => void;
  /** The first date of the pressed stop, so the overnight editor opens on that run. */
  onStop: (startDate: string) => void;
}) {
  const scroller = useRef<ScrollView>(null);
  const [viewWidth, setViewWidth] = useState(0);
  const settled = useRef(false);
  const stays = deriveStops(days.map((d) => ({ dayId: d.id, date: d.date, overnightPlaceId: d.overnightPlaceId, overnightPlaceName: d.overnightPlaceName })));
  const index = days.findIndex((d) => d.date === selected);

  // Why: a long trip runs off the right edge, so the chosen day can start out of sight.
  useEffect(() => {
    if (index < 0 || viewWidth === 0) return;
    const x = space.lg + index * (CHIP + GAP) + CHIP / 2;
    scroller.current?.scrollTo({ x: Math.max(0, x - viewWidth / 2), animated: settled.current });
    settled.current = true;
  }, [index, viewWidth]);

  return (
    <ScrollView
      ref={scroller}
      onLayout={(e) => setViewWidth(e.nativeEvent.layout.width)}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: GAP, paddingHorizontal: space.lg }}
    >
      {stays.map((stay) => {
        const dates = days.filter((d) => stay.dayIds.includes(d.id)).map((d) => d.date);
        const width = dates.length * CHIP + (dates.length - 1) * GAP;
        return (
          <View key={stay.startDate} style={{ gap: space.xs }}>
            <StayBand name={stay.placeName} width={width} current={dates.includes(selected)} onPress={() => onStop(stay.startDate)} />
            <View style={{ flexDirection: "row", gap: GAP }}>
              {dates.map((date) => (
                <DayChip key={date} date={date} on={date === selected} isToday={date === todayDate} onPress={() => onSelect(date)} />
              ))}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}
