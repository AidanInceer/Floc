"use client";

import { useEffect, useMemo, useRef } from "react";

import { Button, ButtonLink, cx } from "@/components/system/ui";
import type { BorrowCard as Card } from "@/lib/landing/borrow";
import { HAND } from "@/lib/landing/globe/hand";

import { BorrowRail } from "./borrow/borrow-rail";
import { BorrowTile } from "./borrow/borrow-tile";
import { StartButton } from "./borrow/start-button";
import { StopPins } from "./borrow/stop-pins";
import { tone } from "./borrow/tones";
import { useBorrowHand } from "./borrow/use-borrow-hand";
import { useBorrowWay } from "./borrow/use-borrow-way";
import { useSpinGlobe, type GlobeEvents } from "./globe/use-spin-globe";
import { Glyph } from "./landing-glyph";
import "./borrow-trip.css";

// Every route on the globe leaves from here.
const LONDON = { lat: 51.507, lng: -0.128 };

/**
 * "Borrow a trip to …": every Explore listing on a globe, six of them on tiles. Pick a tile, turn the
 * globe or spin it and the plane flies there; a tile's round button opens the globe on that trip's route.
 */
export function BorrowTrip({ cards, signedIn, explore }: { cards: Card[]; signedIn: boolean; explore: string }) {
  const places = useMemo(() => cards.flatMap((c) => (c.stops[0] ? [{ lat: c.stops[0].lat, lng: c.stops[0].lng }] : [])), [cards]);
  const events = useRef<GlobeEvents>({});
  const { canvas, lit, globe } = useSpinGlobe(LONDON, places, events);
  const { faces, spin, settle } = useBorrowHand(places, globe);
  const { way, stage, pins, back, enter, leave, go, changed } = useBorrowWay(globe, cards);
  useEffect(() => {
    events.current = { onSettle: settle, onWay: changed };
  }, [settle, changed]);

  const card = cards[lit];
  if (!card || places.length !== cards.length) return null;
  const litSlot = faces.findIndex((f) => f.card === lit);
  const litTone = tone(litSlot < 0 ? lit : litSlot);
  const open = way ? cards[way.card] : undefined;
  const half = Math.ceil(HAND / 2);
  const tiles = (from: number, to: number) =>
    faces.slice(from, to).map((face, k) => (
      <BorrowTile
        key={from + k}
        slot={from + k}
        face={face}
        card={cards[face.card]!}
        current={face.kind !== "tick" && face.card === lit}
        on={{
          pick: () => globe.current?.show(face.card),
          deeper: (opener) => enter(face.card, opener),
          hold: (on) => globe.current?.hold(on ? face.card : -1),
        }}
      />
    ));

  return (
    <div className="borrow text-center">
      <h2 className="band-title">
        Borrow a trip to{" "}
        <span aria-live="polite" className={cx("borrow-word transition-colors duration-500", litTone)}>
          <span key={card.id} className="borrow-roll">
            {card.place}
          </span>
        </span>
      </h2>
      <p className="mx-auto mt-3.5 max-w-[40ch] text-md text-ink-soft">A finished route to start from. Change anything.</p>
      <div ref={stage} className="borrow-stage" data-deep={way ? "" : undefined} data-on={way?.on ? "" : undefined}>
        <div className="borrow-scene">
          <ul className="borrow-list" data-side="left" inert={Boolean(way)}>
            {tiles(0, half)}
          </ul>
          <div className="borrow-globe-box">
            <canvas ref={canvas} className="borrow-globe" role="img" aria-label="A globe. Drag to turn it, or flick it to spin." />
            <div ref={pins} className="borrow-pins">
              {open && way && <StopPins card={open} step={way.step} onStep={go} />}
            </div>
            {way && (
              <button ref={back} type="button" className="borrow-back" onClick={leave}>
                <Glyph name="back" /> Back to the globe
              </button>
            )}
          </div>
          <ul className="borrow-list" data-side="right" inert={Boolean(way)}>
            {tiles(half, HAND)}
          </ul>
          <aside className="borrow-panel">
            {open && way && <BorrowRail card={open} tone={litTone} step={way.step} onStep={go} signedIn={signedIn} />}
          </aside>
        </div>
        <div className="borrow-bar" inert={Boolean(way)}>
          <Button onClick={() => spin(lit)} className="borrow-go">
            Spin for me
          </Button>
          <ButtonLink href={explore} variant="primary" className="borrow-every px-6 py-3 text-[12px]">
            See every trip
          </ButtonLink>
          <StartButton card={card} signedIn={signedIn} variant="ghost" />
        </div>
      </div>
    </div>
  );
}
