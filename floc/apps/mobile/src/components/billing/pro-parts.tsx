/** Text and buttons on the gold Pro ground, where the house ones would read as blue. */
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { useTheme } from "../system/theme";
import { fonts, radius, size, space } from "@/lib/theme";

export function ProText({ children, quiet }: { children: ReactNode; quiet?: boolean }) {
  const { c } = useTheme();
  return (
    <Text
      style={{
        color: quiet ? c["pro-ink-2"] : c["pro-ink"],
        fontFamily: fonts.sans,
        fontSize: quiet ? size.small : size.body,
      }}
    >
      {children}
    </Text>
  );
}

export function ProButton({
  label,
  lead,
  disabled,
  onPress,
}: {
  label: string;
  lead?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        alignItems: "center",
        paddingVertical: space.md,
        paddingHorizontal: space.sm,
        borderRadius: radius.md,
        backgroundColor: lead ? c["pro-ink"] : c["pro-2"],
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: lead ? c["pro-ink"] : c["pro-edge"],
        opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
      })}
    >
      <Text style={{ color: lead ? c["pro-2"] : c["pro-ink"], fontFamily: fonts.sansBold, fontSize: size.small }}>
        {label}
      </Text>
    </Pressable>
  );
}
