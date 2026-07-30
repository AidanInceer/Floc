"use client";

/*
 * Dragging events, within a day and between days.
 *
 * Its own component rather than a mode of `DragList` because events answer to
 * a different gesture. `DragList` has one kind of target — an item, meaning
 * "lift this out and put it here" — and one list. Events have **two** targets
 * and cross between lists:
 *
 *   drop on an event  → the two swap places, and their times with them
 *   drop in a gap     → the dragged event lands at that point
 *   drop in another day's gap → it moves day, keeping its own time
 *
 * The gaps are the whole trick. They're always in the DOM, a couple of pixels
 * of nothing, and they grow into a visible line only while something is being
 * dragged over them — so a still page reads as a plain list, and a page
 * mid-drag reads as a list with somewhere to put things.
 *
 * `active` is module-scoped rather than React state because a drag that starts
 * in one day's list is dropped on another's, and the two components have no
 * common ancestor holding drag state. The DataTransfer payload is the source of
 * truth on drop (and is what makes Firefox start a drag at all); `active` is
 * what the *other* lists read during dragover, where the payload is
 * deliberately unreadable.
 */

import { useState, useTransition, type ReactNode } from "react";

import { cx } from "@/components/ui";

const MIME = "application/x-waypoint-event";

type Active = { eventId: number; dayId: number };

let active: Active | null = null;

export type EventDragItem = {
  id: number;
  /** Names the event in the drag handle's tooltip. */
  label: string;
  node: ReactNode;
};

export function EventDragList({
  dayId,
  items,
  onSwap,
  onInsert,
  emptyLabel,
}: {
  dayId: number;
  items: EventDragItem[];
  /** Drop landed on another event: trade the two. */
  onSwap: (aId: number, bId: number) => Promise<void>;
  /** Drop landed in the gap before position `index` of this day. */
  onInsert: (eventId: number, fromDayId: number, index: number) => Promise<void>;
  /** Shown in place of the list when the day has nothing on it yet. */
  emptyLabel: string;
}) {
  const [armed, setArmed] = useState<number | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [overRow, setOverRow] = useState<number | null>(null);
  const [overGap, setOverGap] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  const clear = () => {
    active = null;
    setArmed(null);
    setDragging(null);
    setOverRow(null);
    setOverGap(null);
  };

  const read = (e: React.DragEvent): Active | null => {
    const raw = e.dataTransfer.getData(MIME);
    if (raw) {
      try {
        return JSON.parse(raw) as Active;
      } catch {
        /* fall through to the module-scoped copy */
      }
    }
    return active;
  };

  const run = (work: () => Promise<void>) => {
    clear();
    startTransition(async () => {
      await work();
    });
  };

  const dropOnRow = (e: React.DragEvent, targetId: number) => {
    const from = read(e);
    if (!from) return;
    e.preventDefault();
    e.stopPropagation();
    if (from.eventId === targetId) return clear();
    // A swap needs both events in one day. Landing on a row in a *different*
    // day is read as "put it here", the same as the gap above that row —
    // refusing the drop would just make the user aim again.
    if (from.dayId !== dayId) {
      const at = items.findIndex((i) => i.id === targetId);
      return run(() => onInsert(from.eventId, from.dayId, Math.max(0, at)));
    }
    run(() => onSwap(from.eventId, targetId));
  };

  const dropInGap = (e: React.DragEvent, index: number) => {
    const from = read(e);
    if (!from) return;
    e.preventDefault();
    e.stopPropagation();
    run(() => onInsert(from.eventId, from.dayId, index));
  };

  const gap = (index: number) => (
    <div
      onDragOver={(e) => {
        if (!active) return;
        e.preventDefault();
        e.stopPropagation();
        setOverGap(index);
        setOverRow(null);
      }}
      onDragLeave={() => setOverGap((g) => (g === index ? null : g))}
      onDrop={(e) => dropInGap(e, index)}
      /* Two pixels of nothing until something is dragged over it. Only the
         inner line animates — growing the gap itself would shove the rows
         around under the cursor mid-drag. */
      className="relative h-2"
      aria-hidden
    >
      <span
        className={cx(
          "absolute inset-x-0 top-1/2 block h-0.5 -translate-y-1/2 rounded-sm transition-opacity",
          overGap === index ? "bg-pen opacity-100" : "opacity-0",
        )}
      />
    </div>
  );

  return (
    <div
      className={cx(
        "flex flex-col",
        pending && "pointer-events-none opacity-60",
      )}
      onDragEnd={clear}
    >
      {items.length === 0 ? (
        <div
          onDragOver={(e) => {
            if (!active) return;
            e.preventDefault();
            e.stopPropagation();
            setOverGap(0);
          }}
          onDragLeave={() => setOverGap(null)}
          onDrop={(e) => dropInGap(e, 0)}
          className={cx(
            "rounded-sm border border-dashed px-3 py-2 text-sm transition-colors",
            overGap === 0
              ? "border-pen bg-pen-soft/40 text-ink"
              : "border-transparent text-ink-faint",
          )}
        >
          {emptyLabel}
        </div>
      ) : (
        <>
          {gap(0)}
          {items.map((item, i) => (
            <div key={item.id}>
              <div
                draggable={armed === item.id}
                onDragStart={(e) => {
                  e.stopPropagation();
                  active = { eventId: item.id, dayId };
                  setDragging(item.id);
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData(MIME, JSON.stringify(active));
                  // Firefox won't start a drag on payload it doesn't know.
                  e.dataTransfer.setData("text/plain", item.label);
                }}
                onDragEnd={(e) => {
                  e.stopPropagation();
                  clear();
                }}
                onDragOver={(e) => {
                  if (!active) return;
                  e.preventDefault();
                  e.stopPropagation();
                  setOverRow(item.id);
                  setOverGap(null);
                }}
                onDragLeave={() => setOverRow((r) => (r === item.id ? null : r))}
                onDrop={(e) => dropOnRow(e, item.id)}
                className={cx(
                  "flex items-center rounded-md transition-shadow",
                  dragging === item.id && "opacity-50",
                  overRow === item.id &&
                    active !== null &&
                    dragging !== item.id &&
                    "ring-2 ring-pen",
                )}
              >
                <span
                  onMouseDown={() => setArmed(item.id)}
                  onMouseUp={() => setArmed(null)}
                  aria-hidden
                  title={`Drag to move ${item.label}`}
                  className="cursor-grab select-none px-1 font-mono text-sm leading-none text-ink-faint active:cursor-grabbing"
                >
                  ⠿
                </span>
                <div className="min-w-0 flex-1">{item.node}</div>
              </div>
              {gap(i + 1)}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
