/**
 * Which files to show (#325 feedback) — the web's filter bar, cut to a phone.
 *
 * IT SCROLLS RATHER THAN WRAPS: five buckets do not fit across a phone.
 *
 * A BUCKET NOTHING IS FILED UNDER IS NOT DRAWN. It is a control that does
 * nothing until something lands there — except the one you are looking at,
 * which has to stay so you can leave it. The page hides the whole row until
 * there is more than one bucket to choose between.
 */
import { DOC_CATEGORIES, DOC_CATEGORY_LABELS, type DocCategory } from "@floc/core/documents/documents";
import { Pressable, ScrollView, Text, View } from "react-native";

import { useTheme } from "../system/theme";
import { fonts, radius, size, space } from "@/lib/theme";

export type FileFilter = DocCategory | "all";

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: on }}
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={7}
      style={{
        height: 30,
        justifyContent: "center",
        borderRadius: radius.pill,
        paddingHorizontal: space.md,
        backgroundColor: on ? c["pen-2"] : "transparent",
      }}
    >
      <Text
        style={{
          color: on ? c["pen-deep"] : c["ink-2"],
          fontFamily: on ? fonts.sansBold : fonts.sans,
          fontSize: size.small,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function FileFilters({
  counts,
  value,
  onChange,
}: {
  counts: Record<DocCategory, number>;
  value: FileFilter;
  onChange: (next: FileFilter) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={{ flexDirection: "row", gap: space.xs }}>
        <Chip label="All" on={value === "all"} onPress={() => onChange("all")} />
        {DOC_CATEGORIES.map((category) => {
          const n = counts[category];
          if (n === 0 && value !== category) return null;
          return (
            <Chip
              key={category}
              label={`${DOC_CATEGORY_LABELS[category]} · ${n}`}
              on={value === category}
              onPress={() => onChange(category)}
            />
          );
        })}
      </View>
    </ScrollView>
  );
}
