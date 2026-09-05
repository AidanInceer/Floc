/**
 * Money (ticket 291).
 *
 * MONEY IS NEVER A FLOAT (rule 1). What a person types is a string; it becomes
 * integer minor units through `parseMoney` and comes back out through
 * `formatMoney`, both from `@floc/core/money` — the same two functions the web
 * app uses. No arithmetic happens in this file.
 *
 * BALANCES ARE DERIVED, NEVER FETCHED. `computeBalances` runs over the ledger
 * the API returned. There is no balance column and no balance procedure,
 * because a stored balance is a second source of truth about the same money.
 *
 * SPLITS ARE SNAPSHOTS (rule 2). Adding an expense sends its whole split set;
 * the API rewrites both together. Nothing here edits a split on its own.
 */
import { computeBalances, computeSplits, formatMoney, parseMoney } from "@floc/core/money";
import { useSession } from "@/lib/auth";
import type { Currency } from "@floc/core/currency";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";

import { Body, Button, Card, Divider, Empty, Failed, Field, Figure, Label, Loading } from "@/components/ui";
import { trpc } from "@/lib/api";
import { space } from "@/lib/theme";

/** Until a currency picker exists, an expense is added in the trip's first currency, or sterling. */
function defaultCurrency(existing: { currency: Currency }[]): Currency {
  return existing[0]?.currency ?? "GBP";
}

export default function Money() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tripId = Number(id);
  const queryClient = useQueryClient();

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [problem, setProblem] = useState<string | null>(null);

  const { data: session } = useSession();
  const trip = useQuery(trpc.trips.get.queryOptions({ tripId }));
  const ledger = useQuery(trpc.money.ledger.queryOptions({ tripId }));

  const write = useMutation({
    ...trpc.money.write.mutationOptions(),
    onSuccess: () => {
      setDescription("");
      setAmount("");
      setProblem(null);
      queryClient.invalidateQueries({ queryKey: trpc.money.ledger.queryKey({ tripId }) });
    },
    onError: (error) => setProblem(error.message),
  });

  if (ledger.isPending || trip.isPending) return <Loading />;
  if (ledger.isError) return <Failed onRetry={() => ledger.refetch()} />;
  if (trip.isError) return <Failed onRetry={() => trip.refetch()} />;

  const members = trip.data.members;
  const nameOf = (userId: string) =>
    members.find((m) => m.userId === userId)?.name ?? "Someone who left";

  const currency = defaultCurrency(ledger.data.expenses);

  const balances = computeBalances(
    ledger.data.expenses.map((e) => ({
      paidBy: e.paidBy,
      currency: e.currency,
      amountMinor: e.amountMinor,
      splits: ledger.data.splits
        .filter((s) => s.expenseId === e.id)
        .map((s) => ({ userId: s.userId, owedAmountMinor: s.owedAmountMinor })),
    })),
    ledger.data.settlements.map((s) => ({
      from: s.fromUserId,
      to: s.toUserId,
      currency: s.currency,
      amountMinor: s.amountMinor,
    })),
  );

  function add() {
    const payer = session?.user.id;
    if (!payer) return;

    // `parseMoney` throws on nonsense rather than returning NaN, so what a
    // person typed is refused here — as a message, never as a crash.
    let amountMinor: number;
    try {
      amountMinor = parseMoney(amount, currency);
    } catch {
      setProblem("That isn't an amount.");
      return;
    }
    if (amountMinor <= 0) {
      setProblem("That isn't an amount.");
      return;
    }

    // One share each, computed by the same function the web app uses, so the
    // leftover penny lands on the same person.
    const splits = computeSplits(
      amountMinor,
      "shares",
      members.map((m) => ({ userId: m.userId, value: 1 })),
    );

    write.mutate({
      tripId,
      description: description.trim(),
      amountMinor,
      currency,
      category: "other",
      splitType: "shares",
      paidBy: payer,
      dayId: null,
      notes: null,
      splits,
    });
  }

  return (
    <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg }}>
      <View style={{ gap: space.sm }}>
        <Label>Who owes who</Label>
        <Card>
          {members.map((m, i) => {
            const owed = balances[currency]?.[m.userId] ?? 0;
            return (
              <View key={m.userId} style={{ gap: space.sm }}>
                {i > 0 ? <Divider /> : null}
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Body>{m.name}</Body>
                  {/* The word carries it, not the colour (#204). */}
                  <Figure tone={owed > 0 ? "green" : owed < 0 ? "red" : "ink-3"}>
                    {owed === 0
                      ? "settled up"
                      : owed > 0
                        ? `owed ${formatMoney(owed, currency)}`
                        : `owes ${formatMoney(-owed, currency)}`}
                  </Figure>
                </View>
              </View>
            );
          })}
        </Card>
      </View>

      <View style={{ gap: space.sm }}>
        <Label>Spending</Label>
        {ledger.data.expenses.length === 0 ? (
          <Empty>Nothing spent yet.</Empty>
        ) : (
          ledger.data.expenses.map((e) => (
            <Card key={e.id}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Body bold>{e.description}</Body>
                <Figure>{formatMoney(e.amountMinor, e.currency)}</Figure>
              </View>
              <Body tone="ink-2">Paid by {nameOf(e.paidBy)}</Body>
            </Card>
          ))
        )}
      </View>

      <View style={{ gap: space.sm }}>
        <Label>Add an expense</Label>
        <Card>
          <Field label="What for" value={description} onChangeText={setDescription} />
          <Field
            label={`Amount (${currency})`}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            inputMode="decimal"
          />
          <Body tone="ink-3">Split evenly across everyone on the trip.</Body>
          {problem ? <Body tone="red">{problem}</Body> : null}
          <Button label="Add" onPress={add} busy={write.isPending} />
        </Card>
      </View>
    </ScrollView>
  );
}
