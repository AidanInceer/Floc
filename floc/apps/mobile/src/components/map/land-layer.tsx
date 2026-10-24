// Types only. Pinned to the version maplibre-react-native itself depends on
// rather than reached through it — a phantom dependency breaks the day the
// hoist changes, and this one is not re-exported from the RN package.
import type { ExpressionSpecification } from "@maplibre/maplibre-gl-style-spec";

import {
  GeoJSONSource,
  Layer,
  type PressEventWithFeatures,
} from "@maplibre/maplibre-react-native";
import type { NativeSyntheticEvent } from "react-native";

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

export function LandLayer({
  fill,
  onPress,
}: {
  fill?: string | ExpressionSpecification;
  onPress?: (event: NativeSyntheticEvent<PressEventWithFeatures>) => void;
}) {
  const { c } = useTheme();
  const colour = fill ?? c["sheet-3"];
  return (
    <GeoJSONSource id="countries" data={SHAPES} onPress={onPress}>
      <Layer
        id="country-fill"
        type="fill"
        filter={["!=", ["geometry-type"], "Point"]}
        paint={{ "fill-color": colour, "fill-outline-color": c["rule-2"] }}
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
