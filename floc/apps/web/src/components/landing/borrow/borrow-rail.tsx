"use client";

import Link from "next/link";
import type { CSSProperties } from "react";

import { cx } from "@/components/system/ui";
import { nightsWords, placeWords, type BorrowCard as Card } from "@/lib/landing/borrow";

import { StartButton } from "./start-button";

type Props = { card: Card; tone: string; step: number; onStep: (k: number) => void; signedIn: boolean };

/** The open trip, stop by stop, marked as the map marks them and joined by one plain line. Every row is one height, so a long trip never scrolls. */
export function BorrowRail({ card, tone, step, onStep, signedIn }: Props) {
  const n = card.stops.length;
  return (
    <div className="bp" style={{ "--n": n } as CSSProperties}>
      <header className="bp-head">
        <span className={cx("bp-tag", tone)}>
          <span aria-hidden="true">{placeWords(card.place)}</span>
          <span className="sr-only">{card.place}</span>
        </span>
        <h3 className="bp-title">{card.title}</h3>
        <p className="bp-figs nums">
          {nightsWords(card.nights)} · from {card.price}
        </p>
      </header>
      <div className="bp-pager">
        <span className="bp-count nums" aria-live="polite">
          Stop {step + 1} of {n}
        </span>
        <span className="bp-steps">
          <StepButton label="Previous stop" path="M8.6 3.4 5 7l3.6 3.6" disabled={step === 0} onClick={() => onStep(step - 1)} />
          <StepButton label="Next stop" path="M5.4 3.4 9 7l-3.6 3.6" disabled={step === n - 1} onClick={() => onStep(step + 1)} />
        </span>
      </div>
      <ol className="bp-list">
        {card.stops.map((stop, k) => (
          <li key={`${stop.name}-${k}`}>
            <button type="button" className="bp-row" aria-current={k === step ? "step" : undefined} onClick={() => onStep(k)}>
              <span className="bp-mark">
                {k > 0 && (
                  <svg className="seg seg-v" aria-hidden="true">
                    <line x1="50%" y1="0" x2="50%" y2="100%" strokeWidth="1.5" />
                  </svg>
                )}
                <Mark k={k} last={n - 1} />
              </span>
              <span className="bp-name">
                <span className="bp-place">{stop.name}</span>
                {stop.outs.length > 0 && (
                  <span className="bp-out">
                    <i className="odot" aria-hidden="true" />
                    {stop.outs.join(", ")}
                  </span>
                )}
              </span>
              <span className="bp-n nums">{nightsWords(stop.nights)}</span>
            </button>
          </li>
        ))}
      </ol>
      <div className="bp-acts">
        <StartButton card={card} signedIn={signedIn} variant="primary" className="px-5 py-2.5" label="Start this trip" />
        <Link href={`/explore/${card.id}`} className="bp-full">
          See the full trip
        </Link>
      </div>
    </div>
  );
}

function StepButton({ label, path, disabled, onClick }: { label: string; path: string; disabled: boolean; onClick: () => void }) {
  return (
    <button type="button" className="bp-step" aria-label={label} disabled={disabled} onClick={onClick}>
      <svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={path} />
      </svg>
    </button>
  );
}

/** Why: the same marks the map draws, so a row and its stop read as one thing. */
function Mark({ k, last }: { k: number; last: number }) {
  if (k !== 0 && k !== last) {
    return (
      <svg className="mk mk-night" viewBox="0 0 14 14" aria-hidden="true">
        <circle cx="7" cy="7" r="4.4" />
      </svg>
    );
  }
  return (
    <svg className="mk mk-end" viewBox="0 0 14 14" aria-hidden="true">
      <circle cx="7" cy="7" r="6.5" />
      {k === 0 ? <path d="M5.6 4.4 9.8 7l-4.2 2.6Z" /> : <rect x="4.8" y="4.8" width="4.4" height="4.4" />}
    </svg>
  );
}
