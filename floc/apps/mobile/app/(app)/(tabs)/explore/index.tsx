/**
 * Explore (ticket 302's left seat) — ready-made trips to start from.
 *
 * STATIC AND EDITORIAL. The listings are `@floc/core/preset-trips`, the same
 * data the web page draws, read straight off the bundle. There is no partner
 * backend and nothing is bookable; only *starting* a trip needs a server, so
 * only that is a mutation — and it now lives on the listing you opened, not on
 * every row.
 *
 * BROWSE, THEN OPEN. This was ten full pitches stacked, which is a wall of
 * text rather than ten choices: the summary and the leg chain fought for the
 * same line and the button repeated ten times. A row carries only what rules a
 * listing in or out — where, how long, how you move, the price — and the
 * pitch happens once, on `[preset]`.
 *
 * SHAPE, NOT PHOTOGRAPHS (#194). Still true, and still the reason the mark on
 * each row is the travel mode rather than a picture of somewhere.
 */
import { PRESET_TRIPS, type Region } from "@floc/core/preset-trips";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, View } from "react-native";

import { PresetRow } from "@/components/preset-row";
import { RegionChips, type RegionChoice } from "@/components/region-chips";
import { useTheme } from "@/components/theme";
import { Body, Empty } from "@/components/ui";
import { space } from "@/lib/theme";

const AVAILABLE: Region[] = [...new Set(PRESET_TRIPS.map((trip) => trip.region))];

export default function Explore() {
  const router = useRouter();
  const { c } = useTheme();
  const [region, setRegion] = useState<RegionChoice>(null);

  const listings = useMemo(
    () => (region === null ? PRESET_TRIPS : PRESET_TRIPS.filter((t) => t.region === region)),
    [region],
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.paper }}>
      <FlatList
        data={listings}
        keyExtractor={(trip) => trip.id}
        contentContainerStyle={{ paddingVertical: space.lg, gap: space.sm }}
        ListHeaderComponent={
          <View style={{ gap: space.md, marginBottom: space.xs }}>
            <RegionChips available={AVAILABLE} value={region} onChange={setRegion} />
            {/* Nothing here is bookable and no operator is a partner. Saying so
                once beats ten rows that read like a shop. */}
            <View style={{ paddingHorizontal: space.lg }}>
              <Body tone="ink-2">Ideas to start a trip from. Nothing is booked or paid for.</Body>
            </View>
          </View>
        }
        ListEmptyComponent={<Empty>Nothing here yet.</Empty>}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: space.lg }}>
            <PresetRow
              trip={item}
              onOpen={() =>
                router.push({ pathname: "/explore/[preset]", params: { preset: item.id } })
              }
            />
          </View>
        )}
      />
    </View>
  );
}
