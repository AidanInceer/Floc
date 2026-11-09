// Why: the web Overview's map style on the phone — the trip's countries in its colour, an ink line patterned by how you travel, named stops, a tag a leg.
import type { Pastel } from "@floc/core/design/pastels";
import { nightsLabel } from "@floc/core/itinerary/stops";
import type { OverviewRoute } from "@floc/core/trip/overview/route";
import { routeLines, stopRoles, type RouteLine } from "@floc/core/trip/route/route-lines";
import { Camera, GeoJSONSource, Layer, Map, Marker, type InitialViewState, type LngLat } from "@maplibre/maplibre-react-native";
import { View } from "react-native";

import { LandLayer } from "../../map/land-layer";
import { useTheme } from "../../system/theme";
import { LegArrow, LegTag, StopDot, StopName } from "./route-marks";
import { countriesAt } from "@/lib/geo/country-at";
import { paperStyle } from "@/lib/map";
import { radius } from "@/lib/theme";
import { shortPlace } from "@floc/core/itinerary/names/place-name";

const HEIGHT = 260;
/** Why: past this the 1:110m outlines turn to blocks, and there are no streets under them. */
const MAX_ZOOM = 6;
/** Room round the route for the names and tags drawn beside it. */
const PADDING = { top: 40, right: 64, bottom: 40, left: 64 };
/** How far a tag sits off its line, to the outside of the bend, as the web's `TAG.gap`. */
const TAG_GAP = 18;

/** Each way to travel as the web draws it (`lineFor`): dash lengths are in line widths here, as MapLibre counts them. */
const LOOKS = {
  road: { width: 1.9, dash: null, cap: "round" },
  train: { width: 2.5, dash: [0.01, 1.6], cap: "round" },
  flight: { width: 1.6, dash: [4, 3], cap: "round" },
  ferry: { width: 1.6, dash: [1.8, 2.2], cap: "butt" },
  unset: { width: 1.4, dash: [1.5, 3], cap: "round" },
} as const;
type Look = keyof typeof LOOKS;

const lookOf = (mode: RouteLine["mode"]): Look => (!mode ? "unset" : mode === "train" || mode === "flight" || mode === "ferry" ? mode : "road");

function view(points: LngLat[]): InitialViewState {
  const [lngs, lats] = [points.map((p) => p[0]), points.map((p) => p[1])];
  const [west, east, south, north] = [Math.min(...lngs), Math.max(...lngs), Math.min(...lats), Math.max(...lats)];
  if (Math.max(east - west, north - south) < 0.2) return { center: [(west + east) / 2, (south + north) / 2], zoom: MAX_ZOOM };
  return { bounds: [west, south, east, north], padding: PADDING };
}

/** A name goes on the side away from the stop's neighbours, so the line does not run through it. */
function sideOf(stops: OverviewRoute["stops"], k: number): "left" | "right" {
  const near = [k - 1, k + 1].filter((i) => i >= 0 && i < stops.length).map((i) => stops[i]!);
  const east = near.reduce((sum, s) => sum + (s.lng - stops[k]!.lng), 0);
  return east > 0 ? "left" : "right";
}

export function StopsMap({ route, tone }: { route: OverviewRoute; tone: Pastel }) {
  const { c } = useTheme();
  const lines = routeLines(route);
  const roles = stopRoles(route.stops);
  const points: LngLat[] = [...route.stops.map((s) => [s.lng, s.lat] as LngLat), ...lines.flatMap((l) => l.coords)];
  const features = {
    type: "FeatureCollection" as const,
    features: lines.map((l) => ({ type: "Feature" as const, properties: { look: lookOf(l.mode) }, geometry: { type: "LineString" as const, coordinates: l.coords } })),
  };

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`The route: ${route.stops.map((s) => s.place).join(", ")}`}
      style={{ height: HEIGHT, borderRadius: radius.sm, overflow: "hidden" }}>
      <Map style={{ flex: 1 }} mapStyle={paperStyle(c.sheet)} touchRotate={false} touchPitch={false} logo={false} compass={false} attribution={false}>
        <Camera initialViewState={view(points)} maxZoom={MAX_ZOOM} />
        <LandLayer tint={{ codes: [...route.countries, ...countriesAt(route.uncoded)], fill: c[tone] }} />
        <GeoJSONSource id="route-lines" data={features}>
          {/* A white edge under every road, rail and boat so the line reads over any land; a flight crosses it bare. */}
          <Layer id="route-edge" type="line" filter={["!=", ["get", "look"], "flight"]} paint={{ "line-color": c.sheet, "line-width": 7 }} layout={{ "line-cap": "round", "line-join": "round" }} />
          {(Object.keys(LOOKS) as Look[]).map((look) => {
            const { width, dash, cap } = LOOKS[look];
            return (
              <Layer
                key={look}
                id={`route-${look}`}
                type="line"
                filter={["==", ["get", "look"], look]}
                paint={{ "line-color": c.ink, "line-width": width, ...(dash ? { "line-dasharray": [...dash] } : {}) }}
                layout={{ "line-cap": cap, "line-join": "round" }}
              />
            );
          })}
        </GeoJSONSource>


        {lines.map((l, k) => (
          <Marker key={`arrow-${k}`} lngLat={l.mid}>
            <LegArrow angle={l.angle} />
          </Marker>
        ))}
        {lines.map((l, k) => (
          <Marker key={`tag-${k}`} lngLat={l.mid} offset={[l.bulge[0] * TAG_GAP, l.bulge[1] * TAG_GAP]}>
            <LegTag mode={l.mode} time={l.time} />
          </Marker>
        ))}
        {route.stops.map((s, k) =>
          roles[k].named ? (
            <Marker key={`stop-${k}`} lngLat={[s.lng, s.lat]}>
              <StopDot role={roles[k].role} />
            </Marker>
          ) : null,
        )}
        {route.stops.map((s, k) => {
          if (!roles[k].named) return null;
          const side = sideOf(route.stops, k);
          return (
            <Marker key={`name-${k}`} lngLat={[s.lng, s.lat]} anchor={side === "left" ? "right" : "left"} offset={[side === "left" ? -12 : 12, 0]}>
              <StopName name={shortPlace(s.place)} nights={s.nights > 0 ? nightsLabel(s.nights) : null} side={side} />
            </Marker>
          );
        })}
      </Map>
    </View>
  );
}
