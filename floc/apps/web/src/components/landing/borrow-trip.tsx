"use client";

import { useEffect, useState } from "react";

import { startTripFromPreset } from "@/app/explore/actions";
import { SubmitButton } from "@/components/system/client-ui";
import { ButtonLink, cx } from "@/components/system/ui";
import type { BorrowCard } from "@/lib/landing/borrow";

import { BorrowMap } from "./borrow-map";
import { Glyph } from "./landing-glyph";

const TONES = [
  "bg-pastel-red text-pastel-red-ink border-pastel-red-edge",
  "bg-pastel-yellow text-pastel-yellow-ink border-pastel-yellow-edge",
  "bg-pastel-blue text-pastel-blue-ink border-pastel-blue-edge",
  "bg-pastel-green text-pastel-green-ink border-pastel-green-edge",
];
const ROLL_MS = 3200;

function TripCard({ card, tone }: { card: BorrowCard; tone: string }) {
  return (
    <div className={cx("rounded-[28px] px-7 pb-[22px] pt-[26px] transition-colors duration-500", tone)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="typed text-current">{card.place}</span>
          <h3 className="mt-1.5 text-[28px] tracking-[-0.03em] text-ink">{card.title}</h3>
        </div>
        <span className="borrow-stamp">
          <b className="nums text-[30px] font-medium">{card.nights}</b>
          <small className="mt-[3px] font-mono text-[8px] uppercase tracking-[0.08em]">nights</small>
        </span>
      </div>
      <div className="mt-4">
        <BorrowMap stops={card.stops} />
      </div>
      <ol key={card.id} className="mt-3 flex flex-wrap gap-1.5">
        {card.stops.map((s, i) => (
          <li
            key={s.name}
            className="borrow-stop flex items-center gap-[7px] rounded-full bg-sheet/60 px-[11px] py-[5px] text-xs"
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            <i className="grid size-4 place-items-center rounded-full bg-current font-mono text-[10px] not-italic">
              <span className="text-sheet">{i + 1}</span>
            </i>
            <span className="text-ink">{s.name}</span>
            <span className="nums text-[11px]">{s.nights}n</span>
          </li>
        ))}
      </ol>
      <p className="nums mt-3.5 flex justify-between border-t border-dashed border-current/30 pt-3 text-xs">
        <span>
          {card.stops.length} {card.stops.length === 1 ? "base" : "stops"}
        </span>
        <span>from {card.price} pp</span>
      </p>
    </div>
  );
}

function StartButton({ card, signedIn }: { card: BorrowCard; signedIn: boolean }) {
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

/** "Borrow a trip to …": the Explore shelf, one finished route at a time. */
export function BorrowTrip({ cards, signedIn, explore }: { cards: BorrowCard[]; signedIn: boolean; explore: string }) {
  const [index, setIndex] = useState(0);
  const [rolling, setRolling] = useState(true);

  useEffect(() => {
    if (!rolling || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % cards.length), ROLL_MS);
    return () => clearInterval(timer);
  }, [rolling, cards.length]);

  if (cards.length === 0) return null;
  const card = cards[index];
  const tone = TONES[index % TONES.length];
  const pick = (i: number) => {
    setRolling(false);
    setIndex(i);
  };

  return (
    <div className="grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] md:gap-14" onPointerEnter={() => setRolling(false)}>
      <div>
        <h2 className="text-[clamp(2.2rem,4.6vw,3.6rem)] leading-[1.02] tracking-[-0.03em]">
          Borrow a trip to
          <br />
          <span className="inline-block min-h-[1.1em]" aria-live="polite">
            <span key={card.id} className={cx("borrow-word", tone)}>
              {card.place}
            </span>
          </span>
        </h2>
        <p className="mt-3.5 text-md text-ink-soft">A finished route to start from. Change anything.</p>
        <div className="mt-[26px] flex flex-wrap gap-2">
          {cards.map((c, i) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={i === index}
              onClick={() => pick(i)}
              className={cx(
                "rounded-full border px-[13px] py-1.5 text-sm transition-colors",
                i === index ? "border-ink bg-ink text-paper" : "border-rule bg-sheet text-ink-soft hover:border-rule-strong hover:text-ink",
              )}
            >
              {c.place}
            </button>
          ))}
        </div>
        <div className="mt-7 flex flex-wrap gap-3">
          <StartButton card={card} signedIn={signedIn} />
          <ButtonLink href={explore} variant="ghost">
            See every trip
          </ButtonLink>
        </div>
      </div>
      <TripCard card={card} tone={tone} />
    </div>
  );
}
