import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { CalendarGlyph, ChevronGlyph, ClockGlyph } from "../../system/glyphs";
import { useTheme } from "../../system/theme";
import { fonts, radius, size, space } from "@/lib/theme";

function Choice({ tile, label, hint, onPress }: { tile: ReactNode; label: string; hint: string; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${hint}`}
      onPress={onPress}
      style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: space.md, padding: space.md, backgroundColor: pressed ? c["pen-2"] : c.sheet })}
    >
      {tile}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: c.ink, fontFamily: fonts.sans, fontSize: size.body }}>{label}</Text>
        <Text style={{ color: c["ink-3"], fontFamily: fonts.sans, fontSize: size.small }}>{hint}</Text>
      </View>
      <View style={{ transform: [{ rotate: "-90deg" }] }}>
        <ChevronGlyph color={c["ink-3"]} />
      </View>
    </Pressable>
  );
}

/** Step one (ADR-025), as on the web: the dates decide what can come across, so they are asked first. */
export function AskStep({ nights, onAnswer }: { nights: number; onAnswer: (has: boolean) => void }) {
  const { c } = useTheme();
  const tile = (ground: string, glyph: ReactNode) => (
    <View style={{ width: 30, height: 30, borderRadius: radius.sm, alignItems: "center", justifyContent: "center", backgroundColor: ground }}>{glyph}</View>
  );
  return (
    <View style={{ gap: space.md }}>
      <Text accessibilityRole="header" style={{ textAlign: "center", color: c.ink, fontFamily: fonts.sansBold, fontSize: size.body }}>
        Do you have dates yet?
      </Text>
      <View style={{ borderWidth: StyleSheet.hairlineWidth * 2, borderColor: c.rule, borderRadius: radius.md, overflow: "hidden" }}>
        <Choice
          tile={tile(c["pastel-yellow"], <CalendarGlyph color={c["pastel-yellow-ink"]} />)}
          label="Yes"
          hint={`Pick when you go. The ${nights} nights follow.`}
          onPress={() => onAnswer(true)}
        />
        <View style={{ height: StyleSheet.hairlineWidth * 2, backgroundColor: c.rule }} />
        <Choice
          tile={tile(c["sheet-3"], <ClockGlyph color={c["ink-2"]} />)}
          label="Not yet"
          hint="Start with the highlights. Add dates when the group agrees."
          onPress={() => onAnswer(false)}
        />
      </View>
    </View>
  );
}
