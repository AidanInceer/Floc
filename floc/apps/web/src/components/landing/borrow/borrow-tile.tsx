"use client";

import { useState } from "react";

import { cx } from "@/components/system/ui";
import { nightsWords, placeWords, type BorrowCard as Card } from "@/lib/landing/borrow";

import { Glyph } from "@/components/system/icons/landing";
import { toneDot } from "./tones";
import type { Face } from "./use-borrow-hand";

type Shown = { card: Card; face: Face };
type Actions = { pick: () => void; deeper: (opener: HTMLElement) => void; hold: (on: boolean) => void };

function FaceView({ shown, onGone }: { shown: Shown; onGone?: () => void }) {
  const { card, face } = shown;
  return (
    <span className="borrow-face" data-kind={onGone ? "out" : face.kind} data-dim={onGone && face.kind === "tick" ? "" : undefined} onAnimationEnd={onGone}>
      <span className="typed borrow-place">
        <i className={cx("borrow-dot", toneDot(card.region))} aria-hidden="true" />
        <span className="borrow-place-word">{placeWords(card.place)}</span>
      </span>
      <b className="borrow-chip-title">{card.title}</b>
      <span className="borrow-meta nums text-ink-faint">
        <span>{nightsWords(card.nights)} ·</span> <span>from {card.price}</span>
      </span>
    </span>
  );
}

/** A tile's words as a reel: when the trip changes, the old words slide out below as the new ones come in from above. */
function Reel({ card, face }: { card: Card; face: Face }) {
  const [shown, setShown] = useState<{ now: Shown; was: Shown | null }>({ now: { card, face }, was: null });
  if (shown.now.face.key !== face.key) setShown({ now: { card, face }, was: face.kind === "rest" ? null : shown.now });
  return (
    <>
      {shown.was && <FaceView key={shown.was.face.key} shown={shown.was} onGone={() => setShown((s) => ({ ...s, was: null }))} />}
      <FaceView key={shown.now.face.key} shown={shown.now} />
    </>
  );
}

/** One of the six trips beside the globe. The corner button opens the globe on the trip's route. */
export function BorrowTile({ card, face, current, on }: { card: Card; face: Face; current: boolean; on: Actions }) {
  const rolling = face.kind === "tick";
  return (
    <li
      className="borrow-tile"
      onPointerEnter={(e) => e.pointerType === "mouse" && on.hold(true)}
      onPointerLeave={() => on.hold(false)}
      onFocus={(e) => e.target.matches(":focus-visible") && on.hold(true)}
      onBlur={() => on.hold(false)}
    >
      <button type="button" className="borrow-chip" aria-current={current} disabled={rolling} onClick={on.pick}>
        <Reel card={card} face={face} />
      </button>
      <button type="button" className="borrow-deeper" aria-label={`See the route: ${card.title}`} disabled={rolling} onClick={(e) => on.deeper(e.currentTarget)}>
        <Glyph name="expand" />
      </button>
    </li>
  );
}
