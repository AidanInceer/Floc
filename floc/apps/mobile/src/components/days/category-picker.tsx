/**
 * What an expense was for, picked (money overhaul).
 *
 * A CLOSED CONTROL, THEN A SHEET. Twelve categories will not sit on a phone's
 * width, and a scrolling strip of twelve makes the form's shortest question its
 * tallest control. So the closed control shows the answer and opens a grid.
 *
 * ON A PHONE IT IS THE GLYPH ALONE. `compact` drops the word and the whole
 * "Category" row with it, folding the answer onto the line it belongs to. The
 * word is not lost — it is the accessible label, and the grid is all words —
 * but a labelled row for a question with a correct default was a third of the
 * form's height spent on the thing least often changed.
 *
 * IT STILL HAS TO LOOK PRESSABLE. Compact keeps the field's ground and edge, so
 * a bare glyph reads as a control rather than a decoration on the amount.
 *
 * NOTHING IS INVALID. `other` is a real answer and the default, so this cannot
 * block a save — it is a filing decision, not a required field.
 */
import {
  CATEGORY_LABELS,
  EXPENSE_CATEGORIES,
  type ExpenseCategory,
} from "@floc/core/money/expense-category";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { CategoryIcon } from "../system/category-icon";
import { Sheet } from "../system/sheet";
import { useTheme } from "../system/theme";
import { Label } from "../system/ui";
import { fonts, radius, size, space } from "@/lib/theme";

/** Three across fits the longest word ("Groceries") without breaking it. */
const COLUMNS = 3;

function Cell({
  category,
  on,
  onPress,
}: {
  category: ExpenseCategory;
  on: boolean;
  onPress: () => void;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: on }}
      accessibilityLabel={CATEGORY_LABELS[category]}
      onPress={onPress}
      style={{
        width: `${100 / COLUMNS}%`,
        alignItems: "center",
        gap: space.xs,
        paddingVertical: space.md,
        borderRadius: radius.md,
        backgroundColor: on ? c.mint : "transparent",
        borderWidth: on ? 1.4 : StyleSheet.hairlineWidth,
        borderColor: on ? c["mint-edge"] : c.rule,
      }}
    >
      <CategoryIcon category={category} color={on ? c["mint-ink"] : c["ink-2"]} size={20} />
      <Text
        style={{
          color: on ? c["mint-ink"] : c["ink-2"],
          fontFamily: fonts.sans,
          fontSize: size.small,
        }}
      >
        {CATEGORY_LABELS[category]}
      </Text>
    </Pressable>
  );
}

export function CategoryPicker({
  value,
  onChange,
  compact,
}: {
  value: ExpenseCategory;
  onChange: (category: ExpenseCategory) => void;
  /** Glyph only, sized to sit inside another line rather than own a row. */
  compact?: boolean;
}) {
  const { c } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Category — ${CATEGORY_LABELS[value]}`}
        onPress={() => setOpen(true)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: compact ? 0 : space.sm,
          backgroundColor: c.sheet,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: c["rule-2"] ?? c.rule,
          borderRadius: radius.md,
          paddingVertical: space.sm,
          paddingHorizontal: compact ? space.sm : space.md,
          minWidth: compact ? 42 : 150,
        }}
      >
        <CategoryIcon category={value} color={c["ink-2"]} size={compact ? 20 : 16} />
        {compact ? null : (
          <Text style={{ color: c.ink, fontFamily: fonts.sans, fontSize: size.body }}>
            {CATEGORY_LABELS[value]}
          </Text>
        )}
      </Pressable>

      <Sheet open={open} onClose={() => setOpen(false)}>
        <View style={{ padding: space.lg, gap: space.sm }}>
          <Label>What was it for</Label>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {EXPENSE_CATEGORIES.map((category) => (
              <Cell
                key={category}
                category={category}
                on={category === value}
                onPress={() => {
                  onChange(category);
                  setOpen(false);
                }}
              />
            ))}
          </View>
        </View>
      </Sheet>
    </>
  );
}
