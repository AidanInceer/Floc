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
