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
import { NudgeWord } from "@/components/trip/nudge/nudge-word";
import { BudgetTab } from "@/components/money/estimate/budget-tab";
import { ExpenseForm, type DayOption, type ExpenseDraft } from "@/components/money/expense-form";
import { ExpenseRows } from "@/components/money/expense-rows";
import { PlusGlyph } from "@/components/system/glyphs";
import { useTheme } from "@/components/system/theme";
import { Body, Button, Empty, Failed, Loading, SectionTitle, Segmented } from "@/components/system/ui";
import { trpc } from "@/lib/api";
import { useSession } from "@/lib/auth";
import { ledgerCurrency } from "@/lib/balance";
import { editStart, peopleOnExpense } from "@floc/core/money/edit-start";
import { shareLine } from "@/lib/money/share-line";
import { fonts, size, space } from "@/lib/theme";
import type { Ledger } from "@floc/api/port";
import { clearedDebts } from "@floc/core/money/cleared-debts";

type Editing =
  { kind: "none" } | { kind: "add" } | { kind: "edit"; expenseId: number };

function clearsLine(row: SettleRow, viewerId: string, nameOf: (userId: string) => string): string {
  return clearedDebts(row, viewerId)
    .map((d) => (d.youOwe ? `${d.cleared} you owe ${nameOf(d.otherId)}` : `${d.cleared} ${nameOf(d.otherId)} owes you`))
    .join("\n");
}

function Problem({ text }: { text: string | null }) {
  return text ? <Body tone="red">{text}</Body> : null;
}

function expenseBeingEdited(
  expenses: Ledger["expenses"],
  editing: Editing,
): Ledger["expenses"][number] | undefined {
  if (editing.kind !== "edit") return undefined;
  return expenses.find((expense) => expense.id === editing.expenseId);
}

function formValues(ledger: Ledger, expense: Ledger["expenses"][number]) {
  const start = editStart(
    ledger.splits.filter((split) => split.expenseId === expense.id),
    expense.currency,
  );
  return {
    description: expense.description,
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

function addLabel(count: number): string {
  return count === 0 ? "Log the first cost" : "Add an expense";
}

function sharesOf(ledger: Ledger, viewerId: string | undefined): Map<number, number> {
  return new Map(
    ledger.splits
      .filter((split) => split.userId === viewerId)
      .map((split) => [split.expenseId, split.owedAmountMinor]),
  );
}

function ExpensesView({ switcher }: { switcher: React.ReactNode }) {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tripId = Number(id);
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
  const nudges = useQuery(trpc.nudges.targets.queryOptions({ tripId }, { enabled: ready }));
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

  const rank = (dayId: number | null | undefined) => {
    const at = dayOptions.findIndex((day) => day.id === dayId);
    return at < 0 ? dayOptions.length : at;
  };
  const shown = [...ledger.data.expenses].sort((a, b) => rank(a.dayId) - rank(b.dayId));

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
      {switcher}
      {snapshot.expenses.length > 0 ? (
        <BalanceCard
          rows={pairs.data?.rows ?? []}
          viewerId={me}
          nameOf={nameOf}
          busy={settle.isPending}
          onSettle={settleRow}
          nudgeFor={(userId) => {
            const person = nudges.data?.money.find((n) => n.userId === userId);
            return person ? <NudgeWord tripId={tripId} task="money" person={person} /> : null;
          }}
        />
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

export default function Money() {
  const { id, view: asked } = useLocalSearchParams<{ id: string; view?: string }>();
  const tripId = Number(id);
  const [view, setView] = useState<"expenses" | "budget">(asked === "budget" ? "budget" : "expenses");
  const switcher = (
    <Segmented soft options={[{ value: "expenses", label: "Expenses" }, { value: "budget", label: "Budget" }] as const} value={view} onChange={setView} />
  );
  if (view === "expenses" || !Number.isFinite(tripId)) return <ExpensesView switcher={switcher} />;
  return (
    <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg }}>
      {switcher}
      <BudgetTab tripId={tripId} />
    </ScrollView>
  );
}
