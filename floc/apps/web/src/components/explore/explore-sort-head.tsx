import Link from "next/link";
import { flipSort, sortDirection, type ExploreSort, type SortColumn } from "@floc/core/trip/explore/explore-sort";
import type { Region } from "@floc/core/trip/explore/preset-trips";

import { exploreHref } from "@/components/explore/explore-href";
import { cx } from "@/components/system/ui";

const LABEL: Record<SortColumn, string> = { nights: "Nights", price: "Price" };
const SPOKEN: Record<SortColumn, Record<"up" | "down", string>> = {
  nights: { up: "fewest nights first", down: "most nights first" },
  price: { up: "cheapest first", down: "dearest first" },
};
const ARROW = { up: "M7 11V3M4 6l3-3 3 3", down: "M7 3v8M4 8l3 3 3-3", none: "M5 5.5l2-2 2 2M5 8.5l2 2 2-2" };

export function ExploreSortHead({ sort, region, showAll }: { sort: ExploreSort; region: Region | null; showAll: boolean }) {
  const head = (column: SortColumn) => {
    const now = sortDirection(sort, column);
    const next = flipSort(sort, column);
    return (
      <Link
        href={exploreHref({ region, sort: next, showAll })}
        scroll={false}
        aria-label={`${LABEL[column]}, ${SPOKEN[column][sortDirection(next, column) ?? "up"]}`}
        className={cx(
          "typed inline-flex items-center gap-1 transition-colors",
          now ? "text-ink" : "text-ink-soft hover:text-ink",
        )}
      >
        {LABEL[column]}
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d={ARROW[now ?? "none"]} />
        </svg>
      </Link>
    );
  };
  return (
    <nav aria-label="Sort trips" className="flex gap-5 md:justify-end">
      {head("nights")}
      {head("price")}
    </nav>
  );
}
