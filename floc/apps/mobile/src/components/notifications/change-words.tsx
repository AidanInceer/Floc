import { Text, View, type TextStyle } from "react-native";

import { useTheme } from "../system/theme";
import { fonts, size, space } from "@/lib/theme";

export function ChangeWords({ was, now }: { was: string | null; now: string | null }) {
  const { c } = useTheme();
  const style: TextStyle = { fontFamily: fonts.type, fontSize: size.label, fontVariant: ["tabular-nums"] };
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: space.sm }}>
      {was ? <Text style={{ ...style, color: c["ink-3"], textDecorationLine: "line-through" }}>{was}</Text> : null}
      {now ? <Text style={{ ...style, color: c["ink-2"] }}>{now}</Text> : null}
    </View>
  );
}
