/**
 * Where the trip goes, on a real map (#no-ticket — the app half of the web's
 * `route-map.tsx`).
 *
 * REPLACES THE DOT PLOT. `place-plot.tsx` drew the places against their own
 * bounding box because the app had no map library; it has one now, and a plot
 * that answers "roughly where" is strictly worse than a map that answers it
 * exactly. The plot's other job survives here: the names stay underneath, and
 * a place with no coordinates is still named even though it cannot be pinned
 * (rule 11).
 *
 * PINS ARE NUMBERED, NOT LABELLED. A name on every pin is unreadable at phone
 * width; the number ties a pin to its position in the list below, which is the
 * same device the web map uses.
 *
 * NO DAY BADGE. The web's pin carries how many days the trip spends there,
 * derived from stops; `places.list` is a flat set with no days in it, so the
 * phone does not invent one.
 */
import {
  Camera,
  GeoJSONSource,
  Layer,
  Map,
  Marker,
  type InitialViewState,
  type LngLat,
} from "@maplibre/maplibre-react-native";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "./theme";
import { Body, Figure } from "./ui";
import { TILE_STYLE } from "@/lib/map";
import { fonts, radius, size, space } from "@/lib/theme";

export type MappablePlace = {
  id: number;
  name: string;
  lat: number | null;
  lng: number | null;
};

const HEIGHT = 240;
const PIN = 26;
/** Zoom used when there is no box to fit — a town, not a country. */
const SINGLE_ZOOM = 9;
/**
 * Degrees below which a bounding box is treated as a single point. Fitting a
 * two-hotel route honestly gives a street map, which tells you less about
 * where the trip is than the town does.
 */
const TIGHT_SPAN = 0.2;
/** Keeps the outermost pins off the frame's edge. */
const FIT_PADDING = { top: 44, right: 44, bottom: 44, left: 44 };

type Pinned = { id: number; no: number; name: string; lngLat: LngLat };

/** Numbering counts the full list, so a pin's number matches its name below. */
function pin(places: MappablePlace[]): Pinned[] {
  return places.flatMap((place, index) =>
    place.lat === null || place.lng === null
      ? []
      : [
          {
            id: place.id,
            no: index + 1,
            name: place.name,
            lngLat: [place.lng, place.lat] as LngLat,
          },
        ],
  );
}

/**
 * Where the camera opens. Bounds when the places are far enough apart to make
 * a box, the middle of them at town zoom when they are not.
 */
function view(pins: Pinned[]): InitialViewState {
  const lngs = pins.map((p) => p.lngLat[0]);
  const lats = pins.map((p) => p.lngLat[1]);
  const west = Math.min(...lngs);
  const east = Math.max(...lngs);
  const south = Math.min(...lats);
  const north = Math.max(...lats);

  if (Math.max(east - west, north - south) < TIGHT_SPAN) {
    return { center: [(west + east) / 2, (south + north) / 2], zoom: SINGLE_ZOOM };
  }
  return { bounds: [west, south, east, north], padding: FIT_PADDING };
}

/**
 * The map alone. Explore draws a listing's bases over its own written route,
 * so it wants the frame without a second list of the same names under it.
 */
export function RouteMapFrame({ places }: { places: MappablePlace[] }) {
  const { c } = useTheme();
  const pins = pin(places);
  if (pins.length === 0) return null;

  return (
    <View
          style={{
            height: HEIGHT,
            borderColor: c.rule,
            borderWidth: StyleSheet.hairlineWidth,
            borderRadius: radius.md,
            overflow: "hidden",
          }}
        >
          <Map
            style={{ flex: 1 }}
            mapStyle={TILE_STYLE}
            // Rotating and tilting a route map only ever loses north.
            touchRotate={false}
            touchPitch={false}
            logo={false}
            compass={false}
          >
            <Camera initialViewState={view(pins)} />

            {pins.length > 1 ? (
              <GeoJSONSource
                id="route"
                data={{
                  type: "Feature",
                  properties: {},
                  geometry: {
                    type: "LineString",
                    coordinates: pins.map((p) => p.lngLat),
                  },
                }}
              >
                <Layer
                  id="route-line"
                  type="line"
                  paint={{
                    "line-color": c.pen,
                    "line-width": 2,
                    "line-opacity": 0.85,
                    "line-dasharray": [3, 2.5],
                  }}
                  layout={{ "line-cap": "round", "line-join": "round" }}
                />
              </GeoJSONSource>
            ) : null}

            {pins.map((p) => (
              <Marker key={p.id} lngLat={p.lngLat}>
                <View
                  accessible
                  accessibilityLabel={`Stop ${p.no}: ${p.name}`}
                  style={{
                    width: PIN,
                    height: PIN,
                    borderRadius: PIN / 2,
                    borderWidth: 2,
                    borderColor: c.pen,
                    backgroundColor: c.sheet,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      color: c.pen,
                      fontFamily: fonts.type,
                      fontSize: size.small,
                    }}
                  >
                    {p.no}
                  </Text>
                </View>
              </Marker>
            ))}
          </Map>
    </View>
  );
}

export function RouteMap({ places }: { places: MappablePlace[] }) {
  const missing = places.filter((p) => p.lat === null || p.lng === null);

  return (
    <View style={{ gap: space.md }}>
      <RouteMapFrame places={places} />

      <Body>{places.map((p) => p.name).join(" → ")}</Body>
      <Figure tone="ink-2">
        {places.length} {places.length === 1 ? "place" : "places"}
      </Figure>
      {/* The one thing the map cannot show: what is not on it (rule 11). */}
      {missing.length > 0 ? (
        <Body tone="ink-2">
          Not on the map — no coordinates: {missing.map((p) => p.name).join(", ")}.
        </Body>
      ) : null}
    </View>
  );
}
