import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { useTheme } from "../../system/theme";
import { fonts, radius, size, space } from "@/lib/theme";

export function VotePill({
  votes,
  mine,
  label,
  onPress,
}: {
  votes: number;
  mine: boolean;
  /** Said aloud — carries the count and whether the vote is yours. */
  label: string;
  onPress: () => void;
}) {
  const { c } = useTheme();
  const ink = mine ? c.green : c["ink-2"];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: mine }}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: space.xs,
        paddingHorizontal: space.sm,
        height: 34,
        borderRadius: radius.pill,
        backgroundColor: mine ? c["green-2"] : "transparent",
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: mine ? c["green-edge"] : c["rule-2"],
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <View>
        <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
          <Path
            d="M7 11.2V3.2M3.6 6.6 7 3.2l3.4 3.4"
            stroke={ink}
            strokeWidth={1.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
      <Text style={{ color: ink, fontFamily: fonts.type, fontSize: size.small }}>{votes}</Text>
    </Pressable>
  );
}
