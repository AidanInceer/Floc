/**
 * Somebody else's profile (ticket 46) — the phone's half of `/profile/[userId]`.
 *
 * IT RENDERS WHAT IT IS HANDED AND RE-DERIVES NOTHING. Every ring is applied on
 * the server; a hidden attribute arrives as null rather than as a value with a
 * flag beside it, so this screen cannot leak what it was never sent.
 *
 * NULL IS "NOT YOURS TO SEE", AND SO IS A BAD ID. The two answer identically on
 * purpose, so this cannot be used to find out whether an account exists — which
 * means the empty state says nothing about which of the two it was.
 *
 * NO WAY INTO A PAST TRIP. The names are text, not links: opening somebody
 * else's trip is its own piece of work, and its roster would show third parties
 * who never agreed to appear here.
 */
import { formatDateRange } from "@floc/core/dates";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { ScrollView, View } from "react-native";

import { Face } from "@/components/trip/person-row";
import { TravelMap } from "@/components/map/travel-map";
import {
  Body,
  Button,
  Card,
  Empty,
  Failed,
  Figure,
  Label,
  Loading,
  Pill,
  Row,
} from "@/components/system/ui";
import { trpc } from "@/lib/api";
import { space } from "@/lib/theme";

export default function PersonProfile() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const queryClient = useQueryClient();
  const person = useQuery(trpc.people.profile.queryOptions({ userId }));

  const ask = useMutation({
    ...trpc.friends.request.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.people.profile.queryKey({ userId }) });
      queryClient.invalidateQueries({ queryKey: trpc.friends.list.queryKey() });
    },
  });

  if (person.isPending) return <Loading />;
  if (person.isError) return <Failed onRetry={() => person.refetch()} />;

  if (!person.data) {
    return (
      <>
        <Stack.Screen options={{ title: "Profile" }} />
        <Empty>There is nothing here for you to see.</Empty>
      </>
    );
  }

  const p = person.data;

  return (
    <>
      <Stack.Screen options={{ title: p.name }} />
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg }}>
        {/* The floor: a face and a name, which anyone inside a ring always
            sees — a fully private profile still shows exactly these two. */}
        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
            <Face name={p.name} avatarUrl={p.avatarUrl} size={64} />
            <View style={{ flex: 1, gap: space.xs }}>
              <Body bold>{p.name}</Body>
              <Body tone="ink-3">
                {p.relation === "friend" ? "You are friends" : "You have shared a trip"}
              </Body>
            </View>
          </View>
          {p.isPrivate ? <Body tone="ink-3">This profile is private.</Body> : null}
          {p.vibeTags && p.vibeTags.length > 0 ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.xs }}>
              {p.vibeTags.map((tag) => (
                <Pill key={tag} word={tag} tone="peri" />
              ))}
            </View>
          ) : null}
        </Card>

        {/* One button, and it says which of the four states you are in — a
            request already sent is not the same as never having asked. */}
        {p.friendState === "none" ? (
          <Button
            label="Ask to be friends"
            busy={ask.isPending}
            onPress={() => ask.mutate({ userId: p.userId })}
          />
        ) : p.friendState === "outgoing" ? (
          <Body tone="ink-3">You have asked. Waiting on them.</Body>
        ) : p.friendState === "incoming" ? (
          <Body tone="ink-3">They have asked you — answer it on your Friends screen.</Body>
        ) : null}

        {p.map ? (
          <View style={{ gap: space.sm }}>
            <Label>Where they have been</Label>
            <Card>
              <TravelMap marks={p.map} />
            </Card>
            <Figure tone="ink-3">
              {p.been} been · {p.wantToGo} to go
            </Figure>
          </View>
        ) : null}

        {p.pastTrips ? (
          <View style={{ gap: space.sm }}>
            <Label>Trips they have been on</Label>
            {p.pastTrips.length === 0 ? (
              <Empty>Nothing to show yet.</Empty>
            ) : (
              p.pastTrips.map((trip) => (
                <Row key={trip.id}>
                  <View style={{ flex: 1, gap: space.xs }}>
                    <Body bold>{trip.name}</Body>
                    <Figure tone="ink-3">
                      {formatDateRange(trip.startDate, trip.endDate)}
                    </Figure>
                  </View>
                </Row>
              ))
            )}
          </View>
        ) : null}
      </ScrollView>
    </>
  );
}
