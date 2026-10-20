"use client";

import { NIGHTS_SCALE, PRICE_SCALE, withNights, withPrice, withUnit, toggled, type Finder, type FinderCounts, type PriceUnit } from "@floc/core/trip/explore/finder/finder";
import { MONTH_SHORT, nightsWord, scaleWord } from "@floc/core/trip/explore/finder/finder-words";
import { REGIONS } from "@floc/core/trip/explore/preset-trips";

import { FinderChip, linkClass } from "@/components/explore/finder/finder-chip";
import { RangeBars } from "@/components/explore/finder/range-bars";
import { PillToggle } from "@/components/system/client-ui";
import { cx } from "@/components/system/ui";

type Facet = { finder: Finder; counts: FinderCounts; shown: number; onChange: (next: Finder) => void };

const trips = (n: number) => `${n} ${n === 1 ? "trip" : "trips"}`;

export function WhereFacet({ finder, counts, onChange }: Facet) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <FinderChip on={!finder.regions.length} onClick={() => onChange({ ...finder, regions: [] })}>
        Anywhere
      </FinderChip>
      {REGIONS.map((r) => (
        <FinderChip key={r} on={finder.regions.includes(r)} count={counts.regions[r]} onClick={() => onChange({ ...finder, regions: toggled(finder.regions, r) })}>
          {r}
        </FinderChip>
      ))}
    </div>
  );
}

export function WhenFacet({ finder, counts, onChange }: Facet) {
  return (
    <>
      <div className="grid grid-cols-6 gap-1.5">
        {MONTH_SHORT.map((name, i) => {
          const on = finder.months.includes(i + 1);
          const none = counts.months[i] === 0;
          return (
            <button
              key={name}
              type="button"
              aria-pressed={on}
              aria-label={`${name}, ${trips(counts.months[i])}`}
              onClick={() => onChange({ ...finder, months: toggled(finder.months, i + 1) })}
              className={cx(
                "grid justify-items-center gap-px rounded-[10px] border pb-[5px] pt-1.5 transition-colors",
                on ? "border-ink bg-ink text-paper" : "border-rule-strong bg-sheet hover:border-ink-faint",
                !on && none && "border-dashed text-ink-faint",
              )}
            >
              <b className="text-[13px] font-medium">{name}</b>
              <span className={cx("nums text-[10.5px]", on ? "opacity-70" : "text-ink-faint")}>{counts.months[i]}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-2.5">
        <span className="text-xs text-ink-faint">Trips in season. Pick every month you could go.</span>
        {finder.months.length ? (
          <button type="button" className={linkClass} onClick={() => onChange({ ...finder, months: [] })}>
            Any month
          </button>
        ) : null}
      </div>
    </>
  );
}

export function LengthFacet({ finder, counts, shown, onChange }: Facet) {
  const { min, max } = finder.nights ?? NIGHTS_SCALE;
  return (
    <RangeBars
      label="Nights"
      bars={counts.nights.map((count, i) => ({ count, on: NIGHTS_SCALE.min + i >= min && NIGHTS_SCALE.min + i <= max }))}
      bounds={{ ...NIGHTS_SCALE, step: 1 }}
      value={[min, max]}
      valueText={nightsWord(finder.nights)}
      onChange={([a, b]) => onChange(withNights(finder, a, b))}
    >
      <span>{nightsWord(finder.nights)}</span>
      <span>{trips(shown)}</span>
    </RangeBars>
  );
}

export function PriceFacet({ finder, counts, shown, onChange }: Facet) {
  const { unit, min, max } = finder.price;
  const scale = PRICE_SCALE[unit];
  const band = scale.max / counts.price.length;
  return (
    <div className="grid gap-2.5">
      <PillToggle<PriceUnit>
        label="Count the price"
        value={unit}
        options={[
          { value: "trip", label: "Whole trip" },
          { value: "night", label: "Per night" },
        ]}
        onChange={(next) => onChange(withUnit(finder, next))}
      />
      <RangeBars
        label="Price"
        bars={counts.price.map((count, i) => ({ count, on: (min === null || (i + 1) * band > min) && (max === null || i * band <= max) }))}
        bounds={{ min: 0, max: scale.max, step: scale.step }}
        value={[min ?? 0, max ?? scale.max]}
        valueText={scaleWord(finder.price)}
        onChange={([a, b]) => onChange(withPrice(finder, a, b))}
      >
        <span>{scaleWord(finder.price)}</span>
        <span>{trips(shown)}</span>
      </RangeBars>
    </div>
  );
}
