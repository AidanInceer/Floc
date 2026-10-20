/**
 * One listing as a row: the country in its region's colour, then the title
 * (#383, direction B1 — the web row cut back to what fits a phone). Nights and
 * price live on the listing you open. Colour is never the only signal: the
 * country names itself inside the tag.
 */
import type { PresetTrip } from "@floc/core/trip/explore/preset-trips";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ChevronGlyph } from "../system/glyphs";
import { useTheme } from "../system/theme";
import { REGION_TINT } from "@/lib/region-tint";
import { fonts, radius, size, space } from "@/lib/theme";

/** `note` is a short line under the title: the tags you like that this trip has. */
export function PresetRow({ trip, note, onOpen }: { trip: PresetTrip; note?: string; onOpen: () => void }) {
  const { c } = useTheme();
  const tint = REGION_TINT[trip.region];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${trip.title} — ${trip.country}`}
      onPress={onOpen}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space.md,
        borderBottomColor: c.rule,
        borderBottomWidth: StyleSheet.hairlineWidth,
        paddingVertical: space.md,
      }}
    >
      <View
        style={{
          width: 96,
          alignItems: "flex-start",
        }}
      >
        <Text
          numberOfLines={1}
          style={{
            backgroundColor: c[tint.fill],
            color: c[tint.ink],
            borderRadius: radius.sm,
            overflow: "hidden",
            paddingVertical: space.xs,
            paddingHorizontal: space.sm,
            fontFamily: fonts.type,
            fontSize: size.label,
            textTransform: "uppercase",
            letterSpacing: 0.6,
            maxWidth: 96,
          }}
        >
          {trip.country}
        </Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text numberOfLines={1} style={{ color: c.ink, fontFamily: fonts.sansBold, fontSize: size.body }}>
          {trip.title}
        </Text>
        {note ? (
          <Text numberOfLines={1} style={{ color: c["ink-3"], fontFamily: fonts.sans, fontSize: size.small }}>
            {note}
          </Text>
        ) : null}
      </View>
      <View style={{ transform: [{ rotate: "-90deg" }] }}>
        <ChevronGlyph color={c["ink-3"]} />
      </View>
    </Pressable>
  );
}
