"use client";

import { useId, type MouseEvent } from "react";

import type { Gap, LeftToSort as SortList, Sorted } from "@floc/core/trip/overview/left-to-sort";
import { ButtonLink, cx, iconButtonClass } from "@/components/system/ui";
import { ChevronIcon } from "@/components/system/icons";
import { STACK_COLUMNS, SortCard } from "./sort/sort-card";
import { SortCubes } from "./sort/sort-cubes";
import { useDeal } from "./sort/use-deal";

const hrefOf = (tripId: number, gap: Gap): string =>
  gap.tab === "overview" ? `#${gap.anchor ?? ""}` : `/trip/${tripId}/${gap.tab}${gap.anchor ? `#${gap.anchor}` : ""}`;

/** Above the map (#460, round 2 E2): one soft cube per thing, sorted ones from the left; the strip deals its stack of cards down. */
export function LeftToSort({ tripId, list }: { tripId: number; list: SortList }) {
  const { open, toggle, drawer, list: stack, chevron } = useDeal();
  const id = useId();
  const next = list.open[0];
  if (!next) return null;
  const sorted = list.done.length;
  const total = sorted + list.left;
  // Why: the whole strip opens on a click, but its own link must still go where it says.
  const toggleFromStrip = (e: MouseEvent) => {
    if (!(e.target as HTMLElement).closest("a, button")) toggle();
  };
  return (
    <section aria-label="Left to sort" className="group/sort relative mb-2.5">
      <div className="relative z-[2] rounded-md bg-sheet px-4 py-2.5 shadow-raised ring-1 ring-rule sm:pl-5">
        <div onClick={toggleFromStrip} className="flex min-h-10 cursor-pointer flex-wrap items-center gap-x-4 gap-y-2">
          <SortCubes total={total} filled={sorted} />
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
            onClick={toggle}
            aria-expanded={open}
            aria-controls={id}
            aria-label={open ? "Hide what is left" : "Show what is left"}
            className={cx(iconButtonClass(open), "ml-auto sm:ml-0")}
          >
            <span ref={chevron} className="grid place-items-center">
              <ChevronIcon direction="down" size={13} />
            </span>
          </button>
        </div>
      </div>
      <div ref={drawer} id={id} inert className="invisible relative z-[1] h-0 overflow-hidden">
        <ul ref={stack} className={cx("pt-2 [&>li]:relative [&>li>*]:[opacity:var(--ink-o,1)]", STACK_COLUMNS)}>
          {list.open.map((gap) => (
            <SortCard key={gap.key} item={gap} href={hrefOf(tripId, gap)} action={gap.action} />
          ))}
          {sorted > 0 ? <SortedDeck done={list.done} /> : null}
        </ul>
      </div>
      <StackEdges />
    </section>
  );
}

/** The same deal as the strip above: the sorted cards start under this band and drop down from it. */
function SortedDeck({ done }: { done: Sorted[] }) {
  const { open, toggle, drawer, list, chevron } = useDeal();
  const id = useId();
  return (
    <li className="grid gap-y-0 sm:col-span-full sm:grid-cols-subgrid">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={id}
        className="relative z-[2] flex w-full items-center gap-3 rounded-md border sm:col-span-full border-dashed border-pen-edge bg-pen-soft px-3.5 py-2.5 text-left text-sm text-ink-soft hover:border-pen"
      >
        <SortCubes total={done.length} filled={done.length} />
        <span className="flex-1">{done.length} already sorted</span>
        <span ref={chevron} className="grid place-items-center">
          <ChevronIcon direction="down" size={13} />
        </span>
      </button>
      <div ref={drawer} id={id} inert className="invisible relative z-[1] h-0 overflow-hidden sm:col-span-full sm:grid sm:grid-cols-subgrid">
        <ul ref={list} className="grid gap-1.5 pt-1.5 sm:col-span-full sm:grid-cols-subgrid [&>li]:relative [&>li>*]:[opacity:var(--ink-o,1)]">
          {done.map((item) => (
            <SortCard key={item.key} item={item} />
          ))}
        </ul>
      </div>
    </li>
  );
}

/** Two paper edges under the closed strip: there is a stack behind it. The first two cards start on them as it opens. */
function StackEdges() {
  return (
    <>
      <span aria-hidden className="absolute inset-x-2.5 -bottom-[5px] z-[1] h-3 rounded-b-md bg-sheet ring-1 ring-rule group-data-[dealt]/sort:invisible" />
      <span aria-hidden className="absolute inset-x-[22px] -bottom-2.5 z-0 h-3 rounded-b-md bg-sheet ring-1 ring-rule group-data-[dealt]/sort:invisible" />
    </>
  );
}
