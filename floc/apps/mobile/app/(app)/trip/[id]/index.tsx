/**
 * Trip overview (ticket 291).
 *
 * What the trip *is*: its name, its dates, where it stops, who is on it. Every
 * one of those is derived, not stored — the stops especially. A stop is
 * consecutive days sharing an overnight place, computed here by
 * `@floc/core/stops`, exactly as the web app computes it. There is no `stop`
 * table and this screen must never make it look as though there is (rule 3).
 */
import { deriveStops, placedStops } from "@floc/core/stops";
import { formatDateRange } from "@floc/core/dates";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { ScrollView, View } from "react-native";

import { Body, Card, Empty, Failed, Figure, Heading, Label, Loading, Pill } from "@/components/ui";
import { trpc } from "@/lib/api";
import { space } from "@/lib/theme";

export default function Overview() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tripId = Number(id);

  const trip = useQuery(trpc.trips.get.queryOptions({ tripId }));
  const days = useQuery(trpc.itinerary.days.queryOptions({ tripId }));

  if (trip.isPending) return <Loading />;
  if (trip.isError) return <Failed onRetry={() => trip.refetch()} />;

  // Derived here, never fetched — the API has no procedure that returns one.
  const stops = placedStops(
    deriveStops(
      (days.data ?? []).map((d) => ({
        dayId: d.id,
        date: d.date,
        overnightPlaceId: d.overnightPlaceId,
        overnightPlaceName: d.overnightPlaceName,
      })),
    ),
  );

  return (
    <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg }}>
      <View style={{ gap: space.xs }}>
        <Heading>{trip.data.name}</Heading>
        <Figure tone="ink-2">{formatDateRange(trip.data.startDate, trip.data.endDate)}</Figure>
        {trip.data.archived ? <Pill word="Archived" tone="butter" /> : null}
      </View>

      <View style={{ gap: space.sm }}>
        <Label>Where</Label>
        {days.isPending ? (
          <Loading />
        ) : stops.length === 0 ? (
          <Empty>No overnight places set yet.</Empty>
        ) : (
          stops.map((stop) => (
            <Card key={stop.startDate}>
              <Body bold>{stop.placeName}</Body>
              <Figure tone="ink-2">
                {formatDateRange(stop.startDate, stop.endDate)}
              </Figure>
            </Card>
          ))
        )}
      </View>

      <View style={{ gap: space.sm }}>
        <Label>Who</Label>
        <Card>
          <Body>
            {trip.data.members.map((m) => m.name).join(", ")}
          </Body>
        </Card>
      </View>
    </ScrollView>
  );
}
