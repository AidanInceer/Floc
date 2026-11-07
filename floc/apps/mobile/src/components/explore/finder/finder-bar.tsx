import { FINDER_SORTS, type FinderSort } from "@floc/core/trip/explore/finder/finder-rank";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ChevronGlyph, CrossGlyph, FilterGlyph, SortGlyph } from "../../system/glyphs";
import { useTheme } from "../../system/theme";
import { ChoiceSheet } from "../../system/ui";
import { fonts, radius, size, space } from "@/lib/theme";

type Removable = { id: string; label: string; onClear: () => void };

function Control({ label, onPress, children }: { label: string; onPress: () => void; children: React.ReactNode }) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: space.xs + 2,
        minHeight: 44,
        backgroundColor: c.sheet,
        borderColor: c.rule,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: radius.sm,
        paddingHorizontal: space.md,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      {children}
    </Pressable>
  );
}

/** Above the rows: Filters on the left and the order on the right, then what is set, each tapped away. */
export function FinderBar({
  set,
  pills,
  sort,
  onSort,
  onOpen,
}: {
  set: number;
  pills: Removable[];
  sort: FinderSort;
  onSort: (sort: FinderSort) => void;
  onOpen: () => void;
}) {
  const { c } = useTheme();
  const [sorting, setSorting] = useState(false);
  const word = { color: c.ink, fontFamily: fonts.sans, fontSize: size.small };

  return (
    <View style={{ gap: space.sm }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: space.sm }}>
        <Control label={`Filters${set ? `, ${set} set` : ""}`} onPress={onOpen}>
          <FilterGlyph color={c["ink-2"]} />
          <Text style={word}>Filters</Text>
          {set ? <Text style={{ ...word, fontFamily: fonts.type, color: c["ink-2"] }}>· {set}</Text> : null}
        </Control>
        <Control label={`Sort: ${FINDER_SORTS[sort]}`} onPress={() => setSorting(true)}>
          <SortGlyph color={c["ink-2"]} />
          <Text style={word}>{FINDER_SORTS[sort]}</Text>
          <ChevronGlyph color={c["ink-3"]} />
        </Control>
      </View>
      {pills.length > 0 ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
          {pills.map((p) => (
            <Pressable
              key={p.id}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${p.label}`}
              onPress={p.onClear}
              hitSlop={6}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: space.xs,
                backgroundColor: c.sheet,
                borderColor: c.rule,
                borderWidth: StyleSheet.hairlineWidth,
                borderRadius: radius.pill,
                paddingVertical: space.xs + 2,
                paddingHorizontal: space.md,
              }}
            >
              <Text style={word}>{p.label}</Text>
              <CrossGlyph color={c["ink-3"]} />
            </Pressable>
          ))}
        </View>
      ) : null}
      <ChoiceSheet
        title="Sort by"
        open={sorting}
        onClose={() => setSorting(false)}
        options={(Object.keys(FINDER_SORTS) as FinderSort[]).map((s) => ({ value: s, label: FINDER_SORTS[s] }))}
        value={sort}
        onChange={onSort}
      />
    </View>
  );
}
