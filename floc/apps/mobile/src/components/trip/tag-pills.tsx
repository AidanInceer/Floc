/**
 * A trip's tags, drawn (tickets 71, 213).
 *
 * They wear the trip's one chosen pastel rather than a tone each — that was
 * ticket 213's whole point, and `tripPastel` is the shared rule so a card on a
 * phone and a card in a browser land on the same colour for the same trip.
 *
 * Lower case, as they are stored: a tag is the group's own word, not a title.
 */
import { readTags } from "@floc/core/trip/tags";
import { tripPastel, type TripColor } from "@floc/core/trip/trip-color";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../system/theme";
import { fonts, radius, size, space } from "@/lib/theme";

export function TagPills({
  tags,
  color,
  tripId,
}: {
  /** Straight off the row — JSON, so `readTags` guards it (rule 11). */
  tags: unknown;
  color: TripColor | null;
  tripId: number;
}) {
  const { c } = useTheme();
  const words = readTags(tags);
  if (words.length === 0) return null;

  const tone = tripPastel(color, tripId);

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
              fontFamily: fonts.type,
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
