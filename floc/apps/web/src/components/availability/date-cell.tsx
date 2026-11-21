"use client";

import { cx } from "@/components/system/ui";
import { markKey, type DayMark } from "@floc/core/dates/day-marks";

const FILL: Record<string, string> = {
  all: "bg-pastel-green",
  "some-1": "bg-some-free-1",
  "some-2": "bg-some-free-2",
  "some-3": "bg-some-free-3",
  trip: "bg-green",
  pend: "bg-green/55",
};
const INK: Record<string, string> = {
  "": "text-ink",
  all: "text-pastel-green-ink",
  "some-1": "text-some-free-ink",
  "some-2": "text-some-free-ink",
  "some-3": "text-some-free-ink",
  trip: "font-medium text-sheet",
  pend: "font-medium text-sheet",
};

export type DateCellProps = {
  date: string;
  mark: DayMark;
  join: { left: boolean; right: boolean };
  mine: boolean;
  liked?: boolean;
  past: boolean;
  today: boolean;
  cut: boolean;
  hi?: number;
  label: string;
  press: ((e: React.PointerEvent) => void) | null;
  activate: (() => void) | null;
  selected?: boolean;
};

function MineDisc({ onTrip, liked }: { onTrip: boolean; liked: boolean }) {
  const look = liked
    ? onTrip ? "bg-sheet" : "border-[1.5px] border-ink bg-sheet"
    : onTrip ? "border border-sheet" : "border border-ink-faint";
  return <span aria-hidden className={cx("absolute left-1/2 top-1/2 size-8 -translate-x-1/2 -translate-y-1/2 rounded-full", look)} />;
}

function numberInk(p: DateCellProps, key: string): string | false {
  if (!p.mine || !p.liked) return false;
  return key === "trip" ? "font-semibold text-green" : "font-semibold text-ink";
}

export function DateCell(p: DateCellProps) {
  const key = markKey(p.mark);
  const live = p.press !== null || p.activate !== null;
  const body = (
    <>
      <span
        aria-hidden
        className={cx(
          "absolute inset-y-[3px] rounded-md transition-colors",
          p.join.left ? "left-0 rounded-l-none" : "left-[3px]",
          p.join.right ? "right-0 rounded-r-none" : "right-[3px]",
          FILL[key],
          live && !key && "group-hover:bg-sheet-2",
        )}
      />
      {p.mine ? <MineDisc onTrip={key === "trip"} liked={!!p.liked} /> : null}
      <span className={cx("nums relative", numberInk(p, key), p.cut && "line-through", p.today && "underline decoration-1 underline-offset-4")}>
        {Number(p.date.slice(8, 10))}
      </span>
      {p.hi !== undefined ? (
        <span aria-hidden className="nums absolute right-2 top-[7px] text-[11px] leading-none opacity-85">
          {p.hi}°
        </span>
      ) : null}
    </>
  );
  const cell = cx(
    "group relative flex h-12 items-center justify-center font-mono text-[13px] select-none lg:h-[52px]",
    INK[key],
    p.past && "opacity-70",
  );

  if (!live)
    return (
      <span role="gridcell" data-date={p.date} title={p.label} aria-label={p.label} className={cell}>
        {body}
      </span>
    );
  return (
    <button
      type="button"
      role="gridcell"
      data-date={p.date}
      aria-label={p.label}
      title={p.label}
      aria-selected={p.selected}
      onPointerDown={p.press ?? undefined}
      onClick={(e) => {
        if (e.detail === 0 || !p.press) p.activate?.();
      }}
      className={cx(cell, "focus-visible:outline-none focus-visible:[&>span:first-child]:inset-ring-2 focus-visible:[&>span:first-child]:inset-ring-pen")}
    >
      {body}
    </button>
  );
}
