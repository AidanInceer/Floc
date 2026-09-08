/**
 * The trip list — the screen the tracer bullet was aimed at (ticket 289).
 *
 * One tRPC read, rendered with the same vocabulary the web app uses — dates go
 * through `@floc/core/dates`, so "Dates not set" reads identically on a phone
 * and in a browser. Nothing about how a trip reads is re-decided here.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useRouter } from "expo-router";
import { FlatList, Pressable, RefreshControl, View } from "react-native";

import { InviteBanner } from "@/components/invite-banner";
import { TagPills } from "@/components/tag-pills";
import { useTheme } from "@/components/theme";
import { Body, Button, Card, Empty, Failed, Figure, Loading, Pill } from "@/components/ui";
import { formatDateRange } from "@floc/core/dates";
import { readTripColor, tripPastel } from "@floc/core/trip-color";

import { trpc } from "@/lib/api";
import { space } from "@/lib/theme";

export default function Trips() {
  const router = useRouter();
  const { c } = useTheme();
  const queryClient = useQueryClient();
  const trips = useQuery(trpc.trips.list.queryOptions({ archived: false }));
  // Invites are a second read rather than a field on the list: they are almost
  // always empty, and a list that fails because nobody asked you anything is
  // worse than a banner that quietly does not draw.
  const invites = useQuery(trpc.invites.mine.queryOptions());

  const settled = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.invites.mine.queryKey() });
      queryClient.invalidateQueries({ queryKey: trpc.trips.list.queryKey() });
    },
  };
  const accept = useMutation({ ...trpc.invites.accept.mutationOptions(), ...settled });
  const decline = useMutation({ ...trpc.invites.decline.mutationOptions(), ...settled });

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
        ListHeaderComponent={
          <InviteBanner
            invites={invites.data ?? []}
            busy={accept.isPending || decline.isPending}
            onAnswer={(tripId, join) =>
              join ? accept.mutate({ tripId }) : decline.mutate({ tripId })
            }
          />
        }
        ListEmptyComponent={<Empty>No trips yet.</Empty>}
        renderItem={({ item }) => {
          // The chosen colour, or the id rotation still filling in (#213). It
          // is a rail, not a wash: a card tinted edge to edge would fight the
          // tag pills wearing the same pastel.
          const tone = tripPastel(readTripColor(item.colorKey), item.id);
          return (
            <Link href={{ pathname: "/trip/[id]", params: { id: item.id } }} asChild>
              <Pressable>
                <Card style={{ borderLeftWidth: 4, borderLeftColor: c[tone] }}>
                  <Body bold>{item.name}</Body>
                  {/* Undated is normal, not an error (rule 9) — so it is said, not hidden. */}
                  <Figure tone="ink-2">{formatDateRange(item.startDate, item.endDate)}</Figure>
                  <TagPills tags={item.tags} color={readTripColor(item.colorKey)} tripId={item.id} />
                  {item.role === "admin" ? <Pill word="Admin" tone="peri" /> : null}
                </Card>
              </Pressable>
            </Link>
          );
        }}
        ListFooterComponent={
          <View style={{ gap: space.sm, paddingTop: space.lg }}>
            <Button label="New trip" onPress={() => router.push("/(app)/new-trip")} />
            <Button
              label="Join with a link"
              variant="quiet"
              onPress={() => router.push("/(app)/join")}
            />
            <Button
              label="Archived trips"
              variant="quiet"
              onPress={() => router.push("/(app)/archived")}
            />
          </View>
        }
      />
    </View>
  );
}
