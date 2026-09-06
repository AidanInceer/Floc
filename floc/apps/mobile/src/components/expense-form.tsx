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
import { formatMoney } from "@floc/core/money";
import { useState, type ReactNode } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import {
  MODES,
  ParticipantChips,
  Participants,
  Pills,
  buildDraft,
  dayOptions,
  labelOf,
  payerOptions,
  trySave,
  useFields,
  type ExpenseFormProps,
} from "./expense-form-parts";
import { useTheme } from "./theme";
import { Body, Button, Card, Field, Label, Segmented } from "./ui";
import { fonts, size, space } from "@/lib/theme";

export type { DayOption, ExpenseDraft } from "./expense-form-parts";

/** One line: what is being asked on the left, the answer on the right. */
function Line({ label, children, first }: { label: string; children: ReactNode; first?: boolean }) {
  const { c } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: space.md,
        paddingVertical: space.sm,
        borderTopWidth: first ? 0 : StyleSheet.hairlineWidth,
        borderTopColor: c.rule,
      }}
    >
      <Label>{label}</Label>
      <View style={{ flexShrink: 1, alignItems: "flex-end" }}>{children}</View>
    </View>
  );
}

/** A bare input with no label of its own — the line beside it already said what it is. */
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
        minWidth: 140,
        color: c.ink,
        fontFamily: numeric ? fonts.type : fonts.sans,
        fontSize: big ? size.heading : size.body,
        textAlign: "right",
        paddingVertical: space.xs,
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
    <View style={{ gap: space.sm }}>
      <View style={{ flexDirection: "row", gap: space.sm }}>
        <View style={{ flex: 1 }}>
          <Button label="Cancel" variant="quiet" onPress={onCancel} />
        </View>
        <View style={{ flex: 2 }}>
          <Button label="Save" busy={busy} onPress={onSave} />
        </View>
      </View>
      {/* Deleting is not one of two equals — it sits apart, below. */}
      {onDelete ? <Button label="Delete this expense" variant="danger" onPress={onDelete} /> : null}
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
  return (
    <View style={{ gap: space.sm }}>
      <Segmented options={MODES} value={f.mode} onChange={f.setMode} />
      {/* Equally asks a yes or no, so a chip each fits one line; the other two
          ask for a figure, which needs a row. */}
      {f.mode === "equally" ? (
        <ParticipantChips people={people} inOn={f.inOn} onToggle={f.toggle} />
      ) : (
        <Participants
          people={people}
          mode={f.mode}
          inOn={f.inOn}
          weights={f.weights}
          currency={currency}
          onToggle={f.toggle}
          onWeight={f.setWeight}
        />
      )}
    </View>
  );
}

/** What each person is down for, once it is knowable. Status, so it is said (#126). */
function Each({
  f,
  people,
  currency,
}: {
  f: ReturnType<typeof useFields>;
  people: ExpenseFormProps["people"];
  currency: ExpenseFormProps["currency"];
}) {
  const attempt = buildDraft(
    { description: "", amount: f.amount, paidBy: f.paidBy, dayId: null, notes: "", mode: f.mode },
    people,
    f.inOn,
    f.weights,
    currency,
  );
  const share =
    attempt.ok && f.mode === "equally"
      ? attempt.draft.splits.find((split) => split.owedAmountMinor > 0)?.owedAmountMinor
      : undefined;

  return (
    <Body tone="ink-3">
      {share === undefined ? "" : `${formatMoney(share, currency)} each · `}
      {f.inOn.size} of {people.length} in
    </Body>
  );
}

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
        accessibilityLabel="Payer, day and notes"
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
          <Pills label="Paid by" options={payers} value={f.paidBy} small onChange={f.setPaidBy} />
          {days.length > 0 ? (
            <Pills
              label="Which day"
              options={whichDay}
              value={dayValue}
              small
              onChange={(key) => f.setDayId(key === "none" ? null : Number(key))}
            />
          ) : null}
          <Field label="Notes" value={f.notes} onChangeText={f.setNotes} multiline />
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
  const f = useFields(initial, viewerId, people);

  return (
    <Card>
      <View style={{ gap: space.md }}>
        <View>
          <Line label="What for" first>
            <Plain
              accessibilityLabel="Description"
              value={f.description}
              onChangeText={f.setDescription}
              placeholder="Lunch"
            />
          </Line>
          <Line label={`Amount (${currency})`}>
            <Plain
              accessibilityLabel="Amount"
              value={f.amount}
              onChangeText={f.setAmount}
              placeholder="0.00"
              numeric
              big
            />
          </Line>
        </View>

        <Split f={f} people={people} currency={currency} />
        <Each f={f} people={people} currency={currency} />

        <Folded f={f} people={people} days={days} />

        {f.problem ? <Body tone="red">{f.problem}</Body> : null}
        <Actions
          busy={busy}
          onSave={() => trySave(f, people, currency, onSave)}
          onCancel={onCancel}
          onDelete={onDelete}
        />
      </View>
    </Card>
  );
}
