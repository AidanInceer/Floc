/**
 * Where the trip goes, plotted (ticket 296).
 *
 * NOT A TILE MAP. There is no map library in this app and adding one is its
 * own decision — tiles mean an API key, an attribution surface, a cache and a
 * per-request cost, none of which Overview needs to answer "roughly where is
 * this trip". So this plots the places against their own bounding box: the
 * shape of the route, in the trip's own colours, with the names underneath.
 *
 * A place with no coordinates simply does not plot (rule 11). It is still
 * named below, because the *list* is the thing that must be complete.
 *
 * The plot is decoration and is hidden from the screen reader; the names below
 * carry everything it says.
 */
import { StyleSheet, View } from "react-native";

import { useTheme } from "./theme";
import { Body, Figure } from "./ui";
import { radius, space } from "@/lib/theme";

export type PlottablePlace = {
  id: number;
  name: string;
  lat: number | null;
  lng: number | null;
};

const HEIGHT = 150;
const DOT = 9;
/** Keeps a dot off the edge, and gives a single place somewhere to sit. */
const INSET = 0.12;

type Point = { id: number; x: number; y: number };

/**
 * Normalises to the places' own bounding box, so a city trip fills the frame
 * as readably as a country-crossing one. A degenerate box — one place, or
 * several at the same spot — centres rather than dividing by zero.
 */
function plot(places: PlottablePlace[]): Point[] {
  const located = places.filter(
    (p): p is PlottablePlace & { lat: number; lng: number } =>
      p.lat !== null && p.lng !== null,
  );
  if (located.length === 0) return [];

  const lats = located.map((p) => p.lat);
  const lngs = located.map((p) => p.lng);
  const spanLat = Math.max(...lats) - Math.min(...lats);
  const spanLng = Math.max(...lngs) - Math.min(...lngs);

  const place = (value: number, min: number, span: number) =>
    span === 0 ? 0.5 : INSET + ((value - min) / span) * (1 - INSET * 2);

  return located.map((p) => ({
    id: p.id,
    x: place(p.lng, Math.min(...lngs), spanLng),
    // Latitude climbs north but a screen's y climbs down, so this inverts.
    y: 1 - place(p.lat, Math.min(...lats), spanLat),
  }));
}

export function PlacePlot({ places }: { places: PlottablePlace[] }) {
  const { c } = useTheme();
  const points = plot(places);

  return (
    <View style={{ gap: space.md }}>
      {points.length > 0 ? (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{
            height: HEIGHT,
            backgroundColor: c["sheet-2"],
            borderColor: c.rule,
            borderWidth: StyleSheet.hairlineWidth,
            borderRadius: radius.md,
          }}
        >
          {points.map((point) => (
            <View
              key={point.id}
              style={{
                position: "absolute",
                left: `${point.x * 100}%`,
                top: `${point.y * 100}%`,
                width: DOT,
                height: DOT,
                marginLeft: -DOT / 2,
                marginTop: -DOT / 2,
                borderRadius: DOT / 2,
                backgroundColor: c.pen,
              }}
            />
          ))}
        </View>
      ) : null}

      <Body>{places.map((p) => p.name).join(" → ")}</Body>
      <Figure tone="ink-2">
        {places.length} {places.length === 1 ? "place" : "places"}
      </Figure>
    </View>
  );
}
