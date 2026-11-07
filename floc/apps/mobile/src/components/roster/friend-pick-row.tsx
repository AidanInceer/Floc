import { Pressable, StyleSheet, Text, View } from "react-native";

import { TickGlyph } from "@/components/system/glyphs";
import { useTheme } from "@/components/system/theme";
import { Face } from "@/components/trip/person-row";
import { fonts, radius, size, space } from "@/lib/theme";

export function FriendPickRow({ name, on, first, onPress }: {
  name: string;
  on: boolean;
  first: boolean;
  onPress: () => void;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      accessibilityLabel={`Invite ${name}`}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: space.md,
        minHeight: 56,
        paddingHorizontal: space.md,
        backgroundColor: on ? c["pen-2"] : "transparent",
        borderTopWidth: first ? 0 : StyleSheet.hairlineWidth,
        borderTopColor: c.rule,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Face name={name} size={34} />
      <Text numberOfLines={1} style={{ flex: 1, color: on ? c["pen-deep"] : c.ink, fontFamily: fonts.sansBold, fontSize: size.body }}>{name}</Text>
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: radius.sm,
          borderWidth: 1.4,
          borderColor: on ? c.pen : c["rule-2"],
          backgroundColor: on ? c.pen : "transparent",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {on ? <TickGlyph color={c.sheet} /> : null}
      </View>
    </Pressable>
  );
}
