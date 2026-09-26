"use client";

import type { CSSProperties, ReactNode } from "react";

import { AvatarRow, cx } from "@/components/system/ui";
import { leadingBlanks } from "@/lib/landing/month-grid";

import { Glyph } from "./landing-glyph";
import { sampleGroup, sampleStops } from "./sample-trip";
import { useScene } from "./use-scene";

// The four beats: the vote lands, the dates agree, the route draws, the money squares.
const BEATS = [700, 1500, 2400, 3600] as const;
const VOTED = 1;
const DATED = 2;
const ROUTED = 3;
const SQUARE = 4;

// How busy each September day was before the group settled — shading only.
const HEAT = [2, 3, 1, 2, 4, 3, 2, 3, 4, 5, 4, 5, 5, 5, 5, 5, 5, 5, 5, 3, 2, 4, 3, 1, 2, 3, 2, 1, 2, 3];
const kicker = "font-mono text-[10px] uppercase tracking-[0.1em] opacity-80";

/** A figure that changes slides the old value out and the new one in — never counts. */
function Swap({ on, from, to, className }: { on: boolean; from: ReactNode; to: ReactNode; className?: string }) {
  return (
    <span className={cx("deck-swap", on && "is-on", className)}>
      <span aria-hidden={on}>{from}</span>
      <span aria-hidden={!on}>{to}</span>
    </span>
  );
}

function VotesCard({ step }: { step: number }) {
  const rows = [
    { place: "Sicily", from: 0.2, to: 1, votes: 4, lead: true },
    { place: "Lisbon", from: 0.2, to: 0.25, votes: 1 },
    { place: "Croatia", from: 0.1, to: 0.25, votes: 1 },
  ];
  return (
    <div className="deck-card bg-pastel-yellow px-5 py-[18px] text-pastel-yellow-ink">
      <div className="flex items-center justify-between gap-2">
        <span className={kicker}>Where to</span>
        <span className="text-xs font-semibold">All 6 voted</span>
      </div>
      <div className="mt-2.5 flex flex-col gap-[7px] text-[13px]">
        {rows.map((r) => (
          <div key={r.place} className={cx("grid grid-cols-[5.2rem_1fr_1.4rem] items-center gap-2", r.lead && "font-semibold")}>
            <span>{r.place}</span>
            <span className="deck-track">
              <i className="deck-bar" style={{ "--w": step >= VOTED ? r.to : r.from } as CSSProperties} />
            </span>
            <span className="nums">{r.votes}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

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
      <div className="mt-2.5 grid grid-cols-7 gap-[3px] text-center font-mono text-[10px]">
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
              style={{ "--heat": `${heat * 5}%`, "--delay": `${pick ? (day - 12) * 0.05 : 0}s` } as CSSProperties}
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
          <Swap on={step >= DATED} from="Dates open · 6 asked" to="Sun 12 – Sun 19 Sep · 7 nights" />
        </p>
        <ol className={cx("deck-route relative mt-6 grid grid-cols-4", step >= ROUTED && "is-drawn")}>
          {sampleStops.map((s, i) => (
            <li key={s.name} className="deck-stop relative text-center text-xs" style={{ "--delay": `${0.15 + i * 0.28}s` } as CSSProperties}>
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
        <Swap on={step >= SQUARE} className="nums" from="Jo is owed £42.50" to={<span className="text-green">Square</span>} />
      </div>
    </div>
  );
}

function MoneyCard({ step }: { step: number }) {
  const rows: [string, ReactNode][] = [
    ["Flat, Palermo", "£960.00"],
    ["Car hire", "£102.00"],
    ["Priya → Jo", <Swap key="pj" on={step >= SQUARE} from="£42.50" to="Paid" />],
  ];
  return (
    <div className="deck-card bg-pastel-green px-5 py-[18px] text-pastel-green-ink">
      <span className={kicker}>Each</span>
      <p className="mt-1.5 font-mono text-[30px] leading-none tracking-[-0.02em]">£177.00</p>
      <div className="mt-3 flex flex-col gap-[5px] text-xs">
        {rows.map(([what, cost]) => (
          <div key={what} className="flex justify-between gap-2 rounded-[10px] bg-sheet/60 px-2.5 py-1.5">
            <span>{what}</span>
            <span className="nums text-[11px]">{cost}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PackingCard() {
  return (
    <div className="deck-card bg-pastel-yellow px-5 py-[18px] text-pastel-yellow-ink">
      <span className={kicker}>Packing</span>
      <ul className="mt-2 flex flex-col gap-1.5 text-[13px]">
        {[
          ["Speaker", "Sam"],
          ["Adapters", "Jo"],
          ["Sun cream", "You"],
        ].map(([item, who]) => (
          <li key={item} className="flex justify-between gap-2.5">
            <span>{item}</span>
            <span className={cx(who === "You" && "font-semibold text-pen-deep")}>{who}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The hero's scene: one Sicily trip, fanned out as the cards a group hands round, settling in four beats. */
export function HeroDeck() {
  const { ref, step } = useScene<HTMLDivElement>(BEATS);
  return (
    <div ref={ref} className="hero-deck" role="img" aria-label="A sample trip to Sicily coming together: the vote, the dates, the route and the money">
      <div className="deck-slot deck-votes"><VotesCard step={step} /></div>
      <div className="deck-slot deck-dates"><DatesCard step={step} /></div>
      <div className="deck-slot deck-ticket"><TicketCard step={step} /></div>
      <div className="deck-slot deck-money"><MoneyCard step={step} /></div>
      <div className="deck-slot deck-pack"><PackingCard /></div>
    </div>
  );
}
