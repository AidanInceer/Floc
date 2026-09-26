/**
 * The travel map, drawn (#no-ticket — the app half of the web's `travel-map.tsx`).
 *
 * WHAT CHANGED SINCE #302. `travel-marks.tsx` listed the marked countries as
 * two named groups and said, honestly, that the phone could not draw the world
 * because there was no map library in the app. There is one now, so the drawing
 * is back and the naming shrank to the web's key — two named swatches and the
 * two counts. Colour still never stands alone (#204), but a hundred pills below
 * a phone-sized map was the map's answer restated at length.
 *
 * SHAPES, NO TILES. Natural Earth outlines on the page's own paper, exactly as
 * the web does it: this screen needs an outline, not geography, and tiles would
 * be a second map competing with the fills.
 *
 * TAP CYCLES, SAME ORDER AS THE WEB. blank → yellow → green → blank. `blank`
 * over a country a trip still claims is a rejection row, not a delete — the
 * host tells the two apart, so this only ever says what was tapped.
 */
// Types only. Pinned to the version maplibre-react-native itself depends on
// rather than reached through it — a phantom dependency breaks the day the
// hoist changes, and this one is not re-exported from the RN package.
import type { ExpressionSpecification } from "@maplibre/maplibre-gl-style-spec";

import { COUNTRIES } from "@floc/core/people/countries";
import {
  Camera,
  GeoJSONSource,
  Layer,
  Map,
  type PressEventWithFeatures,
} from "@maplibre/maplibre-react-native";
import { useMemo, useState } from "react";
import { StyleSheet, View, type NativeSyntheticEvent } from "react-native";

import { useTheme } from "../system/theme";
import { Body } from "../system/ui";
import COUNTRY_SHAPES from "@/lib/countries-110m.json";
import { paperStyle } from "@/lib/map";
import { radius, space } from "@/lib/theme";
import { nextMark } from "@floc/core/itinerary/travel-map";

export type MapState = "green" | "yellow";
/** What a tap asks for — the displayed state, not the stored row. */
export type NextState = MapState | "blank";
export type CountryMark = { code: string; state: MapState };

const HEIGHT = 260;
/** The whole world, once. Zooming out further only repeats it. */
const MIN_ZOOM = 0.6;
const MAX_ZOOM = 6;
/** Roughly centres the landmasses rather than the equator's empty ocean. */
const OPENING: [number, number] = [8, 25];

/**
 * The shapes, with the ISO code moved from the feature id into a property.
 *
 * Style expressions read properties; a feature id is only reliably an
 * expression input when it is a number, and these are "GB". Done once at
 * module load rather than per render — it is ~250 features and never changes.
 */
const SHAPES = {
  type: "FeatureCollection" as const,
  features: (COUNTRY_SHAPES as GeoJSON.FeatureCollection).features.map((feature) => ({
    ...feature,
    properties: { code: String(feature.id ?? "") },
  })),
};

/**
 * The fill, as one expression over the country code.
 *
 * `case` rather than `match` because its shape is fixed: `match` would need a
 * branch per state and drop the branch whose list is empty, and an expression
 * whose arity changes with the data is a harder thing to keep true. An empty
 * `in` list simply matches nothing.
 */
function fillColour(
  marks: CountryMark[],
  colours: { green: string; yellow: string; blank: string },
): ExpressionSpecification {
  return [
    "case",
    ["in", ["get", "code"], ["literal", marks.filter((m) => m.state === "green").map((m) => m.code)]],
    colours.green,
    ["in", ["get", "code"], ["literal", marks.filter((m) => m.state === "yellow").map((m) => m.code)]],
    colours.yellow,
    colours.blank,
  ];
}

export function TravelMap({
  marks,
  editable = false,
  onSet,
}: {
  marks: CountryMark[];
  editable?: boolean;
  /** Required when `editable`. */
  onSet?: (code: string, next: NextState) => void;
}) {
  const { c } = useTheme();
  // Optimistic: a failed write is corrected when `marks` refetches.
  const [local, setLocal] = useState<CountryMark[]>(marks);

  // The server is the truth, and it changes under us — the mark sheet writes
  // through the same mutation, so a refetch is how its marks reach this map.
  // Adjusting during render rather than in an effect: an effect would draw the
  // stale fills for a frame first (#no-ticket).
  const [seen, setSeen] = useState(marks);
  if (seen !== marks) {
    setSeen(marks);
    setLocal(marks);
  }

  const shown = editable ? local : marks;

  const state = useMemo(() => {
    const byCode: Record<string, MapState> = {};
    for (const mark of shown) byCode[mark.code] = mark.state;
    return byCode;
  }, [shown]);

  const paint = useMemo(
    () =>
      fillColour(shown, {
        green: c["green-2"],
        yellow: c.highlight,
        blank: c["sheet-3"],
      }),
    [shown, c],
  );

  function tap(event: NativeSyntheticEvent<PressEventWithFeatures>) {
    if (!editable || !onSet) return;
    const code = String(event.nativeEvent.features[0]?.properties?.code ?? "");
    if (!code) return;

    const next = nextMark(state[code]);
    setLocal((prev) => [
      ...prev.filter((mark) => mark.code !== code),
      ...(next === "blank" ? [] : [{ code, state: next }]),
    ]);
    onSet(code, next);
  }

  const green = COUNTRIES.filter((country) => state[country.code] === "green");
  const yellow = COUNTRIES.filter((country) => state[country.code] === "yellow");

  return (
    <View style={{ gap: space.md }}>
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
          mapStyle={paperStyle(c.sheet)}
          touchRotate={false}
          touchPitch={false}
          logo={false}
          compass={false}
          attribution={false}
        >
          <Camera
            initialViewState={{ center: OPENING, zoom: MIN_ZOOM }}
            minZoom={MIN_ZOOM}
            maxZoom={MAX_ZOOM}
          />

          <GeoJSONSource id="countries" data={SHAPES} onPress={tap}>
            <Layer
              id="country-fill"
              type="fill"
              filter={["!=", ["geometry-type"], "Point"]}
              paint={{ "fill-color": paint, "fill-outline-color": c["rule-2"] }}
            />
            {/* Singapore, Malta, Monaco and ~60 more are Points at 1:110m —
                a fill layer draws nothing for them. */}
            <Layer
              id="country-dot"
              type="circle"
              filter={["==", ["geometry-type"], "Point"]}
              paint={{
                "circle-radius": 3.5,
                "circle-color": paint,
                "circle-stroke-width": 0.6,
                "circle-stroke-color": c["rule-2"],
              }}
            />
          </GeoJSONSource>
        </Map>
      </View>

      {/* The key, as the web draws it: each fill named, and the counts saying
          the same thing in words (#204 — never colour alone). */}
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "center",
          gap: space.md,
        }}
      >
        <Key word="Been there" tone="green-2" />
        <Key word="Want to go" tone="highlight" />
        <Body tone="ink-2">
          {green.length} visited · {yellow.length} want to go
        </Body>
      </View>

      {editable ? <Body tone="ink-2">Tap a country to mark it.</Body> : null}
    </View>
  );
}

function Key({ word, tone }: { word: string; tone: "green-2" | "highlight" }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.xs }}>
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: 2,
          backgroundColor: c[tone],
          borderColor: c["rule-2"],
          borderWidth: StyleSheet.hairlineWidth,
        }}
      />
      <Body tone="ink-2">{word}</Body>
    </View>
  );
}
