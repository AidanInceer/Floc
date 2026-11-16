import type { Currency } from "@floc/core/money/currency";
import { SPLIT_MODES, splitBox, splitFromForm, type SplitMode } from "@floc/core/money/expense/expense-form";
import { useState, type ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import {
  DEFAULT_CATEGORY,
  type ExpenseCategory,
} from "@floc/core/money/expense-category";

import { useTheme } from "../system/theme";
import { TickGlyph } from "../system/glyphs";
import { Body, Label } from "../system/ui";
import { fonts, radius, size, space } from "@/lib/theme";

export type ExpenseDraft = {
  description: string;
  category: ExpenseCategory;
  amountMinor: number;
  currency: Currency;
  paidBy: string;
  dayId: number | null;
  notes: string | null;
  splitType: "shares" | "exact";
  splits: { userId: string; owedAmountMinor: number }[];
};

export type Person = { userId: string; name: string };
export type DayOption = { id: number; label: string };

export type Mode = SplitMode;

export const MODES = SPLIT_MODES.map((mode) => ({ value: mode.key, label: mode.label }));

export type Initial = {
  description: string;
  category: ExpenseCategory;
  amount: string;
  paidBy: string;
  dayId: number | null;
  notes: string;
  inOn: string[];
  mode: Mode;
  weights: Record<string, string>;
};

export type ExpenseFormProps = {
  people: Person[];
  days: DayOption[];
  currency: Currency;
  viewerId: string;
  initial?: Initial;
  busy: boolean;
  onSave: (draft: ExpenseDraft) => void;
  onCancel: () => void;
  onDelete?: () => void;
};

function Choice({
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
        backgroundColor: on ? c["pastel-green"] : c["sheet-2"],
        borderWidth: 1,
        borderColor: on ? c["pastel-green-edge"] : c.rule,
      }}
    >
      <Body tone={on ? "ink" : "ink-3"}>{label}</Body>
    </Pressable>
  );
}

export function Pills({
  label,
  options,
  value,
  small,
  onChange,
}: {
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

function MoneyInput({
  person,
  value,
  onChange,
}: {
  person: Person;
  value: string;
  onChange: (value: string) => void;
}) {
  const { c } = useTheme();
  return (
    <TextInput
      accessibilityLabel={`${person.name}, amount`}
      value={value}
      onChangeText={onChange}
      keyboardType="decimal-pad"
      inputMode="decimal"
      style={{
        width: 96,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: c["ink-3"],
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

function Stepper({
  person,
  value,
  onChange,
}: {
  person: Person;
  value: string;
  onChange: (value: string) => void;
}) {
  const { c } = useTheme();
  const shares = value === "" ? 1 : Math.max(1, Math.round(Number(value) || 1));
  const step = (by: number) => onChange(String(Math.max(1, shares + by)));
  const key = {
    width: 30,
    height: 30,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.rule,
    backgroundColor: c["sheet-2"],
  };
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.xs }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`One share fewer for ${person.name}`}
        onPress={() => step(-1)}
        style={key}
      >
        <Body bold>&minus;</Body>
      </Pressable>
      <View style={{ minWidth: 22, alignItems: "center" }}>
        <Body>{shares}</Body>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`One share more for ${person.name}`}
        onPress={() => step(1)}
        style={key}
      >
        <Body bold>+</Body>
      </Pressable>
    </View>
  );
}

function Tick({ on }: { on: boolean }) {
  const { c } = useTheme();
  return (
    <View
      style={{
        width: 20,
        height: 20,
        borderRadius: radius.sm / 2,
        borderWidth: 1.5,
        borderColor: on ? c.pen : c["rule-2"],
        backgroundColor: on ? c.pen : c.sheet,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {on ? <TickGlyph color={c.sheet} /> : null}
    </View>
  );
}

function PersonRow({
  person,
  on,
  onToggle,
  children,
}: {
  person: Person;
  on: boolean;
  onToggle: (userId: string) => void;
  children?: ReactNode;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space.sm,
        paddingVertical: space.xs,
      }}
    >
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: on }}
        accessibilityLabel={person.name}
        onPress={() => onToggle(person.userId)}
        style={{
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          gap: space.sm,
        }}
      >
        <Tick on={on} />
        <Body tone={on ? "ink" : "ink-3"}>
          {on ? person.name : `${person.name} · out`}
        </Body>
      </Pressable>
      {on ? children : null}
    </View>
  );
}

export function TickList({
  people,
  inOn,
  onToggle,
  shareFor,
}: {
  people: Person[];
  inOn: Set<string>;
  onToggle: (userId: string) => void;
  shareFor: (userId: string) => string;
}) {
  return (
    <View>
      {people.map((person) => (
        <PersonRow
          key={person.userId}
          person={person}
          on={inOn.has(person.userId)}
          onToggle={onToggle}
        >
          <Body tone="ink-2">{shareFor(person.userId)}</Body>
        </PersonRow>
      ))}
    </View>
  );
}

export function ExactList({
  people,
  inOn,
  weights,
  currency,
  onToggle,
  onWeight,
}: {
  people: Person[];
  inOn: Set<string>;
  weights: Record<string, string>;
  currency: Currency;
  onToggle: (userId: string) => void;
  onWeight: (userId: string, value: string) => void;
}) {
  return (
    <View>
      {people.map((person) => (
        <PersonRow
          key={person.userId}
          person={person}
          on={inOn.has(person.userId)}
          onToggle={onToggle}
        >
          <Body tone="ink-3">{currency}</Body>
          <MoneyInput
            person={person}
            value={weights[person.userId] ?? ""}
            onChange={(value) => onWeight(person.userId, value)}
          />
        </PersonRow>
      ))}
    </View>
  );
}

export function ShareList({
  people,
  inOn,
  weights,
  onToggle,
  onWeight,
  shareFor,
}: {
  people: Person[];
  inOn: Set<string>;
  weights: Record<string, string>;
  onToggle: (userId: string) => void;
  onWeight: (userId: string, value: string) => void;
  shareFor: (userId: string) => string;
}) {
  return (
    <View>
      {people.map((person) => (
        <PersonRow
          key={person.userId}
          person={person}
          on={inOn.has(person.userId)}
          onToggle={onToggle}
        >
          <Stepper
            person={person}
            value={weights[person.userId] ?? ""}
            onChange={(value) => onWeight(person.userId, value)}
          />
          <View style={{ minWidth: 78, alignItems: "flex-end" }}>
            <Body tone="ink-2">{shareFor(person.userId)}</Body>
          </View>
        </PersonRow>
      ))}
    </View>
  );
}

export type Attempt =
  { ok: true; draft: ExpenseDraft } | { ok: false; problem: string };

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
  const boxes = people
    .filter((person) => inOn.has(person.userId))
    .map((person) => splitBox(fields.mode, person.userId, typedRow(weights[person.userId] ?? "")));
  const split = splitFromForm(fields.amount, boxes, currency);
  if (!split.ok) return split;
  const { amountMinor, splitType, splits } = split;

  return {
    ok: true,
    draft: {
      description: fields.description.trim(),
      category: fields.category,
      amountMinor,
      currency,
      paidBy: fields.paidBy,
      dayId: fields.dayId,
      notes: fields.notes.trim() === "" ? null : fields.notes.trim(),
      splitType,
      splits,
    },
  };
}

function typedRow(typed: string): { shares: number; pin: string } {
  return { shares: typed.trim() === "" ? 1 : Number(typed), pin: typed };
}

export function useFields(
  initial: Initial | undefined,
  viewerId: string,
  people: Person[],
  startCurrency: Currency,
) {
  const start: Initial = {
    description: "",
    category: DEFAULT_CATEGORY,
    amount: "",
    paidBy: viewerId,
    dayId: null,
    notes: "",
    inOn: people.map((person) => person.userId),
    mode: "equally",
    weights: {},
    ...initial,
  };
  const [currency, setCurrency] = useState<Currency>(startCurrency);
  const [description, setDescription] = useState(start.description);
  const [category, setCategory] = useState<ExpenseCategory>(start.category);
  const [amount, setAmount] = useState(start.amount);
  const [paidBy, setPaidBy] = useState(start.paidBy);
  const [dayId, setDayId] = useState<number | null>(start.dayId);
  const [notes, setNotes] = useState(start.notes);
  const [mode, setMode] = useState<Mode>(start.mode);
  const [weights, setWeights] = useState<Record<string, string>>(start.weights);
  const [problem, setProblem] = useState<string | null>(null);
  const [inOn, setInOn] = useState<Set<string>>(new Set(start.inOn));

  return {
    currency,
    setCurrency,
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

export function trySave(
  f: ReturnType<typeof useFields>,
  people: Person[],
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
    f.currency,
  );
  if (!attempt.ok) {
    f.setProblem(attempt.problem);
    return;
  }
  f.setProblem(null);
  onSave(attempt.draft);
}

export function labelOf(
  options: { key: string; label: string }[],
  value: string,
): string {
  return options.find((option) => option.key === value)?.label ?? "";
}

export function payerOptions(people: Person[]) {
  return people.map((person) => ({ key: person.userId, label: person.name }));
}

export function dayOptions(days: DayOption[]) {
  return [
    { key: "none", label: "No day" },
    ...days.map((day) => ({ key: String(day.id), label: day.label })),
  ];
}
