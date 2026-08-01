/**
 * The travel map's pure half (ticket 95) — the shape of the drawing, and the
 * rules for merging what a trip claims about you with what you've said by hand.
 *
 * This file used to be the whole feature, with a comment banner splitting the
 * pure half from the loaders. Ticket 107 turned that banner into the directory
 * boundary: the queries live in `server/travel-map.ts`, and everything here is
 * importable from a Client Component.
 *
 * The one decision that shapes both halves: **trip marks are derived on read
 * and never stored.** Green is triggered by `hasEnded` — by *time passing*, not
 * by a write — so there is no event to materialise on short of a cron job, and
 * the fan-out (a trip ends, a day gains a place, a place is deleted, a
 * membership changes, an archive, a restore) would each have to remember to
 * recompute. Deriving costs two queries and is always right.
 *
 * What *is* stored is the hand-painted marks, in `user_country_mark`, and they
 * win permanently. A `none` row is not the absence of a mark: it's "no, I
 * didn't go", which is how you take back a claim a trip is making on your
 * behalf after its dates have passed.
 */
import type { CountryMarkState } from "@/db/schema";

/** What a country can look like on the drawing. Absent means unpainted. */
export type MapState = "green" | "yellow";

export type TravelMap = {
  /** Country code → colour, trips and hand merged. The thing that gets drawn. */
  states: Record<string, MapState>;
  /**
   * The hand-painted rows on their own, `none` included — the editor needs
   * them to know what clicking again should do next.
   */
  manual: Record<string, CountryMarkState>;
  visited: number;
  wantToGo: number;
};

/**
 * Trip marks + hand marks → what's drawn.
 *
 * Two rules, and between them they answer every case that came up:
 *  - **Green beats yellow** when two trips disagree. Been-there outranks
 *    want-to-go, so an upcoming trip can't demote a country you've been to.
 *  - **A hand mark wins outright**, `none` included, and a country carrying one
 *    ignores the trips entirely rather than merging with them.
 */
export function mergeMarks(
  derived: Record<string, MapState>,
  manual: Record<string, CountryMarkState>,
): TravelMap {
  const states: Record<string, MapState> = {};

  for (const [code, state] of Object.entries(derived)) {
    if (code in manual) continue;
    states[code] = state;
  }
  for (const [code, state] of Object.entries(manual)) {
    if (state !== "none") states[code] = state;
  }

  const values = Object.values(states);
  return {
    states,
    manual,
    visited: values.filter((s) => s === "green").length,
    wantToGo: values.filter((s) => s === "yellow").length,
  };
}

/** Green wins — see `mergeMarks`. Used while folding rows together. */
export function strongest(a: MapState | undefined, b: MapState): MapState {
  return a === "green" || b === "green" ? "green" : "yellow";
}
