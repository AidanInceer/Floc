/**
 * The travel map on the phone (#468): the website's globe, drawn by the same package in a web view, with the key
 * and the counts beneath it in the app's own type. Colour never stands alone (#204).
 *
 * TAP CYCLES, SAME ORDER AS THE WEB. blank → yellow → green → blank. `blank` over a country a trip still claims is a
 * rejection row, not a delete — the host tells the two apart, so this only ever says what was tapped.
 */
import { nextMark } from "@floc/core/itinerary/travel-map";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { useTheme } from "../system/theme";
import { Body } from "../system/ui";
import { space } from "@/lib/theme";
import TravelGlobeDom from "./travel-globe-dom";

export type MapState = "green" | "yellow";
/** What a tap asks for — the displayed state, not the stored row. */
export type NextState = MapState | "blank";
export type CountryMark = { code: string; state: MapState };

// The web's height for a narrow screen (travel-globe.css), so the dome sits the same.
const HEIGHT = 330;

const byCode = (marks: CountryMark[]) => Object.fromEntries(marks.map((m) => [m.code, m.state])) as Record<string, MapState>;

export function TravelMap({
  marks,
  onSet,
}: {
  marks: CountryMark[];
  /** Given, the map is yours to mark; left out, it is someone else's and a tap only names a country. */
  onSet?: (code: string, next: NextState) => void;
}) {
  const { theme } = useTheme();
  // Optimistic: a failed write is corrected when `marks` refetches.
  const [local, setLocal] = useState(() => byCode(marks));

  // The server is the truth, and it changes under us — the mark sheet writes through the same mutation, so a
  // refetch is how its marks reach this map. Adjusting during render: an effect would draw the stale fills first.
  const [seen, setSeen] = useState(marks);
  if (seen !== marks) {
    setSeen(marks);
    setLocal(byCode(marks));
  }

  async function pick(code: string) {
    if (!onSet) return;
    const next = nextMark(local[code]);
    setLocal((prev) => {
      const copy = { ...prev };
      if (next === "blank") delete copy[code];
      else copy[code] = next;
      return copy;
    });
    onSet(code, next);
  }

  const values = Object.values(local);
  return (
    <View style={{ gap: space.md }}>
      {/* Keyed on the theme: the web view reads its colours once, from the page it was given. Why no nested scroll:
          Android's web view otherwise keeps every touch, and a vertical swipe on the globe never scrolls the page (#468). */}
      <TravelGlobeDom
        key={theme}
        states={local}
        theme={theme}
        onPick={onSet ? pick : undefined}
        dom={{ style: { height: HEIGHT }, scrollEnabled: false, nestedScrollEnabled: false }}
      />
      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: space.md, paddingHorizontal: space.lg }}>
        <Key word="Been there" tone="green-2" edge="green-edge" />
        <Key word="Want to go" tone="highlight" edge="highlight-edge" />
        <Body tone="ink-2">
          {values.filter((s) => s === "green").length} visited · {values.filter((s) => s === "yellow").length} want to go
        </Body>
      </View>
    </View>
  );
}

function Key({ word, tone, edge }: { word: string; tone: "green-2" | "highlight"; edge: "green-edge" | "highlight-edge" }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.xs }}>
      <View
        style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: c[tone], borderColor: c[edge], borderWidth: StyleSheet.hairlineWidth }}
      />
      <Body tone="ink-2">{word}</Body>
    </View>
  );
}
