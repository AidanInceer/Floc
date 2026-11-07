// Why this order: the web's key, in the order a group books — who can, then the trip.
import type { TokenName } from "@floc/core/design/tokens";
import { Text, View } from "react-native";

import { useTheme } from "../system/theme";
import { fonts, radius, size, space } from "@/lib/theme";

function Swatch({ ground }: { ground: TokenName }) {
  const { c } = useTheme();
  return <View style={{ width: 16, height: 12, borderRadius: radius.sm, backgroundColor: c[ground] }} />;
}

function Item({ children, word }: { children: React.ReactNode; word: string }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.xs + 2 }}>
      {children}
      <Text style={{ color: c["ink-2"], fontFamily: fonts.sans, fontSize: size.label + 1 }}>{word}</Text>
    </View>
  );
}

export function DatesKey() {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: space.lg, rowGap: space.sm, paddingVertical: space.md }}>
      <Item word="You can do">
        <View style={{ width: 14, height: 14, borderRadius: radius.pill, backgroundColor: c.ink, opacity: 0.14 }} />
      </Item>
      <Item word="Everyone free">
        <Swatch ground="pastel-green" />
      </Item>
      <Item word="Some free">
        <View style={{ flexDirection: "row", gap: 3 }}>
          <Swatch ground="some-free-1" />
          <Swatch ground="some-free-2" />
          <Swatch ground="some-free-3" />
        </View>
      </Item>
      <Item word="The trip">
        <Swatch ground="green" />
      </Item>
    </View>
  );
}
