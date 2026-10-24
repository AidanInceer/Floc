"use client";

import { FINDER_SORTS, type FinderSort } from "@floc/core/trip/explore/finder/finder-rank";
import type { ReactNode } from "react";

import { CrossIcon, LineIcon } from "@/components/system/icons";
import { cx } from "@/components/system/ui";

const SORT_ICONS: Record<FinderSort, ReactNode> = {
  match: <path d="M7 1.8 8.5 5l3.5.4-2.6 2.4.7 3.5L7 9.6l-3.1 1.7.7-3.5L2 5.4 5.5 5Z" />,
  cheap: <path d="M3 3.5v8m-1.8-1.8L3 11.5l1.8-1.8M7 4h5M7 7h3.5M7 10h2" />,
  dear: <path d="M3 10.5v-8M1.2 4.3 3 2.5l1.8 1.8M7 4h2M7 7h3.5M7 10h5" />,
  short: <path d="M2 7h4M2 4.5v5M10 7h2" />,
  long: <path d="M2 7h10M2 4.5v5M12 4.5v5" />,
};

function Pill({ dark = false, onClick, children }: { dark?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "group inline-flex min-h-7 items-center gap-1.5 rounded-full pl-[11px] pr-2 text-[12.5px]",
        dark ? "bg-ink text-paper" : "bg-sheet-3 text-ink",
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
      <div className="flex flex-wrap items-center gap-1.5">
        <b className="nums mr-1.5 text-[13px]">
          {shown} {shown === 1 ? "trip" : "trips"}
        </b>
        <button type="button" onClick={onOpen} className="typed inline-flex min-h-8 items-center gap-1.5 rounded-full border border-rule-strong bg-sheet px-3 lg:hidden">
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
    <div role="radiogroup" aria-label="Sort" className="flex shrink-0 items-center gap-0.5 rounded-full border border-rule-strong bg-sheet p-0.5">
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
            "grid size-8 place-items-center rounded-full transition-colors",
            sort === key ? "bg-ink text-paper" : "text-ink-soft hover:bg-sheet-2 hover:text-ink",
          )}
        >
          <LineIcon size={14}>{SORT_ICONS[key]}</LineIcon>
        </button>
      ))}
    </div>
  );
}
