import { stopsOf } from "@floc/core/trip/explore/listing-stops";
import { listingPrice } from "@floc/core/trip/explore/listing-price";
import type { PresetTrip } from "@floc/core/trip/explore/preset-trips";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../system/theme";
import { Button, Divider } from "../system/ui";
import { RegionTags } from "./region-tag";
import { SaveHeart } from "./save-heart";
import { useListingRates } from "./use-listing-rates";
import { fonts, radius, size, space } from "@/lib/theme";
import { countWord } from "@floc/core/text/count-word";

/** One listing on the map's deck: its pin number and length, where, the route, then the price beside the one action. Tap anywhere else to read it. */
export function ExploreCard({
  trip,
  pin,
  width,
  starting,
  onStart,
  onOpen,
}: {
  trip: PresetTrip;
  pin: number;
  width: number;
  starting: boolean;
  onStart: () => void;
  onOpen: () => void;
}) {
  const { c } = useTheme();
  const rates = useListingRates();
  const bases = stopsOf(trip).map((stop) => stop.place);
  const mono = { fontFamily: fonts.type, fontSize: size.small, fontVariant: ["tabular-nums" as const] };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${pin}. ${trip.title}, ${countWord(trip.nights, "night")}. Open`}
      onPress={onOpen}
      style={({ pressed }) => ({
        width,
        backgroundColor: c.sheet,
        borderColor: c.rule,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: radius.md,
        padding: space.lg,
        gap: space.md,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
        <View style={{ flex: 1 }}>
          <RegionTags region={trip.region} countries={trip.country} />
        </View>
        <Text style={{ ...mono, color: c["ink-3"], lineHeight: 22 }}>
          {pin} · {countWord(trip.nights, "night")}
        </Text>
        <SaveHeart presetId={trip.id} title={trip.title} />
      </View>
      <View style={{ gap: space.xs }}>
        <Text numberOfLines={2} style={{ color: c.ink, fontFamily: fonts.displayBold, fontSize: size.heading }}>
          {trip.title}
        </Text>
        <Text numberOfLines={3} style={{ color: c["ink-2"], fontFamily: fonts.sans, fontSize: size.body }}>
          {bases.join(" → ")}
        </Text>
      </View>
      <View style={{ flex: 1 }} />
      <Divider />
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.md }}>
        <View style={{ flexShrink: 1 }}>
          <Text style={{ color: c.ink, fontFamily: fonts.typeBold, fontSize: size.body, fontVariant: ["tabular-nums"] }}>
            {listingPrice(trip, rates)}
          </Text>
          <Text style={{ ...mono, color: c["ink-3"] }}>each · {trip.groupSize}</Text>
        </View>
        <Button label="Start this trip" fit="small" busy={starting} onPress={onStart} />
      </View>
    </Pressable>
  );
}
