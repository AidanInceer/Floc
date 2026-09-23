/**
 * Add or edit one expense (ticket 300, reshaped #302).
 *
 * WHAT IT LOOKS LIKE AND WHY. The form asks the seven things the web modal
 * asks and used to be drawn the way the web modal draws them: a labelled block
 * per question, stacked. On a desk that is a modal; on a phone it was a page
 * and a half of scrolling for an expense that is usually "lunch, £24, split
 * four ways". Three compressions were drawn and looked at on the device — rows,
 * a sentence, and this. This one won.
 *
 * THE TWO THINGS NOBODY CAN GUESS ARE UP. What it was for and how much: those
 * have to be typed, so they open the card, one line each. The split follows,
 * because it is the thing groups actually disagree about.
 *
 * THE THREE THAT ARE USUALLY RIGHT FOLD. The payer is whoever is holding the
 * phone, the day is none, the note is empty. What is folded is still *said*
 * while it is folded — "Aidan paid · No day" — so the fold hides controls and
 * never facts (#126).
 *
 * THE RULES ARE NOT HERE. `expense-form-parts` holds every one of them, so
 * money, splits and rejections cannot drift from the drawing.
 */
import { CURRENCIES } from "@floc/core/money/currency";
import { formatMoney } from "@floc/core/money/money";
import { useState, type ReactNode } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import {
  ExactList,
  MODES,
  Pills,
  ShareList,
  TickList,
  buildDraft,
  dayOptions,
  labelOf,
  payerOptions,
  trySave,
  useFields,
  type ExpenseFormProps,
} from "./expense-form-parts";
import { CategoryPicker } from "../days/category-picker";
import { useTheme } from "../system/theme";
import { Body, Button, Card, Dropdown, Field, Label, Segmented } from "../system/ui";
import { fonts, radius, size, space } from "@/lib/theme";

export type { DayOption, ExpenseDraft } from "./expense-form-parts";

/**
 * What is being asked, then the field under it.
 *
 * IT USED TO BE ONE ROW, label left and field right. A phone has no room for
 * that: "Description" and a typed sentence fought for the same 200 points and
 * the label was clipped by the field beside it (#317). Stacked, both get the
 * full width and a long description stops colliding with its own label.
 */
function Asked({
  label,
  children,
  first,
}: {
  label: string;
  children: ReactNode;
  first?: boolean;
}) {
  const { c } = useTheme();
  return (
    <View
      style={{
        gap: space.xs,
        paddingVertical: space.sm,
        borderTopWidth: first ? 0 : StyleSheet.hairlineWidth,
        borderTopColor: c.rule,
      }}
    >
      <Label>{label}</Label>
      {children}
    </View>
  );
}

/**
 * The input on a line, boxed.
 *
 * IT WAS BARE, AND THAT WAS THE BUG. Right-aligned text with no border and a
 * grey placeholder read as a value already filled in — people saw "Lunch" and
 * "0.00" as this expense's description and amount rather than as the shape of
 * an answer. A field has to look like a field: its own ground, its own edge,
 * and ink dark enough to tell typed text from a hint.
 */
function Plain({
  value,
  onChangeText,
  placeholder,
  accessibilityLabel,
  numeric,
  big,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  accessibilityLabel: string;
  /** Numbers are tabular and right-aligned; words read from the left. */
  numeric?: boolean;
  big?: boolean;
}) {
  const { c } = useTheme();
  return (
    <TextInput
      accessibilityLabel={accessibilityLabel}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={c["ink-3"]}
      keyboardType={numeric ? "decimal-pad" : "default"}
      inputMode={numeric ? "decimal" : "text"}
      style={{
        flex: 1,
        minWidth: 0,
        color: c.ink,
        fontFamily: numeric ? fonts.type : fonts.sans,
        fontSize: big ? size.heading : size.body,
        textAlign: numeric ? "right" : "left",
        backgroundColor: c.sheet,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: c["rule-2"] ?? c.rule,
        borderRadius: radius.md,
        paddingVertical: space.sm,
        paddingHorizontal: space.md,
      }}
    />
  );
}

/** Save and Cancel on one row. Three stacked full-width buttons is a wall. */
function Actions({
  busy,
  onSave,
  onCancel,
  onDelete,
}: {
  busy: boolean;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
      {/* Deleting is not one of the two equals: it stays a word, not a slab. */}
      {onDelete ? (
        <Pressable
          accessibilityRole="button"
          onPress={onDelete}
          hitSlop={space.sm}
          style={{ paddingHorizontal: space.sm }}
        >
          <Body tone="red">Delete</Body>
        </Pressable>
      ) : null}
      <View style={{ flex: 1 }} />
      <Button label="Cancel" variant="quiet" fit="small" onPress={onCancel} />
      <Button label="Save" busy={busy} fit="small" onPress={onSave} />
    </View>
  );
}

/** How the amount is divided, and between whom. */
function Split({
  f,
  people,
  currency,
}: {
  f: ReturnType<typeof useFields>;
  people: ExpenseFormProps["people"];
  currency: ExpenseFormProps["currency"];
}) {
  let list = (
    <TickList
      people={people}
      inOn={f.inOn}
      onToggle={f.toggle}
      shareFor={shareOf(f, people, currency)}
    />
  );
  if (f.mode === "exact") {
    list = (
      <ExactList
        people={people}
        inOn={f.inOn}
        weights={f.weights}
        currency={currency}
        onToggle={f.toggle}
        onWeight={f.setWeight}
      />
    );
  }
  if (f.mode === "shares") {
    list = (
      <ShareList
        people={people}
        inOn={f.inOn}
        weights={f.weights}
        onToggle={f.toggle}
        onWeight={f.setWeight}
        shareFor={shareOf(f, people, currency)}
      />
    );
  }

  return (
    <View style={{ gap: space.sm }}>
      <Segmented options={MODES} value={f.mode} onChange={f.setMode} />
      {list}
    </View>
  );
}

/** What each person's shares currently come to, or "" while the sum cannot be worked out. */
function shareOf(
  f: ReturnType<typeof useFields>,
  people: ExpenseFormProps["people"],
  currency: ExpenseFormProps["currency"],
): (userId: string) => string {
  const attempt = buildDraft(
    {
      description: "",
      category: f.category,
      amount: f.amount,
      paidBy: f.paidBy,
      dayId: null,
      notes: "",
      mode: f.mode,
    },
    people,
    f.inOn,
    f.weights,
    currency,
  );
  if (!attempt.ok) return () => "";
  return (userId) => {
    const split = attempt.draft.splits.find((one) => one.userId === userId);
    return split ? formatMoney(split.owedAmountMinor, currency) : "";
  };
}

/** How many are in. Each person's own figure is on their own row. */
function Each({
  f,
  people,
}: {
  f: ReturnType<typeof useFields>;
  people: ExpenseFormProps["people"];
}) {
  return (
    <Body tone="ink-3">
      {f.inOn.size} of {people.length} in
    </Body>
  );
}

const CURRENCY_OPTIONS = CURRENCIES.map((code) => ({ value: code, label: code }));

/** The payer, the day and the note, behind one line that says what they currently are. */
function Folded({
  f,
  people,
  days,
}: {
  f: ReturnType<typeof useFields>;
  people: ExpenseFormProps["people"];
  days: ExpenseFormProps["days"];
}) {
  const [open, setOpen] = useState(false);
  const { c } = useTheme();
  const payers = payerOptions(people);
  const whichDay = dayOptions(days);
  const dayValue = f.dayId === null ? "none" : String(f.dayId);
  const said = [
    `${labelOf(payers, f.paidBy)} paid`,
    // An undated trip has no days, and that is normal (rule 9) — the question
    // is simply not asked, and nothing is said about it either.
    days.length > 0 ? labelOf(whichDay, dayValue) : null,
    f.notes.trim() === "" ? null : "a note",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel="Payer, day, currency and notes"
        onPress={() => setOpen(!open)}
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          gap: space.md,
          paddingVertical: space.sm,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: c.rule,
        }}
      >
        <Body tone="ink-2">{said}</Body>
        <Body tone="pen">{open ? "Done" : "Change"}</Body>
      </Pressable>

      {open ? (
        <View style={{ gap: space.md, paddingBottom: space.sm }}>
          <Pills
            label="Paid by"
            options={payers}
            value={f.paidBy}
            small
            onChange={f.setPaidBy}
          />
          {days.length > 0 ? (
            <Pills
              label="Which day"
              options={whichDay}
              value={dayValue}
              small
              onChange={(key) =>
                f.setDayId(key === "none" ? null : Number(key))
              }
            />
          ) : null}
          <Dropdown
            label="Currency"
            options={CURRENCY_OPTIONS}
            value={f.currency}
            onChange={f.setCurrency}
          />
          <Field
            label="Notes"
            value={f.notes}
            onChangeText={f.setNotes}
            multiline
          />
        </View>
      ) : null}
    </View>
  );
}

export function ExpenseForm({
  people,
  days,
  currency,
  viewerId,
  initial,
  busy,
  onSave,
  onCancel,
  onDelete,
}: ExpenseFormProps) {
  const f = useFields(initial, viewerId, people, currency);

  return (
    <Card>
      <View style={{ gap: space.md }}>
        <View>
          {/* "Description" is what the web asks, and what the thing is. "What
              for" was a different question in a second vocabulary. */}
          {/* The category rides this line rather than owning one. It has a
              correct default, so a labelled row of its own was the form's
              least-changed question taking a third of its height. */}
          <Asked label="Description" first>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: space.sm,
              }}
            >
              <CategoryPicker
                value={f.category}
                onChange={f.setCategory}
                compact
              />
              <Plain
                accessibilityLabel="Description"
                value={f.description}
                onChangeText={f.setDescription}
                // No word here on purpose: a greyed "Lunch" inside an unboxed
                // field read as an expense already described.
                placeholder=""
              />
            </View>
          </Asked>
          <Asked label={`Amount (${f.currency})`}>
            <Plain
              accessibilityLabel="Amount"
              value={f.amount}
              onChangeText={f.setAmount}
              // This one stays: it is the *shape* of the answer, not a guess at
              // it, and a decimal field that does not say "two places" invites
              // pennies typed as pounds.
              placeholder="0.00"
              numeric
              big
            />
          </Asked>
        </View>

        <Split f={f} people={people} currency={f.currency} />
        <Each f={f} people={people} />

        <Folded f={f} people={people} days={days} />

        {f.problem ? <Body tone="red">{f.problem}</Body> : null}
        <Actions
          busy={busy}
          onSave={() => trySave(f, people, onSave)}
          onCancel={onCancel}
          onDelete={onDelete}
        />
      </View>
    </Card>
  );
}
