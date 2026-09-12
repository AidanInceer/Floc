/**
 * Which files to show, and the way to add one (#325 feedback) — the web's
 * filter bar, cut to a phone.
 *
 * IT SCROLLS RATHER THAN WRAPS. Five buckets and an Upload button do not fit
 * across a phone, and wrapping drops Upload onto a line of its own where it
 * reads as a stray button. The same choice the browser's bar makes.
 *
 * A BUCKET NOTHING IS FILED UNDER IS NOT DRAWN. It is a control that does
 * nothing until something lands there — except the one you are looking at,
 * which has to stay so you can leave it.
 */
import { DOC_CATEGORIES, DOC_CATEGORY_LABELS, type DocCategory } from "@floc/core/documents/documents";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../system/theme";
import { fonts, radius, size, space } from "@/lib/theme";

/** Set, so a chip and the Upload button beside it sit on the same two lines. */
const CHIP_HEIGHT = 30;

export type FileFilter = DocCategory | "all";

function Chip({
  label,
  on,
  onPress,
}: {
  label: string;
  on: boolean;
  onPress: () => void;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: on }}
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        height: CHIP_HEIGHT,
        justifyContent: "center",
        borderRadius: radius.pill,
        paddingHorizontal: space.md,
        backgroundColor: on ? c.sheet : "transparent",
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: on ? c.rule : "transparent",
      }}
    >
      <Text
        style={{
          color: on ? c.ink : c["ink-2"],
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
  const { c } = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingRight: space.lg }}
    >
      <View
        style={{
          flexDirection: "row",
          gap: space.xs,
          backgroundColor: c["sheet-2"],
          borderRadius: radius.pill,
          padding: space.xs,
        }}
      >
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
