"use client";

/**
 * The add/edit expense form (ticket 16, re-modelled by ticket 85).
 *
 * There used to be a split-type picker — even / exact / percentage / shares —
 * answered on every single expense before you could say who was in it. There
 * is one model now: everyone in the cost holds **shares** of it, and anyone
 * whose number is fixed can be **pinned** to an amount instead, with the rest
 * spreading over whoever is still on shares. Even is everyone on one share;
 * "exact amounts" is everyone pinned. Nothing is unrepresentable that was
 * representable before, and the common case asks nothing.
 *
 * Excluding someone is a tap, not a sum: the row toggles out and stops being a
 * participant entirely (that's ticket 85's direction A, kept). Setting a person
 * to zero was the old way to do it and read as "owes nothing" rather than
 * "wasn't there".
 *
 * The amounts down the right are a live readout only — `resolveWeightedSplit`
 * plus `computeSplits` on the server are the source of truth, and their error
 * strings are shown verbatim on failure. The arithmetic here deliberately
 * mirrors theirs, remainder pennies included, so the preview doesn't disagree
 * with what gets saved.
 */
import { useActionState, useEffect, useMemo, useRef, useState } from "react";

import type { ActionState } from "@/app/trip/[id]/money/actions";
import { CURRENCY_SYMBOLS, formatMoney } from "@/lib/money";
import type { Currency, SplitType } from "@/db/schema";
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
import { SubmitButton, useSheetClose } from "@/components/client-ui";

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

/** One person's row: in or out, how many shares, and a pin if they have one. */
type Row = { shares: number; pin: string };

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
  // The sheet around this form is told to stay open on submit, so that a
  // refused split ("the pinned amounts come to more than the total") is still
  // on screen to read. Closing it is this form's job, once the save lands.
  const sheetClose = useSheetClose();
  const done = onDone ?? sheetClose ?? undefined;

  // Close the sheet once a submission comes *back* with no error. Keyed on the
  // state object changing identity, not on its contents: `onDone` is a fresh
  // closure from the sheet on every render, so a contents-only check re-fired
  // this effect mid-submission and slammed the sheet shut while the action was
  // still running — losing the error it was about to report.
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
  const [checked, setChecked] = useState<Set<string>>(
    new Set(expense ? expense.splits.map((s) => s.userId) : members.map((m) => m.userId)),
  );

  /*
   * Reopening an expense that predates the one model: an even or shares split
   * comes back as shares, and anything the old picker could express only as
   * fixed numbers — exact amounts, percentages of a total — comes back pinned.
   * Editing then works the same way for old rows as for new ones.
   */
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
    return Number.isFinite(n) ? Math.round(n * 100) : 0;
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

  const preview = useMemo(
    () => previewSplit(amountMinor, participants.map((p) => ({ userId: p.userId, ...row(p.userId) }))),
    // `rows`/`checked` are what `row`/`participants` are derived from.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [amountMinor, rows, checked, members],
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
            <Select
              name="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
            >
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

        <Field
          label="Split between"
          hint="Everyone's in, on one share each."
        >
          <Stack gap={2}>
            {members.map((m) => {
              const isIn = checked.has(m.userId);
              const r = row(m.userId);
              const isPinned = r.pin.trim() !== "";
              return (
                <div
                  key={m.userId}
                  className={cx(
                    "flex flex-wrap items-center gap-2 rounded-sm border px-2 py-1.5",
                    isIn ? "border-rule-strong bg-sheet" : "border-dashed border-rule",
                  )}
                >
                  {/* In or out is the first thing on the row, and says which it
                      is in a word — not by colour, and not by a zero in a box. */}
                  <Button
                    type="button"
                    variant="ghost"
                    aria-pressed={isIn}
                    onClick={() => toggle(m.userId)}
                    className="!gap-1 !px-1.5 !py-0.5"
                    title={isIn ? `Take ${m.name} out of this cost` : `Put ${m.name} in`}
                  >
                    <span aria-hidden>{isIn ? "✓" : "+"}</span>
                    {isIn ? "In" : "Out"}
                  </Button>
                  <span
                    className={cx(
                      "flex-1 text-sm",
                      isIn ? undefined : "text-ink-faint line-through",
                    )}
                  >
                    {m.name}
                  </span>

                  {isIn ? (
                    <>
                      {isPinned ? (
                        <Badge tone="marine">Pinned</Badge>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            className="!px-1.5 !py-0.5"
                            aria-label={`Fewer shares for ${m.name}`}
                            onClick={() =>
                              setRow(m.userId, { shares: Math.max(0, r.shares - 1) })
                            }
                          >
                            −
                          </Button>
                          <span className="nums w-14 text-center text-xs text-ink-soft">
                            {r.shares} {r.shares === 1 ? "share" : "shares"}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            className="!px-1.5 !py-0.5"
                            aria-label={`More shares for ${m.name}`}
                            onClick={() => setRow(m.userId, { shares: r.shares + 1 })}
                          >
                            +
                          </Button>
                        </span>
                      )}
                      <Input
                        name={`pin_${m.userId}`}
                        value={r.pin}
                        onChange={(e) => setRow(m.userId, { pin: e.target.value })}
                        placeholder="pin £"
                        aria-label={`Pin an exact amount for ${m.name}`}
                        className="!w-24"
                        inputMode="decimal"
                      />
                      <span className="nums w-20 text-right text-sm">
                        {formatMoney(preview.amounts[m.userId] ?? 0, currency)}
                      </span>
                      <input type="hidden" name="participant" value={m.userId} />
                      <input type="hidden" name={`shares_${m.userId}`} value={r.shares} />
                    </>
                  ) : (
                    <span className="text-xs text-ink-faint">Not in this cost</span>
                  )}
                </div>
              );
            })}
          </Stack>
        </Field>

        {/* One line saying whether the money is all accounted for. It's the
            same question the server asks; getting it wrong here is a nudge,
            not a block — the action is what refuses. */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-dotted border-rule-strong pt-2 text-sm text-ink-soft">
          <span>
            {participants.length === 0
              ? "Nobody's in this cost yet."
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

        <Field label="Notes (optional)">
          <Textarea name="notes" defaultValue={expense?.notes ?? ""} />
        </Field>

        <ErrorText>{state.error}</ErrorText>

        <div className="flex justify-end gap-2">
          {done ? (
            <Button type="button" variant="ghost" onClick={done}>
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

/**
 * What each person ends up owing, for the readout only. Mirrors
 * `resolveWeightedSplit` + `computeSplits`: pins come off the top, the rest
 * spreads by shares, and the odd penny goes to the largest fractional parts.
 */
function previewSplit(
  amountMinor: number,
  rows: { userId: string; shares: number; pin: string }[],
): {
  amounts: Record<string, number>;
  allocated: number;
  leftover: number;
  /** Set only when this is the plain even case, so the readout can say it. */
  evenEach: number | null;
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
