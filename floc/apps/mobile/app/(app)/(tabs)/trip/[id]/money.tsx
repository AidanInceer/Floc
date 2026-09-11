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
import { radius, space } from "@/lib/theme";
import type { Ledger } from "@floc/api/port";

/** Nothing open, adding, or editing this expense. One state, so two cannot both be true. */
type Editing =
  { kind: "none" } | { kind: "add" } | { kind: "edit"; expenseId: number };

/**
 * One side of the viewer's money: what they owe, or what they are owed (#317).
 * Money the rest of the group owes each other is not here — it is theirs, not
 * the reader's, and it still shows in the list below when it is paid.
 */
function SideCard({
  title,
  total,
  rows,
  empty,
  owing,
  onSettle,
  busy,
}: {
  title: string;
  total: string | null;
  /** Who with, and how much — the thing a total alone cannot say. */
  rows: string[];
  empty: string;
  owing: boolean;
  onSettle: () => void;
  busy: boolean;
}) {
  const { c } = useTheme();
  const tone = owing ? "blush" : "mint";
  return (
    <Card style={{ backgroundColor: c[tone], borderColor: c[`${tone}-edge`] }}>
      <View style={{ gap: space.sm, paddingVertical: space.sm }}>
        <Label>{title}</Label>
        {total === null ? (
          <Body tone="ink-2">{empty}</Body>
        ) : (
          <>
            <Heading>{total}</Heading>
            {rows.map((row) => (
              <Body key={row} tone="ink-2">
                {row}
              </Body>
            ))}
            <Button
              label={owing ? "Settle up" : "Mark paid"}
              variant="quiet"
              busy={busy}
              onPress={onSettle}
            />
          </>
        )}
      </View>
    </Card>
  );
}

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
  const { c } = useTheme();
  if (mine.settled) {
    return (
      <Card style={{ backgroundColor: c.mint, borderColor: c["mint-edge"] }}>
        <View
          style={{
            gap: space.xs,
            alignItems: "center",
            paddingVertical: space.md,
          }}
        >
          <Heading>All settled up</Heading>
          <Body tone="ink-2">You are square with everyone on this trip.</Body>
        </View>
      </Card>
    );
  }
  return (
    <>
      <SideCard
        title="You owe"
        total={totalOf(mine.oweTotals)}
        rows={rowsOf(mine.owe, true, nameOf)}
        empty="All square — you have paid your share."
        owing
        busy={busy}
        onSettle={() => onSettle(mine.owe)}
      />
      <SideCard
        title="You are owed"
        total={totalOf(mine.owedTotals)}
        rows={rowsOf(mine.owed, false, nameOf)}
        empty="Nothing to chase — everyone has paid you back."
        owing={false}
        busy={busy}
        onSettle={() => onSettle(mine.owed)}
      />
    </>
  );
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
  const { c } = useTheme();
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
      currency,
      category: draft.category,
      splitType: draft.splitType,
      paidBy: draft.paidBy,
      dayId: draft.dayId,
      notes: draft.notes,
      splits: draft.splits,
    });
  }

  /** Records every transfer the viewer is part of, as separate rows — each one really happened separately. */
  function settleSide(list: CurrencyTransfer[]) {
    for (const transfer of list) {
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
          label={shown.length === 0 ? "Log the first cost" : "Add an expense"}
          onPress={() => {
            setEditing({ kind: "add" });
            setProblem(null);
          }}
        />
      )}

      {problem ? <Body tone="red">{problem}</Body> : null}

      {shown.length === 0 ? <Empty>No costs logged yet.</Empty> : null}

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
              // Guarded on the way in: `category` is a stored word and a row
              // written before the column existed can be anything (rule 11).
              category: isExpenseCategory(expense.category)
                ? expense.category
                : DEFAULT_CATEGORY,
              amount: toMajorInput(expense.amountMinor, expense.currency),
              paidBy: expense.paidBy,
              dayId: expense.dayId ?? null,
              notes: expense.notes ?? "",
              inOn: ledger.data.splits
                .filter(
                  (split) =>
                    split.expenseId === expense.id &&
                    split.owedAmountMinor !== 0,
                )
                .map((split) => split.userId),
            }}
            busy={write.isPending || remove.isPending}
            onSave={save}
            onCancel={() => setEditing({ kind: "none" })}
            onDelete={() => remove.mutate({ tripId, expenseId: expense.id })}
          />
        ) : (
          // One row, tapped to edit. The Edit button under every cost tripled
          // the list's height to repeat what a tap already does (#317).
          <Pressable
            key={expense.id}
            accessibilityRole="button"
            accessibilityLabel={`Edit ${expense.description}`}
            onPress={() => {
              setEditing({ kind: "edit", expenseId: expense.id });
              setProblem(null);
            }}
          >
            <Card style={{ borderRadius: radius.md, borderColor: c.rule }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: space.sm,
                }}
              >
                {/* The glyph makes a long list scannable; the description is
                    still the thing that says what it was. A mark, not a label
                    (#204) — its own `accessibilityLabel` carries the word. */}
                <CategoryIcon
                  category={
                    isExpenseCategory(expense.category)
                      ? expense.category
                      : DEFAULT_CATEGORY
                  }
                  color={c["ink-2"]}
                  size={16}
                />
                <View style={{ flex: 1, gap: 2 }}>
                  <Body bold>{expense.description}</Body>
                  <Body tone="ink-3">
                    {shareLine(ledger.data, expense, me, nameOf)}
                  </Body>
                </View>
                <Figure>
                  {formatMoney(expense.amountMinor, expense.currency)}
                </Figure>
              </View>
            </Card>
          </Pressable>
        ),
      )}
    </ScrollView>
  );
}
