"use client";

/**
 * Place search input (v1 ticket 09; provider swapped by v0.2 tickets 15/12).
 * Search runs through a server action passed in as a prop — no client-side
 * fetch to our own API. Falls back to a plain free-text name field when
 * Nominatim returns nothing (no match, unreachable, or rate-limited), so the
 * app degrades instead of breaking (CLAUDE.md rule 11).
 *
 * Debounced at 600ms: Nominatim's policy caps us at one request a second and
 * the server queue enforces it, so firing per keystroke would only build a
 * backlog the user is already past.
 */
import { useEffect, useRef, useState } from "react";

import { Field, Input, cx } from "./ui";

/** One Nominatim hit as the search action hands it over — `PlaceSearchResult`. */
type PlaceHit = {
  providerId: string;
  name: string;
  label: string;
  lat: number;
  lng: number;
  countryCode: string | null;
};

export type PlacePickerResult = {
  providerId: string | null;
  name: string;
  lat: number | null;
  lng: number | null;
  /** ISO alpha-2 from the chosen search hit — null for a typed name (ticket 95). */
  countryCode: string | null;
};

export function PlacePicker({
  label = "Place",
  name,
  defaultName = "",
  search,
  onSelect,
}: {
  label?: string;
  name: string;
  defaultName?: string;
  search: (query: string) => Promise<PlaceHit[]>;
  onSelect?: (result: PlacePickerResult) => void;
}) {
  const [query, setQuery] = useState(defaultName);
  const [results, setResults] = useState<PlaceHit[]>([]);
  // Set when the last search came back empty — a hint, not a latch: typing
  // again clears it and searching resumes (a transient Nominatim failure must
  // not strand the field in free-text mode for the rest of the session).
  const [noMatch, setNoMatch] = useState(false);
  const [selected, setSelected] = useState<PlacePickerResult | null>(
    defaultName
      ? { providerId: null, name: defaultName, lat: null, lng: null, countryCode: null }
      : null,
  );
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setNoMatch(false);
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const found = await search(query);
      setResults(found);
      // Nothing back → the typed name stands on its own rather than a dead end.
      setNoMatch(found.length === 0);
    }, 600);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query, search]);

  function choose(r: PlaceHit) {
    setQuery(r.name);
    setResults([]);
    setNoMatch(false);
    const result: PlacePickerResult = {
      providerId: r.providerId,
      name: r.name,
      lat: r.lat,
      lng: r.lng,
      countryCode: r.countryCode,
    };
    setSelected(result);
    onSelect?.(result);
  }

  return (
    <Field label={label} hint={noMatch ? "No match — using the name as typed." : undefined}>
      <div className="relative">
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setNoMatch(false);
            const result: PlacePickerResult = {
              providerId: null,
              name: e.target.value,
              lat: null,
              lng: null,
              countryCode: null,
            };
            setSelected(result);
            onSelect?.(result);
          }}
          placeholder="Search a place…"
          autoComplete="off"
        />
        {results.length > 0 ? (
          <ul className="absolute z-10 mt-1 w-full rounded-sm border border-rule-strong bg-sheet shadow-raised">
            {results.map((r) => (
              <li key={r.providerId}>
                <button
                  type="button"
                  onClick={() => choose(r)}
                  className={cx(
                    "block w-full px-2.5 py-1.5 text-left text-sm hover:bg-sheet-2",
                  )}
                >
                  {r.label}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {/* Hidden fields so a plain <form> submit carries the resolved place. */}
      <input type="hidden" name={`${name}Name`} value={selected?.name ?? query} />
      <input type="hidden" name={`${name}ProviderId`} value={selected?.providerId ?? ""} />
      <input type="hidden" name={`${name}Lat`} value={selected?.lat ?? ""} />
      <input type="hidden" name={`${name}Lng`} value={selected?.lng ?? ""} />
      <input
        type="hidden"
        name={`${name}CountryCode`}
        value={selected?.countryCode ?? ""}
      />
    </Field>
  );
}
