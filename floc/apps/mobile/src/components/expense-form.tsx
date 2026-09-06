/**
 * Add or edit one expense, with its split (ticket 300).
 *
 * MONEY IS NEVER A FLOAT (rule 1). What a person types is a string. It becomes
 * integer minor units through `parseMoney` and nothing else, and if `parseMoney`
 * refuses it the person is told — a rejection is a message, never a throw.
 *
 * SPLITS ARE SNAPSHOTS (rule 2). The form hands back the whole split set,
 * computed by `computeSplits` from `@floc/core/money`, and the API rewrites
 * expense and splits in one transaction. Nothing here edits one split alone,
 * and nothing recalculates an old expense's split from today's roster.
 *
 * THE SHARE PICKER IS WHO, NOT HOW MUCH. Shares of 1 or 0 per person is what a
 * group actually wants nine times in ten — "was I in on this?" — and it keeps
 * the leftover penny landing where `computeSplits` puts it, the same place the
 * web app puts it.
 */
import type { Currency } from "@floc/core/currency";
import { computeSplits, parseMoney } from "@floc/core/money";
import { useState } from "react";
import { Pressable, View } from "react-native";

import { useTheme } from "./theme";
import { Body, Button, Card, Field, Label } from "./ui";
import { radius, space } from "@/lib/theme";

export type ExpenseDraft = {
  description: string;
  amountMinor: number;
  splits: { userId: string; owedAmountMinor: number }[];
};

type Person = { userId: string; name: string };

function Who({
  people,
  inOn,
  onToggle,
}: {
  people: Person[];
  inOn: Set<string>;
  onToggle: (userId: string) => void;
}) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
      {people.map((person) => {
        const on = inOn.has(person.userId);
        return (
          <Pressable
            key={person.userId}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            accessibilityLabel={person.name}
            onPress={() => onToggle(person.userId)}
            style={{
              paddingVertical: space.sm,
              paddingHorizontal: space.md,
              borderRadius: radius.pill,
              backgroundColor: on ? c.mint : c["sheet-2"],
              borderWidth: 1,
              borderColor: on ? c["mint-edge"] : c.rule,
            }}
          >
            {/* The word "in", not the fill, is what says they are in (#204). */}
            <Body tone={on ? "ink" : "ink-3"}>{on ? `${person.name} · in` : person.name}</Body>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ExpenseForm({
  people,
  currency,
  initial,
  busy,
  onSave,
  onCancel,
  onDelete,
}: {
  people: Person[];
  currency: Currency;
  initial?: { description: string; amount: string; inOn: string[] };
  busy: boolean;
  onSave: (draft: ExpenseDraft) => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const [description, setDescription] = useState(initial?.description ?? "");
  const [amount, setAmount] = useState(initial?.amount ?? "");
  const [inOn, setInOn] = useState<Set<string>>(
    new Set(initial?.inOn ?? people.map((person) => person.userId)),
  );
  const [problem, setProblem] = useState<string | null>(null);

  function toggle(userId: string) {
    setInOn((current) => {
      const next = new Set(current);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  function save() {
    if (inOn.size === 0) {
      setProblem("Somebody has to be in on it.");
      return;
    }
    // `parseMoney` refuses nonsense rather than returning NaN, so what was
    // typed is turned away here — as a message, never as a crash.
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
    setProblem(null);
    onSave({
      description: description.trim(),
      amountMinor,
      splits: computeSplits(
        amountMinor,
        "shares",
        people.map((person) => ({
          userId: person.userId,
          value: inOn.has(person.userId) ? 1 : 0,
        })),
      ),
    });
  }

  return (
    <Card>
      <View style={{ gap: space.md }}>
        <Field label="What for" value={description} onChangeText={setDescription} />
        <Field
          label={`Amount (${currency})`}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          inputMode="decimal"
        />
        <View style={{ gap: space.sm }}>
          <Label>Who was in on it</Label>
          <Who people={people} inOn={inOn} onToggle={toggle} />
        </View>
        {problem ? <Body tone="red">{problem}</Body> : null}
        <Button label="Save" busy={busy} onPress={save} />
        <Button label="Cancel" variant="quiet" onPress={onCancel} />
        {onDelete ? (
          <Button label="Delete this expense" variant="danger" onPress={onDelete} />
        ) : null}
      </View>
    </Card>
  );
}
