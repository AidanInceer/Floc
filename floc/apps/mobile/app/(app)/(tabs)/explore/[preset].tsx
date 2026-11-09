/**
 * One listing, in full — the screen the browse rows open (direction C).
 *
 * THE PITCH HAPPENS ONCE. Everything Explore used to repeat on every card
 * lives here instead: the whole summary rather than its first sentence, the
 * shape drawn rather than crammed onto a line, what you would actually do, and
 * the one button that costs anything.
 *
 * IT READS OFF THE BUNDLE, LIKE THE LIST. `PRESET_TRIPS` is static editorial
 * data, so opening a listing needs no request and cannot fail — an id that
 * matches nothing is the only bad state, and it says so rather than hanging on
 * a spinner that will never end.
 *
 * NOTHING HERE IS BOOKABLE. Starting a trip copies the shape into a trip of
 * your own; no operator is a partner and no money moves.
 */
import { stopsOf } from "@floc/core/trip/explore/listing-stops";
import { PRESET_TRIPS, type PresetTrip } from "@floc/core/trip/explore/preset-trips";
import { useMutation } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { CopySheet } from "@/components/explore/copy-sheet";
import { SaveHeart } from "@/components/explore/save-heart";
import { PresetRoute } from "@/components/packing/preset-route";
import { RouteMapFrame } from "@/components/map/route-map";
import { Body, Button, Card, Empty, Figure, Pill, SectionTitle } from "@/components/system/ui";
import { trpc } from "@/lib/api";
import { fonts, size, space } from "@/lib/theme";
import { useTheme } from "@/components/system/theme";
import { listingPrice } from "@floc/core/trip/explore/listing-price";
import { useListingRates } from "@/components/explore/use-listing-rates";

/** A listing's bases as map pins — pin number matches base order, as on the web. */
function bases(trip: PresetTrip) {
  return stopsOf(trip).map((stop, index) => ({ id: index, name: stop.place, lat: stop.lat, lng: stop.lng }));
}

export default function PresetDetail() {
  const { c } = useTheme();
  const { preset, start: asked } = useLocalSearchParams<{ preset: string; start?: string }>();
  const router = useRouter();
  const trip = PRESET_TRIPS.find((candidate) => candidate.id === preset);
  // Why: a saved trip on Lists opens with the copy choice open, as on the web (ADR-025).
  const [sheet, setSheet] = useState(asked !== undefined);
  const rates = useListingRates();

  const start = useMutation({
    ...trpc.trips.startFromPreset.mutationOptions(),
    onSuccess: (result) => {
      // Null means the listing has gone since it was drawn — stay put rather
      // than navigate nowhere (rule 11).
      if (!result) return;
      setSheet(false);
      router.replace({ pathname: "/trip/[id]", params: { id: result.id } });
    },
  });

  if (!trip) {
    return (
      <>
        <Stack.Screen options={{ title: "Explore" }} />
        <Empty>That idea is no longer listed.</Empty>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: trip.title }} />
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg }}>
        <View style={{ gap: space.sm }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.md }}>
            <Figure tone="ink-2">
              {trip.country} · {trip.region}
            </Figure>
            <SaveHeart presetId={trip.id} title={trip.title} />
          </View>
          <Body>{trip.summary}</Body>
          {trip.editorial ? <Pill word="Floc's own" tone="pastel-blue" /> : null}
        </View>

        <View style={{ gap: space.sm }}>
          <SectionTitle>The shape of it</SectionTitle>
          <Card>
            {/* The map above the written route, not instead of it: the shape
                says how long you sleep where, which no pin can carry. */}
            <View style={{ gap: space.md }}>
              <RouteMapFrame places={bases(trip)} />
              <PresetRoute trip={trip} />
            </View>
          </Card>
        </View>

        <View style={{ gap: space.sm }}>
          <SectionTitle>What you would do</SectionTitle>
          <Card>
            {trip.highlights.map((highlight) => (
              <Body key={highlight}>{highlight}</Body>
            ))}
          </Card>
        </View>

        {/* The three numbers that decide it, together rather than scattered
            through a paragraph. */}
        <View style={{ gap: space.sm }}>
          <SectionTitle>The numbers</SectionTitle>
          <Card>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Body tone="ink-2">Nights</Body>
              <Figure>{trip.nights}</Figure>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Body tone="ink-2">Group</Body>
              <Figure>{trip.groupSize}</Figure>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Body tone="ink-2">From</Body>
              <Figure>{listingPrice(trip, rates)}</Figure>
            </View>
            {/* Why: a long list of months ran off the screen as one unwrapped figure. */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: space.md }}>
              <Body tone="ink-2">Best months</Body>
              <Text style={{ flexShrink: 1, textAlign: "right", color: c.ink, fontFamily: fonts.sans, fontSize: size.body }}>
                {trip.bestMonths}
              </Text>
            </View>
          </Card>
        </View>

        <View style={{ gap: space.sm }}>
          {/* Why: what starting does is the one thing the pinned button cannot say. */}
          <Body tone="ink-3">
            This copies the shape into a trip of your own. Nothing is booked and no operator here is
            a partner — the price is what a group of this size tends to spend.
          </Body>
        </View>
      </ScrollView>
      <View style={{ padding: space.lg, paddingTop: space.sm, backgroundColor: c.paper, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.rule }}>
        <Button label="Start this trip" onPress={() => setSheet(true)} />
      </View>
      <CopySheet
        trip={trip}
        open={sheet}
        busy={start.isPending}
        error={start.isError ? start.error.message : null}
        onClose={() => setSheet(false)}
        onStart={(choice) => start.mutate(choice)}
      />
    </>
  );
}
