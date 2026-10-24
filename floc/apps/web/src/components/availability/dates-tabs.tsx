"use client";

/**
 * The four stubs down the left of the Dates card. Each says where it stands before you
 * open it; the open one joins the month. On a phone they are one row across the top.
 */
import type { ReactNode } from "react";

import { cx } from "@/components/system/ui";
import type { TabSummary } from "@floc/core/dates/dates-tabs";

export type DatesTab = "mine" | "group" | "trip" | "forecast";

export type TabStub = {
  key: DatesTab;
  label: ReactNode;
  glyph: ReactNode;
  summary: TabSummary;
  /** Top-right: who has answered, or "Not saved". */
  corner?: ReactNode;
};

export function DatesTabs({ stubs, open, onOpen }: { stubs: TabStub[]; open: DatesTab; onOpen: (t: DatesTab) => void }) {
  return (
    <div
      role="tablist"
      aria-label="Dates"
      className="grid grid-flow-col auto-cols-fr border-b border-rule bg-sheet-2 lg:grid-flow-row lg:auto-rows-min lg:border-b-0 lg:shadow-[inset_-1px_0_0_var(--rule)]"
    >
      {stubs.map((s) => (
        <Stub key={s.key} stub={s} selected={s.key === open} onOpen={() => onOpen(s.key)} />
      ))}
    </div>
  );
}

function Stub({ stub, selected, onOpen }: { stub: TabStub; selected: boolean; onOpen: () => void }) {
  const { summary } = stub;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onOpen}
      className={cx(
        "relative grid min-w-0 justify-items-center gap-1.5 px-1 py-3 text-center transition-colors",
        "[&+&]:shadow-[inset_1px_0_0_var(--rule)] lg:[&+&]:shadow-none",
        "lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:justify-items-stretch lg:gap-x-2.5 lg:gap-y-1 lg:border-b-[1.5px] lg:border-dashed lg:border-rule-strong lg:py-4 lg:pl-[18px] lg:pr-4 lg:text-left",
        selected ? "bg-sheet" : "hover:bg-sheet/55",
      )}
    >
      {selected ? (
        <span
          aria-hidden
          className="absolute inset-x-3 bottom-0 h-[3px] rounded-t-[3px] bg-pen lg:inset-x-auto lg:inset-y-4 lg:left-0 lg:h-auto lg:w-[3px] lg:rounded-l-none lg:rounded-r-[3px]"
        />
      ) : null}
      <span
        aria-hidden
        className={cx(
          "flex size-[26px] items-center justify-center rounded-lg",
          selected ? "bg-pen-soft text-pen-deep" : "bg-sheet-3 text-ink-soft",
        )}
      >
        {stub.glyph}
      </span>
      <span className="typed hidden min-w-0 items-center gap-1.5 truncate lg:flex">{stub.label}</span>
      <span className="hidden items-center lg:flex">{stub.corner}</span>
      <b className="min-w-0 max-w-full truncate text-[13px] font-semibold lg:col-span-3 lg:mt-1.5 lg:font-display lg:text-[19px] lg:leading-tight lg:tracking-[-0.015em]">
        <span className="lg:hidden">{summary.short}</span>
        <span className="hidden lg:inline">{summary.value}</span>
      </b>
      <small
        className={cx(
          "hidden truncate text-[12.5px] lg:col-span-3 lg:block",
          summary.open ? "text-highlight-ink" : "text-ink-soft",
        )}
      >
        {summary.note}
      </small>
    </button>
  );
}
