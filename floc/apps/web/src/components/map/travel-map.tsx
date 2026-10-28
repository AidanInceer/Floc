"use client";

// The travel map on a profile (#468): the shared paper globe, as a dome in its panel, with the countries
// someone has been to (green) and wants to go to (highlight). A tap cycles blank → want to go → been there → blank;
// the server maps "blank" over a trip-claimed country to a `none` row rather than a delete (app/profile/actions.ts).
import "@floc/globe/travel-globe.css";

import { COUNTRIES } from "@floc/core/people/countries";
import { nextMark } from "@floc/core/itinerary/travel-map";
import { TravelGlobe, type MapState, type TravelGlobeHandle } from "@floc/globe/view/travel-globe";
import { useEffect, useRef, useState, useTransition } from "react";

import { Input, cx } from "../system/ui";
import { useCountries } from "./use-countries";

export type { MapState };
/** What a click asks for — the displayed state, not the stored row. */
export type NextState = MapState | "blank";

const WORD: Record<MapState, string> = { green: "been there", yellow: "want to go" };

export function TravelMap({
  title,
  states,
  setMark,
}: {
  title: string;
  /** Country code → colour, trips and hand already merged by @floc/core/itinerary/travel-map. */
  states: Record<string, MapState>;
  /** Server action. Given, the map is yours to mark; left out, it is someone else's and only names what you tap. */
  setMark?: (code: string, next: NextState) => Promise<void>;
}) {
  // Optimistic; a failed write is corrected by the revalidate resetting `states`.
  const [local, setLocal] = useState(states);
  const [filter, setFilter] = useState("");
  const [, startTransition] = useTransition();
  const land = useCountries();
  const globe = useRef<TravelGlobeHandle>(null);
  const latest = useRef(local);
  latest.current = local;

  useEffect(() => setLocal(states), [states]);

  function paint(code: string) {
    if (!setMark) return;
    const next = nextMark(latest.current[code]);
    setLocal((prev) => {
      const copy = { ...prev };
      if (next === "blank") delete copy[code];
      else copy[code] = next;
      return copy;
    });
    startTransition(async () => {
      await setMark(code, next);
    });
  }

  const visited = Object.values(local).filter((s) => s === "green").length;
  const wantToGo = Object.values(local).filter((s) => s === "yellow").length;
  // Results only while you're typing: the full list was 200 rows of scroll for the handful you'd ever click.
  const needle = filter.trim().toLowerCase();
  const listed = needle ? COUNTRIES.filter((c) => c.name.toLowerCase().includes(needle)) : [];

  return (
    <section className="overflow-hidden rounded-md bg-sheet">
      <TravelGlobe ref={globe} land={land} states={local} onPick={setMark ? paint : undefined} title={title} />

      <div className="flex flex-col gap-4 px-6 pb-6">
        {/* Status is never colour alone — the key names both fills, and the count says the same in words. */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft">
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="travel-key travel-key-green" />
            Been there
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="travel-key travel-key-yellow" />
            Want to go
          </span>
          <span>
            {visited} visited · {wantToGo} want to go
          </span>
        </div>

        {setMark ? (
          <div>
            {/* The keyboard path, and the way to a country too small to tap. */}
            <Input value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Find a country" autoComplete="off" />
            {needle ? (
              <ul className="mt-2 max-h-64 overflow-y-auto rounded-md bg-sheet-2">
                {listed.length === 0 ? (
                  <li className="px-2.5 py-2 text-sm text-ink-soft">No country by that name.</li>
                ) : (
                  listed.map((c) => {
                    const state = local[c.code];
                    return (
                      <li key={c.code}>
                        <button
                          type="button"
                          onClick={() => {
                            paint(c.code);
                            globe.current?.show(c.code);
                          }}
                          aria-pressed={Boolean(state)}
                          className="flex w-full items-center gap-2 rounded-sm px-2.5 py-1.5 text-left text-sm hover:bg-sheet-3"
                        >
                          <span aria-hidden className={cx("travel-key", state && `travel-key-${state}`)} />
                          <span className="flex-1">{c.name}</span>
                          <span className="text-xs text-ink-faint">{state ? WORD[state] : ""}</span>
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
