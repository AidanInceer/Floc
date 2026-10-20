import { Pressable, StyleSheet, Text } from "react-native";

import { useTheme } from "../../system/theme";
import { fonts, radius, size, space } from "@/lib/theme";

/** A chip in the finder, the web's to the pixel: ink when on; dashed at 0 but still pressable. */
export function FinderChip({
  label,
  on,
  count,
  onPress,
}: {
  label: string;
  on: boolean;
  count?: number;
  onPress: () => void;
}) {
  const { c } = useTheme();
  const none = !on && count === 0;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      accessibilityLabel={count === undefined ? label : `${label}, ${count} trips`}
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space.xs + 2,
        backgroundColor: on ? c.ink : c.sheet,
        borderColor: on ? c.ink : c["rule-2"],
        borderWidth: StyleSheet.hairlineWidth * 2,
        borderStyle: none ? "dashed" : "solid",
        borderRadius: radius.pill,
        paddingVertical: space.xs + 2,
        paddingHorizontal: space.md,
      }}
    >
      <Text style={{ color: on ? c.paper : none ? c["ink-3"] : c.ink, fontFamily: fonts.sans, fontSize: size.small }}>{label}</Text>
      {count === undefined ? null : (
        <Text style={{ color: on ? c.paper : c["ink-3"], opacity: on ? 0.7 : 1, fontFamily: fonts.type, fontSize: size.label }}>{count}</Text>
      )}
    </Pressable>
  );
}
