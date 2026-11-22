import {
  packingCubes,
  viewPackingLines,
  type PackingLineGroup,
  type PackCategory,
} from "@floc/core/packing/packing";
import { suggestedNote } from "@floc/core/packing/packing-words";
import { useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { MoreGlyph } from "../system/glyphs";
import { Sheet } from "../system/sheet";
import { useTheme } from "../system/theme";
import { Card, SectionTitle } from "../system/ui";
import { FigureText } from "./figure-text";
import { SuggestedNote } from "./suggested-mark";
import { TextAction } from "./line-frame";
import { groupCount } from "@/lib/packing/row-words";
import { fonts, size, space } from "@/lib/theme";

export type SectionMenuItem = { label: string; danger: boolean; onPress: () => void };

function ListMenu({
  heading,
  open,
  onClose,
  onPick,
  items,
}: {
  heading: string;
  open: boolean;
  onClose: () => void;
  onPick: (() => void) | null;
  items: SectionMenuItem[];
}) {
  const { c } = useTheme();
  const row = (label: string, tone: "ink" | "red", onPress: () => void) => (
    <Pressable
      key={label}
      accessibilityRole="button"
      accessibilityLabel={`${label} in ${heading}`}
      onPress={() => {
        onClose();
        onPress();
      }}
      style={({ pressed }) => ({
        paddingVertical: space.md,
        paddingHorizontal: space.lg,
        backgroundColor: pressed ? c["sheet-2"] : "transparent",
      })}
    >
      <Text style={{ color: c[tone], fontFamily: fonts.sans, fontSize: size.body }}>{label}</Text>
    </Pressable>
  );
  return (
    <Sheet open={open} onClose={onClose}>
      {onPick ? row("Pick rows to remove", "ink", onPick) : null}
      {items.map((item) => row(item.label, item.danger ? "red" : "ink", item.onPress))}
    </Sheet>
  );
}

function GroupBand({ heading, count, note, first }: { heading: string; count: { text: string; full: boolean }; note: string | null; first: boolean }) {
  const { c } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: space.md,
        paddingHorizontal: space.md,
        paddingVertical: space.sm,
        backgroundColor: c["sheet-2"],
        borderTopWidth: first ? 0 : StyleSheet.hairlineWidth,
        borderTopColor: c.rule,
      }}
    >
      <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: space.sm }}>
        <Text numberOfLines={1} style={{ flexShrink: 1, color: c.ink, fontFamily: fonts.sansBold, fontSize: size.small }}>
          {heading}
        </Text>
        {note ? <SuggestedNote text={note} /> : null}
      </View>
      {count.text ? (
        <FigureText
          text={count.text}
          style={{ color: count.full ? c.green : c["ink-3"], fontFamily: fonts.sans, fontSize: size.small }}
        />
      ) : null}
    </View>
  );
}

export function PackingSection<
  T extends { id: number; label: string; category: PackCategory; quantity?: number; suggested?: boolean },
  I extends { category: PackCategory } = { category: PackCategory },
>({
  heading,
  lines,
  isPacked,
  selecting,
  onSelecting,
  menuItems,
  emptyWord,
  renderLine,
  groupsOverride,
  ideas,
  headerAction,
}: {
  heading: string;
  lines: T[];
  isPacked: (line: T) => boolean | null;
  selecting: boolean;
  onSelecting: (selecting: boolean) => void;
  menuItems: SectionMenuItem[];
  emptyWord: string;
  renderLine: (line: T) => ReactNode;
  groupsOverride?: PackingLineGroup<T>[];
  ideas?: { list: I[]; render: (idea: I) => ReactNode };
  headerAction?: ReactNode;
}) {
  const { c } = useTheme();
  const [menu, setMenu] = useState(false);
  const groups: { key: string; heading: string | null; lines: T[]; ideas: I[] }[] = ideas
    ? packingCubes(lines as (T & { kitName?: string | null })[], ideas.list)
    : (groupsOverride ?? viewPackingLines(lines, { sort: "category", category: "all" })).map((g) => ({ ...g, ideas: [] }));

  return (
    <View style={{ gap: space.sm }}>
      <View style={{ gap: space.xs }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.md, minHeight: 36 }}>
          <View style={{ flex: 1, flexDirection: "row", alignItems: "baseline", gap: space.sm, flexWrap: "wrap" }}>
            <SectionTitle>{heading}</SectionTitle>
          </View>
          {headerAction}
          {selecting ? (
            <TextAction label="Done" tone="pen" bold onPress={() => onSelecting(false)} accessibilityLabel={`Done picking in ${heading}`} />
          ) : lines.length > 0 || menuItems.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`More for ${heading}`}
              onPress={() => setMenu(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{ width: 28, height: 28, alignItems: "center", justifyContent: "center" }}
            >
              <MoreGlyph color={c["ink-2"]} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <ListMenu
        heading={heading}
        open={menu}
        onClose={() => setMenu(false)}
        onPick={lines.length > 0 ? () => onSelecting(true) : null}
        items={menuItems}
      />

      <Card style={{ padding: 0, gap: 0, overflow: "hidden" }}>
        {groups.length === 0 ? (
          <Text style={{ color: c["ink-2"], fontFamily: fonts.sans, fontSize: size.body, padding: space.lg }}>
            {emptyWord}
          </Text>
        ) : null}
        {groups.map((group, g) => {
          const count = groupCount(group.lines.map(isPacked));
          const rows = [
            ...group.lines.map((line) => renderLine(line)),
            ...group.ideas.map((idea) => ideas?.render(idea)),
          ];
          return (
            <View key={group.key}>
              {group.heading ? (
                <GroupBand
                  heading={group.heading}
                  count={count}
                  note={suggestedNote(group.lines.map((line) => ({ suggested: line.suggested === true })))}
                  first={g === 0}
                />
              ) : null}
              {rows.map((row, i) => (
                <View
                  key={i}
                  style={{
                    borderTopWidth: i === 0 && (group.heading || g === 0) ? 0 : StyleSheet.hairlineWidth,
                    borderTopColor: c.rule,
                  }}
                >
                  {row}
                </View>
              ))}
            </View>
          );
        })}
      </Card>
    </View>
  );
}
