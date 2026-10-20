"use client";

import { FINDER_SORTS, isFinderSort, type FinderSort } from "@floc/core/trip/explore/finder/finder-rank";
import type { ReactNode } from "react";

import { CrossIcon, LineIcon } from "@/components/system/icons";
import { Select, cx } from "@/components/system/ui";

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
  sort,
  onSort,
  onOpen,
}: {
  shown: number;
  /** How many filters and tags are set, for the button that opens them on a narrow screen. */
  set: number;
  /** What is set, each removable. A dark pill is "more like" one listing. */
  pills: { id: string; label: string; dark?: boolean; onClear: () => void }[];
  sort: FinderSort;
  onSort: (sort: FinderSort) => void;
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
      <label className="flex shrink-0 items-center gap-2">
        <span className="typed text-ink-faint">Sort</span>
        <Select value={sort} onChange={(e) => isFinderSort(e.target.value) && onSort(e.target.value)} className="w-auto font-sans">
          {Object.entries(FINDER_SORTS).map(([key, name]) => (
            <option key={key} value={key}>
              {name}
            </option>
          ))}
        </Select>
      </label>
    </div>
  );
}
