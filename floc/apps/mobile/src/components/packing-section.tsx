/**
 * One packing list: its heading, its count, its own toolbar, its rows
 * (tickets 219, 220, 229).
 *
 * EACH LIST OWNS ITS CONTROLS. Sorting your bag must not reorder the group's,
 * and the web already keeps the two views apart for that reason. So the sort
 * and the Select toggle sit under each heading rather than once at the top —
 * one shared toolbar would be one control answering two questions.
 *
 * THE COUNT IS STATUS, WHICH IS THE ONE THING TEXT STILL CARRIES. "9 things ·
 * 4 packed" is not derivable from a list you have to scroll, so it is said.
 *
 * GROUPING COMES FROM THE CORE. `viewPackingLines` filters, sorts and groups —
 * including the rule that sorting by name or quantity produces one flat list,
 * because a category heading over rows ordered by something else is two
 * orderings arguing in public. None of that is re-decided here.
 */
import {
  PACK_SORT_LABELS,
  viewPackingLines,
  type PackCategory,
  type PackSort,
} from "@floc/core/packing";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "./theme";
import { Body, Dropdown, Empty, Heading, Label } from "./ui";
import { fonts, radius, size, space } from "@/lib/theme";

export type Selection = ReadonlySet<number>;

/** What the count says. Packed is dropped at zero — "0 packed" is noise on a fresh list. */
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
  filter,
  sort,
  sorts,
  onSort,
  selecting,
  onSelecting,
  emptyWord,
  renderLine,
}: {
  heading: string;
  /** Said only when there is something the drawing cannot say — e.g. who can see this list. */
  aside?: string;
  lines: T[];
  packed: number;
  filter: PackCategory | "all";
  sort: PackSort;
  /** The bag offers quantity; the group's list does not, having no count on screen. */
  sorts: readonly PackSort[];
  onSort: (sort: PackSort) => void;
  selecting: boolean;
  onSelecting: (selecting: boolean) => void;
  /** What to say when the filter hid everything, versus when there is nothing at all. */
  emptyWord: string;
  renderLine: (line: T) => React.ReactNode;
}) {
  const { c } = useTheme();
  const groups = viewPackingLines(lines, { sort, category: filter });

  return (
    <View style={{ gap: space.sm }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: space.sm,
        }}
      >
        <Heading>{heading}</Heading>
        {lines.length > 0 ? <Label>{countLabel(lines.length, packed)}</Label> : null}
      </View>
      {aside ? <Body tone="ink-3">{aside}</Body> : null}

      {/* Nothing to sort and nothing to pick when the list is empty — a toolbar
          over an empty list is furniture asking a question with no answer. */}
      {lines.length > 0 ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
          {/* One short word each. The list they belong to is the heading
              directly above; repeating it here wrapped the label over two
              lines and pushed the second control off the edge. */}
          <View style={{ flex: 1 }}>
            <Dropdown
              label="Sort"
              options={sorts.map((value) => ({ value, label: PACK_SORT_LABELS[value] }))}
              value={sort}
              onChange={onSort}
            />
          </View>
          {/* A toggle, not a menu: it has two states and one of them is off,
              which is a button, not a question with a list of answers. */}
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: selecting }}
            accessibilityLabel={
              selecting ? `Stop picking things in ${heading}` : `Pick things in ${heading}`
            }
            onPress={() => onSelecting(!selecting)}
            style={{
              alignSelf: "flex-end",
              paddingVertical: space.md,
              paddingHorizontal: space.lg,
              borderRadius: radius.md,
              backgroundColor: selecting ? c.mint : c["sheet-2"],
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: selecting ? c["mint-edge"] : c.rule,
            }}
          >
            <Text
              style={{
                color: selecting ? c["mint-ink"] : c.ink,
                fontFamily: fonts.sansBold,
                fontSize: size.body,
              }}
            >
              {selecting ? "Done" : "Select"}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {groups.length === 0 ? <Empty>{emptyWord}</Empty> : null}

      {groups.map((group) => (
        <View key={group.key} style={{ gap: space.sm, paddingTop: space.sm }}>
          {group.heading ? <Label>{group.heading}</Label> : null}
          {group.lines.map((line) => renderLine(line))}
        </View>
      ))}
    </View>
  );
}
