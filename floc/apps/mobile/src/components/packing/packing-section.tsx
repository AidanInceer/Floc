import {
  packingCubes,
  viewPackingLines,
  type PackingLineGroup,
  type PackCategory,
} from "@floc/core/packing/packing";
import { useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { MoreGlyph } from "../system/glyphs";
import { Sheet } from "../system/sheet";
import { useTheme } from "../system/theme";
import { Card, SectionTitle } from "../system/ui";
import { FigureText } from "./figure-text";
import { TextAction } from "./line-frame";
import { groupCount, sectionCount } from "@/lib/packing/row-words";
import { fonts, radius, size, space } from "@/lib/theme";

function ListMenu({
  heading,
  open,
  onClose,
  onPick,
  onClear,
}: {
  heading: string;
  open: boolean;
  onClose: () => void;
  onPick: () => void;
  onClear: () => void;
}) {
  const { c } = useTheme();
  const item = (label: string, tone: "ink" | "red", onPress: () => void) => (
    <Pressable
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
      {item("Pick rows to remove", "ink", onPick)}
      {item("Clear list", "red", onClear)}
    </Sheet>
  );
}

function GroupBand({ heading, count, first }: { heading: string; count: { text: string; full: boolean }; first: boolean }) {
  const { c } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: space.md,
        paddingHorizontal: space.md,
        paddingVertical: space.sm,
        backgroundColor: c["sheet-2"],
        borderTopWidth: first ? 0 : StyleSheet.hairlineWidth,
        borderTopColor: c.rule,
      }}
    >
      <Text numberOfLines={1} style={{ flex: 1, color: c.ink, fontFamily: fonts.sansBold, fontSize: size.small }}>
        {heading}
      </Text>
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
  T extends { id: number; label: string; category: PackCategory; quantity?: number },
  I extends { category: PackCategory } = { category: PackCategory },
>({
  heading,
  aside,
  lines,
  packed,
  isPacked,
  selecting,
  onSelecting,
  onClear,
  emptyWord,
  renderLine,
  groupsOverride,
  ideas,
  headerAction,
}: {
  heading: string;
  aside?: string;
  lines: T[];
  packed: number;
  /** Null when a line has no tick of its own, so its group shows a total, not a fraction. */
  isPacked: (line: T) => boolean | null;
  selecting: boolean;
  onSelecting: (selecting: boolean) => void;
  onClear: () => void;
  emptyWord: string;
  renderLine: (line: T) => ReactNode;
  groupsOverride?: PackingLineGroup<T>[];
  /** Auto packing's ideas, drawn faint at the foot of their category's cube (#469). */
  ideas?: { list: I[]; render: (idea: I) => ReactNode };
  headerAction?: ReactNode;
}) {
  const { c } = useTheme();
  const [menu, setMenu] = useState(false);
  const groups: { key: string; heading: string | null; lines: T[]; ideas: I[] }[] = ideas
    ? packingCubes(lines as (T & { kitName?: string | null })[], ideas.list)
    : (groupsOverride ?? viewPackingLines(lines, { sort: "category", category: "all" })).map((g) => ({ ...g, ideas: [] }));
  const share = lines.length > 0 ? packed / lines.length : 0;

  return (
    <View style={{ gap: space.sm }}>
      <View style={{ gap: space.xs }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.md, minHeight: 36 }}>
          <View style={{ flex: 1, flexDirection: "row", alignItems: "baseline", gap: space.sm, flexWrap: "wrap" }}>
            <SectionTitle>{heading}</SectionTitle>
            {lines.length > 0 ? (
              <FigureText
                text={sectionCount(lines.length, packed)}
                style={{ color: c["ink-3"], fontFamily: fonts.sans, fontSize: size.small }}
              />
            ) : null}
          </View>
          {headerAction}
          {selecting ? (
            <TextAction label="Done" tone="pen" bold onPress={() => onSelecting(false)} accessibilityLabel={`Done picking in ${heading}`} />
          ) : lines.length > 0 ? (
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
        {packed > 0 ? (
          <View style={{ height: 3, borderRadius: radius.sm, backgroundColor: c["sheet-3"], overflow: "hidden" }}>
            <View style={{ width: `${Math.round(share * 100)}%`, height: 3, backgroundColor: c.green }} />
          </View>
        ) : null}
      </View>

      <ListMenu
        heading={heading}
        open={menu}
        onClose={() => setMenu(false)}
        onPick={() => onSelecting(true)}
        onClear={onClear}
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
              {group.heading ? <GroupBand heading={group.heading} count={count} first={g === 0} /> : null}
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
      {aside ? <Text style={{ color: c["ink-3"], fontFamily: fonts.sans, fontSize: size.small }}>{aside}</Text> : null}
    </View>
  );
}
