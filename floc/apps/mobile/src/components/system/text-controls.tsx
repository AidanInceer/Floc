/**
 * Why: split from `ui.tsx` at its 600-line ceiling. These two are one idea at
 * two weights — a control that is only words — where the rest is shapes.
 * `TextLink` is meant to be noticed; `QuietAction` (the web's
 * `quietActionClass`) is a rare verb that must not compete.
 */
import { Pressable, Text } from "react-native";

import { fonts, size, space } from "@/lib/theme";

import { useTheme } from "./theme";

export function TextLink({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityState={{ disabled: !!disabled }}
      onPress={onPress}
      disabled={disabled}
      // Bigger than the text, so the tap target clears the 44pt minimum
      // without the text itself having to grow into a control.
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      style={({ pressed }) => ({
        alignSelf: "center",
        paddingVertical: space.xs,
        opacity: disabled ? 0.5 : pressed ? 0.6 : 1,
      })}
    >
      <Text
        style={{
          color: c["ink-2"],
          fontFamily: fonts.sans,
          fontSize: size.small,
          textDecorationLine: "underline",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * The web's `quietActionClass`: a rare verb that has to be reachable without
 * competing with the controls above it. Smaller and fainter than `TextLink`,
 * which is a normal-weight choice the eye is meant to land on.
 */
export function QuietAction({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      onPress={onPress}
      disabled={disabled}
      hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
      style={({ pressed }) => ({
        alignSelf: "center",
        opacity: disabled ? 0.5 : pressed ? 0.6 : 1,
      })}
    >
      <Text
        style={{
          color: c["ink-3"],
          fontFamily: fonts.sans,
          fontSize: size.label,
          textDecorationLine: "underline",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
