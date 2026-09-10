/**
 * Archived trips (ticket 05, 17) — the phone's half of `/trips/archived`.
 *
 * NOT A TAB. Archiving is rare and looking at what you archived is rarer, so
 * this hangs off the foot of the trip list rather than taking one of five
 * seats on the bottom bar.
 *
 * READ-ONLY FOR A MEMBER, RESTORABLE BY AN ADMIN (rule 6). There is no
 * "request restore" flow, on the phone or the web: a member asks an admin, and
 * this names them so the asking has somewhere to go.
 *
 * AN ARCHIVED TRIP IS STILL A TRIP. Tapping one opens it exactly as the list
 * does — nothing is gated (rule 4), it is simply out of the way.
 */
import { formatDateRange } from "@floc/core/dates";
import { readTripColor, tripPastel } from "@floc/core/trip-color";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "expo-router";
import { FlatList, Pressable, RefreshControl, View } from "react-native";

import { useTheme } from "@/components/system/theme";
import { Body, Button, Card, Empty, Failed, Figure, Loading } from "@/components/system/ui";
import { trpc } from "@/lib/api";
import { space } from "@/lib/theme";

export default function ArchivedTrips() {
  const { c } = useTheme();
  const queryClient = useQueryClient();
  const trips = useQuery(trpc.trips.list.queryOptions({ archived: true }));

  const restore = useMutation({
    ...trpc.trips.setArchived.mutationOptions(),
    onSuccess: () => {
      // Both lists changed: one trip left this one and joined the other.
      queryClient.invalidateQueries({ queryKey: trpc.trips.list.queryKey() });
    },
  });

  if (trips.isPending) return <Loading />;
  if (trips.isError) return <Failed onRetry={() => trips.refetch()} />;

  return (
    <View style={{ flex: 1, backgroundColor: c.paper }}>
      <FlatList
        data={trips.data}
        keyExtractor={(t) => String(t.id)}
        contentContainerStyle={{ padding: space.lg, gap: space.md }}
        refreshControl={
          <RefreshControl
            refreshing={trips.isFetching}
            onRefresh={() => {
              trips.refetch();
            }}
          />
        }
        ListEmptyComponent={<Empty>Nothing archived.</Empty>}
        renderItem={({ item }) => {
          const tone = tripPastel(readTripColor(item.colorKey), item.id);
          return (
            <Card style={{ borderLeftWidth: 4, borderLeftColor: c[tone] }}>
              <Link href={{ pathname: "/trip/[id]", params: { id: item.id } }} asChild>
                <Pressable>
                  <Body bold>{item.name}</Body>
                  <Figure tone="ink-2">
                    {formatDateRange(item.startDate, item.endDate)}
                  </Figure>
                </Pressable>
              </Link>
              {item.role === "admin" ? (
                <Button
                  label="Restore"
                  variant="quiet"
                  busy={restore.isPending}
                  onPress={() => restore.mutate({ tripId: item.id, archived: false })}
                />
              ) : (
                // What is missing is one of the two things text still carries.
                <Body tone="ink-3">Only an admin can restore this.</Body>
              )}
            </Card>
          );
        }}
      />
    </View>
  );
}
