import type { PresetTrip } from "@floc/core/trip/explore/preset-trips";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ChevronGlyph } from "../system/glyphs";
import { useTheme } from "../system/theme";
import { RegionTags } from "./region-tag";
import { fonts, size, space } from "@/lib/theme";

/** One listing on the list's sheet: the title first, then where and the figures under it. */
export function ListingRow({ trip, figures, last, onOpen }: { trip: PresetTrip; figures: string; last: boolean; onOpen: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${trip.title}, ${trip.country}, ${figures}`}
      onPress={onOpen}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: space.md,
        paddingVertical: space.lg,
        paddingHorizontal: space.lg,
        borderBottomColor: c.rule,
        borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <View style={{ flex: 1, gap: space.xs + 2 }}>
        <Text style={{ color: c.ink, fontFamily: fonts.sansBold, fontSize: size.body }}>{trip.title}</Text>
        <RegionTags region={trip.region} countries={trip.country} />
        <Text style={{ color: c["ink-2"], fontFamily: fonts.type, fontSize: size.small, fontVariant: ["tabular-nums"] }}>{figures}</Text>
      </View>
      <View style={{ transform: [{ rotate: "-90deg" }] }}>
        <ChevronGlyph color={c["ink-3"]} />
      </View>
    </Pressable>
  );
}
