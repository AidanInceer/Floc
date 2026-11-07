import { GeoJSONSource, Layer } from "@maplibre/maplibre-react-native";

import { useTheme } from "../system/theme";
import COUNTRY_SHAPES from "@/lib/countries-110m.json";

/**
 * Why: style expressions read properties, and a feature id is only reliably an expression input when
 * it is a number — these are "GB". Moved once at module load; ~250 features that never change.
 */
const SHAPES = {
  type: "FeatureCollection" as const,
  features: (COUNTRY_SHAPES as GeoJSON.FeatureCollection).features.map((feature) => ({
    ...feature,
    properties: { code: String(feature.id ?? "") },
  })),
};

/** The countries as plain paper shapes under a map: the route map and Explore draw on them. `tint` fills a trip's own countries in its colour, as the web's Overview globe does. */
export function LandLayer({ tint }: { tint?: { codes: string[]; fill: string } }) {
  const { c } = useTheme();
  const colour = c["sheet-3"];
  return (
    <GeoJSONSource id="countries" data={SHAPES}>
      <Layer
        id="country-fill"
        type="fill"
        filter={["!=", ["geometry-type"], "Point"]}
        paint={{
          // Why one layer: adding a second when the codes arrive moves the layers under MapLibre, which throws.
          "fill-color": tint ? ["case", ["in", ["get", "code"], ["literal", tint.codes]], tint.fill, colour] : colour,
          "fill-outline-color": c["rule-2"],
        }}
      />
      {/* Singapore, Malta, Monaco and ~60 more are Points at 1:110m —
          a fill layer draws nothing for them. */}
      <Layer
        id="country-dot"
        type="circle"
        filter={["==", ["geometry-type"], "Point"]}
        paint={{
          "circle-radius": 3.5,
          "circle-color": colour,
          "circle-stroke-width": 0.6,
          "circle-stroke-color": c["rule-2"],
        }}
      />
    </GeoJSONSource>
  );
}
