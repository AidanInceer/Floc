import { FINDER_SORTS, type FinderSort } from "@floc/core/trip/explore/finder/finder-rank";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { CrossGlyph, FilterGlyph, SortGlyph } from "../../system/glyphs";
import { useTheme } from "../../system/theme";
import { fonts, radius, size, space } from "@/lib/theme";

type Removable = { id: string; label: string; onClear: () => void };

function Chip({ label, on = false, onPress, children }: { label: string; on?: boolean; onPress: () => void; children?: React.ReactNode }) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space.xs + 2,
        backgroundColor: on ? c.ink : c.sheet,
        borderColor: on ? c.ink : c.rule,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: radius.pill,
        paddingVertical: space.sm,
        paddingHorizontal: space.md,
      }}
    >
      {children}
    </Pressable>
  );
}

/** Above the rows: how many, the Filters button, what is set (tap to remove), then the order. */
export function FinderBar({
  shown,
  set,
  pills,
  sort,
  onSort,
  onOpen,
}: {
  shown: number;
  set: number;
  pills: Removable[];
  sort: FinderSort;
  onSort: (sort: FinderSort) => void;
  onOpen: () => void;
}) {
  const { c } = useTheme();
  const word = (on: boolean) => ({ color: on ? c.paper : c["ink-2"], fontFamily: fonts.type, fontSize: size.label, textTransform: "uppercase" as const, letterSpacing: 0.6 });
  const row = { gap: space.sm, paddingHorizontal: space.lg, alignItems: "center" as const };
  return (
    <View style={{ gap: space.sm }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={row}>
        <Text style={{ color: c.ink, fontFamily: fonts.typeBold, fontSize: size.small, marginRight: space.xs }}>
          {shown} {shown === 1 ? "trip" : "trips"}
        </Text>
        <Chip label={`Filters${set ? `, ${set} set` : ""}`} onPress={onOpen}>
          <FilterGlyph color={c["ink-2"]} />
          <Text style={word(false)}>Filters{set ? ` · ${set}` : ""}</Text>
        </Chip>
        {pills.map((p) => (
          <Chip key={p.id} label={`Remove ${p.label}`} onPress={p.onClear}>
            <Text style={{ color: c.ink, fontFamily: fonts.sans, fontSize: size.small }}>{p.label}</Text>
            <CrossGlyph color={c["ink-3"]} />
          </Chip>
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={row}>
        <View accessibilityLabel="Sort trips" accessible>
          <SortGlyph color={c["ink-2"]} />
        </View>
        {(Object.keys(FINDER_SORTS) as FinderSort[]).map((s) => (
          <Chip key={s} label={FINDER_SORTS[s]} on={s === sort} onPress={() => onSort(s)}>
            <Text style={word(s === sort)}>{FINDER_SORTS[s]}</Text>
          </Chip>
        ))}
      </ScrollView>
    </View>
  );
}
