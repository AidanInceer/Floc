import type { PresetTrip } from "@floc/core/trip/explore/preset-trips";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../system/theme";
import { TravelModeGlyph } from "../system/travel-mode-glyph";
import { fonts, radius, size, space } from "@/lib/theme";
import { countWord } from "@floc/core/text/count-word";

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
              {countWord(leg.nights, "night")}
            </Text>
          </View>
        ) : (
          <View
            key={`${leg.place}-${leg.mode}`}
            style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}
          >
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
