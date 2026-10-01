"use client";

import Link from "next/link";

import { cx } from "@/components/system/ui";
import { hopWords, nightsWords, type BorrowCard as Card } from "@/lib/landing/borrow";

import { Glyph } from "../landing-glyph";
import { StartButton } from "./start-button";

type Props = { card: Card; tone: string; step: number; onStep: (k: number) => void; signedIn: boolean };

/** The open trip, stop by stop: each stop with its nights and the move that arrives at it. Next walks the map along the route. */
export function BorrowRail({ card, tone, step, onStep, signedIn }: Props) {
  const last = card.stops.length - 1;
  return (
    <div className="borrow-rail">
      <span className={cx("typed rounded-md px-[7px] py-px text-[10px]", tone)}>{card.place}</span>
      <b className="borrow-rail-title">{card.title}</b>
      <span className="nums text-[11.5px] text-ink-faint">
        {nightsWords(card.nights)} · from {card.price}
      </span>
      <div className="borrow-pager">
        <button type="button" aria-label="Previous stop" disabled={step === 0} onClick={() => onStep(step - 1)}>
          <Glyph name="back" />
        </button>
        <span className="nums" aria-live="polite">
          Stop {step + 1} of {card.stops.length}
        </span>
        <button type="button" aria-label="Next stop" disabled={step === last} onClick={() => onStep(step + 1)}>
          <Glyph name="arrow" />
        </button>
      </div>
      <ol className="borrow-steps">
        {card.stops.map((stop, k) => (
          <li key={`${stop.name}-${k}`}>
            <button type="button" aria-current={k === step} onClick={() => onStep(k)}>
              <b className="nums">{k + 1}</b>
              <span>
                <strong>{stop.name}</strong>
                {stop.hop && <small>{hopWords(stop.hop)}</small>}
              </span>
              <em className="nums">{nightsWords(stop.nights)}</em>
            </button>
          </li>
        ))}
      </ol>
      {card.also && (
        <p className="mt-2.5 text-[12px] leading-snug text-ink-soft">
          {hopWords(card.also)}: {card.also.place}
        </p>
      )}
      <div className="borrow-acts">
        <StartButton card={card} signedIn={signedIn} variant="primary" className="px-5 py-2.5" />
        <Link href={`/explore/${card.id}`} className="text-[12.5px] font-semibold text-pen underline underline-offset-[3px]">
          See the full trip
        </Link>
      </div>
    </div>
  );
}
