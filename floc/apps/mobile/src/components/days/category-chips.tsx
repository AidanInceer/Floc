/**
 * The packing category filter (#302).
 *
 * A STRIP, NOT A DROPDOWN. The web page uses a `<select>` because a desk has
 * a mouse and no room down the side; a phone has room for eight words side by
 * side and none for a menu that hides which one is on. Same categories, same
 * order, read straight off `PACK_CATEGORIES`.
 *
 * IT FILTERS, IT DOES NOT GATE (rule 4). "All" is always present and nothing
 * is ever unreachable — this is a view over the rows, not a state the trip is
 * in.
 */
import { PACK_CATEGORIES, PACK_CATEGORY_LABELS, type PackCategory } from "@floc/core/packing/packing";
import { Pressable, ScrollView, View } from "react-native";

import { useTheme } from "../system/theme";
import { Body } from "../system/ui";
import { radius, space } from "@/lib/theme";

/** What is showing. `all` is not a category — it is the absence of one. */
export type CategoryFilter = PackCategory | "all";

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: on }}
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        paddingVertical: space.xs,
        paddingHorizontal: space.md,
        borderRadius: radius.pill,
        backgroundColor: on ? c.mint : c["sheet-2"],
        borderWidth: 1,
        borderColor: on ? c["mint-edge"] : c.rule,
      }}
    >
      {/* The word is the thing; the fill is a second signal, never the only one (#204). */}
      <Body tone={on ? "ink" : "ink-3"}>{label}</Body>
    </Pressable>
  );
}

export function CategoryChips({
  value,
  onChange,
}: {
  value: CategoryFilter;
  onChange: (value: CategoryFilter) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={{ flexDirection: "row", gap: space.sm, paddingRight: space.lg }}>
        <Chip label="All" on={value === "all"} onPress={() => onChange("all")} />
        {PACK_CATEGORIES.map((category) => (
          <Chip
            key={category}
            label={PACK_CATEGORY_LABELS[category]}
            on={value === category}
            onPress={() => onChange(category)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

