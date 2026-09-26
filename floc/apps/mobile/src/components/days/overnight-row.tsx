/**
 * Where you are sleeping, as a row you can press (#325 feedback).
 *
 * IT HAS TO LOOK LIKE A CONTROL. This was a bare grey sentence; it read as a
 * caption and nobody pressed it. The frame, the label and the pen are the same
 * three marks every other tappable row on the phone wears.
 *
 * SPLIT FROM `overnight-line` because that file is the read, the write and the
 * run `deriveStops` gives back — the drawing is a separate job, and leaving it
 * inline took one function past what it is allowed to branch on.
 */
import { Pressable, StyleSheet, View } from "react-native";

import { PenGlyph } from "../system/glyphs";
import { useTheme } from "../system/theme";
import { Body, Figure } from "../system/ui";
import { radius, space } from "@/lib/theme";

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
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space.md,
        paddingHorizontal: space.md,
        paddingVertical: space.sm,
        borderRadius: radius.md,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: set ? c["pastel-green-edge"] : c.rule,
        backgroundColor: set ? c["pastel-green"] : "transparent",
      }}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Figure tone="ink-2">Sleeping</Figure>
        <Body bold={set} tone={set ? "ink" : "ink-3"}>
          {place ?? "Nowhere yet"}
        </Body>
      </View>
      {/* The pen says "this is a control, not a caption" — the same mark the
          trip header wears for the same reason. */}
      <PenGlyph color={c["ink-2"]} />
    </Pressable>
  );
}
