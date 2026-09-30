import { TravelModeIcon } from "@/components/map/travel-mode-icon";
import type { BorrowStop } from "@/lib/landing/borrow";
import type { JourneyFrame } from "@/lib/landing/journey";
import "./nights-bar.css";

const MODE_WORD = { flight: "Fly", train: "Train", car: "Drive", ferry: "Ferry", other: "Travel" } as const;

/** The trip's nights laid end to end, one stretch per stop, sized by its nights. */
export function NightsBar({ stops, frame }: { stops: BorrowStop[]; frame: JourneyFrame }) {
  return (
    <ol className="mt-[18px] flex gap-1">
      {stops.map((s, i) => (
        <li key={s.name} className="flex min-w-0 flex-col" style={{ flex: s.nights }}>
          <span
            className="mb-1.5 flex h-3.5 items-center text-ink-faint transition-opacity duration-300"
            style={{ opacity: s.hop && frame.reached[i] ? 1 : 0 }}
            title={s.hop && `${MODE_WORD[s.hop.mode]} · ${s.hop.detail}`}
          >
            {s.hop && <TravelModeIcon mode={s.hop.mode} size={12} />}
          </span>
          <span className="nights-bar" style={{ "--n": s.nights } as React.CSSProperties}>
            <i style={{ transform: `scaleX(${frame.fill[i]})` }} />
          </span>
          <b className="mt-[9px] truncate text-[12.5px] font-medium" title={s.name}>
            {s.name}
          </b>
          <span className="nums text-[10.5px] text-ink-faint">
            {s.nights}
            <span aria-hidden>n</span>
            <span className="sr-only"> {s.nights === 1 ? "night" : "nights"}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
