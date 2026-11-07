import type { Region } from "@floc/core/trip/explore/preset-trips";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../system/theme";
import { REGION_TINT } from "@/lib/region-tint";
import { fonts, radius, size, space } from "@/lib/theme";

/** A listing's countries, one tag each in the region's colour: the region tints them, the words name them. */
export function RegionTags({ region, countries }: { region: Region; countries: string }) {
  const { c } = useTheme();
  const tint = REGION_TINT[region];
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: space.sm, rowGap: space.xs }}>
      {countries.split(", ").map((country) => (
        <View
          key={country}
          style={{
            backgroundColor: c[tint.fill],
            borderColor: c[tint.edge],
            borderWidth: StyleSheet.hairlineWidth,
            borderRadius: radius.pill,
            paddingVertical: 2,
            paddingHorizontal: space.sm,
          }}
        >
          <Text numberOfLines={1} style={{ color: c[tint.ink], fontFamily: fonts.type, fontSize: size.label, textTransform: "uppercase", letterSpacing: 0.6 }}>
            {country}
          </Text>
        </View>
      ))}
    </View>
  );
}
