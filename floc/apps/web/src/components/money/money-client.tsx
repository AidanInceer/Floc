"use client";

// Client bits of the money tab (money overhaul): the display-only currency
// convert toggle, and the settle-up form pre-filled from a simplified transfer.
import { useActionState, useEffect, useRef, useState } from "react";

import type { ActionState } from "@/app/trip/[id]/money/actions";
import type { Currency } from "@/db/schema";
import {
  convertMinor,
  formatMoney,
  formatTicker,
  sanitizeAmountInput,
  toMajorInput,
} from "@floc/core/money/money";
import { CURRENCIES } from "@floc/core/money/currency";
import {
  Button,
  ErrorText,
  Field,
  Input,
  Select,
  Stack,
} from "@/components/system/ui";
import { SubmitButton, useSheetClose } from "@/components/system/client-ui";

function SwapGlyph() {
  return (
    <svg
      width={13}
      height={13}
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2 4.5h8L8.4 2.9M12 9.5H4l1.6 1.6" />
    </svg>
  );
}

/**
 * Shows an amount in its ledger currency; if the viewer's home currency
 * differs and a rate is available, a swap glyph flips the display to home
 * (money overhaul). Display only — the stored amount never changes. Absent a
 * rate, the glyph doesn't render and only the real amount shows (rule 11).
 */
export function ConvertAmount({
  amountMinor,
  currency,
  home,
  rate,
  className,
}: {
  amountMinor: number;
  currency: Currency;
  home: Currency;
  /** Home-per-unit multiplier, or null when unavailable. */
  rate: number | null;
  className?: string;
}) {
  const [showHome, setShowHome] = useState(false);
  const canConvert = rate !== null && home !== currency;

  if (!canConvert) {
    return (
      <span className={className}>{formatMoney(amountMinor, currency)}</span>
    );
  }

  const homeMinor = convertMinor(amountMinor, currency, home, rate as number);

  return (
    <button
      type="button"
      onClick={() => setShowHome((v) => !v)}
      className={className}
      title={showHome ? "Show recorded amount" : `Show in ${home}`}
      style={{ display: "inline-flex", alignItems: "center", gap: "0.35em" }}
    >
      <span className="text-ink-faint transition-transform hover:text-pen">
        <SwapGlyph />
      </span>
      <span
        key={showHome ? "home" : "orig"}
        style={{ animation: "fadeSwap .18s ease" }}
      >
        {formatTicker(
          showHome ? homeMinor : amountMinor,
          showHome ? home : currency,
        )}
      </span>
      <style>{`@keyframes fadeSwap{from{opacity:.3}to{opacity:1}}`}</style>
    </button>
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
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(action, {});
  const submitted = useRef(false);
  const sheetClose = useSheetClose();
  const seen = useRef(state);
  useEffect(() => {
    if (state === seen.current) return;
    seen.current = state;
    if (submitted.current && !state.error) sheetClose?.();
  }, [state, sheetClose]);

  const [amount, setAmount] = useState(toMajorInput(amountMinor, currency));
  // Paying in a currency other than the debt (ticket 253). The server fetches
  // the rate itself — a client-posted rate would be a client-posted balance.
  const [payCurrency, setPayCurrency] = useState<Currency>(currency);
  const [payAmount, setPayAmount] = useState("");

  return (
    <form
      action={(formData) => {
        submitted.current = true;
        return formAction(formData);
      }}
    >
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

        <Field label={`Amount (${currency})`}>
          <Input
            name="amount"
            inputMode="decimal"
            value={amount}
            onChange={(e) =>
              setAmount(sanitizeAmountInput(e.target.value, currency))
            }
            required
          />
        </Field>

        <Field label="Paid in">
          <Select
            name="payCurrency"
            value={payCurrency}
            onChange={(e) => setPayCurrency(e.target.value as Currency)}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
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
                onChange={(e) =>
                  setPayAmount(sanitizeAmountInput(e.target.value, payCurrency))
                }
              />
            </Field>
          </>
        ) : null}

        <ErrorText>{state.error}</ErrorText>

        <div className="flex justify-end gap-2">
          {sheetClose ? (
            <Button type="button" variant="ghost" onClick={sheetClose}>
              Cancel
            </Button>
          ) : null}
          <SubmitButton pendingLabel="Recording…">Record payment</SubmitButton>
        </div>
      </Stack>
    </form>
  );
}
