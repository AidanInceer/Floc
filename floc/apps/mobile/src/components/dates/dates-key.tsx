import type { TokenName } from "@floc/core/design/tokens";
import { EVERYONE_FREE_WORDS, MARK_WORDS, SOME_FREE_WORDS } from "@floc/core/dates/words";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../system/theme";
import { fonts, radius, size, space } from "@/lib/theme";

const MARK = 10;

function Swatch({ ground, width = MARK, edge }: { ground: TokenName; width?: number; edge?: TokenName }) {
  const { c } = useTheme();
  return <View style={{ width, height: MARK, borderRadius: radius.sm, backgroundColor: c[ground], borderWidth: edge ? StyleSheet.hairlineWidth : 0, borderColor: edge ? c[edge] : undefined }} />;
}

function Item({ children, word }: { children: React.ReactNode; word: string }) {
  const { c } = useTheme();
  return (
    <View style={{ flexShrink: 1, flexDirection: "row", alignItems: "center", gap: space.xs }}>
      {children}
      <Text numberOfLines={1} style={{ flexShrink: 1, color: c["ink-2"], fontFamily: fonts.sans, fontSize: size.label }}>{word}</Text>
    </View>
  );
}

export function DatesKey() {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: space.xs, paddingVertical: space.md }}>
      <Item word={MARK_WORDS.free}>
        <View style={{ width: MARK, height: MARK, borderRadius: radius.pill, borderWidth: 1, borderColor: c["ink-3"] }} />
      </Item>
      <Item word={MARK_WORDS.prefer}>
        <View style={{ width: MARK, height: MARK, borderRadius: radius.pill, borderWidth: 1.5, borderColor: c.ink, backgroundColor: c.sheet }} />
      </Item>
      <Item word={SOME_FREE_WORDS}>
        <View style={{ flexDirection: "row", gap: 2 }}>
          <Swatch ground="some-free-1" width={6} edge="rule-2" />
          <Swatch ground="some-free-2" width={6} edge="rule-2" />
          <Swatch ground="some-free-3" width={6} />
        </View>
      </Item>
      <Item word={EVERYONE_FREE_WORDS}>
        <Swatch ground="pastel-green" edge="pastel-green-edge" />
      </Item>
      <Item word="The trip">
        <Swatch ground="green" />
      </Item>
    </View>
  );
}
