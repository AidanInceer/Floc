import type { CSSProperties } from "react";

import { cx } from "@/components/system/ui";

import { Glyph } from "../landing-glyph";
import { CLAIMED, kicker, SPUN } from "./beats";
import { Swap } from "./swap";

const CLAIMS = [
  { item: "Speaker", who: "Sam" },
  { item: "Adapters", who: "Jo" },
  { item: "Sun cream", who: "You" },
];
const POOL = ["Towels", "Snorkel", "Cards", "Hat", "Charger", "Bug spray", "First aid", "Frisbee", "Books", "Goggles", "Torch", "Tote bag"];
const PEOPLE = ["Priya", "Alex", "Maya", "Kit", "Sam", "Jo"];
const ROW = 22;

function Reel({ spins, end, seconds, className }: { spins: string[]; end: string; seconds: number; className?: string }) {
  return (
    <span className={cx("deck-reel", className)}>
      <span className="deck-strip" style={{ "--end": `${spins.length * ROW}px`, "--spin": `${seconds}s` } as CSSProperties}>
        {[...spins, end].map((word, i) => (
          <span key={i}>{word}</span>
        ))}
      </span>
    </span>
  );
}

/** Packing spins like a slot machine, one reel per row, and lands on who brings what. */
export function PackingCard({ step }: { step: number }) {
  return (
    <div className="deck-card bg-pastel-yellow px-5 py-[18px] text-pastel-yellow-ink">
      <div className="flex items-center justify-between gap-2">
        <span className={kicker}>Packing</span>
        <Swap
          on={step >= CLAIMED}
          className="text-xs font-semibold"
          from={" "}
          to={<span className="inline-flex items-center gap-1"><Glyph name="check" className="size-3" />3 claimed</span>}
        />
      </div>
      <ul className={cx("deck-reels mt-2.5 flex flex-col gap-[5px] text-[13px]", step >= SPUN && "is-on")}>
        {CLAIMS.map(({ item, who }, row) => {
          const spins = Array.from({ length: 9 + row * 3 }, (_, k) => k);
          const seconds = 1.875 + row * 0.5625;
          return (
            <li key={item} className="flex justify-between gap-2.5" style={{ "--lock": `${seconds + 0.19}s` } as CSSProperties}>
              <Reel spins={spins.map((k) => POOL[(k * 5 + row * 3) % POOL.length]!)} end={item} seconds={seconds} />
              <Reel
                spins={spins.map((k) => PEOPLE[(k + row * 2) % PEOPLE.length]!)}
                end={who}
                seconds={seconds + 0.19}
                className={cx("text-right", who === "You" && "deck-reel-you")}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
