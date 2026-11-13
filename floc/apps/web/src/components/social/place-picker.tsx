"use client";

// Place search input (v1 ticket 09). Falls back to free-text when Nominatim
// returns nothing (rule 11). Debounced 600ms — Nominatim caps at 1 req/s.
import { useEffect, useRef, useState, type ChangeEvent } from "react";

import { TEXT_CAPS } from "@floc/core/text/text";

import { Field, Input, cx, panelFieldClass, panelTitleClass } from "../system/ui";

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
  countryCode: string | null; // null for a typed name (ticket 95)
};

type PickerLook = "box" | "panel" | "display";

const LOOK: Record<Exclude<PickerLook, "box">, string> = {
  panel: panelFieldClass,
  display: "block w-full border-0 border-b-[1.5px] border-current/30 bg-transparent pb-1.5 pt-0.5 font-display text-[25px] font-semibold leading-tight tracking-[-0.015em] text-inherit transition-colors hover:border-current/55 focus:border-current focus:outline-none max-sm:text-[20px]",
};

export function PlacePicker({
  label = "Place",
  name,
  defaultName = "",
  search,
  onSelect,
  look = "box",
}: {
  label?: string;
  name: string;
  defaultName?: string;
  search: (query: string) => Promise<PlaceHit[]>;
  onSelect?: (result: PlacePickerResult) => void;
  /** `line` and `display` are the Days dialogs' quieter fields (wireframe/modal-forms B3). */
  look?: PickerLook;
}) {
  const [query, setQuery] = useState(defaultName);
  const [results, setResults] = useState<PlaceHit[]>([]);
  // Hint, not a latch — typing again clears it, so a transient failure
  // doesn't strand the field in free-text mode.
  const [noMatch, setNoMatch] = useState(false);
  const [selected, setSelected] = useState<PlacePickerResult | null>(
    defaultName
      ? { providerId: null, name: defaultName, lat: null, lng: null, countryCode: null }
      : null,
  );
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The default name is an answer, not a question — searching it on mount
  // would suggest the place already chosen. Cleared on first keystroke.
  const untouched = useRef(Boolean(defaultName));

  useEffect(() => {
    if (untouched.current) return;
    if (!query.trim()) {
      setResults([]);
      setNoMatch(false);
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const found = await search(query);
      setResults(found);
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

  const hint = noMatch ? "No match — using the name as typed." : undefined;
  const fieldProps = {
    value: query,
    autoComplete: "off",
    maxLength: TEXT_CAPS.placeName,
    onChange: (e: ChangeEvent<HTMLInputElement>) => {
      untouched.current = false;
      setQuery(e.target.value);
      setNoMatch(false);
      const result: PlacePickerResult = { providerId: null, name: e.target.value, lat: null, lng: null, countryCode: null };
      setSelected(result);
      onSelect?.(result);
    },
  };
  const inner = (
    <>
      <div className="relative">
        {look === "box" ? <Input {...fieldProps} /> : <input {...fieldProps} autoFocus={look === "display"} className={LOOK[look]} />}
        {results.length > 0 ? (
          <ul className="absolute z-10 mt-1 w-full rounded-sm border border-rule-strong bg-sheet text-ink shadow-raised">
            {results.map((r) => (
              <li key={r.providerId}>
                <button
                  type="button"
                  onClick={() => choose(r)}
                  className="block w-full px-2.5 py-1.5 text-left font-sans text-sm font-normal tracking-normal hover:text-pen"
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
      <input type="hidden" name={`${name}CountryCode`} value={selected?.countryCode ?? ""} />
    </>
  );

  if (look === "box") return <Field label={label} hint={hint}>{inner}</Field>;
  return (
    <label className="block">
      <span className={look === "display" ? "mb-1 block font-mono text-xs opacity-75" : cx(panelTitleClass, "mb-2")}>{label}</span>
      {inner}
      {hint ? <span className="mt-1 block text-xs opacity-75">{hint}</span> : null}
    </label>
  );
}
