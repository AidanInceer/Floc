// The trail — tabs drawn as a route with a marker at where the trip actually
// is (v0.2 ticket 07). Every station's state is derived from what data exists
// — no lifecycle column, and this must never become one (CLAUDE.md rule 4).
//
// One hue (blue) doing one job: filled = finished, hollow = under way, beige
// = untouched, with a key underneath since a fill nobody can decode is
// decoration. "You are here" is a halo on the hollow dot, never a second
// colour — every station also carries a word, so nothing rests on fill alone.
import { cx } from "@/components/ui";

// `done`/`now`/`snag`/`ahead` — types live in lib/trip-state.ts (ticket 109),
// re-exported here; no shut state since every tab is open from day one (ticket 126).
import type { StationState, TrailStation as Station } from "@/lib/trip-state";

export type { StationState, Station };

// `now` was a filled dot until it collided visually with `done`.
const DOT: Record<StationState, string> = {
  done: "border-pen bg-pen",
  now: "border-[3px] border-pen bg-sheet ring-4 ring-pen-soft",
  snag: "border-[3px] border-pen bg-sheet",
  ahead: "border-rule-strong bg-sheet-3",
};

const KEY: { dot: string; text: string }[] = [
  { dot: "border-pen bg-pen", text: "done" },
  { dot: "border-[3px] border-pen bg-sheet", text: "started" },
  { dot: "border-rule-strong bg-sheet-3", text: "nothing yet" },
];

const LABEL: Record<StationState, string> = {
  done: "text-ink-soft",
  now: "font-bold text-pen",
  snag: "text-pen",
  ahead: "text-ink-faint",
};

const CAPTION: Record<StationState, string> = {
  done: "text-ink-faint",
  now: "text-ink-faint",
  snag: "font-bold text-pen",
  ahead: "text-ink-faint",
};

export function TripTrail({ stations }: { stations: Station[] }) {
  return (
    <nav className="mt-5" aria-label="Where the planning is at">
      <ol className="flex items-start">
        {stations.map((s, i) => {
          // Connector belongs to the station on its right, solid once behind it is covered.
          const prev = stations[i - 1];
          const covered = prev && (prev.state === "done" || prev.state === "now");
          return (
            <li key={s.key} className="relative flex-1 pt-5 text-center">
              {i > 0 ? (
                <span
                  aria-hidden="true"
                  className={cx(
                    "absolute top-[6px] -left-1/2 w-full border-t-2",
                    covered ? "border-solid border-pen" : "border-dotted border-rule-strong",
                  )}
                />
              ) : null}
              <span
                aria-hidden="true"
                className={cx(
                  "absolute top-0 left-1/2 h-[13px] w-[13px] -translate-x-1/2 rounded-full border-2",
                  DOT[s.state],
                )}
              />
              <span className={cx("block text-xs", LABEL[s.state])}>{s.label}</span>
              <span className={cx("block text-[10.5px]", CAPTION[s.state])}>
                {s.caption}
              </span>
            </li>
          );
        })}
      </ol>

      {/* aria-hidden: captions already say each station's state in words. */}
      <ul
        aria-hidden="true"
        className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[10.5px] text-ink-faint"
      >
        {KEY.map((k) => (
          <li key={k.text} className="flex items-center gap-1.5">
            <span
              className={cx(
                "inline-block h-[11px] w-[11px] rounded-full border-2",
                k.dot,
              )}
            />
            {k.text}
          </li>
        ))}
      </ul>
    </nav>
  );
}
