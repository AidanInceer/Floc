"use dom";

/**
 * The travel globe on the phone (#468): the website's own globe, run in a web view as notes runs its editor (ADR-014),
 * so both draw from one package and look the same.
 */
import "@floc/globe/travel-globe.css";

import { InstrumentSans_400Regular } from "@expo-google-fonts/instrument-sans/400Regular";
import { countriesFrom, type Geo } from "@floc/globe/countries";
import { TravelGlobe, type MapState } from "@floc/globe/view/travel-globe";
import type { DOMProps } from "expo/dom";
import { useMemo } from "react";

import COUNTRY_SHAPES from "@/lib/countries-110m.json";
import { pageCss } from "@/lib/notes/page-css";

// Why the unwrap: in a web bundle a font module is its URL, or an object that holds it.
const url = (asset: unknown): string | undefined => {
  if (typeof asset === "string") return asset;
  const held = asset as { uri?: unknown; default?: unknown } | null;
  return typeof held?.uri === "string" ? held.uri : typeof held?.default === "string" ? held.default : undefined;
};

type Props = {
  dom?: DOMProps;
  states: Record<string, MapState>;
  theme: "light" | "dark";
  /** A tap on a country. Left out, a tap only names it. */
  onPick?: (code: string) => Promise<void>;
};

export default function TravelGlobeDom({ states, theme, onPick }: Props) {
  const land = useMemo(() => countriesFrom(COUNTRY_SHAPES as Geo), []);
  const css = useMemo(() => pageCss(theme, { sans: url(InstrumentSans_400Regular) }), [theme]);
  return (
    <>
      <style>{css}</style>
      <TravelGlobe land={land} states={states} onPick={onPick ? (code) => void onPick(code) : undefined} />
    </>
  );
}
