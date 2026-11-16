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

function Plain({
  value,
  onChangeText,
  accessibilityLabel,
  numeric,
  big,
  autoFocus,
}: {
  value: string;
  onChangeText: (value: string) => void;
  accessibilityLabel: string;
  autoFocus?: boolean;
  numeric?: boolean;
  big?: boolean;
}) {
  const { c } = useTheme();
  return (
    <TextInput
      accessibilityLabel={accessibilityLabel}
      value={value}
      onChangeText={onChangeText}
      autoFocus={autoFocus}
      keyboardType={numeric ? "decimal-pad" : "default"}
      inputMode={numeric ? "decimal" : "text"}
      style={{
        flex: 1,
        minWidth: 0,
        color: c.ink,
        fontFamily: numeric ? fonts.type : fonts.sans,
        fontSize: big ? size.display : size.body,
        textAlign: numeric ? "right" : "left",
        backgroundColor: c.sheet,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: c["rule-2"] ?? c.rule,
        borderRadius: radius.sm,
        paddingVertical: space.sm,
        paddingHorizontal: space.md,
      }}
    />
  );
}

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
          <Asked label={`Amount (${f.currency})`} first>
            <Plain
              accessibilityLabel="Amount"
              value={f.amount}
              onChangeText={f.setAmount}
              numeric
              big
              autoFocus={!initial}
            />
          </Asked>
          <Asked label="Description">
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
              />
            </View>
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
