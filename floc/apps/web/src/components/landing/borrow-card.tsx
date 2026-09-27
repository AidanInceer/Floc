"use client";

import { useMemo } from "react";

import type { BorrowCard as Card } from "@/lib/landing/borrow";
import { journeyAt, journeyShares, routeLengths } from "@/lib/landing/journey";
import { routeCrop } from "@/lib/landing/route-crop";

import { NightsBar } from "./nights-bar";
import { StillRouteMap } from "./still-route-map";
import { useJourney } from "./use-journey";

export type FanPos = "front" | "left" | "right" | "back";

const BOX = { width: 424, height: 190, pad: 34 };

/** One trip in the fan. The front card plays its journey; the rest sit finished. */
export function BorrowCard({ card, pos, onPick }: { card: Card; pos: FanPos; onPick: () => void }) {
  const route = useMemo(() => {
    const crop = routeCrop(card.stops, BOX);
    return { crop, lengths: routeLengths(crop.points), shares: journeyShares(card.stops.map((s) => s.nights)) };
  }, [card.stops]);
  const frame = journeyAt(useJourney(pos === "front"), route.shares, route.lengths);
  const side = pos === "left" || pos === "right";

  return (
    <article className="borrow-card" data-pos={pos} aria-hidden={pos !== "front"} onClick={side ? onPick : undefined}>
      <header className="flex justify-between text-xs text-ink-faint">
        <span className="typed">
          {card.place} · {card.nights} nights
        </span>
        <span className="nums">from {card.price}</span>
      </header>
      <h3 className="mt-1.5 text-2xl tracking-[-0.02em]">{card.title}</h3>
      <StillRouteMap crop={route.crop} box={BOX} frame={frame} total={route.lengths.at(-1) ?? 0} tiles={pos !== "back"} />
      <NightsBar stops={card.stops} frame={frame} />
    </article>
  );
}
