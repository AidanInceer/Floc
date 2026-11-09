// Why: pins are numbered, not named — a name on every pin is unreadable at phone width; the number
// ties a pin to the list below. Natural Earth outlines, no tiles, as the web's Overview globe.
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

import { useTheme } from "../system/theme";
import { LandLayer } from "./land-layer";
import { paperStyle } from "@/lib/map";
import { fonts, radius, size } from "@/lib/theme";

export type MappablePlace = {
  id: number;
  name: string;
  lat: number | null;
  lng: number | null;
};

const HEIGHT = 240;
const PIN = 26;
/** Why: past this the 1:110m outlines turn to blocks, and there are no streets under them. */
const MAX_ZOOM = 6;
/** Degrees below which a bounding box is treated as a single point, shown at the closest zoom. */
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
  const all = pins.map((p) => p.lngLat);
  const lngs = all.map((p) => p[0]);
  const lats = all.map((p) => p[1]);
  const west = Math.min(...lngs);
  const east = Math.max(...lngs);
  const south = Math.min(...lats);
  const north = Math.max(...lats);

  if (Math.max(east - west, north - south) < TIGHT_SPAN) {
    return { center: [(west + east) / 2, (south + north) / 2], zoom: MAX_ZOOM };
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
            borderRadius: radius.sm,
            overflow: "hidden",
          }}
        >
          <Map
            style={{ flex: 1 }}
            mapStyle={paperStyle(c.sheet)}
            // Rotating and tilting a route map only ever loses north.
            touchRotate={false}
            touchPitch={false}
            logo={false}
            compass={false}
            attribution={false}
          >
            <Camera initialViewState={view(pins)} maxZoom={MAX_ZOOM} />
            <LandLayer />

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
