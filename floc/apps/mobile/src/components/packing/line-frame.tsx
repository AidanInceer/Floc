import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import { TickGlyph } from "../system/glyphs";
import { useTheme } from "../system/theme";
import { fonts, radius, size, space } from "@/lib/theme";

/** Why: one box for tick, pick and read-only, so every label starts in the same column. */
export function CheckBox({
  on,
  label,
  onPress,
  role = "checkbox",
}: {
  on: boolean;
  label: string;
  onPress?: () => void;
  role?: "checkbox" | "none";
}) {
  const { c } = useTheme();
  const box = (
    <View
      style={{
        width: 24,
        height: 24,
        borderRadius: radius.sm,
        backgroundColor: on ? c["pastel-green"] : "transparent",
        borderWidth: 1.4,
        borderColor: on ? c["pastel-green-edge"] : c["rule-2"],
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {on ? <TickGlyph color={c["pastel-green-ink"]} /> : null}
    </View>
  );
  if (!onPress) return <View accessibilityLabel={label} accessible>{box}</View>;
  return (
    <Pressable
      accessibilityRole={role === "checkbox" ? "checkbox" : "button"}
      accessibilityLabel={label}
      accessibilityState={{ checked: on }}
      onPress={onPress}
      hitSlop={10}
    >
      {box}
    </Pressable>
  );
}

/** A glyph with no box. `remove` is the one trailing cross: 44 wide, 44 tall with its slop, so every row ends on the same edge. */
export function GhostIcon({
  label,
  disabled,
  tone = "ink-3",
  compact = false,
  remove = false,
  onPress,
  children,
}: {
  label: string;
  disabled?: boolean;
  tone?: "ink-3" | "red" | "pen";
  compact?: boolean;
  remove?: boolean;
  onPress: () => void;
  children: (color: string) => ReactNode;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={remove ? { top: 4, bottom: 4 } : compact ? { top: 8, bottom: 8, left: 7, right: 7 } : 4}
      style={({ pressed }) => ({
        width: remove ? 44 : compact ? 30 : 36,
        height: remove ? 36 : compact ? 30 : 36,
        alignItems: "center",
        justifyContent: "center",
        opacity: disabled ? 0.35 : pressed ? 0.5 : 1,
      })}
    >
      {children(c[tone])}
    </Pressable>
  );
}

/** A small text press with a full-height target. */
export function TextAction({
  label,
  tone = "ink-2",
  bold = false,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  tone?: "ink" | "ink-2" | "ink-3" | "pen" | "red";
  bold?: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      hitSlop={{ top: 12, bottom: 12, left: 6, right: 6 }}
      style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
    >
      <Text style={{ color: c[tone], fontFamily: bold ? fonts.sansBold : fonts.sans, fontSize: size.small }}>
        {label}
      </Text>
    </Pressable>
  );
}

/** The shell of one line: leading slot, text, trailing controls. Rules between lines belong to the section. */
export function LineFrame({
  lead,
  children,
  trail,
  onPress,
  checked,
  accessibilityLabel,
}: {
  lead: ReactNode;
  children: ReactNode;
  trail?: ReactNode;
  onPress?: () => void;
  checked?: boolean;
  accessibilityLabel?: string;
}) {
  const content = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space.md,
        minHeight: 48,
        paddingHorizontal: space.md,
        paddingVertical: space.sm,
      }}
    >
      <View style={{ width: 24, alignItems: "center" }}>{lead}</View>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>{children}</View>
      {trail}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: !!checked }}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
    >
      {content}
    </Pressable>
  );
}
