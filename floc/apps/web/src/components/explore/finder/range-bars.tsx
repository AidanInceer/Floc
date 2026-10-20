"use client";

import type { ReactNode } from "react";
import "./range-bars.css";

export type Bar = { count: number; on: boolean };
type Bounds = { min: number; max: number; step: number };

/** How many listings sit at each point of a scale, as bars, with two thumbs under them. Bars inside the range are dark. */
export function RangeBars({
  label,
  bars,
  bounds,
  value: [low, high],
  valueText,
  onChange,
  children,
}: {
  label: string;
  bars: Bar[];
  bounds: Bounds;
  value: [number, number];
  valueText: string;
  onChange: (value: [number, number]) => void;
  /** The line under the thumbs. */
  children: ReactNode;
}) {
  const most = Math.max(1, ...bars.map((b) => b.count));
  const common = { min: bounds.min, max: bounds.max, step: bounds.step, "aria-valuetext": valueText };
  return (
    <div className="grid gap-2.5">
      <div aria-hidden className="flex h-[46px] items-end gap-0.5 px-[9px]">
        {bars.map((b, i) => (
          <i
            key={i}
            className={b.on ? "flex-1 rounded-t-[3px] bg-ink-faint" : "flex-1 rounded-t-[3px] bg-rule"}
            style={{ height: b.count ? `${8 + (b.count / most) * 92}%` : 0 }}
          />
        ))}
      </div>
      <div className="slider relative -mt-2.5 h-5">
        <span aria-hidden className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-rule-strong" />
        <input
          type="range"
          aria-label={`${label}, from`}
          value={low}
          // Why: with both thumbs at the top the upper input covers the lower; lift it so it can move back.
          style={{ zIndex: low > (bounds.min + bounds.max) / 2 ? 1 : undefined }}
          onChange={(e) => onChange([Math.min(Number(e.target.value), high), high])}
          {...common}
        />
        <input type="range" aria-label={`${label}, to`} value={high} onChange={(e) => onChange([low, Math.max(Number(e.target.value), low)])} {...common} />
      </div>
      <div className="nums flex justify-between text-[12.5px] [&>:last-child]:text-ink-faint">{children}</div>
    </div>
  );
}
