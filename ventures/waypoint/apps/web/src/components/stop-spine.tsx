"use client";

/**
 * The Route tab's stop list (ticket 82). Three prototype directions were built
 * on the real page; this one — the "journey spine" — won for being the most
 * intuitive at a glance, and the other two (boarding-pass stubs, a gantt of
 * date bands) were dropped.
 *
 * What the drawing is for: the old list was a stack of cards, so neither of
 * the two questions the page exists to answer had a shape. Now the dates own a
 * rail of their own down the left, and order and direction are one inked line
 * running top to bottom through numbered nodes.
 *
 * Why this isn't `DragList` with a render prop: the item bodies are rendered
 * on the server, and a function child can't cross that boundary (see `Sheet`).
 * So the spine — the thing that has to be draggable — is drawn *here*, in the
 * client, and each stop's body arrives as a plain node to sit beside it. The
 * numbered node doubles as the grip, because the node is what draws the order
 * and so is what a reader reaches for; ↑/↓ under it are the keyboard path.
 *
 * Reordering is a real write (`reorderStops` → re-dating the days underneath —
 * a stop isn't stored, rule 3), never a client-side sort.
 */

import { useState, useTransition } from "react";
import type { ReactNode } from "react";

import { Button, cx } from "./ui";

export type StopSpineItem = {
  key: string;
  /** Names the stop in the move controls' accessible labels. */
  label: string;
  /** The glanceable date range for the left rail, e.g. "12–16 Jun". */
  dates: string;
  /** The line under it, e.g. "4 days". */
  duration: string;
  /** Server-rendered: name, nights, the dates in full, the controls. */
  body: ReactNode;
  /** The leg to the NEXT stop — omitted on the last one. */
  leg?: ReactNode;
};

export function StopSpine({
  items,
  onReorder,
}: {
  items: StopSpineItem[];
  onReorder: (from: number, to: number) => Promise<void>;
}) {
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  // `draggable` is armed by the node, not set permanently: a permanently
  // draggable row makes selecting the text inside it start a drag instead.
  const [armed, setArmed] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  const move = (from: number, to: number) => {
    setDragging(null);
    setOver(null);
    setArmed(null);
    if (from === to || to < 0 || to >= items.length) return;
    startTransition(async () => {
      await onReorder(from, to);
    });
  };

  return (
    <ol
      className={cx("px-1", pending && "pointer-events-none opacity-60")}
    >
      {items.map((item, i) => (
        <li
          key={item.key}
          draggable={armed === i}
          onDragStart={(e) => {
            setDragging(i);
            e.dataTransfer.effectAllowed = "move";
            // Firefox won't start a drag without some payload set.
            e.dataTransfer.setData("text/plain", item.key);
          }}
          onDragEnd={() => {
            setDragging(null);
            setOver(null);
            setArmed(null);
          }}
          onDragOver={(e) => {
            if (dragging === null) return;
            e.preventDefault();
            setOver(i);
          }}
          onDrop={(e) => {
            if (dragging === null) return;
            e.preventDefault();
            move(dragging, i);
          }}
          className={cx(
            "grid grid-cols-[5.5rem_3rem_1fr] items-stretch rounded-md transition-shadow sm:grid-cols-[7rem_3.25rem_1fr]",
            dragging === i && "opacity-50",
            over === i && dragging !== null && dragging !== i && "ring-2 ring-pen",
          )}
        >
          {/* The dates, in the display face: "when" was the question the old
              card header buried in a hint line. */}
          <div className="pt-0.5 text-right">
            <p className="font-display text-[15px] font-semibold leading-tight">
              {item.dates}
            </p>
            <p className="text-xs text-ink-soft">{item.duration}</p>
          </div>

          {/* The spine. */}
          <div className="relative flex flex-col items-center gap-1">
            <span
              onMouseDown={() => setArmed(i)}
              onMouseUp={() => setArmed(null)}
              title={`Drag to move ${item.label}`}
              className="z-10 flex h-7 w-7 shrink-0 cursor-grab items-center justify-center rounded-full border-2 border-pen bg-sheet font-mono text-[11px] text-pen select-none active:cursor-grabbing"
            >
              {i + 1}
            </span>
            <div className="z-10 flex flex-col bg-sheet">
              <Button
                variant="ghost"
                className="px-1 py-0"
                disabled={i === 0}
                aria-label={`Move ${item.label} earlier`}
                onClick={() => move(i, i - 1)}
              >
                ↑
              </Button>
              <Button
                variant="ghost"
                className="px-1 py-0"
                disabled={i === items.length - 1}
                aria-label={`Move ${item.label} later`}
                onClick={() => move(i, i + 1)}
              >
                ↓
              </Button>
            </div>
            {i < items.length - 1 ? (
              <span aria-hidden className="-mt-1 w-px flex-1 bg-rule-strong" />
            ) : null}
          </div>

          <div className="pb-7 pl-1">
            {item.body}
            {item.leg ? (
              <div className="mt-4 flex items-center gap-2">
                <span aria-hidden className="text-pen">
                  ↓
                </span>
                {item.leg}
              </div>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
