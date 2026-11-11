"use client";

import { useId, useState } from "react";

import { BillingAction } from "@/components/auth/billing-buttons";
import { CheckIcon, MinusIcon } from "@/components/system/icons";
import { cx, segmentTrack } from "@/components/system/ui";
import type { BillingInterval } from "@floc/core/billing/plans";
import type { Currency } from "@floc/core/money/currency";
import { formatMoney } from "@floc/core/money/money";

type Price = { interval: BillingInterval; amountMinor: number; currency: Currency };

const ROWS: { what: string; free: boolean }[] = [
  { what: "Plan trips, dates, days and money", free: true },
  { what: "The forecast on your trip dates", free: false },
  { what: "A packing list filled in for you", free: false },
  { what: "Searches with your place and dates in", free: false },
];

const PERIODS: Record<BillingInterval, { word: string; per: string }> = {
  monthly: { word: "Month", per: "a month" },
  quarterly: { word: "3 months", per: "every 3 months" },
  yearly: { word: "Year", per: "a year" },
};

// Why: the Pro column fits three periods side by side from sm (#523).
const GRID = "grid grid-cols-[minmax(0,1fr)_3.6rem_8.4rem] items-center text-[13px] sm:grid-cols-[minmax(0,1fr)_7rem_13rem] sm:text-sm";
const CONSENT_LABEL = "Start Pro straight away. I understand I lose my 14-day right to cancel once it starts.";
const proCell = "self-stretch bg-sheet-2";

function Mark({ on }: { on: boolean }) {
  return (
    <span className="flex h-full items-center justify-center">
      {on ? <CheckIcon /> : <MinusIcon className="text-ink-faint" />}
      <span className="sr-only">{on ? "Yes" : "No"}</span>
    </span>
  );
}

/** Why: Free beside Pro, so what Pro adds is read before its price; one Get Pro for the period picked (#250's two price buttons read as unclear). */
export function ProCompare({ prices }: { prices: Price[] }) {
  const [picked, setPicked] = useState<BillingInterval>(prices.some((p) => p.interval === "yearly") ? "yearly" : "monthly");
  const price = prices.find((p) => p.interval === picked);
  // Why: CCR 2013 reg 37 — the checkout refuses a start without this tick (#523).
  const [consent, setConsent] = useState(false);
  const consentId = useId();

  return (
    <div role="table" aria-label="Free and Pro">
      <div role="row" className={cx(GRID, "items-end")}>
        <span role="columnheader" />
        <span role="columnheader" className="flex flex-col items-center gap-1 pb-2.5 text-center">
          <b className="text-[15px]">Free</b>
          <span className="whitespace-nowrap rounded-full bg-pen-soft px-2 text-xs font-medium text-pen-deep">Your plan</span>
        </span>
        <span role="columnheader" className={cx(proCell, "flex flex-col items-center justify-end gap-1 rounded-t-sm px-2.5 pb-2.5 pt-2.5 text-center")}>
          <b className="text-[15px]">Pro</b>
          {price ? (
            <span className="whitespace-nowrap">
              <span className="nums text-[13px]">{formatMoney(price.amountMinor, price.currency)}</span>{" "}
              <span className="text-[13px] text-ink-soft">{PERIODS[picked].per}</span>
            </span>
          ) : (
            <span aria-hidden className="h-[18px]" />
          )}
        </span>
      </div>
      {ROWS.map((r) => (
        <div key={r.what} role="row" className={cx(GRID, "min-h-11 border-t border-rule")}>
          <span role="rowheader">{r.what}</span>
          <span role="cell" className="h-full"><Mark on={r.free} /></span>
          <span role="cell" className={proCell}><Mark on /></span>
        </div>
      ))}
      <div className="grid gap-x-0 gap-y-2 border-t border-rule pt-3.5 sm:grid-cols-[minmax(0,1fr)_13rem]">
        <div className="flex flex-col gap-2 max-sm:order-2 sm:pr-4">
          <label htmlFor={consentId} className="flex cursor-pointer items-start gap-2 text-xs text-ink-soft">
            <input id={consentId} type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 accent-ink" />
            <span>{CONSENT_LABEL}</span>
          </label>
          <p className="text-xs text-ink-faint">Pro is yours alone. The trip stays free for everyone on it.</p>
        </div>
        {/* Why: with no price to quote (a Stripe read failed), Pro is still on sale; the checkout says what went wrong. */}
        <div className="flex items-center justify-between gap-2 rounded-sm bg-sheet-2 p-2.5 sm:flex-col sm:rounded-t-none sm:pb-3">
            {prices.length > 1 ? (
              <div role="group" aria-label="Billing period" className={cx(segmentTrack, "flex gap-0.5")}>
                {prices.map((p) => (
                  <button
                    key={p.interval}
                    type="button"
                    aria-pressed={p.interval === picked}
                    onClick={() => setPicked(p.interval)}
                    className="h-7 whitespace-nowrap rounded-sm px-2 text-[13px] font-medium text-ink-soft transition-colors duration-220 ease-(--ease) hover:text-pen-deep aria-pressed:bg-pen-soft aria-pressed:text-pen-deep"
                  >
                    {PERIODS[p.interval].word}
                  </button>
                ))}
              </div>
            ) : null}
            <BillingAction
              path="/api/billing/checkout"
              body={{ interval: picked, consent: consent ? "yes" : "no" }}
              disabled={!consent}
              className="lift inline-flex h-9 w-full items-center justify-center rounded-sm bg-pro-mark px-4 text-sm font-semibold text-pro disabled:opacity-70 max-sm:w-auto"
            >
              Get Pro
            </BillingAction>
        </div>
      </div>
    </div>
  );
}
