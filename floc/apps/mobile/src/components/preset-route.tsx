/**
 * A listing's shape, drawn rather than written (#194).
 *
 * THE LEG CHAIN WAS THE WALL. As one line — "Praiano 7n - ferry -" — it read
 * as debris rather than an itinerary, and it was the densest thing on the old
 * card. Down the page, a base is a dot with its nights, and a hop is the stem
 * between two dots. Same data, no new fields.
 *
 * A BASE IS SOLID, A HOP IS HOLLOW. Where you sleep is the thing being chosen;
 * how you get between is how you spend the day in the middle. Both still say
 * their words, so the shapes are decoration on top of a readable list.
 */
import type { PresetTrip } from "@floc/core/preset-trips";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "./theme";
import { TravelModeGlyph } from "./travel-mode-glyph";
import { fonts, radius, size, space } from "@/lib/theme";

const DOT = 10;

export function PresetRoute({ trip }: { trip: PresetTrip }) {
  const { c } = useTheme();

  return (
    <View style={{ gap: space.sm }}>
      {trip.legs.map((leg) =>
        leg.kind === "base" ? (
          <View
            key={`${leg.place}-${leg.nights}`}
            style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}
          >
            <View
              style={{
                width: DOT,
                height: DOT,
                borderRadius: radius.pill,
                backgroundColor: c.pen,
              }}
            />
            <Text
              style={{ flex: 1, color: c.ink, fontFamily: fonts.sans, fontSize: size.body }}
            >
              {leg.place}
            </Text>
            <Text
              style={{
                color: c["ink-2"],
                fontFamily: fonts.type,
                fontSize: size.label,
                fontVariant: ["tabular-nums"],
              }}
            >
              {leg.nights === 1 ? "1 night" : `${leg.nights} nights`}
            </Text>
          </View>
        ) : (
          <View
            key={`${leg.place}-${leg.mode}`}
            style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}
          >
            {/* The stem sits where the dot would be, so the chain reads as one line. */}
            <View style={{ width: DOT, alignItems: "center" }}>
              <View style={{ width: StyleSheet.hairlineWidth * 2, height: 18, backgroundColor: c.rule }} />
            </View>
            <TravelModeGlyph mode={leg.mode} color={c["ink-3"]} size={15} />
            <Text
              style={{ flex: 1, color: c["ink-2"], fontFamily: fonts.sans, fontSize: size.small }}
            >
              {leg.mode === "other" ? leg.detail : `${leg.mode} — ${leg.place}`}
            </Text>
          </View>
        ),
      )}
    </View>
  );
}
