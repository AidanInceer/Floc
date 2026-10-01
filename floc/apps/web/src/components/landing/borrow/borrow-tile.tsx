"use client";

import { useState } from "react";

import { cx } from "@/components/system/ui";
import { nightsWords, type BorrowCard as Card } from "@/lib/landing/borrow";

import { Glyph } from "../landing-glyph";
import { tone } from "./tones";
import type { Face } from "./use-borrow-hand";

type Shown = { card: Card; face: Face };
type Actions = { pick: () => void; deeper: (opener: HTMLElement) => void; hold: (on: boolean) => void };

function FaceView({ shown, slot, onGone }: { shown: Shown; slot: number; onGone?: () => void }) {
  const { card, face } = shown;
  return (
    <span className="borrow-face" data-kind={onGone ? "out" : face.kind} data-dim={onGone && face.kind === "tick" ? "" : undefined} onAnimationEnd={onGone}>
      <span className={cx("typed rounded-md px-[7px] py-px text-[10px]", tone(slot))}>{card.place}</span>
      <b className="borrow-chip-title">{card.title}</b>
      <span className="nums text-ink-faint">
        {nightsWords(card.nights)} · from {card.price}
      </span>
    </span>
  );
}

/** A tile's words as a reel: when the trip changes, the old words slide out below as the new ones come in from above. */
function Reel({ card, face, slot }: { card: Card; face: Face; slot: number }) {
  const [shown, setShown] = useState<{ now: Shown; was: Shown | null }>({ now: { card, face }, was: null });
  if (shown.now.face.key !== face.key) setShown({ now: { card, face }, was: face.kind === "rest" ? null : shown.now });
  return (
    <>
      {shown.was && <FaceView key={shown.was.face.key} shown={shown.was} slot={slot} onGone={() => setShown((s) => ({ ...s, was: null }))} />}
      <FaceView key={shown.now.face.key} shown={shown.now} slot={slot} />
    </>
  );
}

/** One of the six trips beside the globe. The round button opens the globe on the trip's route. */
export function BorrowTile({ card, face, slot, current, on }: { card: Card; face: Face; slot: number; current: boolean; on: Actions }) {
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
        <Reel card={card} face={face} slot={slot} />
      </button>
      <button type="button" className="borrow-deeper" aria-label={`See the route: ${card.title}`} disabled={rolling} onClick={(e) => on.deeper(e.currentTarget)}>
        <Glyph name="expand" />
      </button>
    </li>
  );
}
