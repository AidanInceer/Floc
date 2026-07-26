"use client";

/**
 * The add/edit expense form (ticket 16). Client-side validation is for a
 * good experience only — `computeSplits` in the server action is the source
 * of truth, and its error string is shown verbatim on failure.
 */
import { useActionState, useEffect, useMemo, useRef, useState } from "react";

import type { ActionState } from "@/app/trip/[id]/money/actions";
import { CURRENCY_SYMBOLS } from "@/lib/money";
import type { Currency, SplitType } from "@/db/schema";
import { Button, ErrorText, Field, Input, Select, Stack, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/client-ui";

export type FormMember = { userId: string; name: string };
export type FormDay = { id: number; date: string; label: string };

export type ExistingExpense = {
  id: number;
  description: string;
  amountMinor: number;
  currency: Currency;
  splitType: SplitType;
  paidBy: string;
  dayId: number | null;
  notes: string | null;
  splits: { userId: string; owedAmountMinor: number }[];
};

const SPLIT_LABELS: Record<SplitType, string> = {
  even: "Split evenly",
  exact: "Exact amount each",
  percentage: "Percentage each",
  shares: "Shares",
};

export function ExpenseForm({
  tripId,
  members,
  days,
  homeCurrency,
  viewerId,
  expense,
  action,
  onDone,
}: {
  tripId: number;
  members: FormMember[];
  days: FormDay[];
  homeCurrency: Currency;
  viewerId: string;
  expense?: ExistingExpense;
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  onDone?: () => void;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(action, {});
  const submitted = useRef(false);

  // Close the sheet once a submission comes back with no error — a fresh
  // `{}` on first render must not be mistaken for a successful save.
  useEffect(() => {
    if (submitted.current && !state.error) onDone?.();
  }, [state, onDone]);

  const [amount, setAmount] = useState(
    expense ? (expense.amountMinor / 100).toFixed(2) : "",
  );
  const [splitType, setSplitType] = useState<SplitType>(expense?.splitType ?? "even");
  const [checked, setChecked] = useState<Set<string>>(
    new Set(expense ? expense.splits.map((s) => s.userId) : members.map((m) => m.userId)),
  );
  const [values, setValues] = useState<Record<string, string>>(() => {
    if (!expense) return {};
    if (expense.splitType === "exact") {
      return Object.fromEntries(
        expense.splits.map((s) => [s.userId, (s.owedAmountMinor / 100).toFixed(2)]),
      );
    }
    return {};
  });

  const amountMinor = useMemo(() => {
    const n = Number(amount.replace(/[£€$,\s]/g, ""));
    return Number.isFinite(n) ? Math.round(n * 100) : 0;
  }, [amount]);

  const participants = members.filter((m) => checked.has(m.userId));

  function toggle(userId: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  // Client-side readouts only — the server action re-derives everything.
  const exactAllocated = participants.reduce(
    (sum, p) => sum + Math.round(Number(values[p.userId] ?? "0") * 100 || 0),
    0,
  );
  const exactRemaining = amountMinor - exactAllocated;
  const percentTotal = participants.reduce(
    (sum, p) => sum + (Number(values[p.userId]) || 0),
    0,
  );

  return (
    <form
      action={(formData) => {
        submitted.current = true;
        return formAction(formData);
      }}
    >
      <input type="hidden" name="tripId" value={tripId} />
      {expense ? <input type="hidden" name="expenseId" value={expense.id} /> : null}

      <Stack gap={4}>
        <Field label="Description">
          <Input
            name="description"
            defaultValue={expense?.description}
            placeholder="Airbnb deposit, taxi to the airport…"
            required
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount">
            <Input
              name="amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </Field>
          <Field label="Currency">
            <Select name="currency" defaultValue={expense?.currency ?? homeCurrency}>
              {Object.keys(CURRENCY_SYMBOLS).map((c) => (
                <option key={c} value={c}>
                  {c} ({CURRENCY_SYMBOLS[c as Currency]})
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Paid by">
            <Select name="paidBy" defaultValue={expense?.paidBy ?? viewerId}>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Which day (optional)">
            <Select name="dayId" defaultValue={expense?.dayId ?? ""}>
              <option value="">Not tied to a day</option>
              {days.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Split">
          <Select
            name="splitType"
            value={splitType}
            onChange={(e) => setSplitType(e.target.value as SplitType)}
          >
            {Object.entries(SPLIT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Who's in this cost"
          hint={
            splitType === "exact"
              ? `Remaining to allocate: ${(exactRemaining / 100).toFixed(2)}`
              : splitType === "percentage"
                ? `Total: ${percentTotal}% (must be 100%)`
                : undefined
          }
        >
          <Stack gap={2}>
            {members.map((m) => {
              const isIn = checked.has(m.userId);
              return (
                <div key={m.userId} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`p-${m.userId}`}
                    name="participant"
                    value={m.userId}
                    checked={isIn}
                    onChange={() => toggle(m.userId)}
                    className="size-4 rounded-sm border-rule-strong"
                  />
                  <label htmlFor={`p-${m.userId}`} className="flex-1 text-sm">
                    {m.name}
                  </label>
                  {isIn && splitType !== "even" ? (
                    <Input
                      name={`value_${m.userId}`}
                      value={values[m.userId] ?? ""}
                      onChange={(e) =>
                        setValues((prev) => ({ ...prev, [m.userId]: e.target.value }))
                      }
                      placeholder={
                        splitType === "exact"
                          ? "0.00"
                          : splitType === "percentage"
                            ? "%"
                            : "shares"
                      }
                      className="w-24"
                      inputMode="decimal"
                    />
                  ) : null}
                </div>
              );
            })}
          </Stack>
        </Field>

        <Field label="Notes (optional)">
          <Textarea name="notes" defaultValue={expense?.notes ?? ""} />
        </Field>

        <ErrorText>{state.error}</ErrorText>

        <div className="flex justify-end gap-2">
          {onDone ? (
            <Button type="button" variant="ghost" onClick={onDone}>
              Cancel
            </Button>
          ) : null}
          <SubmitButton pendingLabel="Saving…">
            {expense ? "Save changes" : "Add cost"}
          </SubmitButton>
        </div>
      </Stack>
    </form>
  );
}
