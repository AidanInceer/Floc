/**
 * Where you are sleeping, as a row you can press (#325 feedback).
 *
 * IT HAS TO LOOK LIKE A CONTROL. A bare grey sentence read as a caption and
 * nobody pressed it. One slim row now, as the web's night bar: the bed, the
 * place, and the pen that every tappable row on the phone wears.
 *
 * SPLIT FROM `overnight-line` because that file is the read, the write and the
 * run `deriveStops` gives back — the drawing is a separate job, and leaving it
 * inline took one function past what it is allowed to branch on.
 */
import { Pressable, StyleSheet, Text } from "react-native";

import { BedGlyph, PenGlyph } from "../system/glyphs";
import { useTheme } from "../system/theme";
import { fonts, radius, size, space } from "@/lib/theme";

export function OvernightRow({
  place,
  onPress,
}: {
  /** Null when nowhere is set yet — which is a fact about the trip, not an error (rule 9). */
  place: string | null;
  onPress: () => void;
}) {
  const { c } = useTheme();
  const set = place !== null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={set ? `Sleeping in ${place} — change it` : "Say where you are sleeping"}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: space.sm,
        minHeight: 44,
        paddingHorizontal: space.md,
        borderRadius: radius.sm,
        borderWidth: set ? 0 : StyleSheet.hairlineWidth,
        borderStyle: set ? "solid" : "dashed",
        borderColor: set ? c["pastel-green-edge"] : c["rule-2"],
        backgroundColor: set ? c["pastel-green"] : "transparent",
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <BedGlyph color={set ? c["pastel-green-ink"] : c["ink-3"]} />
      <Text numberOfLines={1} style={{ flex: 1, color: set ? c["pastel-green-ink"] : c["ink-3"], fontFamily: set ? fonts.sansBold : fonts.sans, fontSize: size.small }}>
        {set ? place : "Where are you sleeping?"}
      </Text>
      <PenGlyph color={set ? c["pastel-green-ink"] : c["ink-3"]} />
    </Pressable>
  );
}