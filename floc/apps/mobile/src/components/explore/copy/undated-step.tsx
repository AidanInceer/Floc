import { Text, View } from "react-native";

import { TickGlyph } from "../../system/glyphs";
import { useTheme } from "../../system/theme";
import { fonts, radius, size, space } from "@/lib/theme";

/** Not yet (ADR-025), as on the web: an undated copy brings the highlights page only. */
export function UndatedStep({ highlights }: { highlights: string[] }) {
  const { c } = useTheme();
  return (
    <View style={{ gap: space.md }}>
      <Text accessibilityRole="header" style={{ textAlign: "center", color: c.ink, fontFamily: fonts.sansBold, fontSize: size.body }}>
        What comes across
      </Text>
      <View style={{ flexDirection: "row", gap: space.sm }}>
        <View style={{ paddingTop: 3 }}>
          <TickGlyph color={c.green} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ color: c.ink, fontFamily: fonts.sans, fontSize: size.body }}>{highlights.length} highlights</Text>
          <Text style={{ color: c["ink-3"], fontFamily: fonts.sans, fontSize: size.small }}>{highlights.join(", ")}</Text>
        </View>
      </View>
      <View style={{ borderRadius: radius.sm, paddingVertical: space.sm + 2, paddingHorizontal: space.md, backgroundColor: c["pastel-yellow"] }}>
        <Text style={{ color: c["pastel-yellow-ink"], fontFamily: fonts.sans, fontSize: size.small }}>
          The stops, days and ideas need dates. Go back and pick them to bring those too.
        </Text>
      </View>
    </View>
  );
}
