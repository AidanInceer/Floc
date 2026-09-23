"use client";

// Recording a settlement, and correcting one (#361). Both post the same fields
// to actions that share one set of rules.
import { useActionState, useEffect, useRef, useState } from "react";

import type { ActionState } from "@/app/trip/[id]/money/actions";
import type { Currency } from "@/db/schema";
import { sanitizeAmountInput, toMajorInput } from "@floc/core/money/money";
import { CURRENCIES } from "@floc/core/money/currency";
import { Button, ErrorText, Field, Input, Select, Stack } from "@/components/system/ui";
import { SubmitButton, useSheetClose } from "@/components/system/client-ui";

type SettlementAction = (prev: ActionState, formData: FormData) => Promise<ActionState>;

function useSheetForm(action: SettlementAction) {
  const [state, formAction] = useActionState<ActionState, FormData>(action, {});
  const submitted = useRef(false);
  const sheetClose = useSheetClose();
  const seen = useRef(state);
  useEffect(() => {
    if (state === seen.current) return;
    seen.current = state;
    if (submitted.current && !state.error) sheetClose?.();
  }, [state, sheetClose]);

  const submit = (formData: FormData) => {
    submitted.current = true;
    return formAction(formData);
  };
  return { state, submit, sheetClose };
}

function CurrencyOptions() {
  return CURRENCIES.map((c) => (
    <option key={c} value={c}>
      {c}
    </option>
  ));
}

/** Paying in a currency other than the debt (ticket 253). The server fetches the rate itself — a client-posted rate would be a client-posted balance. */
function PaidIn({ currency, initial }: { currency: Currency; initial: Currency }) {
  const [payCurrency, setPayCurrency] = useState<Currency>(initial);
  const [payAmount, setPayAmount] = useState("");

  return (
    <>
      <Field label="Paid in">
        <Select
          name="payCurrency"
          value={payCurrency}
          onChange={(e) => setPayCurrency(e.target.value as Currency)}
        >
          <CurrencyOptions />
        </Select>
      </Field>

      {payCurrency !== currency ? (
        <>
          <p className="text-sm text-ink-soft">
            The debt stays {currency}. Floc converts at the day&rsquo;s
            published rate and keeps that rate on this payment forever.
          </p>
          <Field
            label={`What you handed over (${payCurrency}) — only if no rate is available`}
          >
            <Input
              name="payAmount"
              inputMode="decimal"
              value={payAmount}
              onChange={(e) => setPayAmount(sanitizeAmountInput(e.target.value, payCurrency))}
            />
          </Field>
        </>
      ) : null}
    </>
  );
}

function AmountField({ currency, amountMinor }: { currency: Currency; amountMinor: number }) {
  const [amount, setAmount] = useState(() => toMajorInput(amountMinor, currency));
  return (
    <Field label={`Amount (${currency})`}>
      <Input
        name="amount"
        inputMode="decimal"
        value={amount}
        onChange={(e) => setAmount(sanitizeAmountInput(e.target.value, currency))}
        required
      />
    </Field>
  );
}

function Actions({ sheetClose, label, pendingLabel }: { sheetClose: (() => void) | null; label: string; pendingLabel: string }) {
  return (
    <div className="flex justify-end gap-2">
      {sheetClose ? (
        <Button type="button" variant="ghost" onClick={sheetClose}>
          Cancel
        </Button>
      ) : null}
      <SubmitButton pendingLabel={pendingLabel}>{label}</SubmitButton>
    </div>
  );
}

/**
 * Settle-up form, pre-filled from a simplified transfer (money overhaul). The
 * amount is editable; from/to are fixed to the suggested pair. Server refuses
 * if the viewer isn't a party to it.
 */
export function SettleUpForm({
  tripId,
  fromUserId,
  toUserId,
  fromName,
  toName,
  currency,
  amountMinor,
  action,
}: {
  tripId: number;
  fromUserId: string;
  toUserId: string;
  fromName: string;
  toName: string;
  currency: Currency;
  amountMinor: number;
  action: SettlementAction;
}) {
  const { state, submit, sheetClose } = useSheetForm(action);

  return (
    <form action={submit}>
      <input type="hidden" name="tripId" value={tripId} />
      <input type="hidden" name="fromUserId" value={fromUserId} />
      <input type="hidden" name="toUserId" value={toUserId} />
      <input type="hidden" name="currency" value={currency} />

      <Stack gap={4}>
        <p className="text-sm text-ink-soft">
          Records that <span className="font-medium text-ink">{fromName}</span>{" "}
          paid <span className="font-medium text-ink">{toName}</span> in cash.
          It updates the balances and can be undone later.
        </p>
        <AmountField currency={currency} amountMinor={amountMinor} />
        <PaidIn currency={currency} initial={currency} />
        <ErrorText>{state.error}</ErrorText>
        <Actions sheetClose={sheetClose} label="Record payment" pendingLabel="Recording…" />
      </Stack>
    </form>
  );
}

export type EditableSettlement = {
  id: number;
  fromUserId: string;
  toUserId: string;
  /** The debt side — what the payment cleared. */
  amountMinor: number;
  currency: Currency;
  payCurrency: Currency;
};

/** Corrects a recorded settlement in place (#361): who paid whom, how much, in what. */
export function SettlementEditForm({
  tripId,
  settlement: s,
  people,
  action,
}: {
  tripId: number;
  settlement: EditableSettlement;
  people: { id: string; name: string }[];
  action: SettlementAction;
}) {
  const { state, submit, sheetClose } = useSheetForm(action);
  const [currency, setCurrency] = useState<Currency>(s.currency);
  const person = (name: string, value: string, label: string) => (
    <Field label={label}>
      <Select name={name} defaultValue={value}>
        {people.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </Select>
    </Field>
  );

  return (
    <form action={submit}>
      <input type="hidden" name="tripId" value={tripId} />
      <input type="hidden" name="settlementId" value={s.id} />

      <Stack gap={4}>
        <div className="grid grid-cols-2 gap-3">
          {person("fromUserId", s.fromUserId, "Paid by")}
          {person("toUserId", s.toUserId, "Paid to")}
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <AmountField currency={currency} amountMinor={s.amountMinor} />
          <Field label="Owed in">
            <Select
              name="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
            >
              <CurrencyOptions />
            </Select>
          </Field>
        </div>
        <PaidIn currency={currency} initial={s.payCurrency} />
        <ErrorText>{state.error}</ErrorText>
        <Actions sheetClose={sheetClose} label="Save" pendingLabel="Saving…" />
      </Stack>
    </form>
  );
}
