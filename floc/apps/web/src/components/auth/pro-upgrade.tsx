"use client";

/**
 * The Pro block's ways in (ticket 250, #523). One button per plan, so choosing and buying are the
 * same press. All three wear one skin: no plan is pre-selected. Each shows the real charge first,
 * then a small per-month figure and the exact saving.
 *
 * `canBuy` false — signed out, or already Pro — makes the buttons links: a checkout needs an
 * account to attach the subscription to. Buying asks first for the 14-day consent (CCR 2013 reg 37).
 */
import { useId, useState } from "react";

import Link from "next/link";

import { CheckIcon } from "@/components/system/icons";
import { cx } from "@/components/system/ui";
import { planOffer, type PlanOffer, type PlanPrice } from "@floc/core/billing/plan-offer";
import { BILLING_INTERVALS } from "@floc/core/billing/plans";

import { BillingAction } from "./billing-buttons";

const CONSENT_LABEL = "Start Pro straight away. I understand I lose my 14-day right to cancel once it starts.";

export function ProUpgrade({ prices, canBuy, href }: { prices: PlanPrice[]; canBuy: boolean; href: string }) {
  const [consent, setConsent] = useState(false);
  // Why: one checkout at a time — while one plan is starting, the others must not start a second.
  const [busy, setBusy] = useState(false);
  const monthly = prices.find((p) => p.interval === "monthly")?.amountMinor ?? null;
  const plans = BILLING_INTERVALS.flatMap((interval) => prices.filter((p) => p.interval === interval));

  // No prices to quote — still sell Pro, just without the figures.
  if (plans.length === 0) {
    return (
      <Link href={href} className={cx(buttonBase, "lift justify-center")}>
        Upgrade now
      </Link>
    );
  }

  return (
    <div className="grid w-full gap-3">
      {canBuy ? <Consent checked={consent} onChange={setConsent} /> : null}
      <div className="grid gap-3 sm:grid-cols-3">
        {plans.map((price) => {
          const offer = planOffer(price, monthly);
          return canBuy ? (
            <BillingAction
              key={price.interval}
              path="/api/billing/checkout"
              body={{ interval: price.interval, consent: consent ? "yes" : "no" }}
              disabled={!consent || busy}
              onBusyChange={setBusy}
              className={cx(buttonBase, consent && !busy ? "lift" : "cursor-not-allowed border-pro-edge/50")}
            >
              <PlanFace offer={offer} />
            </BillingAction>
          ) : (
            <Link key={price.interval} href={href} className={cx(buttonBase, "lift")}>
              <PlanFace offer={offer} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Consent({ checked, onChange }: { checked: boolean; onChange: (on: boolean) => void }) {
  const id = useId();
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-2.5 text-sm text-pro-ink">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={cx(
          "mt-0.5 flex h-[18px] w-[18px] flex-none items-center justify-center rounded-sm border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-pen",
          checked ? "border-pro-mark bg-pro-mark text-pro" : "border-pro-edge bg-transparent",
        )}
      >
        {checked ? <CheckIcon size={11} /> : null}
      </span>
      <span>{CONSENT_LABEL}</span>
    </label>
  );
}

// Why: a row on a phone, three columns from `sm`; the fixed height only matters when the columns
// must line up, so a plan with no saving sits level with the two that have one.
const buttonBase =
  "flex w-full items-center rounded-sm border border-pro-edge bg-transparent px-4 py-3 text-pro-ink transition-colors enabled:hover:border-pro-mark enabled:hover:bg-pro-2 sm:h-[5.5rem] sm:px-5 [&:is(a)]:hover:border-pro-mark [&:is(a)]:hover:bg-pro-2";

function PlanFace({ offer }: { offer: PlanOffer }) {
  return (
    <span className="flex w-full flex-col items-start gap-0.5 text-left sm:items-center sm:text-center">
      <span>
        <span className="font-mono text-md font-semibold">{offer.charge}</span>
        <span className="text-sm"> {offer.per}</span>
      </span>
      {offer.perMonth ? (
        <span className="flex flex-wrap gap-x-1.5 font-mono text-[11px] text-pro-ink-2 sm:flex-col sm:items-center">
          <span>{offer.perMonth}</span>
          {offer.saving ? <><span aria-hidden className="sm:hidden">·</span><span>{offer.saving}</span></> : null}
        </span>
      ) : null}
    </span>
  );
}