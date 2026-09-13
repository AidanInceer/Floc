import { Camera, Map, Marker, type LngLat } from "@maplibre/maplibre-react-native";
import { mapPicks } from "@floc/core/trip/explore/explore-match";
import { PRESET_TRIPS } from "@floc/core/trip/explore/preset-trips";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../system/theme";
import { TILE_STYLE } from "@/lib/map";
import { fonts, radius, size } from "@/lib/theme";

const HEIGHT = 260;
const PIN = 28;

const PICKS = mapPicks(PRESET_TRIPS, 2);

function firstBase(tripIndex: number): LngLat {
  const base = PICKS[tripIndex].legs.find((l) => l.kind === "base");
  return base && base.kind === "base" ? [base.lng, base.lat] : [0, 0];
}

const POINTS = PICKS.map((_, i) => firstBase(i));
const lngs = POINTS.map((p) => p[0]);
const lats = POINTS.map((p) => p[1]);
const BOUNDS: [number, number, number, number] = [
  Math.min(...lngs),
  Math.min(...lats),
  Math.max(...lngs),
  Math.max(...lats),
];

export function ExploreMap({
  picked,
  onPick,
}: {
  picked: string;
  onPick: (presetId: string) => void;
}) {
  const { c } = useTheme();

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
        touchRotate={false}
        touchPitch={false}
        logo={false}
        compass={false}
      >
        <Camera
          initialViewState={{
            bounds: BOUNDS,
            padding: { top: 30, right: 30, bottom: 30, left: 30 },
          }}
        />
        {PICKS.map((trip, i) => {
          const on = trip.id === picked;
          return (
            <Marker key={trip.id} lngLat={POINTS[i]}>
              <Pressable
                testID={`explore-pin-${trip.id}`}
                accessibilityRole="button"
                accessibilityLabel={`${i + 1}. ${trip.title}, ${trip.nights} nights`}
                accessibilityState={{ selected: on }}
                onPress={() => onPick(trip.id)}
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
                <Text
                  style={{ color: on ? c.paper : c.ink, fontFamily: fonts.type, fontSize: size.label }}
                >
                  {i + 1}
                </Text>
              </Pressable>
            </Marker>
          );
        })}
      </Map>
    </View>
  );
}
