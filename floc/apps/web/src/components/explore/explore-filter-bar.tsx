"use client";

import { FILTER, monthWindow, type ExploreFilter } from "@floc/core/trip/explore/explore-filter";

import { ExploreRangeSlider, ExploreSlider } from "@/components/explore/explore-slider";

const thousands = (major: number) => major.toLocaleString("en-GB");

function priceShown({ priceMin, priceMax }: ExploreFilter): string {
  const top = priceMax >= FILTER.price.max;
  if (priceMin === 0) return top ? "Any" : `Up to ${thousands(priceMax)}`;
  return top ? `${thousands(priceMin)}+` : `${thousands(priceMin)}–${thousands(priceMax)}`;
}

const monthsShown = (filter: ExploreFilter) =>
  filter.fromMonth === FILTER.month.min && filter.toMonth === FILTER.month.max ? "Any month" : monthWindow(filter);

export function ExploreFilterBar({ filter, onChange }: { filter: ExploreFilter; onChange: (next: ExploreFilter) => void }) {
  return (
    <div className="border-b border-rule bg-paper">
      <div className="mx-auto grid max-w-[76rem] grid-cols-2 gap-x-8 gap-y-4 px-4 py-4 sm:px-6 md:grid-cols-4">
        <ExploreSlider
          label="Group"
          bounds={FILTER.people}
          value={filter.people}
          shown={filter.people >= FILTER.people.max ? `${filter.people}+ people` : `${filter.people} people`}
          onChange={(people) => onChange({ ...filter, people })}
        />
        <ExploreRangeSlider
          label="When"
          bounds={FILTER.month}
          value={[filter.fromMonth, filter.toMonth]}
          shown={monthsShown(filter)}
          onChange={([fromMonth, toMonth]) => onChange({ ...filter, fromMonth, toMonth })}
        />
        <ExploreRangeSlider
          label="Each"
          bounds={FILTER.price}
          value={[filter.priceMin, filter.priceMax]}
          shown={priceShown(filter)}
          onChange={([priceMin, priceMax]) => onChange({ ...filter, priceMin, priceMax })}
        />
        <ExploreSlider
          label="Nights"
          bounds={FILTER.nights}
          value={filter.nights}
          shown={filter.nights >= FILTER.nights.max ? "Any length" : `Up to ${filter.nights}`}
          onChange={(nights) => onChange({ ...filter, nights })}
        />
      </div>
    </div>
  );
}
