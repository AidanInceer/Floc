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
    <section aria-label="Left to sort" className="rounded-xl bg-sheet px-4 py-2.5 shadow-raised ring-1 ring-rule sm:pl-5">
      <div className="flex min-h-10 flex-wrap items-center gap-x-3.5 gap-y-2">
        <span role="img" aria-label={`${sorted} of ${total} sorted`} className="h-1.5 w-[72px] flex-none overflow-hidden rounded-full bg-sheet-2">
          <i className="block h-full rounded-full bg-pastel-green-ink" style={{ width: `${Math.round((sorted / total) * 100)}%` }} />
        </span>
        <span className="flex-none text-sm text-ink-soft">
          <b className="nums font-display text-[17px] text-ink">{open.length}</b> left to sort
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
        <ul className="mt-2 flex flex-col gap-1 border-t border-rule pt-2">
          {shown.map((gap) => (
            <li key={gap.key} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-1">
              <span className="min-w-0 flex-1 text-sm">
                {gap.text}
                {gap.sub ? <span className="nums text-ink-faint"> · {gap.sub}</span> : null}
              </span>
              <Link href={hrefOf(tripId, gap)} className="text-sm text-ink-soft underline-offset-4 hover:text-ink hover:underline">
                {gap.action}
              </Link>
            </li>
          ))}
          {open.length > SHOWN ? <li className="py-1 text-sm text-ink-faint">and {open.length - SHOWN} more</li> : null}
        </ul>
      ) : null}
    </section>
  );
}
