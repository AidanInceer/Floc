import type { TransportType } from "@floc/core/vocabulary";
import type { PresetTrip } from "@floc/core/trip/explore/preset-trips";

import { routeParts } from "@/components/explore/listing";
import { LineIcon } from "@/components/system/icons";

const MODE: Record<TransportType, string[]> = {
  flight: ["M12.4 2.4 6.2 8.6M12.4 2.4l-4 9.8-2.2-3.6-3.6-2.2Z"],
  train: ["M4.8 1.8h4.4A1.8 1.8 0 0 1 11 3.6v4.8a1.8 1.8 0 0 1-1.8 1.8H4.8A1.8 1.8 0 0 1 3 8.4V3.6a1.8 1.8 0 0 1 1.8-1.8Z", "M3 6.4h8M5 12.2l1-2M9 12.2l-1-2"],
  car: ["M2 9.4V7.2l1.3-3a1 1 0 0 1 .9-.6h5.6a1 1 0 0 1 .9.6l1.3 3v2.2H2ZM2 7.2h10", "M4.4 9.9a1 1 0 1 0 0 2 1 1 0 0 0 0-2ZM9.6 9.9a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"],
  ferry: ["M2.2 8.2h9.6l-1.4 3H3.6ZM4.2 8.2V5.4h5.6v2.8M7 5.4V2.6"],
  other: ["M2.4 7h9.2M8 3.4 11.6 7 8 10.6"],
};

function ModeIcon({ mode, className }: { mode: TransportType; className?: string }) {
  return (
    <LineIcon className={className}>
      {MODE[mode].map((d) => (
        <path key={d} d={d} />
      ))}
    </LineIcon>
  );
}

const nightsOf = (n: number) => `${n} ${n === 1 ? "night" : "nights"}`;
// The line down the rail: it starts at the first stay's dot and ends at the last one's.
const rail =
  "relative pl-6 after:absolute after:bottom-0 after:left-[7px] after:top-0 after:border-l-[1.5px] after:border-rule-strong first:after:top-3.5 last:after:bottom-[calc(100%-0.875rem)]";

/** The route top to bottom: where you sleep and for how long, and how you move between. */
export function RouteRail({ trip }: { trip: PresetTrip }) {
  return (
    <ol>
      {routeParts(trip).map((part, i) =>
        part.kind === "stay" ? (
          <li
            key={`stay-${i}`}
            className={`${rail} flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 py-0.5 text-sm before:absolute before:left-[3px] before:top-[9px] before:z-[1] before:size-[9.5px] before:rounded-full before:border-[1.5px] before:border-ink before:bg-sheet`}
          >
            <b className="font-medium">{part.place}</b>
            <span className="nums text-xs text-ink-faint">{nightsOf(part.nights)}</span>
            {part.dayTrips.map((out) => (
              <span key={out.text} className="flex basis-full items-center gap-1.5 text-[12.5px] text-ink-soft">
                <ModeIcon mode={out.mode} />
                {out.text}
              </span>
            ))}
          </li>
        ) : (
          <li key={`move-${i}`} className={`${rail} flex items-center py-0.5 text-xs text-ink-soft`}>
            <ModeIcon mode={part.mode} className="absolute left-0 top-1/2 z-[1] size-[15px] -translate-y-1/2 rounded-full bg-sheet p-px" />
            <span className="nums">{part.text}</span>
          </li>
        ),
      )}
    </ol>
  );
}
