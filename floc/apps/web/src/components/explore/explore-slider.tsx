"use client";

import type { ReactNode } from "react";
import "./explore-slider.css";

type Bounds = { min: number; max: number; step?: number };

const pct = (value: number, { min, max }: Bounds) => ((value - min) / (max - min)) * 100;

function Track({ from, to, children }: { from: number; to: number; children: ReactNode }) {
  return (
    <div className="slider relative h-4">
      <span aria-hidden className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-rule-strong" />
      <span aria-hidden className="absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-ink" style={{ left: `${from}%`, right: `${100 - to}%` }} />
      {children}
    </div>
  );
}

function Frame({ label, shown, children }: { label: string; shown: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="typed text-ink-faint">{label}</span>
      {children}
      <span className="nums text-[13px]">{shown}</span>
    </div>
  );
}

export function ExploreSlider({
  label,
  bounds,
  value,
  shown,
  onChange,
}: {
  label: string;
  bounds: Bounds;
  value: number;
  shown: string;
  onChange: (value: number) => void;
}) {
  return (
    <Frame label={label} shown={shown}>
      <Track from={0} to={pct(value, bounds)}>
        <input
          type="range"
          aria-label={label}
          aria-valuetext={shown}
          min={bounds.min}
          max={bounds.max}
          step={bounds.step ?? 1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </Track>
    </Frame>
  );
}

export function ExploreRangeSlider({
  label,
  bounds,
  value: [low, high],
  shown,
  onChange,
}: {
  label: string;
  bounds: Bounds;
  value: [number, number];
  shown: string;
  onChange: (value: [number, number]) => void;
}) {
  const common = { min: bounds.min, max: bounds.max, step: bounds.step ?? 1, "aria-valuetext": shown };
  return (
    <Frame label={label} shown={shown}>
      <Track from={pct(low, bounds)} to={pct(high, bounds)}>
        <input
          type="range"
          aria-label={`${label}, from`}
          value={low}
          // Why: with both thumbs at the top the upper input covers the lower; lift it so it can move back.
          style={{ zIndex: low > (bounds.min + bounds.max) / 2 ? 1 : undefined }}
          onChange={(e) => onChange([Math.min(Number(e.target.value), high), high])}
          {...common}
        />
        <input
          type="range"
          aria-label={`${label}, to`}
          value={high}
          onChange={(e) => onChange([low, Math.max(Number(e.target.value), low)])}
          {...common}
        />
      </Track>
    </Frame>
  );
}
