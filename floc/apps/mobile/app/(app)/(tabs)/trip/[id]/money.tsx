/**
 * Money (ticket 300) — what you owe first, the ledger second.
 *
 * THE QUESTION IS NEVER "what did the group spend". It is "what do I owe, and
 * to whom", so the viewer's own balance leads and the list settles underneath.
 * That is the one real difference from the web page, which has room to lead
 * with the whole book.
 *
 * MONEY IS NEVER A FLOAT (rule 1). Integer minor units end to end. Every
 * amount displayed goes through `formatMoney` and every amount typed through
 * `parseMoney`, both from `@floc/core/money` — so the phone cannot round a
 * penny differently from the browser.
 *
 * BALANCES ARE DERIVED, NEVER FETCHED. `ledgerBalances` runs over the ledger
 * the API returned, and `yourSettleUp` keeps the viewer's own half of it
 * (#317). There is no balance column, because a stored balance is a second
 * source of truth about the same money.
 *
 * SPLITS ARE SNAPSHOTS (rule 2). An edit sends the whole split set and the API
 * rewrites expense and splits together. Nothing here recalculates an old
 * expense from today's roster.
 *
 * SETTLING IS NOT AN ADMIN POWER (rule 6). Any member records a transfer, in
 * either direction — the four powers are remove, promote, delete or archive, and reset the link.
 */
import { formatDate } from "@floc/core/dates/dates";
import {
  DEFAULT_CATEGORY,
  isExpenseCategory,
} from "@floc/core/money/expense-category";
import { formatMoney, toMajorInput } from "@floc/core/money/money";
import type { PairRow } from "@floc/core/money/pair-settle";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";

import { CategoryIcon } from "@/components/system/category-icon";
import {
  ExpenseForm,
  type DayOption,
  type ExpenseDraft,
} from "@/components/money/expense-form";
import { useTheme } from "@/components/system/theme";
import {
  Body,
  Button,
  Card,
  Divider,
  Empty,
  Failed,
  Figure,
  Heading,
  Label,
  Loading,
} from "@/components/system/ui";
import { trpc } from "@/lib/api";
import { useSession } from "@/lib/auth";
import { ledgerCurrency } from "@/lib/balance";
import { editStart, peopleOnExpense } from "@/lib/money/edit-start";
import { space } from "@/lib/theme";
import type { Ledger } from "@floc/api/port";

/** Nothing open, adding, or editing this expense. One state, so two cannot both be true. */
type Editing =
  { kind: "none" } | { kind: "add" } | { kind: "edit"; expenseId: number };

/**
 * The top of the screen: one row per person you owe or are owed by, each settled in one payment even when the
 * debts run in two currencies (#461). Being square is the viewer's own state (#317).
 */
function MoneyTop({
  pairs,
  viewerId,
  nameOf,
  busy,
  onSettle,
}: {
  pairs: { rows: PairRow[] } | undefined;
  viewerId: string | undefined;
  nameOf: (userId: string) => string;
  busy: boolean;
  onSettle: (row: PairRow) => void;
}) {
  const [showOwed, setShowOwed] = useState(false);
  const rows = pairs?.rows ?? [];
  const owe = rows.filter((r) => r.payer === viewerId);
  const owed = rows.filter((r) => r.payee === viewerId);

  if (rows.length === 0) {
    return (
      <Card>
        <View style={{ gap: space.xs, alignItems: "center" }}>
          <Heading>All settled up</Heading>
          <Body tone="ink-2">You are square with everyone on this trip.</Body>
        </View>
      </Card>
    );
  }

  const line = (row: PairRow, paying: boolean) => (
    <View key={row.other} style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Figure tone={paying ? "red" : "green"}>{formatMoney(row.amountMinor, row.currency)}</Figure>
        <Body tone="ink-2">{paying ? `to ${nameOf(row.other)}` : `from ${nameOf(row.other)}`}</Body>
      </View>
      <Button label="Settle up" variant={paying ? "primary" : "quiet"} fit="small" busy={busy} onPress={() => onSettle(row)} />
    </View>
  );

  return (
    <Card style={{ gap: space.sm }}>
      <Label>You owe</Label>
      {owe.length === 0 ? <Body tone="ink-2">Nothing to pay — you have paid your share.</Body> : owe.map((r) => line(r, true))}

      <Divider />

      {/* Money owed to you is news, not a job: one line, opened when you ask. */}
      <Pressable
        accessibilityRole="button"
        onPress={() => setShowOwed((open) => !open)}
        style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.sm }}
      >
        <Body tone="ink-2">You are owed</Body>
        <Body tone="ink-2">{owed.length === 0 ? "nothing" : `${owed.length} ${owed.length === 1 ? "person" : "people"}`}</Body>
      </Pressable>
      {showOwed ? owed.map((r) => line(r, false)) : null}
    </Card>
  );
}

/** What one payment clears, for the confirm before it is recorded. */
function clearsLine(row: PairRow, viewerId: string, nameOf: (userId: string) => string): string {
  return row.parts
    .map((p) => {
      const amount = formatMoney(p.clearsAmountMinor ?? p.amountMinor, p.clearsCurrency ?? p.currency);
      return p.fromUserId === viewerId ? `${amount} you owe ${nameOf(p.toUserId)}` : `${amount} ${nameOf(p.fromUserId)} owes you`;
    })
    .join("\n");
}

/**
 * Every cost, as one card of hairline rows (#317). A card per cost put a gap
 * and a border around every line, so a short list read as a stack of floating
 * tiles rather than a ledger. A row is tapped to edit it.
 */
function ExpenseList({
  expenses,
  lineFor,
  dayLabel,
  onEdit,
}: {
  expenses: Ledger["expenses"];
  lineFor: (expense: Ledger["expenses"][number]) => string;
  /** The day a cost belongs to, as words — costs with no day group last. */
  dayLabel: (dayId: number | null) => string;
  onEdit: (expenseId: number) => void;
}) {
  const { c } = useTheme();
  if (expenses.length === 0) return <Empty>No costs logged yet.</Empty>;
  return (
    <Card style={{ padding: 0, gap: 0, overflow: "hidden" }}>
      {groupByDay(expenses, dayLabel).map((group) => (
        <View key={group.day}>
          <View style={{ paddingHorizontal: space.md, paddingTop: space.md }}>
            <Label>{group.day}</Label>
          </View>
          {group.expenses.map((expense, index) => (
            <View key={expense.id}>
              {index > 0 ? <Divider /> : null}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Edit ${expense.description}`}
                onPress={() => onEdit(expense.id)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: space.sm,
                  padding: space.md,
                }}
              >
                {/* The glyph makes a long list scannable; the description is still
                the thing that says what it was. A mark, not a label (#204) —
                its own `accessibilityLabel` carries the word. */}
                <CategoryIcon
                  category={
                    isExpenseCategory(expense.category)
                      ? expense.category
                      : DEFAULT_CATEGORY
                  }
                  color={c["ink-3"]}
                  size={16}
                />
                <View style={{ flex: 1, gap: 2 }}>
                  <Body bold>{expense.description}</Body>
                  <Body tone="ink-3">{lineFor(expense)}</Body>
                </View>
                <Figure>
                  {formatMoney(expense.amountMinor, expense.currency)}
                </Figure>
              </Pressable>
            </View>
          ))}
        </View>
      ))}
    </Card>
  );
}

/** The cost being edited, or nothing when the screen is not editing one. */
function expenseBeingEdited(
  expenses: Ledger["expenses"],
  editing: Editing,
): Ledger["expenses"][number] | undefined {
  if (editing.kind !== "edit") return undefined;
  return expenses.find((expense) => expense.id === editing.expenseId);
}

/** A stored cost, as the form's starting values. */
function formValues(ledger: Ledger, expense: Ledger["expenses"][number]) {
  const start = editStart(
    ledger.splits.filter((split) => split.expenseId === expense.id),
    expense.currency,
  );
  return {
    description: expense.description,
    // Guarded on the way in: `category` is a stored word and a row written
    // before the column existed can be anything (rule 11).
    category: isExpenseCategory(expense.category)
      ? expense.category
      : DEFAULT_CATEGORY,
    amount: toMajorInput(expense.amountMinor, expense.currency),
    paidBy: expense.paidBy,
    dayId: expense.dayId ?? null,
    notes: expense.notes ?? "",
    ...start,
  };
}

/** The first cost of a trip is asked for differently from the tenth. */
function addLabel(count: number): string {
  return count === 0 ? "Log the first cost" : "Add an expense";
}

/** Costs in the order they came, cut into the days they belong to. */
function groupByDay(
  expenses: Ledger["expenses"],
  dayLabel: (dayId: number | null) => string,
): { day: string; expenses: Ledger["expenses"] }[] {
  const groups: { day: string; expenses: Ledger["expenses"] }[] = [];
  for (const expense of expenses) {
    const day = dayLabel(expense.dayId ?? null);
    const last = groups.at(-1);
    if (last && last.day === day) last.expenses.push(expense);
    else groups.push({ day, expenses: [expense] });
  }
  return groups;
}

/** The viewer's own share of each expense, read once rather than once per row. */
function sharesOf(ledger: Ledger, viewerId: string | undefined): Map<number, number> {
  return new Map(
    ledger.splits
      .filter((split) => split.userId === viewerId)
      .map((split) => [split.expenseId, split.owedAmountMinor]),
  );
}

/** Who paid, and what it cost you — one line under the description. */
function shareLine(
  shares: Map<number, number>,
  expense: Ledger["expenses"][number],
  me: string | undefined,
  nameOf: (userId: string) => string,
): string {
  const share = shares.get(expense.id);
  const who =
    expense.paidBy === me ? "You paid" : `${nameOf(expense.paidBy)} paid`;
  if (share === undefined) return `${who} · not yours`;
  return `${who} · your share ${formatMoney(share, expense.currency)}`;
}

export default function Money() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tripId = Number(id);
  // A screen keeps rendering for a frame while it leaves, and `id` is gone by
  // then: NaN goes down the wire as null and the server rightly refuses it.
  const ready = Number.isFinite(tripId);
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const [editing, setEditing] = useState<Editing>({ kind: "none" });
  const [problem, setProblem] = useState<string | null>(null);

  const trip = useQuery(
    trpc.trips.get.queryOptions({ tripId }, { enabled: ready }),
  );
  const ledger = useQuery(
    trpc.money.ledger.queryOptions({ tripId }, { enabled: ready }),
  );
  const pairs = useQuery(trpc.money.pairs.queryOptions({ tripId }, { enabled: ready }));
  // For "which day". An undated trip returns none, which is not an error
  // (rule 9) — the form simply stops asking.
  const itinerary = useQuery(
    trpc.itinerary.days.queryOptions({ tripId }, { enabled: ready }),
  );

  const done = () => {
    setEditing({ kind: "none" });
    setProblem(null);
    queryClient.invalidateQueries({
      queryKey: trpc.money.ledger.queryKey({ tripId }),
    });
    void queryClient.invalidateQueries({ queryKey: trpc.money.pairs.queryKey({ tripId }) });
  };
  const failed = (error: { message: string }) => setProblem(error.message);

  const write = useMutation({
    ...trpc.money.write.mutationOptions(),
    onSuccess: done,
    onError: failed,
  });
  const remove = useMutation({
    ...trpc.money.deleteExpense.mutationOptions(),
    onSuccess: done,
    onError: failed,
  });
  const settle = useMutation({
    ...trpc.money.settlePair.mutationOptions(),
    onSuccess: done,
    onError: failed,
  });

  if (trip.isPending || ledger.isPending) return <Loading />;
  if (trip.isError) return <Failed onRetry={() => trip.refetch()} />;
  if (ledger.isError) return <Failed onRetry={() => ledger.refetch()} />;

  // Bound once past the guards: a closure below cannot see the narrowing.
  const snapshot = ledger.data;
  const me = session?.user.id;
  const members = trip.data.members;
  const nameOf = (userId: string) =>
    members.find((member) => member.userId === userId)?.name ??
    "Someone who left";

  const dayOptions: DayOption[] = (itinerary.data ?? []).map((day) => ({
    id: day.id,
    label: formatDate(day.date),
  }));

  const currency = ledgerCurrency(ledger.data);

  // Every expense, always. There was a two-way switch here; it earned its
  // removal — a trip splits money between *people*, not between "mine" and
  // "everyone", and every line on this list is already labelled with the
  // viewer's own share. The filter hid rows to say what the rows already said.
  const shown = ledger.data.expenses;

  // Everything the API is told now comes from the form. It used to guess the
  // payer, the day, the note and the split type, which is how the phone could
  // record an expense it had no way to describe.
  function save(draft: ExpenseDraft) {
    write.mutate({
      tripId,
      ...(editing.kind === "edit" ? { expenseId: editing.expenseId } : {}),
      description: draft.description,
      amountMinor: draft.amountMinor,
      currency: draft.currency,
      category: draft.category,
      splitType: draft.splitType,
      paidBy: draft.paidBy,
      dayId: draft.dayId,
      notes: draft.notes,
      splits: draft.splits,
    });
  }

  function settleRow(row: PairRow) {
    const paying = row.payer === me;
    const amount = formatMoney(row.amountMinor, row.currency);
    // Why: this records real money as moved, so one stray tap must not do it.
    Alert.alert(
      paying ? `Pay ${nameOf(row.other)} ${amount}?` : `${nameOf(row.other)} paid you ${amount}?`,
      `Clears:\n${clearsLine(row, me ?? "", nameOf)}`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Record", onPress: () => settle.mutate({ tripId, otherUserId: row.other }) },
      ],
    );
  }

  const editingExpense = expenseBeingEdited(shown, editing);
  const myShares = sharesOf(snapshot, me);

  return (
    <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg }}>
      {snapshot.expenses.length > 0 ? (
        <MoneyTop
          pairs={pairs.data}
          viewerId={me}
          nameOf={nameOf}
          busy={settle.isPending}
          onSettle={settleRow}
        />
      ) : null}

      {/* Adding a cost sits with the money it changes, not at the end of the
          list you have to scroll past (#317). */}
      {editing.kind === "add" ? (
        <View style={{ gap: space.sm }}>
          <Label>Add an expense</Label>
          <ExpenseForm
            people={members}
            days={dayOptions}
            viewerId={me ?? ""}
            currency={currency}
            busy={write.isPending}
            onSave={save}
            onCancel={() => setEditing({ kind: "none" })}
          />
        </View>
      ) : (
        <Button
          label={addLabel(shown.length)}
          onPress={() => {
            setEditing({ kind: "add" });
            setProblem(null);
          }}
        />
      )}

      {problem ? <Body tone="red">{problem}</Body> : null}

      {editingExpense ? (
        <ExpenseForm
          // Why: a new row must start a new form, or its fields keep the last row's values.
          key={editingExpense.id}
          people={peopleOnExpense(
            members,
            {
              paidBy: editingExpense.paidBy,
              splits: snapshot.splits.filter(
                (split) => split.expenseId === editingExpense.id,
              ),
            },
            nameOf,
          )}
          days={dayOptions}
          viewerId={me ?? ""}
          currency={editingExpense.currency}
          initial={formValues(ledger.data, editingExpense)}
          busy={write.isPending || remove.isPending}
          onSave={save}
          onCancel={() => setEditing({ kind: "none" })}
          onDelete={() =>
            remove.mutate({ tripId, expenseId: editingExpense.id })
          }
        />
      ) : null}

      <ExpenseList
        expenses={shown}
        lineFor={(expense) => shareLine(myShares, expense, me, nameOf)}
        dayLabel={(dayId) =>
          dayOptions.find((day) => day.id === dayId)?.label ?? "No day yet"
        }
        onEdit={(expenseId) => {
          setEditing({ kind: "edit", expenseId });
          setProblem(null);
        }}
      />
    </ScrollView>
  );
}
