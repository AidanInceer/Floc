"use client";

import type { BorrowCard as Card } from "@/lib/landing/borrow";
import { pinsOf } from "@/lib/landing/globe/deep";

/**
 * The stops of the open trip, as numbered pins over the map. The globe places each one and picks
 * the side its name sits on (globe/way-in); the name shows on the stop the map is on.
 */
export function StopPins({ card, step, onStep }: { card: Card; step: number; onStep: (k: number) => void }) {
  return pinsOf(card.stops).map((pin) => {
    const first = pin.stops[0]!;
    const name = card.stops[first]!.name;
    return (
      <button key={first} type="button" className="borrow-pin" data-side="r" aria-current={pin.stops.includes(step)} aria-label={`Go to ${name}`} onClick={() => onStep(first)}>
        <b className="nums">{pin.stops.map((k) => k + 1).join(" · ")}</b>
        <i>{name}</i>
      </button>
    );
  });
}
