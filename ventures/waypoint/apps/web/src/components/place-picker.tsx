"use client";

/**
 * Place search input (ticket 09/15). Search runs through a server action
 * passed in as a prop — no client-side fetch to our own API by default. Falls
 * back to a plain free-text name field when Mapbox returns nothing (no token
 * configured, or no matches), so the app degrades instead of breaking.
 */
import { useEffect, useRef, useState } from "react";

import { Field, Input, cx } from "./ui";

export type PlacePickerResult = {
  mapboxId: string | null;
  name: string;
  lat: number | null;
  lng: number | null;
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
  search: (query: string) => Promise<{ mapboxId: string; name: string; lat: number; lng: number }[]>;
  onSelect?: (result: PlacePickerResult) => void;
}) {
  const [query, setQuery] = useState(defaultName);
  const [results, setResults] = useState<
    { mapboxId: string; name: string; lat: number; lng: number }[]
  >([]);
  const [freeText, setFreeText] = useState(false);
  const [selected, setSelected] = useState<PlacePickerResult | null>(
    defaultName ? { mapboxId: null, name: defaultName, lat: null, lng: null } : null,
  );
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!query.trim() || freeText) {
      setResults([]);
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const found = await search(query);
      setResults(found);
      // No matches at all → offer the free-text fallback rather than a dead end.
      if (found.length === 0) setFreeText(true);
    }, 300);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query, freeText, search]);

  function choose(r: { mapboxId: string; name: string; lat: number; lng: number }) {
    setQuery(r.name);
    setResults([]);
    const result: PlacePickerResult = { mapboxId: r.mapboxId, name: r.name, lat: r.lat, lng: r.lng };
    setSelected(result);
    onSelect?.(result);
  }

  return (
    <Field label={label} hint={freeText ? "No Mapbox match — using a free-text name." : undefined}>
      <div className="relative">
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            const result: PlacePickerResult = { mapboxId: null, name: e.target.value, lat: null, lng: null };
            setSelected(result);
            onSelect?.(result);
          }}
          placeholder="Search a place…"
          autoComplete="off"
        />
        {results.length > 0 ? (
          <ul className="absolute z-10 mt-1 w-full rounded-sm border border-rule-strong bg-sheet shadow-raised">
            {results.map((r) => (
              <li key={r.mapboxId}>
                <button
                  type="button"
                  onClick={() => choose(r)}
                  className={cx(
                    "block w-full px-2.5 py-1.5 text-left text-sm hover:bg-sheet-2",
                  )}
                >
                  {r.name}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {/* Hidden fields so a plain <form> submit carries the resolved place. */}
      <input type="hidden" name={`${name}Name`} value={selected?.name ?? query} />
      <input type="hidden" name={`${name}MapboxId`} value={selected?.mapboxId ?? ""} />
      <input type="hidden" name={`${name}Lat`} value={selected?.lat ?? ""} />
      <input type="hidden" name={`${name}Lng`} value={selected?.lng ?? ""} />
    </Field>
  );
}
