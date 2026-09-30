"use client";

import type { CSSProperties } from "react";

import { AvatarRow, cx } from "@/components/system/ui";
import { leadingBlanks } from "@/lib/landing/month-grid";

import { Glyph } from "../landing-glyph";
import { sampleGroup, sampleStops } from "../sample-trip";
import { useScene } from "../use-scene";
import { BEATS, DATED, kicker, ROUTED, SETTLED } from "./beats";
import { Flight } from "./flight";
import { MoneyCard } from "./money-card";
import { PackingCard } from "./packing-card";
import { Swap } from "./swap";
import { VotesCard } from "./votes-card";
import "./hero.css";

// How busy each September day was before the group settled — shading only.
const HEAT = [2, 3, 1, 2, 4, 3, 2, 3, 4, 5, 4, 5, 5, 5, 5, 5, 5, 5, 5, 3, 2, 4, 3, 1, 2, 3, 2, 1, 2, 3];

function DatesCard({ step }: { step: number }) {
  const agreed = step >= DATED;
  return (
    <div className="deck-card bg-pastel-blue px-5 py-[18px] text-pastel-blue-ink">
      <div className="flex items-center justify-between gap-2">
        <span className={kicker}>September</span>
        <Swap
          on={agreed}
          className="text-xs font-semibold"
          from="4 of 6 free"
          to={<span className="inline-flex items-center gap-1"><Glyph name="check" className="size-3" />All 6 free</span>}
        />
      </div>
      <div className={cx("deck-month mt-2.5 grid grid-cols-7 gap-[3px] text-center font-mono text-[10px]", agreed && "is-agreed")}>
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <b key={`${d}${i}`} className="pb-0.5 font-medium opacity-60">{d}</b>
        ))}
        {Array.from({ length: leadingBlanks(2027, 9) }, (_, i) => <i key={`blank-${i}`} />)}
        {HEAT.map((heat, i) => {
          const day = i + 1;
          const pick = day >= 12 && day <= 19;
          return (
            <span
              key={day}
              className={cx("deck-day grid aspect-square place-items-center rounded-[6px]", pick && agreed && "is-picked")}
              style={{ "--heat": `${heat * 5}%`, "--delay": `${pick ? (day - 12) * 0.0875 : 0}s` } as CSSProperties}
            >
              {day}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function TicketCard({ step }: { step: number }) {
  return (
    <div className="deck-card bg-sheet text-ink">
      <div className="px-[26px] pb-[18px] pt-6">
        <div className="flex items-start justify-between gap-3">
          <p className="font-display text-[52px] font-semibold leading-[0.95] tracking-[-0.035em]">Sicily</p>
          <span className={cx("deck-stamp inline-flex items-center gap-1.5 rounded-full bg-pen px-3 py-1 font-display text-xs font-semibold text-sheet", step >= ROUTED && "is-on")}>
            <Glyph name="check" className="size-[11px]" />
            Agreed
          </span>
        </div>
        <p className="mt-2 font-mono text-xs text-ink-soft">
          <Swap on={step >= ROUTED} from="Dates open · 6 asked" to="Sun 12 – Sun 19 Sep · 7 nights" />
        </p>
        <ol className={cx("deck-route relative mt-6 grid grid-cols-4", step >= ROUTED && "is-drawn")}>
          {sampleStops.map((s, i) => (
            <li key={s.name} className="deck-stop relative text-center text-xs" style={{ "--delay": `${0.19 + i * 0.35}s` } as CSSProperties}>
              <i className="mx-auto mb-1.5 block size-[13px] rounded-full border-2 border-sheet bg-pen shadow-[0_0_0_1.5px_var(--pen)]" />
              {s.name}
              <span className="block font-mono text-[10px] text-ink-faint">
                {s.days} {s.days === 1 ? "night" : "nights"}
              </span>
            </li>
          ))}
        </ol>
      </div>
      <div className="deck-perf" />
      <div className="flex items-center justify-between gap-3 px-[26px] pb-5 pt-4 text-sm text-ink-soft">
        <span className="flex items-center gap-2.5 whitespace-nowrap">
          <AvatarRow people={sampleGroup} max={6} size={26} />
          6 going
        </span>
        <Swap on={step >= SETTLED} className="nums" from="Jo is owed £42.50" to={<span className="text-green">Square</span>} />
      </div>
    </div>
  );
}

/** The hero's scene: one Sicily trip, fanned out as the cards a group hands round, each card playing after the one before while a plane crosses above. */
export function HeroDeck() {
  const { ref, step } = useScene<HTMLDivElement>(BEATS);
  return (
    <div ref={ref} className="hero-deck" role="img" aria-label="A sample trip to Sicily coming together: the vote, the dates, the route, the money and the packing">
      <Flight flying={step >= 1} />
      <div className="deck-slot deck-votes"><VotesCard step={step} /></div>
      <div className="deck-slot deck-dates"><DatesCard step={step} /></div>
      <div className="deck-slot deck-ticket"><TicketCard step={step} /></div>
      <div className="deck-slot deck-money"><MoneyCard step={step} /></div>
      <div className="deck-slot deck-pack"><PackingCard step={step} /></div>
    </div>
  );
}
