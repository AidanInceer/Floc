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
import { formatMoney } from "@floc/core/money";
import { PRESET_TRIPS, type PresetTrip } from "@floc/core/preset-trips";
import { useMutation } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, View } from "react-native";

import { PresetRoute } from "@/components/preset-route";
import { RouteMapFrame } from "@/components/route-map";
import { Body, Button, Card, Empty, Figure, Label, Pill } from "@/components/ui";
import { trpc } from "@/lib/api";
import { space } from "@/lib/theme";

/** A listing's bases as map pins — pin number matches base order, as on the web. */
function bases(trip: PresetTrip) {
  return trip.legs
    .filter((leg) => leg.kind === "base")
    .map((leg, index) => ({ id: index, name: leg.place, lat: leg.lat, lng: leg.lng }));
}

export default function PresetDetail() {
  const { preset } = useLocalSearchParams<{ preset: string }>();
  const router = useRouter();
  const trip = PRESET_TRIPS.find((candidate) => candidate.id === preset);

  const start = useMutation({
    ...trpc.trips.startFromPreset.mutationOptions(),
    onSuccess: (result) => {
      // Null means the listing has gone since it was drawn — stay put rather
      // than navigate nowhere (rule 11).
      if (result) router.replace({ pathname: "/trip/[id]", params: { id: result.id } });
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
          <Figure tone="ink-2">
            {trip.country} · {trip.region}
          </Figure>
          <Body>{trip.summary}</Body>
          {trip.editorial ? <Pill word="Floc's own" tone="peri" /> : null}
        </View>

        <View style={{ gap: space.sm }}>
          <Label>The shape of it</Label>
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
          <Label>What you would do</Label>
          <Card>
            {trip.highlights.map((highlight) => (
              <Body key={highlight}>{highlight}</Body>
            ))}
          </Card>
        </View>

        {/* The three numbers that decide it, together rather than scattered
            through a paragraph. */}
        <View style={{ gap: space.sm }}>
          <Label>The numbers</Label>
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
              <Figure>{formatMoney(trip.priceFromMinor, trip.currency)}</Figure>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Body tone="ink-2">Best months</Body>
              <Figure>{trip.bestMonths}</Figure>
            </View>
          </Card>
        </View>

        <View style={{ gap: space.sm }}>
          <Button
            label="Start this trip"
            busy={start.isPending}
            onPress={() => start.mutate({ presetId: trip.id })}
          />
          {start.isError ? <Body tone="red">{start.error.message}</Body> : null}
          {/* What starting actually does is the one thing the button cannot say. */}
          <Body tone="ink-3">
            This copies the shape into a trip of your own. Nothing is booked and no operator here is
            a partner — the price is what a group of this size tends to spend.
          </Body>
        </View>
      </ScrollView>
    </>
  );
}
