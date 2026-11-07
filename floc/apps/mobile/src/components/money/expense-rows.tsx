/**
 * Every cost, one card of hairline rows with a band per day (#317), as a ledger app lists them: the category tile, what
 * it was and who paid, then the amount and what it means for you. A row opens the cost to edit.
 */
import { DEFAULT_CATEGORY, isExpenseCategory } from "@floc/core/money/expense-category";
import { formatMoney } from "@floc/core/money/money";
import type { Ledger } from "@floc/api/port";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { CategoryIcon } from "../system/category-icon";
import { useTheme } from "../system/theme";
import { Card, Label } from "../system/ui";
import { groupByDay } from "@/lib/money/group-by-day";
import type { ShareTone } from "@/lib/money/share-line";
import { fonts, radius, size, space } from "@/lib/theme";

type Expense = Ledger["expenses"][number];

function Row({ expense, paidBy, share, first, onPress }: { expense: Expense; paidBy: string; share: { words: string; tone: ShareTone }; first: boolean; onPress: () => void }) {
  const { c } = useTheme();
  const category = isExpenseCategory(expense.category) ? expense.category : DEFAULT_CATEGORY;
  const shareInk = { lent: c["pastel-green-ink"], share: c["ink-2"], none: c["ink-3"] }[share.tone];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${expense.description}, ${formatMoney(expense.amountMinor, expense.currency)}, ${paidBy}, ${share.words}. Edit`}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: space.md,
        paddingHorizontal: space.md,
        paddingVertical: space.md,
        borderTopWidth: first ? 0 : StyleSheet.hairlineWidth,
        borderTopColor: c.rule,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <View style={{ width: 34, height: 34, borderRadius: radius.sm, backgroundColor: c["sheet-3"], alignItems: "center", justifyContent: "center" }}>
        <CategoryIcon category={category} color={c["ink-2"]} size={16} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text numberOfLines={2} style={{ color: c.ink, fontFamily: fonts.sansBold, fontSize: size.small }}>{expense.description}</Text>
        <Text numberOfLines={1} style={{ color: c["ink-3"], fontFamily: fonts.sans, fontSize: size.small }}>{paidBy}</Text>
      </View>
      <View style={{ alignItems: "flex-end", gap: 2 }}>
        <Text style={{ color: c.ink, fontFamily: fonts.type, fontSize: size.small, fontVariant: ["tabular-nums"] }}>{formatMoney(expense.amountMinor, expense.currency)}</Text>
        <Text style={{ color: shareInk, fontFamily: fonts.type, fontSize: size.label, fontVariant: ["tabular-nums"] }}>{share.words}</Text>
      </View>
    </Pressable>
  );
}

export function ExpenseRows({
  expenses,
  paidByOf,
  shareOf,
  dayLabel,
  onEdit,
}: {
  expenses: Expense[];
  paidByOf: (expense: Expense) => string;
  shareOf: (expense: Expense) => { words: string; tone: ShareTone };
  /** The day a cost belongs to, as words — costs with no day group last. */
  dayLabel: (dayId: number | null) => string;
  onEdit: (expenseId: number) => void;
}) {
  const { c } = useTheme();
  const groups = groupByDay(expenses, dayLabel);
  return (
    <Card style={{ padding: 0, gap: 0, overflow: "hidden" }}>
      {groups.map((group, g) => (
        <View key={group.day}>
          {/* Why: one undated group needs no heading — "No day yet" over every cost said nothing. */}
          {groups.length > 1 ? (
            <View style={{ paddingHorizontal: space.md, paddingTop: space.md, paddingBottom: space.xs, backgroundColor: c["sheet-2"], borderTopWidth: g === 0 ? 0 : StyleSheet.hairlineWidth, borderTopColor: c.rule }}>
              <Label>{group.day}</Label>
            </View>
          ) : null}
          {group.expenses.map((expense, i) => (
            <Row key={expense.id} expense={expense} paidBy={paidByOf(expense)} share={shareOf(expense)} first={i === 0 && (groups.length > 1 || g === 0)} onPress={() => onEdit(expense.id)} />
          ))}
        </View>
      ))}
    </Card>
  );
}