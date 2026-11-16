import { formatDateRange } from "@floc/core/dates/dates";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { ScrollView, View } from "react-native";

import { FriendSaved } from "@/components/lists/friend-saved";
import { StartWishWith } from "@/components/lists/start-wish-with";
import { Face } from "@/components/system/face";
import { Body, Button, Card, Empty, Failed, Figure, Loading, Pill, Row, SectionTitle } from "@/components/system/ui";
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
        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
            <Face name={p.name} size={64} />
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
                <Pill key={tag} word={tag} tone="pastel-blue" />
              ))}
            </View>
          ) : null}
        </Card>

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

        {p.saved ? <StartWishWith friendId={userId} name={p.name} /> : null}
        <FriendSaved saved={p.saved} map={p.map} />

        {p.pastTrips ? (
          <View style={{ gap: space.sm }}>
            <SectionTitle>Trips they have been on</SectionTitle>
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
