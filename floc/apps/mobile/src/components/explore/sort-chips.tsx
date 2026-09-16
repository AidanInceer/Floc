import { EXPLORE_SORTS, type ExploreSort } from "@floc/core/trip/explore/explore-sort";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { SortGlyph } from "../system/glyphs";
import { useTheme } from "../system/theme";
import { fonts, radius, size, space } from "@/lib/theme";

export function SortChips({ value, onChange }: { value: ExploreSort; onChange: (next: ExploreSort) => void }) {
  const { c } = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: space.sm, paddingHorizontal: space.lg, alignItems: "center" }}
    >
      <View accessibilityLabel="Sort trips" accessible>
        <SortGlyph color={c["ink-2"]} />
      </View>
      {(Object.keys(EXPLORE_SORTS) as ExploreSort[]).map((sort) => {
        const on = sort === value;
        return (
          <Pressable
            key={sort}
            testID={`explore-sort-${sort}`}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(sort)}
            style={{
              backgroundColor: on ? c.pen : c.sheet,
              borderColor: on ? c.pen : c.rule,
              borderWidth: StyleSheet.hairlineWidth,
              borderRadius: radius.pill,
              paddingVertical: space.sm,
              paddingHorizontal: space.md,
            }}
          >
            <Text
              style={{
                color: on ? c.sheet : c["ink-2"],
                fontFamily: fonts.type,
                fontSize: size.label,
                textTransform: "uppercase",
                letterSpacing: 0.6,
              }}
            >
              {EXPLORE_SORTS[sort]}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
