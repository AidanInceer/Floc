/**
 * Explore (ticket 302's left seat) — ready-made trips to start from.
 *
 * STATIC AND EDITORIAL. The listings are `@floc/core/preset-trips`, the same
 * data the web page draws, read straight off the bundle. There is no partner
 * backend and nothing is bookable; only *starting* a trip needs a server, so
 * only that is a mutation.
 *
 * SHAPE, NOT PHOTOGRAPHS (#194). A listing sells itself on where you sleep and
 * how you move between — the leg chain — which is also the one part of it a
 * phone can draw at full fidelity. The web's map and its region filter are not
 * attempted: ten listings do not need filtering, and #266 is where Explore
 * grows past this.
 */
import { formatMoney } from "@floc/core/money";
import { PRESET_TRIPS, type PresetTrip } from "@floc/core/preset-trips";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { FlatList, View } from "react-native";

import { useTheme } from "@/components/theme";
import { Body, Button, Card, Figure, Pill } from "@/components/ui";
import { trpc } from "@/lib/api";
import { space } from "@/lib/theme";

/** First sentence only — the rest is detail the group finds after it starts. */
function hook(summary: string): string {
  const end = summary.indexOf(". ");
  return end === -1 ? summary : summary.slice(0, end + 1);
}

/** Where you sleep and how you move between, as one line (#194). */
function shape(trip: PresetTrip): string {
  return trip.legs
    .map((leg) => (leg.kind === "base" ? `${leg.place} ${leg.nights}n` : `- ${leg.mode} -`))
    .join(" ");
}

export default function Explore() {
  const router = useRouter();
  const { c } = useTheme();
  const [starting, setStarting] = useState<string | null>(null);

  const start = useMutation({
    ...trpc.trips.startFromPreset.mutationOptions(),
    onSettled: () => setStarting(null),
    onSuccess: (result) => {
      // Null means the listing has gone since it was drawn — stay put rather
      // than navigate nowhere (rule 11).
      if (result) router.push({ pathname: "/(app)/trip/[id]", params: { id: result.id } });
    },
  });

  return (
    <View style={{ flex: 1, backgroundColor: c.paper }}>
      <FlatList
        data={PRESET_TRIPS}
        keyExtractor={(trip) => trip.id}
        contentContainerStyle={{ padding: space.lg, gap: space.md }}
        ListHeaderComponent={
          // Nothing here is bookable and no operator is a partner. Saying so
          // once beats ten cards that read like a shop.
          <Body tone="ink-2">Ideas to start a trip from. Nothing here is booked or paid for.</Body>
        }
        renderItem={({ item }) => (
          <Card>
            <View style={{ gap: space.sm }}>
              <Body bold>{item.title}</Body>
              <Figure tone="ink-2">
                {item.nights} nights · {item.country} · from{" "}
                {formatMoney(item.priceFromMinor, item.currency)}
              </Figure>
              <Body tone="ink-2">{hook(item.summary)}</Body>
              <Figure tone="ink-3">{shape(item)}</Figure>
              {item.editorial ? <Pill word="Floc's own" tone="peri" /> : null}
              <Button
                label="Start this trip"
                busy={start.isPending && starting === item.id}
                onPress={() => {
                  setStarting(item.id);
                  start.mutate({ presetId: item.id });
                }}
              />
            </View>
          </Card>
        )}
      />
      {start.isError ? <Body tone="red">{start.error.message}</Body> : null}
    </View>
  );
}
