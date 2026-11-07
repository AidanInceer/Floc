import { Pressable, Text } from "react-native";

import { useTheme } from "../system/theme";
import { fonts, radius, size, space } from "@/lib/theme";

export function ListsButton({ count, onPress }: { count: number; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={count === 0 ? "Lists" : `Lists, ${count}`}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "baseline",
        gap: space.xs,
        paddingVertical: space.sm,
        paddingHorizontal: space.md,
        borderWidth: 1,
        borderColor: c["rule-2"],
        borderRadius: radius.sm,
        backgroundColor: c.sheet,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Text style={{ color: c["ink-2"], fontFamily: fonts.sansBold, fontSize: size.small }}>Lists</Text>
      {count > 0 ? (
        <Text style={{ color: c["ink-3"], fontFamily: fonts.type, fontSize: size.label, fontVariant: ["tabular-nums"] }}>{count}</Text>
      ) : null}
    </Pressable>
  );
}
