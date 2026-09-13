import { formatMoney } from "@floc/core/money/money";
import type { PresetTrip } from "@floc/core/trip/explore/preset-trips";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../system/theme";
import { Body } from "../system/ui";
import { REGION_TINT } from "@/lib/region-tint";
import { fonts, radius, size, space } from "@/lib/theme";

export function ExploreMatches({
  matches,
  onPick,
}: {
  matches: { trip: PresetTrip; score: number }[];
  onPick: (presetId: string) => void;
}) {
  const { c } = useTheme();

  if (matches.length === 0) {
    return <Body tone="ink-2">No trips are that short. Add more nights.</Body>;
  }

  return (
    <View style={{ gap: space.sm }}>
      {matches.map(({ trip }, index) => {
        const tint = REGION_TINT[trip.region];
        return (
          <Pressable
            key={trip.id}
            accessibilityRole="button"
            accessibilityLabel={`Match ${index + 1}: ${trip.title}`}
            onPress={() => onPick(trip.id)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: space.md,
              backgroundColor: c[tint.fill],
              borderColor: c[tint.edge],
              borderWidth: StyleSheet.hairlineWidth,
              borderRadius: radius.md,
              padding: space.md,
            }}
          >
            <Text style={{ color: c[tint.ink], fontFamily: fonts.display, fontSize: size.display, width: 32 }}>
              {index + 1}
            </Text>
            <View style={{ flex: 1, gap: space.xs }}>
              <Text numberOfLines={1} style={{ color: c[tint.ink], fontFamily: fonts.display, fontSize: size.body }}>
                {trip.title}
              </Text>
              <Text style={{ color: c[tint.ink], fontFamily: fonts.type, fontSize: size.label }}>
                {trip.nights} nights · {formatMoney(trip.priceFromMinor, trip.currency)} each
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
