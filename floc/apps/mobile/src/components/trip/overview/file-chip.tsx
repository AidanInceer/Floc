import { DOC_CATEGORY_LABELS, DOC_CATEGORY_TONES, type DocCategory } from "@floc/core/documents/documents";
import { Pressable, StyleSheet, Text } from "react-native";

import { useTheme } from "../../system/theme";
import { fonts, radius, size, space } from "@/lib/theme";

/** A file, or a kind of file with its count, in the colour of its category (travel blue, hotel green, tickets yellow, admin red, other grey). */
export function FileChip({
  category,
  text,
  count,
  onPress,
}: {
  category: DocCategory;
  text?: string;
  count?: number;
  onPress: () => void;
}) {
  const { c } = useTheme();
  const tone = DOC_CATEGORY_TONES[category];
  const ground = tone ? c[`pastel-${tone}`] : c["sheet-3"];
  const edge = tone ? c[`pastel-${tone}-edge`] : c["rule-2"];
  const ink = tone ? c[`pastel-${tone}-ink`] : c["ink-2"];
  const word = text ?? DOC_CATEGORY_LABELS[category];
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={count === undefined ? word : `${word}, ${count}`}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => ({
        maxWidth: 220,
        flexDirection: "row",
        alignItems: "center",
        gap: space.xs,
        paddingVertical: 2,
        paddingHorizontal: space.sm,
        borderRadius: radius.pill,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: edge,
        backgroundColor: ground,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Text numberOfLines={1} style={{ flexShrink: 1, color: ink, fontFamily: fonts.sans, fontSize: size.small }}>
        {word}
      </Text>
      {count === undefined ? null : (
        <Text style={{ color: ink, fontFamily: fonts.type, fontSize: size.label, fontVariant: ["tabular-nums"] }}>{count}</Text>
      )}
    </Pressable>
  );
}
