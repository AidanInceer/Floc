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
 * BALANCES ARE DERIVED, NEVER FETCHED. `viewerBalance` runs `computeBalances`
 * over the ledger the API returned. There is no balance column, because a
 * stored balance is a second source of truth about the same money.
 *
 * SPLITS ARE SNAPSHOTS (rule 2). An edit sends the whole split set and the API
 * rewrites expense and splits together. Nothing here recalculates an old
 * expense from today's roster.
 *
 * SETTLING IS NOT AN ADMIN POWER (rule 6). Any member records a transfer, in
 * either direction — the four powers are invite, kick, promote and archive.
 */
import { formatDate } from "@floc/core/dates";
import { formatMoney, suggestSettlements, computeBalances, toMajorInput } from "@floc/core/money";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";

import { ExpenseForm, type DayOption, type ExpenseDraft } from "@/components/expense-form";
import { useTheme } from "@/components/theme";
import {
  Body,
  Button,
  Card,
  Empty,
  Failed,
  Figure,
  Heading,
  Label,
  Loading,
} from "@/components/ui";
import { trpc } from "@/lib/api";
import { useSession } from "@/lib/auth";
import { ledgerCurrency, viewerBalance } from "@/lib/balance";
import { radius, space } from "@/lib/theme";
import type { Ledger } from "@floc/api/port";

/** Nothing open, adding, or editing this expense. One state, so two cannot both be true. */
type Editing = { kind: "none" } | { kind: "add" } | { kind: "edit"; expenseId: number };

/**
 * The viewer's own balance, large. The word `owed`/`owe` comes from
 * `viewerBalance` and is what carries the meaning; the ground is a second
 * signal, never the only one (#204).
 */
function BalanceCard({
  figure,
  owing,
  lines,
  onSettle,
  busy,
}: {
  figure: string;
  owing: boolean;
  /** Who with, and how much — the thing a balance alone cannot say. */
  lines: string[];
  onSettle: () => void;
  busy: boolean;
}) {
  const { c } = useTheme();
  const tone = owing ? "blush" : "mint";
  return (
    <Card style={{ backgroundColor: c[tone], borderColor: c[`${tone}-edge`] }}>
      {/* Centred, like the web page's settled panel: one figure, alone, is a
          statement rather than the first item of a list. */}
      <View style={{ gap: space.sm, alignItems: "center", paddingVertical: space.md }}>
        <Heading>{figure}</Heading>
        {lines.length > 0 ? <Body tone="ink-2">{lines.join(" · ")}</Body> : null}
        {lines.length > 0 ? (
          <View style={{ alignSelf: "stretch" }}>
            <Button label="Settle up" variant="quiet" busy={busy} onPress={onSettle} />
          </View>
        ) : null}
      </View>
    </Card>
  );
}

/** The viewer's own share of one expense, or null when they were not in on it. */
function shareOf(ledger: Ledger, expenseId: number, viewerId: string | undefined): number | null {
  if (!viewerId) return null;
  const split = ledger.splits.find((s) => s.expenseId === expenseId && s.userId === viewerId);
  return split ? split.owedAmountMinor : null;
}

export default function Money() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tripId = Number(id);
  // A screen keeps rendering for a frame while it leaves, and `id` is gone by
  // then: NaN goes down the wire as null and the server rightly refuses it.
  const ready = Number.isFinite(tripId);
  const queryClient = useQueryClient();
  const { c } = useTheme();
  const { data: session } = useSession();

  const [editing, setEditing] = useState<Editing>({ kind: "none" });
  const [problem, setProblem] = useState<string | null>(null);

  const trip = useQuery(trpc.trips.get.queryOptions({ tripId }, { enabled: ready }));
  const ledger = useQuery(trpc.money.ledger.queryOptions({ tripId }, { enabled: ready }));
  // For "which day". An undated trip returns none, which is not an error
  // (rule 9) — the form simply stops asking.
  const itinerary = useQuery(trpc.itinerary.days.queryOptions({ tripId }, { enabled: ready }));

  const done = () => {
    setEditing({ kind: "none" });
    setProblem(null);
    queryClient.invalidateQueries({ queryKey: trpc.money.ledger.queryKey({ tripId }) });
  };
  const failed = (error: { message: string }) => setProblem(error.message);

  const write = useMutation({ ...trpc.money.write.mutationOptions(), onSuccess: done, onError: failed });
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
    members.find((member) => member.userId === userId)?.name ?? "Someone who left";

  const dayOptions: DayOption[] = (itinerary.data ?? []).map((day) => ({
    id: day.id,
    label: formatDate(day.date),
  }));

  const currency = ledgerCurrency(ledger.data);
  const balance = viewerBalance(ledger.data, me);
  const owing = balance.minor < 0;

  // Who the viewer specifically owes, or is owed by. The same greedy matching
  // the web app shows, so both suggest the same transfers.
  const book = computeBalances(
    ledger.data.expenses.map((expense) => ({
      paidBy: expense.paidBy,
      currency: expense.currency,
      amountMinor: expense.amountMinor,
      splits: ledger.data.splits
        .filter((split) => split.expenseId === expense.id)
        .map((split) => ({ userId: split.userId, owedAmountMinor: split.owedAmountMinor })),
    })),
    ledger.data.settlements.map((settlement) => ({
      from: settlement.fromUserId,
      to: settlement.toUserId,
      currency: settlement.currency,
      amountMinor: settlement.amountMinor,
    })),
  );
  const transfers = suggestSettlements(book[currency] ?? {}).filter(
    (transfer) => transfer.from === me || transfer.to === me,
  );
  const lines = transfers.map(
    (transfer) =>
      `${transfer.from === me ? nameOf(transfer.to) : nameOf(transfer.from)} ${formatMoney(transfer.amountMinor, currency)}`,
  );

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
      currency,
      category: "other",
      splitType: draft.splitType,
      paidBy: draft.paidBy,
      dayId: draft.dayId,
      notes: draft.notes,
      splits: draft.splits,
    });
  }

  /** Records every transfer the viewer is part of, as separate rows — each one really happened separately. */
  function settleAll() {
    for (const transfer of transfers) {
      settle.mutate({
        tripId,
        fromUserId: transfer.from,
        toUserId: transfer.to,
        amountMinor: transfer.amountMinor,
        currency,
      });
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg }}>
      {/* Only while somebody owes somebody. A whole panel whose news is
          "settled" is a panel reporting the absence of news — the expenses
          below already show every share is square (#126). */}
      {snapshot.expenses.length > 0 && lines.length > 0 ? (
        <BalanceCard
          figure={balance.figure}
          owing={owing}
          lines={lines}
          busy={settle.isPending}
          onSettle={settleAll}
        />
      ) : null}

      {problem ? <Body tone="red">{problem}</Body> : null}

      {shown.length === 0 ? (
        <Empty>Nothing spent yet.</Empty>
      ) : null}

      {shown.map((expense) =>
        editing.kind === "edit" && editing.expenseId === expense.id ? (
          <ExpenseForm
            key={expense.id}
            people={members}
            days={dayOptions}
            viewerId={me ?? ""}
            currency={expense.currency}
            initial={{
              description: expense.description,
              amount: toMajorInput(expense.amountMinor, expense.currency),
              paidBy: expense.paidBy,
              dayId: expense.dayId ?? null,
              notes: expense.notes ?? "",
              inOn: ledger.data.splits
                .filter((split) => split.expenseId === expense.id && split.owedAmountMinor !== 0)
                .map((split) => split.userId),
            }}
            busy={write.isPending || remove.isPending}
            onSave={save}
            onCancel={() => setEditing({ kind: "none" })}
            onDelete={() => remove.mutate({ tripId, expenseId: expense.id })}
          />
        ) : (
          <Card
            key={expense.id}
            style={{ borderRadius: radius.md, borderColor: c.rule }}
          >
            <View style={{ gap: space.xs }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Body bold>{expense.description}</Body>
                <Figure>{formatMoney(expense.amountMinor, expense.currency)}</Figure>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Body tone="ink-3">{nameOf(expense.paidBy)} paid</Body>
                <Figure tone="ink-2">
                  {(() => {
                    const share = shareOf(ledger.data, expense.id, me);
                    if (share === null) return "not yours";
                    return expense.paidBy === me
                      ? `you paid, your share ${formatMoney(share, expense.currency)}`
                      : `you ${formatMoney(share, expense.currency)}`;
                  })()}
                </Figure>
              </View>
              <Button
                label="Edit"
                variant="quiet"
                onPress={() => {
                  setEditing({ kind: "edit", expenseId: expense.id });
                  setProblem(null);
                }}
              />
            </View>
          </Card>
        ),
      )}

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
          label="Add an expense"
          onPress={() => {
            setEditing({ kind: "add" });
            setProblem(null);
          }}
        />
      )}
    </ScrollView>
  );
}
