/**
 * Under the Dates grid in Weather view: the day you tapped, its hours, and the
 * key. A free trip gets the reason instead — the mode is never hidden (#248).
 */
import { formatDate } from "@floc/core/dates/dates";
import type { WeatherCondition } from "@floc/core/itinerary/weather";
import { StyleSheet, Text, View } from "react-native";

import { WeatherGlyph } from "../system/glyphs";
import { useTheme } from "../system/theme";
import { Body, Button, Figure, Label } from "../system/ui";
import { HourlyCurve, type HourlyPoint } from "./hourly-curve";
import { fonts, radius, size, space } from "@/lib/theme";
import type { TokenName } from "@floc/core/design/tokens";

export type ForecastDay = { date: string; condition: WeatherCondition; label: string; hi: number; lo: number };

/** Ground and ink per condition — tokens, and always a word beside them (#204). */
export const WEATHER_LOOK: Record<WeatherCondition, { ground: TokenName; ink: TokenName; word: string }> = {
  sun: { ground: "highlight", ink: "highlight-ink", word: "Sun" },
  part: { ground: "highlight-2", ink: "ink", word: "Sun and cloud" },
  cloud: { ground: "sheet-3", ink: "ink", word: "Cloud" },
  rain: { ground: "pen-2", ink: "pen-deep", word: "Rain" },
};

function Legend() {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.md }}>
      {Object.values(WEATHER_LOOK).map((look) => (
        <View key={look.word} style={{ flexDirection: "row", alignItems: "center", gap: space.xs }}>
          <View
            style={{
              width: 12,
              height: 12,
              borderRadius: radius.sm / 3,
              backgroundColor: c[look.ground],
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: c["rule-2"],
            }}
          />
          <Text style={{ color: c["ink-2"], fontFamily: fonts.sans, fontSize: size.label }}>{look.word}</Text>
        </View>
      ))}
    </View>
  );
}

export function WeatherPanel({
  placeName,
  horizonEnd,
  day,
  hours,
}: {
  placeName: string;
  horizonEnd: string;
  day: ForecastDay | null;
  hours: HourlyPoint[];
}) {
  const { c } = useTheme();
  return (
    <View style={{ gap: space.sm }}>
      {day ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
          <WeatherGlyph condition={day.condition} color={day.condition === "rain" ? c.pen : c["ink-2"]} size={20} />
          <Figure tone="ink-2">{formatDate(day.date)}</Figure>
          <View style={{ flex: 1 }}>
            <Body>{day.label}</Body>
          </View>
          <Figure>{`${day.hi}° / ${day.lo}°`}</Figure>
        </View>
      ) : (
        <>
          <Label>{`${placeName} · to ${formatDate(horizonEnd)}`}</Label>
          {/* A phone has no hover, so the tap has to be said once. */}
          <Body tone="ink-3">Tap a day in the trip for its hours.</Body>
        </>
      )}
      {day ? <HourlyCurve points={hours} /> : null}
      <Legend />
    </View>
  );
}

export function WeatherLocked({ onSeePro }: { onSeePro: () => void }) {
  return (
    <View style={{ gap: space.sm }}>
      <Label>Weather</Label>
      <Body tone="ink-2">
        The forecast on your dates is part of Floc Pro. One person on the trip with Pro is enough.
      </Body>
      <Button label="See Floc Pro" variant="quiet" onPress={onSeePro} />
    </View>
  );
}
