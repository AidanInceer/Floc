import { ideaCategoryLabel, ideaEventType } from "@floc/core/trip/idea-categories";
import { View } from "react-native";

import { KindTile, groundOf } from "../../system/event-glyph";
import { GlassGlyph } from "../../system/glyphs";
import { useTheme } from "../../system/theme";
import { radius } from "@/lib/theme";

export function IdeaTile({ category }: { category: string }) {
  const { c } = useTheme();
  const type = ideaEventType(category);
  if (category !== "drinks") return <KindTile type={type} transportType={type === "transport" ? "train" : null} />;
  const { fill, ink } = groundOf(type, c);
  return (
    <View
      accessibilityLabel={ideaCategoryLabel(category)}
      style={{ width: 26, height: 26, borderRadius: radius.sm, backgroundColor: fill, alignItems: "center", justifyContent: "center" }}
    >
      <GlassGlyph color={ink} />
    </View>
  );
}
