"use client";

import { useMemo } from "react";

import { startTripFromPreset } from "@/app/explore/actions";
import { SubmitButton } from "@/components/system/client-ui";
import { Button, ButtonLink, cx } from "@/components/system/ui";
import type { BorrowCard as Card } from "@/lib/landing/borrow";

import { useSpinGlobe } from "./globe/use-spin-globe";
import { Glyph } from "./landing-glyph";
import "./borrow-trip.css";

const TONES = [
  "bg-pastel-red text-pastel-red-ink",
  "bg-pastel-yellow text-pastel-yellow-ink",
  "bg-pastel-blue text-pastel-blue-ink",
  "bg-pastel-green text-pastel-green-ink",
];
const tone = (index: number) => TONES[index % TONES.length];

// Every route on the globe leaves from here.
const LONDON = { lat: 51.507, lng: -0.128 };

function StartButton({ card, signedIn }: { card: Card; signedIn: boolean }) {
  const label = (
    <>
      Start from {card.place} <Glyph name="arrow" />
    </>
  );
  if (!signedIn) {
    return (
      <ButtonLink href="/signup" variant="ghost" className="borrow-start">
        {label}
      </ButtonLink>
    );
  }
  return (
    <form action={startTripFromPreset} className="borrow-start">
      <input type="hidden" name="presetId" value={card.id} />
      <SubmitButton variant="ghost" pendingLabel="Starting…">
        {label}
      </SubmitButton>
    </form>
  );
}

function Chip({ card, index, current, onPick }: { card: Card; index: number; current: boolean; onPick: () => void }) {
  return (
    <li>
      <button type="button" className="borrow-chip" aria-current={current} onClick={onPick}>
        <span className={cx("typed rounded-md px-[7px] py-px text-[10px]", tone(index))}>{card.place}</span>
        <b className="borrow-chip-title">{card.title}</b>
        <span className="nums text-ink-faint">
          {card.nights} nights · from {card.price}
        </span>
      </button>
    </li>
  );
}

/** "Borrow a trip to …": the Explore shelf on a globe. Pick a trip, turn the globe or spin it; the plane flies there. */
export function BorrowTrip({ cards, signedIn, explore }: { cards: Card[]; signedIn: boolean; explore: string }) {
  const places = useMemo(() => cards.flatMap((c) => (c.stops[0] ? [{ lat: c.stops[0].lat, lng: c.stops[0].lng }] : [])), [cards]);
  const { canvas, lit, show, spin } = useSpinGlobe(LONDON, places);
  const card = cards[lit];
  if (!card || places.length !== cards.length) return null;
  const half = Math.ceil(cards.length / 2);
  const chips = (from: number, to: number) =>
    cards.slice(from, to).map((c, k) => <Chip key={c.id} card={c} index={from + k} current={from + k === lit} onPick={() => show(from + k)} />);

  return (
    <div className="text-center">
      <h2 className="band-title">
        Borrow a trip to{" "}
        <span aria-live="polite" className={cx("borrow-word transition-colors duration-500", tone(lit))}>
          <span key={card.id} className="borrow-roll">
            {card.place}
          </span>
        </span>
      </h2>
      <p className="mx-auto mt-3.5 max-w-[40ch] text-md text-ink-soft">A finished route to start from. Change anything.</p>
      <div className="borrow-spin">
        <ul className="borrow-list" data-side="left">
          {chips(0, half)}
        </ul>
        <canvas ref={canvas} className="borrow-globe" role="img" aria-label="A globe. Drag to turn it, or flick it to spin." />
        <ul className="borrow-list" data-side="right">
          {chips(half, cards.length)}
        </ul>
        <div className="borrow-bar">
          <Button onClick={spin} className="borrow-go">
            Spin for me
          </Button>
          <ButtonLink href={explore} variant="primary" className="borrow-every px-6 py-3 text-[12px]">
            See every trip
          </ButtonLink>
          <StartButton card={card} signedIn={signedIn} />
        </div>
      </div>
    </div>
  );
}
