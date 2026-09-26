import {
  viewPackingLines,
  type PackingLineGroup,
  type PackCategory,
} from "@floc/core/packing/packing";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../system/theme";
import { Empty, Heading, Label } from "../system/ui";
import { fonts, radius, size, space } from "@/lib/theme";

function countLabel(total: number, packed: number): string {
  const things = total === 1 ? "1 thing" : `${total} things`;
  return packed > 0 ? `${things} · ${packed} packed` : things;
}

export function PackingSection<
  T extends { id: number; label: string; category: PackCategory; quantity?: number },
>({
  heading,
  aside,
  lines,
  packed,
  selecting,
  onSelecting,
  onClear,
  emptyWord,
  renderLine,
  cubes = false,
  groupsOverride,
}: {
  heading: string;
  aside?: string;
  lines: T[];
  packed: number;
  selecting: boolean;
  onSelecting: (selecting: boolean) => void;
  onClear: () => void;
  emptyWord: string;
  renderLine: (line: T) => React.ReactNode;
  cubes?: boolean;
  groupsOverride?: PackingLineGroup<T>[];
}) {
  const { c } = useTheme();
  const groups = groupsOverride ?? viewPackingLines(lines, { sort: "category", category: "all" });

  return (
    <View style={{ gap: space.sm }}>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: space.sm }}>
        <View style={{ flex: 1 }}>
          <Heading>{heading}</Heading>
          {lines.length > 0 ? <Label>{countLabel(lines.length, packed)}</Label> : null}
        </View>
        {lines.length > 0 ? (
          <View style={{ alignItems: "flex-end", gap: space.xs }}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: selecting }}
              accessibilityLabel={selecting ? `Done picking in ${heading}` : `Pick rows to remove in ${heading}`}
              onPress={() => onSelecting(!selecting)}
              style={{ padding: space.xs }}
            >
              <Text style={{ color: c.pen, fontFamily: fonts.type, fontSize: size.label }}>
                {selecting ? "DONE" : "PICK ROWS TO REMOVE"}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Clear ${heading}`}
              onPress={onClear}
              style={{ padding: space.xs }}
            >
              <Text style={{ color: c.red, fontFamily: fonts.type, fontSize: size.label }}>
                CLEAR LIST
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
      {aside ? <Label>{aside}</Label> : null}

      {groups.length === 0 ? <Empty>{emptyWord}</Empty> : null}

      {groups.map((group) => (
        <View
          key={group.key}
          style={{
            gap: space.sm,
            padding: cubes ? space.md : 0,
            paddingTop: space.sm,
            backgroundColor: cubes ? c["sheet-2"] : "transparent",
            borderRadius: cubes ? radius.md : 0,
            borderWidth: cubes ? StyleSheet.hairlineWidth : 0,
            borderColor: c.rule,
          }}
        >
          {group.heading ? <Label>{group.heading}</Label> : null}
          {group.lines.map((line) => renderLine(line))}
        </View>
      ))}
    </View>
  );
}
