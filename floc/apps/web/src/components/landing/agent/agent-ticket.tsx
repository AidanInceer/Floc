import type { CSSProperties } from "react";

import { AvatarRow, cx } from "@/components/system/ui";
import type { LaneRow } from "@/lib/landing/agent/agent-lanes";

import { Swap } from "../hero/swap";
import { Glyph, type GlyphName } from "../landing-glyph";
import { sampleGroup, sampleStops } from "../sample-trip";

const ROWS: { row: LaneRow; glyph: GlyphName; name: string; count: string }[] = [
  { row: "booked", glyph: "stay", name: "Booked", count: "8" },
  { row: "picks", glyph: "eat", name: "Local picks", count: "7" },
  { row: "pack", glyph: "packing", name: "To pack", count: "9" },
];

/** The trip every lane feeds: it fills row by row, then takes the stamp. */
export function AgentTicket({ rows, stampAt, t }: { rows: Record<LaneRow, number>; stampAt: number; t: number }) {
  const on = (row: LaneRow) => t >= rows[row];
  return (
    <div className="rounded-[22px] border border-rule bg-sheet shadow-lifted">
      <div className="px-6 pb-[18px] pt-[22px]">
        <div className="flex items-start justify-between gap-3">
          <p className="font-display text-[50px] font-semibold leading-[0.95] tracking-[-0.035em]">Sicily</p>
          <span className={cx("deck-stamp mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-pen px-3 py-1 font-display text-xs font-semibold text-sheet", t >= stampAt && "is-on")}>
            <Glyph name="check" className="size-[11px]" />
            Planned
          </span>
        </div>
        <p className="mt-2 font-mono text-xs text-ink-soft">
          <Swap on={on("dates")} from="Dates open · 6 asked" to="Sun 12 – Sun 19 Sep · 7 nights" />
        </p>
        <ol className={cx("deck-route relative mt-[22px] grid grid-cols-4", on("route") && "is-drawn")}>
          {sampleStops.map((s, i) => (
            <li key={s.name} className="deck-stop text-center text-xs" style={{ "--delay": `${0.15 + i * 0.3}s` } as CSSProperties}>
              <i className="mx-auto mb-1.5 block size-[13px] rounded-full border-2 border-sheet bg-pen shadow-[0_0_0_1.5px_var(--pen)]" />
              {s.name}
              <span className="nums block font-mono text-[10px] text-ink-faint">
                {s.days} {s.days === 1 ? "night" : "nights"}
              </span>
            </li>
          ))}
        </ol>
      </div>
      <div className="deck-perf" />
      <ul className="grid gap-[9px] px-6 pb-1 pt-4">
        {ROWS.map(({ row, glyph, name, count }) => (
          <li key={row} className={cx("grid grid-cols-[14px_1fr_auto] items-center gap-2.5 text-[13.5px] transition-colors duration-300", on(row) ? "text-ink" : "text-ink-faint")}>
            <Glyph name={glyph} />
            <span>{name}</span>
            <b className="nums font-semibold">
              <Swap on={on(row)} from="–" to={count} />
            </b>
          </li>
        ))}
        <li className={cx("grid grid-cols-[14px_1fr_auto] items-center gap-2.5 text-[13.5px] transition-colors duration-300", on("yours") ? "text-ink" : "text-ink-faint")}>
          <Glyph name="flight" className={cx(on("yours") && "text-pen")} />
          <span>Flights, yours to book</span>
          <span className={cx("rounded-full bg-pen px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.06em] text-sheet transition-opacity duration-300", !on("yours") && "opacity-0")}>
            Book
          </span>
        </li>
      </ul>
      <div className="flex items-center gap-2.5 px-6 pb-5 pt-3.5 text-[13px] text-ink-soft">
        <AvatarRow people={sampleGroup} max={6} size={24} />
        <span>6 going</span>
        <b className={cx("nums ml-auto font-semibold transition-colors duration-300", on("money") ? "text-green" : "text-ink")}>
          <Swap on={on("money")} from="£900 each" to="£861 each" />
        </b>
      </div>
    </div>
  );
}
