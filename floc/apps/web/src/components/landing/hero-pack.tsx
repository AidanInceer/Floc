import { AvatarRow, cx } from "@/components/system/ui";
import { leadingBlanks } from "@/lib/landing/month-grid";

import { Glyph } from "./landing-glyph";
import { sampleGroup, sampleStops } from "./sample-trip";

// How busy each September day was before the group settled — shading only.
const HEAT = [2, 3, 1, 2, 4, 3, 2, 3, 4, 5, 4, 0, 0, 0, 0, 0, 0, 0, 0, 3, 2, 4, 3, 1, 2, 3, 2, 1, 2, 3];
const kicker = "font-mono text-[10px] uppercase tracking-[0.1em] opacity-80";

function DatesCard() {
  return (
    <div className="hero-card bg-pastel-blue px-5 py-[18px] text-pastel-blue-ink">
      <div className="flex items-center justify-between gap-2">
        <span className={kicker}>September</span>
        <span className="inline-flex items-center gap-1 text-xs font-semibold">
          <Glyph name="check" className="size-3" />
          All 6 free
        </span>
      </div>
      <div className="mt-2.5 grid grid-cols-7 gap-[3px] text-center font-mono text-[10px]">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <b key={`${d}${i}`} className="pb-0.5 font-medium opacity-60">{d}</b>
        ))}
        {Array.from({ length: leadingBlanks(2027, 9) }, (_, i) => <i key={`blank-${i}`} />)}
        {HEAT.map((heat, i) => {
          const day = i + 1;
          const agreed = day >= 12 && day <= 19;
          return (
            <span
              key={day}
              className={cx("grid aspect-square place-items-center rounded-[6px]", agreed && "bg-pen text-sheet")}
              style={agreed ? undefined : { background: `color-mix(in srgb, var(--pen) ${heat * 5}%, transparent)` }}
            >
              {day}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function MoneyCard() {
  return (
    <div className="hero-card bg-pastel-green px-5 py-[18px] text-pastel-green-ink">
      <span className={kicker}>Each</span>
      <p className="mt-1.5 font-mono text-[34px] leading-none tracking-[-0.02em]">£177.00</p>
      <div className="mt-3 flex flex-col gap-[5px] text-xs">
        {[
          ["Flat, Palermo", "£960.00"],
          ["Car hire", "£102.00"],
        ].map(([what, cost]) => (
          <div key={what} className="flex justify-between gap-2 rounded-[10px] bg-sheet/60 px-2.5 py-1.5">
            <span>{what}</span>
            <span className="nums text-[11px]">{cost}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TicketCard() {
  return (
    <div className="hero-card bg-sheet text-ink">
      <div className="px-6 pb-[18px] pt-[22px]">
        <div className="flex items-start justify-between gap-3">
          <p className="font-display text-[46px] font-semibold leading-[0.95] tracking-[-0.035em]">Sicily</p>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-pen px-3 py-1 font-display text-xs font-semibold text-sheet">
            <Glyph name="check" className="size-[11px]" />
            Agreed
          </span>
        </div>
        <p className="mt-2 font-mono text-xs text-ink-soft">Sun 12 – Sun 19 Sep · 7 nights</p>
        <ol className="hero-route relative mt-[22px] grid grid-cols-4">
          {sampleStops.map((s, i) => (
            <li key={s.name} className="relative text-center text-xs">
              <i
                className={cx(
                  "mx-auto mb-1.5 block size-[13px] rounded-full border-2 border-sheet shadow-[0_0_0_1.5px_var(--pen)]",
                  i === 0 || i === sampleStops.length - 1 ? "bg-sheet" : "bg-pen",
                )}
              />
              {s.name}
              <span className="block font-mono text-[10px] text-ink-faint">
                {s.days} {s.days === 1 ? "night" : "nights"}
              </span>
            </li>
          ))}
        </ol>
      </div>
      <div className="hero-perf" />
      <div className="flex items-center gap-2.5 px-6 pb-5 pt-4 text-sm text-ink-soft">
        <AvatarRow people={sampleGroup} max={6} size={26} />
        6 going · all paid up
      </div>
    </div>
  );
}

function PackingCard() {
  return (
    <div className="hero-card bg-pastel-yellow px-5 py-[18px] text-pastel-yellow-ink">
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

/** The hero's trip pack: one settled trip, dealt as the cards a group would hand round. */
export function HeroPack() {
  return (
    <div className="hero-pack" aria-label="A sample trip to Sicily, planned by six friends" role="img">
      <div className="hero-slot hero-slot-dates"><DatesCard /></div>
      <div className="hero-slot hero-slot-money"><MoneyCard /></div>
      <div className="hero-slot hero-slot-ticket"><TicketCard /></div>
      <div className="hero-slot hero-slot-pack"><PackingCard /></div>
    </div>
  );
}
