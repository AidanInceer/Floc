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
 * BALANCES ARE DERIVED, NEVER FETCHED. `computeBalances` runs over the ledger
 * the API returned, and `yourSettleUp` keeps the viewer's own half of it
 * (#317). There is no balance column, because a stored balance is a second
 * source of truth about the same money.
 *
 * SPLITS ARE SNAPSHOTS (rule 2). An edit sends the whole split set and the API
 * rewrites expense and splits together. Nothing here recalculates an old
 * expense from today's roster.
 *
 * SETTLING IS NOT AN ADMIN POWER (rule 6). Any member records a transfer, in
 * either direction — the three powers are kick, promote and archive.
 */
import { formatDate } from "@floc/core/dates/dates";
import {
  DEFAULT_CATEGORY,
  isExpenseCategory,
} from "@floc/core/money/expense-category";
import {
  formatMoney,
  suggestSettlements,
  computeBalances,
  toMajorInput,
} from "@floc/core/money/money";
import { CURRENCIES } from "@floc/core/money/currency";
import {
  yourSettleUp,
  type CurrencyTotal,
  type CurrencyTransfer,
  type YourSettleUp,
} from "@floc/core/money/settle-up";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

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
import { space } from "@/lib/theme";
import type { Ledger } from "@floc/api/port";

/** Nothing open, adding, or editing this expense. One state, so two cannot both be true. */
type Editing =
  { kind: "none" } | { kind: "add" } | { kind: "edit"; expenseId: number };

/**
 * The top of the screen: your two sides, or one panel saying you are square.
 * Being square is the viewer's own state — two other people can still owe each
 * other and that is not this reader's news (#317).
 */
function MoneyTop({
  mine,
  nameOf,
  busy,
  onSettle,
}: {
  mine: YourSettleUp;
  nameOf: (userId: string) => string;
  busy: boolean;
  onSettle: (list: CurrencyTransfer[]) => void;
}) {
  const [showOwed, setShowOwed] = useState(false);

  if (mine.settled) {
    return (
      <Card>
        <View style={{ gap: space.xs, alignItems: "center" }}>
          <Heading>All settled up</Heading>
          <Body tone="ink-2">You are square with everyone on this trip.</Body>
        </View>
      </Card>
    );
  }

  return (
    <Card style={{ gap: space.sm }}>
      <Label>You owe</Label>
      {mine.owe.length === 0 ? (
        <Body tone="ink-2">Nothing to pay — you have paid your share.</Body>
      ) : (
        <>
          {mine.owe.map((transfer) => (
            <View
              key={`${transfer.to}-${transfer.currency}`}
              style={{
                flexDirection: "row",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: space.sm,
              }}
            >
              <Figure tone="red">
                {formatMoney(transfer.amountMinor, transfer.currency)}
              </Figure>
              <Body tone="ink-2">to {nameOf(transfer.to)}</Body>
            </View>
          ))}
          <Button
            label="Settle up"
            busy={busy}
            onPress={() => onSettle(mine.owe)}
          />
        </>
      )}

      <Divider />

      {/* Money owed to you is news, not a job: one line, opened when you ask. */}
      <Pressable
        accessibilityRole="button"
        onPress={() => setShowOwed((open) => !open)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: space.sm,
        }}
      >
        <Body tone="ink-2">You are owed</Body>
        <Figure tone="green">{totalOf(mine.owedTotals) ?? "nothing"}</Figure>
      </Pressable>

      {showOwed && mine.owed.length > 0 ? (
        <>
          {rowsOf(mine.owed, false, nameOf).map((row) => (
            <Body key={row} tone="ink-3">
              {row}
            </Body>
          ))}
          <Button
            label="Mark paid"
            variant="quiet"
            fit="small"
            busy={busy}
            onPress={() => onSettle(mine.owed)}
          />
        </>
      ) : null}
    </Card>
  );
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
    inOn: ledger.splits
      .filter(
        (split) =>
          split.expenseId === expense.id && split.owedAmountMinor !== 0,
      )
      .map((split) => split.userId),
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

/** The viewer's own share of one expense, or null when they were not in on it. */
function shareOf(
  ledger: Ledger,
  expenseId: number,
  viewerId: string | undefined,
): number | null {
  if (!viewerId) return null;
  const split = ledger.splits.find(
    (s) => s.expenseId === expenseId && s.userId === viewerId,
  );
  return split ? split.owedAmountMinor : null;
}

/** Who paid, and what it cost you — one line under the description. */
function shareLine(
  ledger: Ledger,
  expense: Ledger["expenses"][number],
  me: string | undefined,
  nameOf: (userId: string) => string,
): string {
  const share = shareOf(ledger, expense.id, me);
  const who =
    expense.paidBy === me ? "You paid" : `${nameOf(expense.paidBy)} paid`;
  if (share === null) return `${who} · not yours`;
  return `${who} · your share ${formatMoney(share, expense.currency)}`;
}

/** One line per person on a side, naming the other party. */
function rowsOf(
  list: CurrencyTransfer[],
  paying: boolean,
  nameOf: (userId: string) => string,
): string[] {
  return list.map(
    (transfer) =>
      `${nameOf(paying ? transfer.to : transfer.from)} ${formatMoney(transfer.amountMinor, transfer.currency)}`,
  );
}

/** Two currencies never add up, so each keeps its own figure (ticket 253). */
function totalOf(totals: CurrencyTotal[]): string | null {
  if (totals.length === 0) return null;
  return totals
    .map((total) => formatMoney(total.amountMinor, total.currency))
    .join(" · ");
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
    ...trpc.money.settle.mutationOptions(),
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

  // Who the viewer specifically owes, or is owed by. The same greedy matching
  // the web app shows, so both suggest the same transfers.
  const book = computeBalances(
    ledger.data.expenses.map((expense) => ({
      paidBy: expense.paidBy,
      currency: expense.currency,
      amountMinor: expense.amountMinor,
      splits: ledger.data.splits
        .filter((split) => split.expenseId === expense.id)
        .map((split) => ({
          userId: split.userId,
          owedAmountMinor: split.owedAmountMinor,
        })),
    })),
    ledger.data.settlements.map((settlement) => ({
      from: settlement.fromUserId,
      to: settlement.toUserId,
      currency: settlement.currency,
      amountMinor: settlement.amountMinor,
    })),
  );
  // Why: a trip with euro dinners and pound flights has two books, and reading
  // only one made a real debt look like nothing owed (#317).
  const mine = yourSettleUp({
    transfers: CURRENCIES.flatMap((inCurrency) =>
      suggestSettlements(book[inCurrency] ?? {}).map((transfer) => ({
        ...transfer,
        currency: inCurrency,
      })),
    ),
    viewerId: me ?? "",
  });
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

  /** One row per transfer — each really happened separately — sent as one call so they save together. */
  function settleSide(list: CurrencyTransfer[]) {
    settle.mutate({
      tripId,
      transfers: list.map((transfer) => ({
        fromUserId: transfer.from,
        toUserId: transfer.to,
        amountMinor: transfer.amountMinor,
        currency: transfer.currency,
      })),
    });
  }

  const editingExpense = expenseBeingEdited(shown, editing);

  return (
    <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg }}>
      {snapshot.expenses.length > 0 ? (
        <MoneyTop
          mine={mine}
          nameOf={nameOf}
          busy={settle.isPending}
          onSettle={settleSide}
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
          people={members}
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
        lineFor={(expense) => shareLine(ledger.data, expense, me, nameOf)}
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
