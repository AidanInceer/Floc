import { GeoJSONSource, Layer } from "@maplibre/maplibre-react-native";

import { useTheme } from "../system/theme";
import COUNTRY_SHAPES from "@/lib/countries-110m.json";

const SHAPES = {
  type: "FeatureCollection" as const,
  features: (COUNTRY_SHAPES as GeoJSON.FeatureCollection).features.map((feature) => ({
    ...feature,
    properties: { code: String(feature.id ?? "") },
  })),
};

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
          "fill-color": tint ? ["case", ["in", ["get", "code"], ["literal", tint.codes]], tint.fill, colour] : colour,
          "fill-outline-color": c["rule-2"],
        }}
      />
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
