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
  /** Filed under one of the fixed twelve; the glyph is the rendering, never the value. */
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
  mode: Mode;
  weights: Record<string, string>;
};

/** Everything the form is handed. */
export type ExpenseFormProps = {
  people: Person[];
  /** The trip's days, for "which day". Empty on an undated trip — not an error (rule 9). */
  days: DayOption[];
  /** What the form starts in: the expense's own on an edit, the trip's on an add. */
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
        backgroundColor: on ? c["pastel-green"] : c["sheet-2"],
        borderWidth: 1,
        borderColor: on ? c["pastel-green-edge"] : c.rule,
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

/**
 * The amount typed against one person, in Exact.
 *
 * The currency is said to the LEFT of the box and the box has a real edge
 * (#317): a hairline field holding a greyed "GBP" read as a filled-in amount
 * rather than as somewhere to type one.
 */
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
      placeholder="0.00"
      placeholderTextColor={c["ink-3"]}
      style={{
        width: 96,
        borderRadius: radius.md,
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

/** Minus and plus, because a share is counted, not typed (#317). */
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

/** Ticked or empty. An empty box is the one shape everybody reads as "turn me on". */
function Tick({ on }: { on: boolean }) {
  const { c } = useTheme();
  return (
    <View
      style={{
        width: 20,
        height: 20,
        // Half of `radius.sm` — at 20 points the small radius is a full circle,
        // and a circle reads as a radio button, one of many.
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

/**
 * One person, tapped to put them in or out, with whatever the mode asks of them
 * on the right. A row each, not wrapped chips (#317): names are different
 * lengths, so chips left a ragged block nobody could scan down.
 *
 * THE BOX IS WHY THE ROW LOOKS PRESSABLE. "Dev user · in" was the whole row and
 * read as a statement, so nobody found the tap that takes a person out (#317).
 */
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
        {/* Out is the odd state, so it says so — a tick alone is an icon (#204). */}
        <Body tone={on ? "ink" : "ink-3"}>
          {on ? person.name : `${person.name} · out`}
        </Body>
      </Pressable>
      {on ? children : null}
    </View>
  );
}

/**
 * Equally asks a yes or no, and answers with the cost.
 *
 * The share sits on the right of the row it belongs to, so ticking somebody out
 * is seen in the figure it changes rather than in a total further down.
 */
export function TickList({
  people,
  inOn,
  onToggle,
  shareFor,
}: {
  people: Person[];
  inOn: Set<string>;
  onToggle: (userId: string) => void;
  /** What this person is down for, or "" while the amount is unusable. */
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

/** Exact asks for a figure each, in the trip's currency. */
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

/** Shares counts up and down, and says what each count comes to. */
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
  /** What this person's shares come to, or "" while the amount is unusable. */
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

/** What the form produced, or what to tell the person instead. A rejection is a message. */
export type Attempt =
  { ok: true; draft: ExpenseDraft } | { ok: false; problem: string };

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
  if (inOn.size === 0)
    return { ok: false, problem: "Somebody has to be in on it." };

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
      currency,
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
    return {
      userId: person.userId,
      value: typed === "" ? 0 : parseMoney(typed, currency),
    };
  });
}

/**
 * Every field the form holds, in one hook.
 *
 * Not an abstraction for its own sake: eleven `useState` lines each with their
 * own `?? fallback` put a shape over both the length and the complexity
 * ceilings, and none of that branching is about drawing anything.
 */
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

/** The one save path, so a shape cannot accidentally validate differently. */
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

/** The name a chosen key answers with, for a shape that shows the answer rather than the choices. */
export function labelOf(
  options: { key: string; label: string }[],
  value: string,
): string {
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
