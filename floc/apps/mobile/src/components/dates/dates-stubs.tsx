// Why one row of four: the web's narrow Dates card — each view says where it stands before you open it.
import type { TabSummary } from "@floc/core/dates/dates-tabs";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../system/theme";
import type { DatesView } from "@/lib/dates/day-look";
import { fonts, radius, size, space } from "@/lib/theme";

export type DatesStub = { key: DatesView; name: string; glyph: (color: string) => ReactNode; summary: TabSummary };

export function DatesStubs({ stubs, open, onOpen }: { stubs: DatesStub[]; open: DatesView; onOpen: (view: DatesView) => void }) {
  const { c } = useTheme();
  return (
    <View accessibilityRole="tablist" style={{ flexDirection: "row", backgroundColor: c["sheet-2"], borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.rule }}>
      {stubs.map((stub, i) => {
        const on = stub.key === open;
        return (
          <Pressable
            key={stub.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`${stub.name}: ${stub.summary.value}. ${stub.summary.note}`}
            onPress={() => onOpen(stub.key)}
            style={{
              flex: 1,
              minWidth: 0,
              alignItems: "center",
              gap: space.xs + 2,
              paddingTop: space.md,
              paddingBottom: space.md + 1,
              backgroundColor: on ? c.sheet : "transparent",
              borderLeftWidth: i === 0 ? 0 : StyleSheet.hairlineWidth,
              borderLeftColor: c.rule,
            }}
          >
            <View style={{ width: 26, height: 26, borderRadius: radius.sm, alignItems: "center", justifyContent: "center", backgroundColor: on ? c["pen-2"] : c["sheet-3"] }}>
              {stub.glyph(on ? c["pen-deep"] : c["ink-2"])}
            </View>
            <Text numberOfLines={1} style={{ maxWidth: "100%", paddingHorizontal: space.xs, color: c.ink, fontFamily: fonts.sansBold, fontSize: size.small }}>
              {stub.summary.short}
            </Text>
            {on ? <View style={{ position: "absolute", left: space.md, right: space.md, bottom: 0, height: 3, backgroundColor: c.pen }} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}
