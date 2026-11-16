import { readTags } from "@floc/core/trip/tags";
import { tripPastel, type TripColor } from "@floc/core/trip/trip-color";
import { pastelOf } from "@floc/core/design/pastels";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../system/theme";
import { fonts, radius, size, space } from "@/lib/theme";

export function TagPills({
  tags,
  color,
  tripId,
}: {
  tags: unknown;
  color: TripColor | null;
  tripId: number;
}) {
  const { c } = useTheme();
  const words = readTags(tags);
  if (words.length === 0) return null;

  const tone = pastelOf(tripPastel(color, tripId));

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.xs }}>
      {words.map((word) => (
        <View
          key={word}
          style={{
            backgroundColor: c[tone],
            borderColor: c[`${tone}-edge`],
            borderWidth: StyleSheet.hairlineWidth,
            borderRadius: radius.pill,
            paddingVertical: 2,
            paddingHorizontal: space.sm,
          }}
        >
          <Text
            style={{
              color: c[`${tone}-ink`],
              fontFamily: fonts.sans,
              fontSize: size.small,
            }}
          >
            {word}
          </Text>
        </View>
      ))}
    </View>
  );
}
