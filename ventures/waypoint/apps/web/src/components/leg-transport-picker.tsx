"use client";

/**
 * How the group gets from one stop to the next, set on the leg itself (ticket
 * 82). The leg used to be read-only — it showed a mode written on Days and
 * gave you nowhere to write one — so the Route tab could tell you travel
 * wasn't planned but not let you plan it.
 *
 * The control only appears once you press "How?", so the spine stays a
 * drawing of the route rather than a row of dropdowns. Setting a mode writes a
 * transport event on the arrival day (see `setLegTransport`); once one exists
 * the leg reads as its icon and word, and pressing it again re-types it.
 */

import { useState, useTransition } from "react";

import { Button } from "@/components/ui";
import { TravelModeIcon } from "@/components/travel-mode-icon";
import type { TransportType } from "@/db/schema";

/**
 * Listed here rather than imported from `db/schema`: the value export would
 * drag the server-only db module into the client bundle (the same trap ticket
 * 73 hit with `EVENT_CATEGORIES`). The `TransportType` annotation catches a
 * mode that isn't in the column; a mode added to the column and not to this
 * list is the gap to watch.
 */
const TRANSPORT_TYPES: readonly TransportType[] = [
  "flight",
  "train",
  "car",
  "ferry",
  "other",
];

export function LegTransportPicker({
  mode,
  onSet,
}: {
  /** null when no transport event on the arrival day names one. */
  mode: TransportType | null;
  onSet: (mode: TransportType) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const set = (next: TransportType) => {
    setOpen(false);
    startTransition(async () => {
      await onSet(next);
    });
  };

  return (
    // The options float over the page rather than expanding in place: five
    // buttons appearing inline pushed the stop below them down the screen, so
    // the row you were aiming at moved as you opened the picker. The trigger
    // keeps its place and its size; only the panel is new.
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={pending}
        aria-expanded={open}
        // Colour is never the only signal, and neither is the icon: the mode is
        // always spelled out beside it.
        className="inline-flex items-center gap-1.5 rounded-sm border border-dashed border-rule-strong px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.06em] text-ink-soft hover:border-pen hover:text-pen disabled:opacity-50 aria-expanded:border-pen aria-expanded:text-pen"
      >
        {mode ? (
          <>
            <TravelModeIcon mode={mode} />
            <span>{mode}</span>
            <span className="text-ink-faint">— change</span>
          </>
        ) : (
          <span>Travel not planned — how?</span>
        )}
      </button>

      {open ? (
        // `w-max`: an absolutely-positioned box is sized by its containing
        // block, which here is the trigger — without it the five modes wrap
        // into a column one word wide.
        <span className="absolute left-0 top-full z-20 mt-1 flex w-max items-center gap-1 rounded-md border border-rule-strong bg-sheet p-1.5 shadow-md">
          {TRANSPORT_TYPES.map((t) => (
            <Button
              key={t}
              variant={t === mode ? "primary" : "secondary"}
              onClick={() => set(t)}
            >
              {t}
            </Button>
          ))}
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </span>
      ) : null}
    </span>
  );
}
