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

import { cx } from "./ui";

/**
 * ↑/↓ wear the same 26px disc as the row's triple-dot — three controls in a
 * row that hover three different ways read as three different kinds of thing.
 * The glyph is set heavier than the body text: at regular weight the arrow is
 * a hairline and disappears against ruled paper.
 */
function MoveButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cx(
        "flex h-[26px] w-[26px] items-center justify-center rounded-full border border-transparent text-[15px] font-bold leading-none transition-colors",
        disabled
          ? "cursor-not-allowed text-ink-faint/40"
          : "text-ink-soft hover:border-rule-strong hover:bg-sheet-2 hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

export type StopSpineItem = {
  key: string;
  /** Names the stop in the move controls' accessible labels. */
  label: string;
  /** The glanceable date range for the left rail, e.g. "12–16 Jun". */
  dates: string;
  /** The line under it, e.g. "4 days". */
  duration: string;
  /** Server-rendered: name, nights, the dates in full. */
  body: ReactNode;
  /**
   * The stop's own verbs, behind one triple-dot. They sit *after* the ↑/↓
   * pair: reordering is the thing you do here, so it keeps the buttons, and
   * three full-size buttons spread across the row's right edge (ticket 125's
   * complaint) collapse to one affordance.
   */
  actions?: ReactNode;
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
      /* Centred rather than edge-to-edge: with the verbs collapsed to one
         triple-dot the row is narrow, and stretched across a desktop sheet it
         left a lake of paper between the stop and its own controls. */
      className={cx(
        "mx-auto w-fit max-w-full px-1",
        pending && "pointer-events-none opacity-60",
      )}
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
            "grid grid-cols-[4rem_2rem_1fr] items-stretch rounded-md transition-shadow sm:grid-cols-[7rem_3rem_1fr]",
            dragging === i && "opacity-50",
            over === i && dragging !== null && dragging !== i && "ring-2 ring-pen",
          )}
        >
          {/* The dates, in the display face: "when" was the question the old
              card header buried in a hint line. The day count wears the same
              highlighter pill the map pin does — one stop, one drawing. */}
          <div className="pt-0.5 text-right">
            <p className="font-display text-[15px] font-semibold leading-tight">
              {item.dates}
            </p>
            <p className="mt-0.5">
              <span className="day-pill day-pill-lg">{item.duration}</span>
            </p>
          </div>

          {/* The spine: node, then one unbroken line down to the next node.
              Nothing else is allowed in this column — the move buttons started
              here, and their paper cut the line in two at every stop, which is
              the whole thing the drawing is for. They sit with the row's other
              controls instead. */}
          <div className="relative flex flex-col items-center">
            {i < items.length - 1 ? (
              <span
                aria-hidden
                className="absolute left-1/2 top-3.5 bottom-0 w-px -translate-x-1/2 bg-rule-strong"
              />
            ) : null}
            <span
              onMouseDown={() => setArmed(i)}
              onMouseUp={() => setArmed(null)}
              title={`Drag to move ${item.label}`}
              className="relative z-10 flex h-7 w-7 shrink-0 cursor-grab items-center justify-center rounded-full border-2 border-pen bg-sheet font-mono text-[11px] text-pen select-none active:cursor-grabbing"
            >
              {i + 1}
            </span>
          </div>

          <div className="pb-5 pl-1">
            {/* The controls sit right beside the stop, not out at the row's
                far edge: pushed apart they read as belonging to the page
                rather than to this stop, and the eye has to cross a lake of
                paper to get to them. One row at every width. */}
            <div className="flex items-center gap-1">
              <div className="min-w-0">{item.body}</div>
              <div className="flex shrink-0 items-center gap-0.5 pl-1">
                <MoveButton
                  label={`Move ${item.label} earlier`}
                  disabled={i === 0}
                  onClick={() => move(i, i - 1)}
                >
                  ↑
                </MoveButton>
                <MoveButton
                  label={`Move ${item.label} later`}
                  disabled={i === items.length - 1}
                  onClick={() => move(i, i + 1)}
                >
                  ↓
                </MoveButton>
                {item.actions}
              </div>
            </div>
            {item.leg ? (
              <div className="mt-2 flex items-center gap-2">
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
