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
import { Pressable, ScrollView, Text, View } from "react-native";

import { BedGlyph } from "../system/glyphs";
import { useTheme } from "../system/theme";
import { fonts, radius, size, space } from "@/lib/theme";

const CHIP = 42;
const cityOf = (placeName: string) => placeName.split(",")[0];
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
      <Text style={{ color: on ? c["pen-deep"] : c["ink-3"], fontFamily: fonts.type, fontSize: size.label, textTransform: "uppercase", letterSpacing: 0.6 }}>{weekday}</Text>
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

function StayBand({ name, width }: { name: string | null; width: number }) {
  const { c } = useTheme();
  if (!name) return <View style={{ width, height: 24 }} />;
  return (
    <View accessibilityLabel={`Sleeping in ${name}`} style={{ width, height: 24, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.xs, paddingHorizontal: space.sm, borderRadius: radius.sm, backgroundColor: c["sheet-2"] }}>
      <BedGlyph color={c["ink-2"]} />
      {/* Why: a one-night stay is one chip wide; there the bed alone says it, and the label says where. */}
      {width < 80 ? null : <Text numberOfLines={1} style={{ flexShrink: 1, color: c["ink-2"], fontFamily: fonts.sansBold, fontSize: size.label + 1 }}>
        {cityOf(name)}
      </Text>}
    </View>
  );
}

export function DayStrip({
  days,
  selected,
  todayDate,
  onSelect,
}: {
  days: StripDay[];
  selected: string;
  /** The real today, passed in so the component itself reads no clock. */
  todayDate: string;
  onSelect: (date: string) => void;
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
            <StayBand name={stay.placeName} width={width} />
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
