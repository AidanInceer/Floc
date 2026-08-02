/**
 * The trail — the six tabs drawn as a route with a marker at where the trip
 * actually is (v0.2 ticket 07). It is the hero's content, not decoration: it
 * says the same thing the "up to" sentence does, spatially.
 *
 * Every station's state is derived from what data exists — there is no
 * lifecycle column and this must never become one (CLAUDE.md rule 4).
 *
 * One hue, blue, doing one job: how far along you are. A filled dot is
 * finished, a hollow blue one is under way, a beige one is untouched — and the
 * key underneath says so, because a fill nobody can decode is decoration. "You
 * are here" is a halo on top of the hollow dot, never a second colour: an amber
 * marker made the trail read as an error state, and there is nothing for a
 * second hue here to mean. Every station carries a word regardless, so nothing
 * rests on the fill alone.
 */
import { cx } from "@/components/ui";

/**
 * `done` — nothing outstanding. `now` — where the group is working; there is
 * at most one. `snag` — has data but something is still open. `ahead` — not
 * started, nothing wrong. `locked` — the tab isn't open yet.
 */
/*
 * Both types are `lib/trip-state.ts`'s (ticket 109) and re-exported here for
 * the component's own callers. The vocabulary belongs with the derivation that
 * produces it, not with the drawing that renders it — and the caption, which
 * must never be omitted because the fill is never the only cue, is decided
 * there too.
 */
import type { StationState, TrailStation as Station } from "@/lib/trip-state";

export type { StationState, Station };

/*
 * Three readings, and the fill is what tells them apart:
 *
 *   filled blue    — done. Nothing outstanding here.
 *   hollow blue    — started, not settled (`snag`, and `now`, which adds a halo
 *                    to say the group is working here right now).
 *   beige, empty   — nothing yet (`ahead`), or not open yet (`locked`, dashed).
 *
 * `now` used to be a *filled* dot, which made "where we're working" and
 * "finished" the same shape — the one distinction the trail exists to draw.
 * The caption under every dot still says the same thing in words.
 */
const DOT: Record<StationState, string> = {
  done: "border-pen bg-pen",
  now: "border-[3px] border-pen bg-sheet ring-4 ring-pen-soft",
  snag: "border-[3px] border-pen bg-sheet",
  ahead: "border-rule-strong bg-sheet-3",
  locked: "border-dashed border-rule-strong bg-sheet-3",
};

const KEY: { dot: string; text: string }[] = [
  { dot: "border-pen bg-pen", text: "done" },
  { dot: "border-[3px] border-pen bg-sheet", text: "started" },
  { dot: "border-rule-strong bg-sheet-3", text: "nothing yet" },
  { dot: "border-dashed border-rule-strong bg-sheet-3", text: "not open yet" },
];

const LABEL: Record<StationState, string> = {
  done: "text-ink-soft",
  now: "font-bold text-pen",
  snag: "text-pen",
  ahead: "text-ink-faint",
  locked: "text-rule-strong",
};

const CAPTION: Record<StationState, string> = {
  done: "text-ink-faint",
  now: "text-ink-faint",
  snag: "font-bold text-pen",
  ahead: "text-ink-faint",
  locked: "text-rule-strong",
};

export function TripTrail({ stations }: { stations: Station[] }) {
  return (
    <nav className="mt-5" aria-label="Where the planning is at">
      <ol className="flex items-start">
        {stations.map((s, i) => {
          // The connector belongs to the station on its right and is drawn
          // solid once the ground behind it is covered.
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

      {/* The key is the point of this change: the fills had meanings and no way
          to learn them. Marked aria-hidden — the captions already say each
          station's state in words, so this is a legend for the eye only. */}
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
