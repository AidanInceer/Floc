"use client";

import { useState } from "react";

import { BillingAction } from "@/components/auth/billing-buttons";
import { CheckIcon, MinusIcon } from "@/components/system/icons";
import { SegmentTrack } from "@/components/system/segment-track";
import { cx, trackSegmentClass } from "@/components/system/ui";
import { proPlans } from "@/lib/landing/pro-plans";
import type { BillingInterval } from "@floc/core/billing/plans";
import { PRO_FEATURES } from "@floc/core/billing/pro-features";
import type { Currency } from "@floc/core/money/currency";
import { formatMoney } from "@floc/core/money/money";

type Price = { interval: BillingInterval; amountMinor: number; currency: Currency };

const ROWS: { what: string; free: boolean }[] = [
  { what: "Plan trips, dates, days and money", free: true },
  ...PRO_FEATURES.map((f) => ({ what: f.name, free: false })),
];

const PERIODS: Record<BillingInterval, { word: string; per: string }> = {
  monthly: { word: "Month", per: "a month" },
  quarterly: { word: "3 months", per: "every 3 months" },
  yearly: { word: "Year", per: "a year" },
};

const GRID = "grid grid-cols-[minmax(0,1fr)_4.25rem_8.4rem] items-center text-[13px] sm:grid-cols-[minmax(0,1fr)_8rem_15rem] sm:text-sm";
const proCell = "self-stretch bg-sheet-2";

function Mark({ on }: { on: boolean }) {
  return (
    <span className="flex h-full items-center justify-center">
      {on ? <CheckIcon /> : <MinusIcon className="text-ink-faint" />}
      <span className="sr-only">{on ? "Yes" : "No"}</span>
    </span>
  );
}

export function ProCompare({ prices }: { prices: Price[] }) {
  const [picked, setPicked] = useState<BillingInterval>(proPlans(prices).initial ?? "monthly");
  const price = prices.find((p) => p.interval === picked);

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
            <span>
              <span className="nums whitespace-nowrap text-[13px] max-sm:block">{formatMoney(price.amountMinor, price.currency)}</span>{" "}
              <span className="whitespace-nowrap text-[13px] text-ink-soft max-sm:block">{PERIODS[picked].per}</span>
            </span>
          ) : (
            <span aria-hidden className="h-[18px]" />
          )}
        </span>
      </div>
      {ROWS.map((r) => (
        <div key={r.what} role="row" className={cx(GRID, "min-h-11 border-t border-rule")}>
          <span role="rowheader" className="text-pretty">{r.what}</span>
          <span role="cell" className="h-full"><Mark on={r.free} /></span>
          <span role="cell" className={proCell}><Mark on /></span>
        </div>
      ))}
      <div className="grid gap-x-0 gap-y-2 border-t border-rule pt-3.5 sm:grid-cols-[minmax(0,1fr)_15rem]">
        <p className="text-xs text-ink-faint max-sm:order-2">Pro is yours. The trip stays free for everyone on it.</p>
        <div className="flex flex-col gap-2 rounded-sm bg-sheet-2 p-2.5 sm:rounded-t-none sm:pb-3">
            {prices.length > 1 ? (
              <SegmentTrack role="group" aria-label="Billing period" className="flex w-full gap-0.5">
                {prices.map((p) => (
                  <button
                    key={p.interval}
                    type="button"
                    aria-pressed={p.interval === picked}
                    onClick={() => setPicked(p.interval)}
                    className={cx(trackSegmentClass(p.interval === picked), "h-7 flex-1 whitespace-nowrap px-1 text-[13px]")}
                  >
                    {PERIODS[p.interval].word}
                  </button>
                ))}
              </SegmentTrack>
            ) : null}
            <BillingAction
              path="/api/billing/checkout"
              body={{ interval: picked }}
              className="lift inline-flex h-9 w-full items-center justify-center rounded-sm bg-pro-mark px-4 text-sm font-semibold text-pro disabled:opacity-70"
            >
              Get Pro
            </BillingAction>
        </div>
      </div>
    </div>
  );
}
