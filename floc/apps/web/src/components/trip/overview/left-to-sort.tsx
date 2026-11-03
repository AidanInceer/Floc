"use client";

import Link from "next/link";
import { useState } from "react";

import type { Gap } from "@floc/core/trip/overview/left-to-sort";
import { ButtonLink, cx } from "@/components/system/ui";
import { ChevronIcon } from "@/components/system/icons";

const SHOWN = 5;

const hrefOf = (tripId: number, gap: Gap): string =>
  gap.tab === "overview" ? `#${gap.anchor ?? ""}` : `/trip/${tripId}/${gap.tab}${gap.anchor ? `#${gap.anchor}` : ""}`;

/** One line above the map (#460, option C): how much is sorted, the next thing and its action; the rest folds out. */
export function LeftToSort({ tripId, open, sorted }: { tripId: number; open: Gap[]; sorted: number }) {
  const [expanded, setExpanded] = useState(false);
  const next = open[0];
  if (!next) return null;
  const total = sorted + open.length;
  const shown = open.slice(0, SHOWN);
  return (
    <section aria-label="Left to sort" className="rounded-md bg-sheet px-4 py-2.5 shadow-raised ring-1 ring-rule sm:pl-5">
      <div className="flex min-h-10 flex-wrap items-center gap-x-3.5 gap-y-2">
        <span aria-hidden className="h-1.5 w-[72px] flex-none overflow-hidden rounded-full bg-sheet-2">
          <i className="block h-full rounded-full bg-pastel-green-ink" style={{ width: `${Math.round((sorted / total) * 100)}%` }} />
        </span>
        <span className="flex-none text-sm text-ink-soft">
          <b className="nums font-display text-[17px] text-ink">{sorted}</b> of {total} sorted
        </span>
        <span className="order-3 min-w-0 basis-full text-sm text-ink-faint sm:order-none sm:flex-1 sm:basis-auto sm:truncate">
          {next.mine ? "Next for you:" : "Next:"} <b className="font-medium text-ink">{next.text}</b>
        </span>
        <ButtonLink href={hrefOf(tripId, next)} variant={next.mine ? "primary" : "secondary"} className="order-4 max-sm:flex-1 sm:order-none">
          {next.action}
        </ButtonLink>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          aria-label={expanded ? "Hide the list" : "Show all"}
          className="ml-auto grid size-8 place-items-center rounded-full text-ink-soft hover:bg-sheet-2 hover:text-ink sm:ml-0"
        >
          <ChevronIcon direction="down" size={13} className={cx("transition-transform motion-reduce:transition-none", expanded && "rotate-180")} />
        </button>
      </div>
      {expanded ? (
        // Why: subgrid rows share one set of columns, so every date and every night count starts at the same x.
        <ul className="mt-2 flex flex-col gap-1 border-t border-rule pt-2 sm:grid sm:grid-cols-[max-content_max-content_max-content_1fr_auto] sm:gap-x-5">
          {shown.map((gap) => (
            <li key={gap.key} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 py-1 sm:col-span-full sm:grid sm:grid-cols-subgrid">
              <span className="min-w-0 text-sm max-sm:basis-full">{gap.text}</span>
              {gap.sub?.map((part) => (
                <span key={part} className="nums font-mono text-xs text-ink-faint">
                  {part}
                </span>
              ))}
              <Link href={hrefOf(tripId, gap)} className="text-sm text-ink-soft underline-offset-4 hover:text-ink hover:underline max-sm:ml-auto sm:col-start-5">
                {gap.action}
              </Link>
            </li>
          ))}
          {open.length > SHOWN ? <li className="py-1 text-sm text-ink-faint sm:col-span-full">and {open.length - SHOWN} more</li> : null}
        </ul>
      ) : null}
    </section>
  );
}
