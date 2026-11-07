import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { useTheme } from "../../system/theme";
import { space } from "@/lib/theme";

/** One hairline-topped line of the trip card; the card's own edge closes the last one, so borders never stack. */
export function LineRow({ children, onPress, label, baseline }: { children: ReactNode; onPress?: () => void; label?: string; baseline?: boolean }) {
  const { c } = useTheme();
  const style = {
    minHeight: baseline ? undefined : 52,
    flexDirection: "row",
    alignItems: baseline ? "baseline" : "center",
    gap: space.md,
    paddingVertical: baseline ? space.md : space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.rule,
  } as const;
  if (!onPress) return <View style={style}>{children}</View>;
  return (
    <Pressable accessibilityRole="link" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [style, { opacity: pressed ? 0.6 : 1 }]}>
      {children}
    </Pressable>
  );
}
