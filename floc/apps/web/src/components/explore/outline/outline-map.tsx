"use client";

import type { PresetTrip } from "@floc/core/trip/explore/preset-trips";
import { useMemo } from "react";

import { landFor } from "@/components/explore/listing";
import { cx } from "@/components/system/ui";

import { outlineCode } from "./country";
import { drawOutline } from "./drawing";
import { useLand } from "./use-land";

// Why: a name is set at 12px, so each place the map goes has a drawing at the size it is shown.
const SIZES = {
  tile: { width: 240, height: 170 },
  pass: { width: 432, height: 216 },
  sheet: { width: 343, height: 190 },
} as const;

const PIN = "fill-sheet stroke-pen";

/**
 * A listing's route on the outline of its country. No tile layer: the shapes come from `public/land-50m.json`.
 * `named` numbers the pins and writes each place beside its pin.
 */
export function OutlineMap({ trip, size, named = false }: { trip: PresetTrip; size: keyof typeof SIZES; named?: boolean }) {
  const land = useLand("fine");
  const box = SIZES[size];
  const stops = useMemo(() => trip.legs.flatMap((leg) => (leg.kind === "base" ? [leg] : [])), [trip]);
  const d = useMemo(() => drawOutline(stops, outlineCode(trip.country) ?? "", land, box, named), [stops, trip.country, land, box, named]);
  const home = landFor(trip);

  return (
    <svg
      viewBox={`0 0 ${box.width} ${box.height}`}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={`${stops.map((s) => s.place).join(", ")}, ${trip.country}`}
      className="block size-full"
    >
      <path d={d.other} strokeWidth={0.75} className="fill-sheet-3 stroke-rule-strong" />
      {d.islets.map((islet) => (
        <circle key={`${islet.x} ${islet.y}`} cx={islet.x} cy={islet.y} r={islet.r} className={home} />
      ))}
      <path d={d.home} className={home} />
      {d.way ? <path d={d.way} fill="none" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="stroke-pen opacity-85" /> : null}
      {d.pins.map((pin) =>
        named ? (
          <g key={pin.label}>
            <circle cx={pin.x} cy={pin.y} r={9} strokeWidth={2} className={PIN} />
            <text x={pin.x} y={pin.y + 3.6} textAnchor="middle" className={cx("nums fill-pen font-semibold", pin.label.length > 2 ? "text-[7.5px]" : "text-[10.5px]")}>
              {pin.label}
            </text>
          </g>
        ) : (
          <circle key={pin.label} cx={pin.x} cy={pin.y} r={4.2} strokeWidth={2} className={PIN} />
        ),
      )}
      {d.names.map((name) => (
        <text key={name.text} x={name.x} y={name.y} strokeWidth={3} strokeLinejoin="round" paintOrder="stroke" className="fill-ink stroke-sheet text-[12px] font-medium">
          {name.text}
        </text>
      ))}
    </svg>
  );
}
