"use client";

import { FINDER_SORTS, type FinderSort } from "@floc/core/trip/explore/finder/finder-rank";
import type { ReactNode } from "react";

import { CrossIcon, LineIcon } from "@/components/system/icons";
import { SUN_PATHS } from "@/components/system/icons/weather";
import { cx } from "@/components/system/ui";

const SORT_ICONS: Record<FinderSort, ReactNode> = {
  season: SUN_PATHS.map((d) => <path key={d} d={d} />),
  match: <path d="M7 12.1C3.3 9.4 1.5 7.5 1.5 5.4A3.2 3.2 0 0 1 7 3.5a3.2 3.2 0 0 1 5.5 1.9c0 2.1-1.8 4-5.5 6.7Z" />,
  cheap: <path d="M3 10.5v-8M1.2 4.3 3 2.5l1.8 1.8M7 4h2M7 7h3.5M7 10h5" />,
  dear: <path d="M3 3.5v8m-1.8-1.8L3 11.5l1.8-1.8M7 4h5M7 7h3.5M7 10h2" />,
  short: <path d="M2 7h4M2 4.5v5M10 7h2" />,
  long: <path d="M2 7h10M2 4.5v5M12 4.5v5" />,
};

function Pill({ dark = false, onClick, children }: { dark?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "group inline-flex min-h-7 items-center gap-1.5 rounded-full pl-[11px] pr-2 text-[13px]",
        dark ? "bg-pen-soft text-pen-deep" : "bg-sheet-3 text-ink",
      )}
    >
      {children}
      <CrossIcon size={11} className={dark ? undefined : "text-ink-faint group-hover:text-ink"} />
    </button>
  );
}

/** Above the trips: how many, what is set (each removable), and the order. */
export function FinderBar({
  shown,
  set,
  pills,
  onOpen,
}: {
  shown: number;
  /** How many filters and tags are set, for the button that opens them on a narrow screen. */
  set: number;
  /** What is set, each removable. A dark pill is "more like" one listing. */
  pills: { id: string; label: string; dark?: boolean; onClear: () => void }[];
  onOpen: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 pb-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-h-8 flex-wrap items-center gap-1.5">
        <b className="nums mr-1.5 text-[13px]">
          {shown} {shown === 1 ? "trip" : "trips"}
        </b>
        <button type="button" onClick={onOpen} className="typed inline-flex min-h-8 items-center gap-1.5 rounded-sm border border-rule-strong bg-sheet px-3 lg:hidden">
          <LineIcon>
            <path d="M2 4h10M4 7h6M6 10h2" />
          </LineIcon>
          Filters{set ? ` · ${set}` : ""}
        </button>
        {pills.map((p) => (
          <Pill key={p.id} dark={p.dark} onClick={p.onClear}>
            {p.label}
          </Pill>
        ))}
      </div>
    </div>
  );
}

export function SortPicker({ sort, onSort }: { sort: FinderSort; onSort: (sort: FinderSort) => void }) {
  return (
    <div role="radiogroup" aria-label="Sort" className="flex shrink-0 items-center justify-between gap-0.5 rounded-md border border-rule-strong bg-sheet p-0.5 max-sm:w-full">
      {(Object.keys(FINDER_SORTS) as FinderSort[]).map((key) => (
        <button
          key={key}
          type="button"
          role="radio"
          aria-checked={sort === key}
          aria-label={FINDER_SORTS[key]}
          title={FINDER_SORTS[key]}
          onClick={() => onSort(key)}
          className={cx(
            "grid size-8 place-items-center rounded-sm transition-colors max-sm:h-10 max-sm:w-auto max-sm:flex-1",
            sort === key ? "bg-pen-soft text-pen-deep" : "text-ink-soft hover:bg-sheet-2 hover:text-ink",
          )}
        >
          <LineIcon size={14}>{SORT_ICONS[key]}</LineIcon>
        </button>
      ))}
    </div>
  );
}
