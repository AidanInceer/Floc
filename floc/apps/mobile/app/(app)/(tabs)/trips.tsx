/**
 * The trip list — the screen the tracer bullet was aimed at (ticket 289).
 *
 * One tRPC read, rendered with the same vocabulary the web app uses — dates go
 * through `@floc/core/dates`, so "Dates not set" reads identically on a phone
 * and in a browser. Nothing about how a trip reads is re-decided here.
 */
import { useQuery } from "@tanstack/react-query";
import { Link, useRouter } from "expo-router";
import { FlatList, Pressable, RefreshControl, View } from "react-native";

import { useTheme } from "@/components/theme";
import { Body, Button, Card, Empty, Failed, Figure, Loading, Pill } from "@/components/ui";
import { formatDateRange } from "@floc/core/dates";

import { trpc } from "@/lib/api";
import { space } from "@/lib/theme";

export default function Trips() {
  const router = useRouter();
  const { c } = useTheme();
  const trips = useQuery(trpc.trips.list.queryOptions({ archived: false }));

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
        ListEmptyComponent={<Empty>No trips yet.</Empty>}
        renderItem={({ item }) => (
          <Link href={{ pathname: "/trip/[id]", params: { id: item.id } }} asChild>
            <Pressable>
              <Card>
                <Body bold>{item.name}</Body>
                {/* Undated is normal, not an error (rule 9) — so it is said, not hidden. */}
                <Figure tone="ink-2">{formatDateRange(item.startDate, item.endDate)}</Figure>
                {item.role === "admin" ? <Pill word="Admin" tone="peri" /> : null}
              </Card>
            </Pressable>
          </Link>
        )}
        ListFooterComponent={
          <View style={{ gap: space.sm, paddingTop: space.lg }}>
            <Button label="New trip" onPress={() => router.push("/(app)/new-trip")} />
            <Button
              label="Join with a link"
              variant="quiet"
              onPress={() => router.push("/(app)/join")}
            />
          </View>
        }
      />
    </View>
  );
}
