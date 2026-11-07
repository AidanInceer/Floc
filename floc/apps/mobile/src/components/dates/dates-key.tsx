// Why this order: the web's key, in the order a group books — who can, then the trip.
import type { TokenName } from "@floc/core/design/tokens";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../system/theme";
import { fonts, radius, size, space } from "@/lib/theme";

const MARK = 10;

// Why the edge: the pale washes all but vanish on the dark card without one.
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

/** One line at phone width: small marks, the web's four words. */
export function DatesKey() {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: space.xs, paddingVertical: space.md }}>
      <Item word="You can do">
        <View style={{ width: MARK, height: MARK, borderRadius: radius.pill, backgroundColor: c.ink, opacity: 0.14 }} />
      </Item>
      <Item word="Everyone free">
        <Swatch ground="pastel-green" edge="pastel-green-edge" />
      </Item>
      <Item word="Some free">
        <View style={{ flexDirection: "row", gap: 2 }}>
          <Swatch ground="some-free-1" width={6} edge="rule-2" />
          <Swatch ground="some-free-2" width={6} edge="rule-2" />
          <Swatch ground="some-free-3" width={6} />
        </View>
      </Item>
      <Item word="The trip">
        <Swatch ground="green" />
      </Item>
    </View>
  );
}
