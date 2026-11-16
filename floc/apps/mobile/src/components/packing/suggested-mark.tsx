import { Text, View } from "react-native";

import { SparkGlyph } from "../system/glyphs";
import { useTheme } from "../system/theme";
import { fonts, size, space } from "@/lib/theme";

const SOFT = 0.6;

export function SuggestedMark() {
  const { c } = useTheme();
  return (
    <View accessible accessibilityRole="image" accessibilityLabel="Suggested" style={{ opacity: SOFT }}>
      <SparkGlyph color={c.pen} size={10} />
    </View>
  );
}

export function SuggestedNote({ text }: { text: string }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.xs, opacity: SOFT }}>
      <SparkGlyph color={c.pen} size={10} />
      <Text style={{ color: c.pen, fontFamily: fonts.sans, fontSize: size.small }}>{text}</Text>
    </View>
  );
}
