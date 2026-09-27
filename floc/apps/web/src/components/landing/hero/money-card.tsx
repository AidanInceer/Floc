import { cx } from "@/components/system/ui";

import { kicker, SETTLED, SPENT } from "./beats";
import { Roll } from "./swap";

// Each share is the running total over the six going: £960, then £1,062, then £1,200.
const EXPENSES = [
  { what: "Flat, Palermo", cost: "£960.00", each: "£160.00" },
  { what: "Car hire", cost: "£102.00", each: "£177.00" },
  { what: "Dinner, Ortigia", cost: "£138.00", each: "£200.00" },
];

/** Three expenses land one by one, then the group settles up. */
export function MoneyCard({ step }: { step: number }) {
  const landed = Math.max(0, Math.min(step - SPENT + 1, EXPENSES.length));
  const settled = step >= SETTLED;
  return (
    <div className={cx("deck-card deck-money-card relative bg-pastel-green px-5 py-[18px] text-pastel-green-ink", settled && "is-settled")}>
      <span className={kicker}>Each</span>
      <p className="mt-1.5 font-mono text-[30px] leading-none tracking-[-0.02em]">
        <Roll value={EXPENSES[landed - 1]?.each ?? "£0.00"} />
      </p>
      <div className="deck-expenses mt-3 flex flex-col gap-[5px] text-xs">
        {EXPENSES.map((e, i) => (
          <div key={e.what} className={cx("deck-expense flex justify-between gap-2 rounded-[10px] bg-sheet/60 px-2.5 py-1.5", i < landed && "is-on")}>
            <span className="min-w-0 truncate">{e.what}</span>
            <span className="nums text-[11px]">{e.cost}</span>
          </div>
        ))}
      </div>
      <span className="deck-settled" aria-hidden={!settled}>
        <span className="deck-tick">
          <svg viewBox="0 0 14 14" aria-hidden="true">
            <path pathLength={1} d="M2.6 7.4 5.6 10.4 11.4 4" />
          </svg>
        </span>
        Settled up
      </span>
    </div>
  );
}
