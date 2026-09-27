"use client";

import { useState } from "react";

import { startTripFromPreset } from "@/app/explore/actions";
import { SubmitButton } from "@/components/system/client-ui";
import { ButtonLink, cx } from "@/components/system/ui";
import type { BorrowCard as Card } from "@/lib/landing/borrow";

import { BorrowCard, type FanPos } from "./borrow-card";
import { Glyph } from "./landing-glyph";

const TONES = [
  "bg-pastel-red text-pastel-red-ink",
  "bg-pastel-yellow text-pastel-yellow-ink",
  "bg-pastel-blue text-pastel-blue-ink",
  "bg-pastel-green text-pastel-green-ink",
];

function fanPos(k: number, index: number, n: number): FanPos {
  const rel = (k - index + n) % n;
  if (rel === 0) return "front";
  if (rel === 1) return "right";
  return rel === n - 1 ? "left" : "back";
}

function StartButton({ card, signedIn }: { card: Card; signedIn: boolean }) {
  const label = (
    <>
      Start from {card.place} <Glyph name="arrow" />
    </>
  );
  if (!signedIn) {
    return (
      <ButtonLink href="/signup" variant="primary">
        {label}
      </ButtonLink>
    );
  }
  return (
    <form action={startTripFromPreset}>
      <input type="hidden" name="presetId" value={card.id} />
      <SubmitButton pendingLabel="Starting…">{label}</SubmitButton>
    </form>
  );
}

function StepButton({ label, onClick, back }: { label: string; onClick: () => void; back?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-9 place-items-center rounded-full border border-rule-strong bg-sheet transition-colors hover:border-pen"
    >
      <Glyph name="arrow" className={back ? "rotate-180" : undefined} />
    </button>
  );
}

/** "Borrow a trip to …": the Explore shelf as a fan of finished routes, one in front. */
export function BorrowTrip({ cards, signedIn, explore }: { cards: Card[]; signedIn: boolean; explore: string }) {
  const [index, setIndex] = useState(0);
  const n = cards.length;
  if (n === 0) return null;
  const card = cards[index];
  const step = (by: number) => setIndex((i) => (i + by + n) % n);

  return (
    <div className="text-center">
      <h2 className="band-title">
        Borrow a trip to{" "}
        <span aria-live="polite" className={cx("borrow-word transition-colors duration-500", TONES[index % TONES.length])}>
          <span key={card.id} className="borrow-roll">
            {card.place}
          </span>
        </span>
      </h2>
      <p className="mx-auto mt-3.5 max-w-[40ch] text-md text-ink-soft">A finished route to start from. Change anything.</p>
      <div className="borrow-stage">
        {cards.map((c, k) => (
          <BorrowCard key={c.id} card={c} pos={fanPos(k, index, n)} onPick={() => setIndex(k)} />
        ))}
      </div>
      <div className="mb-6 mt-2 inline-flex items-center gap-3.5 text-sm text-ink-soft">
        <StepButton label="Previous trip" back onClick={() => step(-1)} />
        <span className="nums">
          {index + 1} of {n}
        </span>
        <StepButton label="Next trip" onClick={() => step(1)} />
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <StartButton card={card} signedIn={signedIn} />
        <ButtonLink href={explore} variant="ghost">
          See every trip
        </ButtonLink>
      </div>
    </div>
  );
}
