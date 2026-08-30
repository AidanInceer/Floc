"use client";

// Add/edit expense form (ticket 16, re-modelled by ticket 85). One model:
// everyone holds shares of the cost, anyone can be pinned to a fixed amount
// instead, the rest spread over remaining shares. Excluding someone removes
// them as a participant entirely (direction A) rather than pinning to zero.
// The readout mirrors resolveWeightedSplit + computeSplits (remainder pennies
// included) so it doesn't disagree with what the server actually saves.
import { useActionState, useEffect, useMemo, useRef, useState } from "react";

import type { ActionState } from "@/app/trip/[id]/money/actions";
import { CURRENCY_SYMBOLS, formatMoney, MAX_EXPENSE_MINOR } from "@/lib/money";
import type { Currency, SplitType } from "@/db/schema";
import {
  CATEGORY_LABELS,
  DEFAULT_CATEGORY,
  EXPENSE_CATEGORIES,
} from "@/lib/expense-category";
import type { ExpenseCategory } from "@/lib/expense-category";
import { CategoryIcon } from "@/components/category-icon";
import {
  Badge,
  Button,
  ErrorText,
  Field,
  Input,
  Select,
  Stack,
  Textarea,
  cx,
} from "@/components/ui";
import { PillToggle, SubmitButton, useSheetClose } from "@/components/client-ui";

export type FormMember = { userId: string; name: string };
export type FormDay = { id: number; date: string; label: string };

export type ExistingExpense = {
  id: number;
  description: string;
  amountMinor: number;
  currency: Currency;
  splitType: SplitType;
  category: ExpenseCategory;
  paidBy: string;
  dayId: number | null;
  notes: string | null;
  splits: { userId: string; owedAmountMinor: number }[];
};

type Row = { shares: number; pin: string };
type SplitMode = "equally" | "exact" | "shares";
const SPLIT_MODES: { key: SplitMode; label: string }[] = [
  { key: "equally", label: "Equally" },
  { key: "exact", label: "Exact" },
  { key: "shares", label: "Shares" },
];

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
  // Sheet stays open on submit so a refused split is still readable; this form
  // closes it once the save lands.
  const sheetClose = useSheetClose();
  const done = onDone ?? sheetClose ?? undefined;

  // Keyed on state identity not contents: onDone is a fresh closure every
  // render, so a contents-only check re-fired this mid-submission and closed
  // the sheet before the error came back.
  const seen = useRef(state);
  useEffect(() => {
    if (state === seen.current) return;
    seen.current = state;
    if (submitted.current && !state.error) done?.();
  }, [state, done]);

  const [amount, setAmount] = useState(
    expense ? (expense.amountMinor / 100).toFixed(2) : "",
  );
  const [currency, setCurrency] = useState<Currency>(
    expense?.currency ?? homeCurrency,
  );
  const [category, setCategory] = useState<ExpenseCategory>(
    expense?.category ?? DEFAULT_CATEGORY,
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [mode, setMode] = useState<SplitMode>(
    expense?.splitType === "exact" || expense?.splitType === "percentage"
      ? "exact"
      : "equally",
  );
  const [checked, setChecked] = useState<Set<string>>(
    new Set(expense ? expense.splits.map((s) => s.userId) : members.map((m) => m.userId)),
  );

  // Pre-one-model expenses: even/shares comes back as shares, exact/percentage
  // comes back pinned.
  const [rows, setRows] = useState<Record<string, Row>>(() => {
    const pinned = expense?.splitType === "exact" || expense?.splitType === "percentage";
    const initial: Record<string, Row> = {};
    for (const m of members) {
      const split = expense?.splits.find((s) => s.userId === m.userId);
      initial[m.userId] = {
        shares: 1,
        pin: pinned && split ? (split.owedAmountMinor / 100).toFixed(2) : "",
      };
    }
    return initial;
  });

  const amountMinor = useMemo(() => {
    const n = Number(amount.replace(/[£€$,\s]/g, ""));
    if (!Number.isFinite(n)) return 0;
    // Clamp so a pasted 20-digit number can't blow up the readout; the action
    // is still the gate that refuses it.
    return Math.max(0, Math.min(Math.round(n * 100), MAX_EXPENSE_MINOR));
  }, [amount]);

  const participants = members.filter((m) => checked.has(m.userId));
  const row = (userId: string) => rows[userId] ?? { shares: 1, pin: "" };

  function toggle(userId: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  function setRow(userId: string, patch: Partial<Row>) {
    setRows((prev) => ({ ...prev, [userId]: { ...row(userId), ...patch } }));
  }

  // What each row contributes depends on the mode: exact uses the pin, shares
  // uses the stepper, equally is one share each with no pins.
  const rowFor = (userId: string): { userId: string; shares: number; pin: string } => {
    const r = row(userId);
    if (mode === "exact") return { userId, shares: 1, pin: r.pin };
    if (mode === "shares") return { userId, shares: r.shares, pin: "" };
    return { userId, shares: 1, pin: "" };
  };

  const preview = useMemo(
    () => previewSplit(amountMinor, participants.map((p) => rowFor(p.userId))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [amountMinor, rows, checked, members, mode],
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

      <input type="hidden" name="category" value={category} />

      <Stack gap={3}>
        <Field label="Description">
          <div className="flex items-stretch gap-2">
            <div className="relative flex-none">
              <button
                type="button"
                onClick={() => setPickerOpen((o) => !o)}
                aria-label={`Category: ${CATEGORY_LABELS[category]}`}
                aria-expanded={pickerOpen}
                title={`Category: ${CATEGORY_LABELS[category]}`}
                className="flex h-full w-10 items-center justify-center rounded-md border border-pen-edge bg-pen-soft text-pen transition-colors hover:text-pen-deep"
              >
                <CategoryIcon category={category} />
              </button>
              {pickerOpen ? (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setPickerOpen(false)}
                    aria-hidden
                  />
                  <div
                    aria-label="Choose a category"
                    className="absolute left-0 top-full z-30 mt-1 grid w-max grid-cols-4 gap-1.5 rounded-md border border-rule bg-sheet p-2 shadow-lg"
                  >
                    {EXPENSE_CATEGORIES.map((c) => {
                      const on = c === category;
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            setCategory(c);
                            setPickerOpen(false);
                          }}
                          aria-pressed={on}
                          title={CATEGORY_LABELS[c]}
                          className={cx(
                            "flex h-9 w-9 items-center justify-center rounded-md border transition-colors",
                            on
                              ? "border-pen-edge bg-pen-soft text-pen-deep"
                              : "border-rule bg-sheet-2 text-ink-soft hover:text-ink",
                          )}
                        >
                          <CategoryIcon category={c} />
                          <span className="sr-only">{CATEGORY_LABELS[c]}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : null}
            </div>
            <Input
              name="description"
              defaultValue={expense?.description}
              placeholder="Expense description"
              className="flex-1"
              required
            />
          </div>
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Amount" className="col-span-2">
            {/* Currency rides inside the amount as a compact ticker, not a
                second full-width control (mockup). */}
            <div className="flex items-stretch overflow-hidden rounded-md border border-rule-strong bg-sheet focus-within:border-pen">
              <div className="relative flex items-center border-r border-rule bg-sheet-2 pl-2.5 pr-1 font-mono text-sm text-ink-soft">
                {currency}
                <select
                  name="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as Currency)}
                  aria-label="Currency"
                  className="absolute inset-0 cursor-pointer opacity-0"
                >
                  {Object.keys(CURRENCY_SYMBOLS).map((c) => (
                    <option key={c} value={c}>
                      {c} ({CURRENCY_SYMBOLS[c as Currency]})
                    </option>
                  ))}
                </select>
                <svg
                  width={11}
                  height={11}
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="ml-1 text-ink-faint"
                  aria-hidden
                >
                  <path d="M3.5 5.2L7 8.7l3.5-3.5" />
                </svg>
              </div>
              <input
                name="amount"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(sanitizeAmount(e.target.value))}
                placeholder="0.00"
                maxLength={12}
                required
                className="w-full min-w-0 bg-sheet px-2.5 py-1.5 text-right font-mono text-sm text-ink placeholder:text-ink-faint focus:outline-none"
              />
            </div>
          </Field>
          <Field label="Which day">
            <Select name="dayId" defaultValue={expense?.dayId ?? days[0]?.id ?? ""}>
              <option value="">—</option>
              {days.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Paid by">
          <Select name="paidBy" defaultValue={expense?.paidBy ?? viewerId}>
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Split between">
          <Stack gap={3}>
            <PillToggle
              label="How to split"
              value={mode}
              onChange={setMode}
              options={SPLIT_MODES.map((sm) => ({ value: sm.key, label: sm.label }))}
            />

            <div className="flex flex-col">
              {members.map((m) => {
                const isIn = checked.has(m.userId);
                const r = row(m.userId);
                return (
                  <div
                    key={m.userId}
                    // Fixed height so switching mode (stepper vs input vs text,
                    // each a different height) doesn't resize the modal.
                    className="flex h-11 items-center gap-2.5 border-b border-rule last:border-b-0"
                  >
                    <button
                      type="button"
                      onClick={() => toggle(m.userId)}
                      aria-pressed={isIn}
                      title={isIn ? `Take ${m.name} out` : `Put ${m.name} in`}
                      className={cx(
                        "flex h-[18px] w-[18px] flex-none items-center justify-center rounded-[5px] border transition-colors",
                        isIn
                          ? "border-pen bg-pen text-white"
                          : "border-rule-strong bg-sheet",
                      )}
                    >
                      {isIn ? (
                        <svg
                          width={11}
                          height={11}
                          viewBox="0 0 14 14"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.6}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden
                        >
                          <path d="M3 7.3l2.6 2.6L11 4.4" />
                        </svg>
                      ) : null}
                    </button>
                    <span
                      className={cx(
                        "flex-1 truncate text-sm",
                        isIn ? undefined : "text-ink-faint",
                      )}
                    >
                      {m.name}
                    </span>

                    {isIn ? (
                      <>
                        {mode === "shares" ? (
                          <span className="flex items-center overflow-hidden rounded-md border border-rule-strong">
                            <button
                              type="button"
                              onClick={() =>
                                setRow(m.userId, { shares: Math.max(0, r.shares - 1) })
                              }
                              aria-label={`Fewer shares for ${m.name}`}
                              className="flex h-7 w-7 items-center justify-center bg-sheet-2 text-ink-soft hover:text-ink"
                            >
                              −
                            </button>
                            <span className="nums w-7 text-center text-sm">{r.shares}</span>
                            <button
                              type="button"
                              onClick={() => setRow(m.userId, { shares: r.shares + 1 })}
                              aria-label={`More shares for ${m.name}`}
                              className="flex h-7 w-7 items-center justify-center bg-sheet-2 text-ink-soft hover:text-ink"
                            >
                              +
                            </button>
                          </span>
                        ) : null}

                        {mode === "exact" ? (
                          <Input
                            name={`pin_${m.userId}`}
                            value={r.pin}
                            onChange={(e) =>
                              setRow(m.userId, { pin: sanitizeAmount(e.target.value) })
                            }
                            placeholder="0.00"
                            aria-label={`Amount for ${m.name}`}
                            className="!w-20 text-right"
                            inputMode="decimal"
                            maxLength={12}
                          />
                        ) : (
                          <span
                            // Box mirrors the exact-mode Input (border, px-2.5,
                            // py-1.5) so the digits don't shift between modes.
                            className="nums w-20 border border-transparent px-2.5 py-1.5 text-right text-sm text-ink-soft"
                          >
                            {formatMoney(preview.amounts[m.userId] ?? 0, currency)}
                          </span>
                        )}

                        <input type="hidden" name="participant" value={m.userId} />
                        <input
                          type="hidden"
                          name={`shares_${m.userId}`}
                          value={mode === "shares" ? r.shares : 1}
                        />
                        {mode !== "exact" ? (
                          <input type="hidden" name={`pin_${m.userId}`} value="" />
                        ) : null}
                      </>
                    ) : (
                      <span className="text-xs text-ink-faint">Not in</span>
                    )}
                  </div>
                );
              })}
            </div>
          </Stack>
        </Field>

        {/* Nudge only — the action, not this readout, is what refuses. */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-rule pt-3 text-sm text-ink-soft">
          <span>
            {participants.length === 0
              ? "Nobody's in this expense yet."
              : preview.evenEach !== null
                ? `${formatMoney(preview.evenEach, currency)} each · ${participants.length} of ${members.length} in`
                : `${formatMoney(preview.allocated, currency)} of ${formatMoney(amountMinor, currency)} allocated`}
          </span>
          {preview.leftover > 0 ? (
            <Badge tone="open">{formatMoney(preview.leftover, currency)} left</Badge>
          ) : preview.leftover < 0 ? (
            <Badge tone="action">
              {formatMoney(-preview.leftover, currency)} over
            </Badge>
          ) : null}
        </div>

        <Field label="Notes">
          <Textarea
            name="notes"
            defaultValue={expense?.notes ?? ""}
            rows={2}
            className="!min-h-0"
          />
        </Field>

        <ErrorText>{state.error}</ErrorText>

        <div className="flex justify-end gap-2">
          {done ? (
            <Button type="button" variant="ghost" onClick={done}>
              Cancel
            </Button>
          ) : null}
          <SubmitButton pendingLabel="Saving…">
            {expense ? "Save changes" : "Add expense"}
          </SubmitButton>
        </div>
      </Stack>
    </form>
  );
}

// Readout only, mirrors resolveWeightedSplit + computeSplits: pins come off
// the top, the rest spreads by shares, odd penny to the largest fractions.
// Keeps a money box to digits and a single decimal point — no minus sign, no
// letters. The server still validates; this just stops nonsense being typed.
function sanitizeAmount(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, "");
  const [whole, ...rest] = cleaned.split(".");
  return rest.length ? `${whole}.${rest.join("").slice(0, 2)}` : whole;
}

function previewSplit(
  amountMinor: number,
  rows: { userId: string; shares: number; pin: string }[],
): {
  amounts: Record<string, number>;
  allocated: number;
  leftover: number;
  evenEach: number | null; // set only in the plain even case
} {
  const amounts: Record<string, number> = {};
  if (rows.length === 0) return { amounts, allocated: 0, leftover: amountMinor, evenEach: null };

  const parsed = rows.map((r) => {
    const pin = r.pin.trim();
    const n = pin === "" ? null : Number(pin.replace(/[£€$,\s]/g, ""));
    return {
      userId: r.userId,
      shares: r.shares,
      pinnedMinor: n === null || !Number.isFinite(n) ? null : Math.round(n * 100),
    };
  });

  const pinnedTotal = parsed.reduce((sum, r) => sum + (r.pinnedMinor ?? 0), 0);
  const remainder = amountMinor - pinnedTotal;
  const unpinned = parsed.filter((r) => r.pinnedMinor === null);
  const shareTotal = unpinned.reduce((sum, r) => sum + r.shares, 0);

  for (const r of parsed) if (r.pinnedMinor !== null) amounts[r.userId] = r.pinnedMinor;

  if (remainder > 0 && shareTotal > 0) {
    const exact = unpinned.map((r) => (remainder * r.shares) / shareTotal);
    const floors = exact.map(Math.floor);
    let pennies = remainder - floors.reduce((a, b) => a + b, 0);
    const order = exact
      .map((value, i) => ({ i, frac: value - floors[i] }))
      .sort((a, b) => b.frac - a.frac || a.i - b.i);
    for (const { i } of order) {
      if (pennies <= 0) break;
      floors[i] += 1;
      pennies -= 1;
    }
    unpinned.forEach((r, i) => {
      amounts[r.userId] = floors[i];
    });
  } else {
    for (const r of unpinned) amounts[r.userId] = 0;
  }

  const allocated = Object.values(amounts).reduce((a, b) => a + b, 0);
  const isEven =
    pinnedTotal === 0 &&
    unpinned.length === parsed.length &&
    parsed.every((r) => r.shares === parsed[0].shares && r.shares > 0);

  return {
    amounts,
    allocated,
    leftover: amountMinor - allocated,
    evenEach: isEven && parsed.length > 0 ? amounts[parsed[0].userId] : null,
  };
}
