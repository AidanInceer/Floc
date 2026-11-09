"use client";

import Link from "next/link";
import { useState } from "react";

import { cx, segmentTrack } from "@/components/system/ui";
import type { BillingInterval } from "@floc/core/billing/plans";
import type { ProPlan } from "@/lib/landing/pro-plans";

/** Every period's price sits in one cell, so a tap fades between them and the card never changes height. */
export function ProPriceCard({ plans, initial, href }: { plans: ProPlan[]; initial: BillingInterval | null; href: string }) {
  const [picked, setPicked] = useState(initial);
  return (
    <div className="grid gap-4 rounded-md bg-sheet p-[22px] text-ink shadow-raised">
      <p className="text-[16px] font-bold">Floc Pro</p>
      {plans.length > 1 && (
        <div role="group" aria-label="Billing period" className={cx(segmentTrack, "mt-2.5 flex gap-0.5")}>
          {plans.map((p) => (
            <button
              key={p.interval}
              type="button"
              aria-pressed={p.interval === picked}
              onClick={() => setPicked(p.interval)}
              className="pro-seg relative h-[34px] flex-1 rounded-sm text-[14px] font-medium text-ink-2 hover:text-pen-deep aria-pressed:bg-pen-soft aria-pressed:text-pen-deep"
            >
              {p.label}
              {p.best && <span className="pro-best">Best value</span>}
            </button>
          ))}
        </div>
      )}
      {plans.length > 0 && (
        <div className="grid">
          {plans.map((p) => (
            <div key={p.interval} aria-hidden={p.interval !== picked} className={cx("pro-price", p.interval === picked && "is-on")}>
              <p>
                <span className="nums text-[34px] tracking-[-0.02em]">{p.price}</span>{" "}
                <span className="text-[15px] text-ink-2">{p.per}</span>
              </p>
              <p className="mt-1 text-[13px] text-ink-3">
                {p.saving ? <>Save <span className="nums">{p.saving}</span> on the year</> : "Cancel any time"}
              </p>
            </div>
          ))}
        </div>
      )}
      <Link href={href} className="lift inline-flex h-11 items-center justify-center rounded-sm bg-pro-mark font-semibold text-pro">
        Get Pro
      </Link>
    </div>
  );
}
