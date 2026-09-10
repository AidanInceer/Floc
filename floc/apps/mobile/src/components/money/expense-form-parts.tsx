/**
 * The pieces every shape of the expense form is built from (#302).
 *
 * WHY A PARTS FILE. `expense-form.tsx` is the drawing; this is what the drawing
 * is made of and what it must obey. Splitting them started as a way to compare
 * three shapes fairly and earned its keep afterwards: money, splits and
 * rejections are read here without markup around them, and the screen is read
 * without the rules in the way (single responsibility).
 *
 * MONEY IS NEVER A FLOAT (rule 1). What a person types is a string. It becomes
 * integer minor units through `parseMoney` and nothing else, and if `parseMoney`
 * refuses it the person is told — a rejection is a message, never a throw.
 *
 * SPLITS ARE SNAPSHOTS (rule 2). `buildDraft` hands back the whole split set,
 * computed by `computeSplits`, and the API rewrites expense and splits in one
 * transaction. Nothing here edits one split alone.
 *
 * THREE WAYS, TWO WRITABLE TYPES. Equally and Shares are both `shares` — the
 * first is every weight 1, the second lets a weight be typed. Exact is
 * `exact`. `even` and `percentage` stay readable history and nothing writes
 * them (#117), so the wire never sees them from here.
 *
 * NO TIMEZONES (rule 10). The day is a `dayId`; its label is the itinerary's
 * own date string, shown exactly as stored.
 */
import type { Currency } from "@floc/core/money/currency";
import { computeSplits, formatMoney, parseMoney } from "@floc/core/money/money";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";

import {
  DEFAULT_CATEGORY,
  type ExpenseCategory,
} from "@floc/core/money/expense-category";

import { useTheme } from "../system/theme";
import { Body, Label } from "../system/ui";
import { fonts, radius, size, space } from "@/lib/theme";

export type ExpenseDraft = {
  description: string;
  /** Filed under one of the fixed twelve; the glyph is the rendering, never the value. */
  category: ExpenseCategory;
  amountMinor: number;
  paidBy: string;
  dayId: number | null;
  notes: string | null;
  splitType: "shares" | "exact";
  splits: { userId: string; owedAmountMinor: number }[];
};

export type Person = { userId: string; name: string };
export type DayOption = { id: number; label: string };

/** How the amount is divided. The words are the web page's; two of them write `shares`. */
export type Mode = "equally" | "exact" | "shares";

export const MODES = [
  { value: "equally" as const, label: "Equally" },
  { value: "exact" as const, label: "Exact" },
  { value: "shares" as const, label: "Shares" },
];

/** What an edit starts from. Absent means a new expense. */
export type Initial = {
  description: string;
  category: ExpenseCategory;
  amount: string;
  paidBy: string;
  dayId: number | null;
  notes: string;
  inOn: string[];
};

/** Everything the form is handed. */
export type ExpenseFormProps = {
  people: Person[];
  /** The trip's days, for "which day". Empty on an undated trip — not an error (rule 9). */
  days: DayOption[];
  currency: Currency;
  /** Who the payer defaults to on a new expense: whoever is holding the phone. */
  viewerId: string;
  initial?: Initial;
  busy: boolean;
  onSave: (draft: ExpenseDraft) => void;
  onCancel: () => void;
  onDelete?: () => void;
};

/** One pill in a row of choices. Used for the payer, the day and the split mode. */
export function Choice({
  label,
  on,
  small,
  onPress,
}: {
  label: string;
  on: boolean;
  small?: boolean;
  onPress: () => void;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: on }}
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        paddingVertical: small ? space.xs : space.sm,
        paddingHorizontal: small ? space.sm : space.md,
        borderRadius: radius.pill,
        backgroundColor: on ? c.mint : c["sheet-2"],
        borderWidth: 1,
        borderColor: on ? c["mint-edge"] : c.rule,
      }}
    >
      <Body tone={on ? "ink" : "ink-3"}>{label}</Body>
    </Pressable>
  );
}

/** A row of pills that scrolls. The payer, the day and the mode ask the same shape of question. */
export function Pills({
  label,
  options,
  value,
  small,
  onChange,
}: {
  /** Absent draws no heading — a shape that labels its row another way says so by omitting it. */
  label?: string;
  options: { key: string; label: string }[];
  value: string;
  small?: boolean;
  onChange: (key: string) => void;
}) {
  return (
    <View style={{ gap: space.xs }}>
      {label ? <Label>{label}</Label> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: "row", gap: space.xs }}>
          {options.map((option) => (
            <Choice
              key={option.key}
              label={option.label}
              on={option.key === value}
              small={small}
              onPress={() => onChange(option.key)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

/** The small number beside a person, in the two modes where the answer is a figure. */
export function Weight({
  person,
  mode,
  currency,
  value,
  onChange,
}: {
  person: Person;
  mode: Mode;
  currency: Currency;
  value: string;
  onChange: (value: string) => void;
}) {
  const { c } = useTheme();
  return (
    <TextInput
      accessibilityLabel={mode === "exact" ? `${person.name}, amount` : `${person.name}, shares`}
      value={value}
      onChangeText={onChange}
      keyboardType="decimal-pad"
      inputMode="decimal"
      placeholder={mode === "exact" ? currency : "1"}
      placeholderTextColor={c["ink-3"]}
      style={{
        width: 76,
        borderRadius: radius.md,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: c.rule,
        backgroundColor: c.sheet,
        paddingVertical: space.xs,
        paddingHorizontal: space.sm,
        color: c.ink,
        fontFamily: fonts.type,
        fontSize: size.body,
        textAlign: "right",
      }}
    />
  );
}

/**
 * The people, and what each one is down for.
 *
 * Equally is a tick list — in or out. Exact and Shares put a number beside
 * each person, because in those two the answer is a figure and not a yes.
 */
export function Participants({
  people,
  mode,
  inOn,
  weights,
  currency,
  onToggle,
  onWeight,
}: {
  people: Person[];
  mode: Mode;
  inOn: Set<string>;
  weights: Record<string, string>;
  currency: Currency;
  onToggle: (userId: string) => void;
  onWeight: (userId: string, value: string) => void;
}) {
  return (
    <View style={{ gap: space.xs }}>
      {people.map((person) => {
        const on = inOn.has(person.userId);
        return (
          <View
            key={person.userId}
            style={{ flexDirection: "row", alignItems: "center", gap: space.md }}
          >
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={person.name}
              onPress={() => onToggle(person.userId)}
              style={{ flex: 1 }}
            >
              {/* The word "in", not the fill, is what says they are in (#204). */}
              <Body tone={on ? "ink" : "ink-3"}>{on ? `${person.name} · in` : person.name}</Body>
            </Pressable>
            {mode !== "equally" && on ? (
              <Weight
                person={person}
                mode={mode}
                currency={currency}
                value={weights[person.userId] ?? ""}
                onChange={(value) => onWeight(person.userId, value)}
              />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

/** In Equally, who is in is a yes or no — so a chip each fits a line instead of a list. */
export function ParticipantChips({
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
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.xs }}>
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
              paddingVertical: space.xs,
              paddingHorizontal: space.sm,
              borderRadius: radius.pill,
              backgroundColor: on ? c.mint : c["sheet-2"],
              borderWidth: 1,
              borderColor: on ? c["mint-edge"] : c.rule,
            }}
          >
            {/* "out" is said, because a chip that is merely paler is not a state
                anyone can read at a glance (#204). */}
            <Body tone={on ? "ink" : "ink-3"}>{on ? person.name : `${person.name} · out`}</Body>
          </Pressable>
        );
      })}
    </View>
  );
}

/** What the form produced, or what to tell the person instead. A rejection is a message. */
export type Attempt = { ok: true; draft: ExpenseDraft } | { ok: false; problem: string };

/**
 * Everything that can be wrong with a filled-in form, in one place.
 *
 * Pure, and outside every component, so the rules can be read without markup
 * around them — and so all three shapes reject exactly the same things.
 */
export function buildDraft(
  fields: {
    description: string;
    category: ExpenseCategory;
    amount: string;
    paidBy: string;
    dayId: number | null;
    notes: string;
    mode: Mode;
  },
  people: Person[],
  inOn: Set<string>,
  weights: Record<string, string>,
  currency: Currency,
): Attempt {
  if (inOn.size === 0) return { ok: false, problem: "Somebody has to be in on it." };

  let amountMinor: number;
  try {
    amountMinor = parseMoney(fields.amount, currency);
  } catch {
    return { ok: false, problem: "That isn't an amount." };
  }
  if (amountMinor <= 0) return { ok: false, problem: "That isn't an amount." };

  const splitType = fields.mode === "exact" ? "exact" : "shares";
  let splits: { userId: string; owedAmountMinor: number }[];
  try {
    splits = computeSplits(
      amountMinor,
      splitType,
      participantValues(people, inOn, weights, fields.mode, currency),
    );
  } catch {
    return {
      ok: false,
      problem:
        fields.mode === "exact"
          ? `The amounts have to add up to ${formatMoney(amountMinor, currency)}.`
          : "Those shares do not work.",
    };
  }

  return {
    ok: true,
    draft: {
      description: fields.description.trim(),
      category: fields.category,
      amountMinor,
      paidBy: fields.paidBy,
      dayId: fields.dayId,
      notes: fields.notes.trim() === "" ? null : fields.notes.trim(),
      splitType,
      splits,
    },
  };
}

/**
 * What each person is down for, as `computeSplits` wants it.
 *
 * Everyone gets a row: the snapshot records who was considered, not only who
 * owes, so somebody left out is a nought rather than an absence.
 */
function participantValues(
  people: Person[],
  inOn: Set<string>,
  weights: Record<string, string>,
  mode: Mode,
  currency: Currency,
): { userId: string; value: number }[] {
  return people.map((person) => {
    if (!inOn.has(person.userId)) return { userId: person.userId, value: 0 };
    const typed = weights[person.userId] ?? "";
    if (mode === "equally") return { userId: person.userId, value: 1 };
    if (mode === "shares") {
      const value = typed === "" ? 1 : Number(typed);
      if (!Number.isFinite(value) || value < 0) throw new Error("share");
      return { userId: person.userId, value };
    }
    // Exact is money, so it goes through `parseMoney` like every other amount
    // — a share typed "3.5" must round the way the total does.
    return { userId: person.userId, value: typed === "" ? 0 : parseMoney(typed, currency) };
  });
}

/**
 * Every field the form holds, in one hook.
 *
 * Not an abstraction for its own sake: eleven `useState` lines each with their
 * own `?? fallback` put a shape over both the length and the complexity
 * ceilings, and none of that branching is about drawing anything.
 */
export function useFields(initial: Initial | undefined, viewerId: string, people: Person[]) {
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState<ExpenseCategory>(
    initial?.category ?? DEFAULT_CATEGORY,
  );
  const [amount, setAmount] = useState(initial?.amount ?? "");
  const [paidBy, setPaidBy] = useState(initial?.paidBy ?? viewerId);
  const [dayId, setDayId] = useState<number | null>(initial?.dayId ?? null);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [mode, setMode] = useState<Mode>("equally");
  const [weights, setWeights] = useState<Record<string, string>>({});
  const [problem, setProblem] = useState<string | null>(null);
  const [inOn, setInOn] = useState<Set<string>>(
    new Set(initial?.inOn ?? people.map((person) => person.userId)),
  );

  return {
    description,
    setDescription,
    category,
    setCategory,
    amount,
    setAmount,
    paidBy,
    setPaidBy,
    dayId,
    setDayId,
    notes,
    setNotes,
    mode,
    setMode,
    weights,
    problem,
    setProblem,
    setWeight: (userId: string, value: string) =>
      setWeights((current) => ({ ...current, [userId]: value })),
    inOn,
    toggle: (userId: string) =>
      setInOn((current) => {
        const next = new Set(current);
        if (next.has(userId)) next.delete(userId);
        else next.add(userId);
        return next;
      }),
  };
}

/** The one save path, so a shape cannot accidentally validate differently. */
export function trySave(
  f: ReturnType<typeof useFields>,
  people: Person[],
  currency: Currency,
  onSave: (draft: ExpenseDraft) => void,
) {
  const attempt = buildDraft(
    {
      description: f.description,
      category: f.category,
      amount: f.amount,
      paidBy: f.paidBy,
      dayId: f.dayId,
      notes: f.notes,
      mode: f.mode,
    },
    people,
    f.inOn,
    f.weights,
    currency,
  );
  if (!attempt.ok) {
    f.setProblem(attempt.problem);
    return;
  }
  f.setProblem(null);
  onSave(attempt.draft);
}

/** The name a chosen key answers with, for a shape that shows the answer rather than the choices. */
export function labelOf(options: { key: string; label: string }[], value: string): string {
  return options.find((option) => option.key === value)?.label ?? "";
}

/** Payer options. Every shape asks this the same way. */
export function payerOptions(people: Person[]) {
  return people.map((person) => ({ key: person.userId, label: person.name }));
}

/** Day options, with "No day" first — an expense need not belong to one (rule 9). */
export function dayOptions(days: DayOption[]) {
  return [
    { key: "none", label: "No day" },
    ...days.map((day) => ({ key: String(day.id), label: day.label })),
  ];
}
