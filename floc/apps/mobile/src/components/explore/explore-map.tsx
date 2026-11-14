import { Camera, Map, Marker, type CameraRef, type LngLat } from "@maplibre/maplibre-react-native";
import { stopsOf } from "@floc/core/trip/explore/listing-stops";
import { mapPicks } from "@floc/core/trip/explore/map-picks";
import { PRESET_TRIPS } from "@floc/core/trip/explore/preset-trips";
import { useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { LandLayer } from "../map/land-layer";
import { useTheme } from "../system/theme";
import { useReducedMotion } from "../system/use-reduced-motion";
import { paperStyle } from "@/lib/map";
import { fonts, radius, size } from "@/lib/theme";
import { countWord } from "@floc/core/text/count-word";

const HEIGHT = 240;
// Why: the picks span Mexico to New Zealand, wider than a phone can show at zoom 0, so pins at the
// edge were cut in half. The map centres the picked trip instead, and the deck below reaches the rest.
const ZOOM = 1.6;
const PIN = 28;

export const MAP_PICKS = mapPicks(PRESET_TRIPS, 2);

function firstBase(trip: (typeof MAP_PICKS)[number]): LngLat {
  const base = stopsOf(trip)[0];
  return base ? [base.lng, base.lat] : [0, 0];
}

export function ExploreMap({ picked, onPick }: { picked: string; onPick: (presetId: string) => void }) {
  const { c } = useTheme();
  const camera = useRef<CameraRef>(null);
  const reducedMotion = useReducedMotion();
  const [lng, lat] = firstBase(MAP_PICKS.find((t) => t.id === picked) ?? MAP_PICKS[0]);
  const first = useRef<LngLat>([lng, lat]);

  useEffect(() => {
    camera.current?.easeTo({ center: [lng, lat], zoom: ZOOM, duration: reducedMotion === false ? 300 : 0 });
  }, [lng, lat, reducedMotion]);

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
      <Map style={{ flex: 1 }} mapStyle={paperStyle(c.sheet)} touchRotate={false} touchPitch={false} logo={false} compass={false} attribution={false}>
        <Camera ref={camera} initialViewState={{ center: first.current, zoom: ZOOM }} />
        <LandLayer />
        {MAP_PICKS.map((trip, i) => {
          const on = trip.id === picked;
          return (
            // Why: on Android the map takes the touch before a view inside a marker sees it; the marker's own press is what fires.
            <Marker key={trip.id} lngLat={firstBase(trip)} onPress={() => onPick(trip.id)}>
              <Pressable
                testID={`explore-pin-${trip.id}`}
                accessibilityRole="button"
                accessibilityLabel={`${i + 1}. ${trip.title}, ${countWord(trip.nights, "night")}`}
                accessibilityState={{ selected: on }}
                onPress={() => onPick(trip.id)}
                hitSlop={8}
                style={{
                  width: PIN,
                  height: PIN,
                  borderRadius: PIN / 2,
                  borderWidth: 1.5,
                  borderColor: on ? c.pen : c.ink,
                  backgroundColor: on ? c.pen : c.sheet,
                  alignItems: "center",
                  justifyContent: "center",
                  transform: [{ scale: on ? 1.15 : 1 }],
                }}
              >
                <Text style={{ color: on ? c.paper : c.ink, fontFamily: fonts.type, fontSize: size.label }}>{i + 1}</Text>
              </Pressable>
            </Marker>
          );
        })}
      </Map>
    </View>
  );
}
