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
 * BALANCES ARE DERIVED, NEVER STORED. The server works out the group's
 * payments from the ledger with its rates (#463) and the phone shows them.
 * There is no balance column, because a stored balance is a second source of
 * truth about the same money.
 *
 * SPLITS ARE SNAPSHOTS (rule 2). An edit sends the whole split set and the API
 * rewrites expense and splits together. Nothing here recalculates an old
 * expense from today's roster.
 *
 * SETTLING IS NOT AN ADMIN POWER (rule 6). Any member records a transfer, in
 * either direction — the four powers are remove, promote, delete or archive, and reset the link.
 */
import { formatDate } from "@floc/core/dates/dates";
import { DEFAULT_CATEGORY, isExpenseCategory } from "@floc/core/money/expense-category";
import { formatMoney, toMajorInput } from "@floc/core/money/money";
import type { SettleRow } from "@floc/core/money/group-settle";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";

import { EventSheet } from "@/components/days/event-sheet";
import { BalanceCard } from "@/components/money/balance-card";
import { ExpenseForm, type DayOption, type ExpenseDraft } from "@/components/money/expense-form";
import { ExpenseRows } from "@/components/money/expense-rows";
import { PlusGlyph } from "@/components/system/glyphs";
import { useTheme } from "@/components/system/theme";
import { Body, Button, Empty, Failed, Loading, SectionTitle } from "@/components/system/ui";
import { trpc } from "@/lib/api";
import { useSession } from "@/lib/auth";
import { ledgerCurrency } from "@/lib/balance";
import { editStart, peopleOnExpense } from "@floc/core/money/edit-start";
import { shareLine } from "@/lib/money/share-line";
import { fonts, size, space } from "@/lib/theme";
import type { Ledger } from "@floc/api/port";
import { clearedDebts } from "@floc/core/money/cleared-debts";

/** Nothing open, adding, or editing this expense. One state, so two cannot both be true. */
type Editing =
  { kind: "none" } | { kind: "add" } | { kind: "edit"; expenseId: number };

/** What one payment clears, for the confirm before it is recorded. */
function clearsLine(row: SettleRow, viewerId: string, nameOf: (userId: string) => string): string {
  return clearedDebts(row, viewerId)
    .map((d) => (d.youOwe ? `${d.cleared} you owe ${nameOf(d.otherId)}` : `${d.cleared} ${nameOf(d.otherId)} owes you`))
    .join("\n");
}

/** Why the last write failed, in words; nothing when it did not. */
function Problem({ text }: { text: string | null }) {
  return text ? <Body tone="red">{text}</Body> : null;
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

/** The viewer's own share of each expense, read once rather than once per row. */
function sharesOf(ledger: Ledger, viewerId: string | undefined): Map<number, number> {
  return new Map(
    ledger.splits
      .filter((split) => split.userId === viewerId)
      .map((split) => [split.expenseId, split.owedAmountMinor]),
  );
}

export default function Money() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tripId = Number(id);
  // A screen keeps rendering for a frame while it leaves, and `id` is gone by
  // then: NaN goes down the wire as null and the server rightly refuses it.
  const ready = Number.isFinite(tripId);
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { c } = useTheme();

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

  // Why every expense, no mine/everyone filter: each row already says your share.
  // Why sorted: costs arrive in logged order; sorted by day so the day headings run in trip order, undated last.
  const rank = (dayId: number | null | undefined) => {
    const at = dayOptions.findIndex((day) => day.id === dayId);
    return at < 0 ? dayOptions.length : at;
  };
  const shown = [...ledger.data.expenses].sort((a, b) => rank(a.dayId) - rank(b.dayId));

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

  function settleRow(row: SettleRow) {
    const paying = row.payer === me;
    const other = paying ? row.payee : row.payer;
    const amount = formatMoney(row.amountMinor, row.currency);
    // Why: this records real money as moved, so one stray tap must not do it.
    Alert.alert(
      paying ? `Pay ${nameOf(other)} ${amount}?` : `${nameOf(other)} paid you ${amount}?`,
      `Clears:\n${clearsLine(row, me ?? "", nameOf)}`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Record", onPress: () => settle.mutate({ tripId, otherUserId: other }) },
      ],
    );
  }

  const editingExpense = expenseBeingEdited(shown, editing);
  const myShares = sharesOf(snapshot, me);
  const startAdd = () => {
    setEditing({ kind: "add" });
    setProblem(null);
  };

  const paidByOf = (expense: Ledger["expenses"][number]) => (expense.paidBy === me ? "You paid" : `${nameOf(expense.paidBy)} paid`);
  const close = () => setEditing({ kind: "none" });
  const viewer = me ?? "";

  return (
    <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg }}>
      {snapshot.expenses.length > 0 ? (
        <BalanceCard rows={pairs.data?.rows ?? []} viewerId={me} nameOf={nameOf} busy={settle.isPending} onSettle={settleRow} />
      ) : null}

      <Problem text={editing.kind === "none" ? problem : null} />

      {shown.length === 0 ? (
        <View style={{ gap: space.md }}>
          <Empty>No costs logged yet.</Empty>
          <Button label={addLabel(0)} onPress={startAdd} />
        </View>
      ) : (
        <View style={{ gap: space.md }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
            <SectionTitle>Expenses</SectionTitle>
            <Text style={{ flex: 1, color: c["ink-3"], fontFamily: fonts.type, fontSize: size.small }}>{shown.length}</Text>
            <Button label="Add" variant="quiet" fit="small" icon={(ink) => <PlusGlyph color={ink} />} onPress={startAdd} />
          </View>
          <ExpenseRows
            expenses={shown}
            paidByOf={paidByOf}
            shareOf={(expense) => shareLine(expense, me, myShares.get(expense.id))}
            dayLabel={(dayId) => dayOptions.find((day) => day.id === dayId)?.label ?? "No day yet"}
            onEdit={(expenseId) => {
              setEditing({ kind: "edit", expenseId });
              setProblem(null);
            }}
          />
        </View>
      )}

      <EventSheet open={editing.kind === "add"} title="Add an expense" onClose={close}>
        <Problem text={problem} />
        <ExpenseForm people={members} days={dayOptions} viewerId={viewer} currency={currency} busy={write.isPending} onSave={save} onCancel={close} />
      </EventSheet>

      <EventSheet open={editingExpense !== undefined} title="Edit expense" onClose={close}>
        <Problem text={problem} />
        {editingExpense ? (
          <ExpenseForm
            // Why: a new row must start a new form, or its fields keep the last row's values.
            key={editingExpense.id}
            people={peopleOnExpense(members, { paidBy: editingExpense.paidBy, splits: snapshot.splits.filter((split) => split.expenseId === editingExpense.id) }, nameOf)}
            days={dayOptions}
            viewerId={viewer}
            currency={editingExpense.currency}
            initial={formValues(ledger.data, editingExpense)}
            busy={write.isPending || remove.isPending}
            onSave={save}
            onCancel={close}
            onDelete={() => remove.mutate({ tripId, expenseId: editingExpense.id })}
          />
        ) : null}
      </EventSheet>
    </ScrollView>
  );
}