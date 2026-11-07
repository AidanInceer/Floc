import { formatShortRange } from "@floc/core/dates/dates";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ChevronGlyph } from "../../system/glyphs";
import { useTheme } from "../../system/theme";
import { TITLE_INDENT } from "./columns";
import { fonts, size, space } from "@/lib/theme";

/** Why: a long run of empty days reads as noise one row apiece; one row says the same and still opens Days. */
export function QuietRun({ first, last, count, onOpen }: { first: string; last: string; count: number; onOpen: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${count} days, nothing planned. Plan on Days`}
      onPress={onOpen}
      style={({ pressed }) => ({
        minHeight: 48,
        flexDirection: "row",
        alignItems: "center",
        gap: space.md,
        paddingLeft: TITLE_INDENT,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: c.rule,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Text style={{ flex: 1, color: c["ink-3"], fontFamily: fonts.sans, fontSize: size.small }}>Nothing planned</Text>
      <Text style={{ color: c["ink-3"], fontFamily: fonts.type, fontSize: size.label, fontVariant: ["tabular-nums"] }}>{formatShortRange(first, last)}</Text>
      <View style={{ transform: [{ rotate: "-90deg" }] }}>
        <ChevronGlyph color={c["ink-3"]} />
      </View>
    </Pressable>
  );
}
