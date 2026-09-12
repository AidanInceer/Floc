/**
 * Friends (ticket 18) — the phone's half of `/friends`.
 *
 * REQUESTS FIRST. Incoming ones are the only thing on the screen waiting on
 * you, so they are at the top and they are the only rows with a filled button.
 *
 * NO ADD-BY-EMAIL, HERE OR ANYWHERE. You meet people by sharing a trip, then
 * ask from their profile or their roster row. A field taking an address would
 * turn this into "is that an account?" for any address typed (ticket 46).
 *
 * A NAME OPENS A PROFILE ONLY WHERE IT LANDS SOMEWHERE. An accepted friend has
 * a profile you may see; somebody who has only asked may be outside every one
 * of your rings, and that profile answers null.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";

import { PersonRow } from "@/components/trip/person-row";
import { Body, Button, Empty, Failed, Label, Loading } from "@/components/system/ui";
import { trpc } from "@/lib/api";
import { space } from "@/lib/theme";

export default function Friends() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const board = useQuery(trpc.friends.list.queryOptions());

  // Every button on the screen changes the same three lists, so they share one
  // invalidation rather than each guessing which list it moved somebody out of.
  const settled = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.friends.list.queryKey() });
    },
  };
  const accept = useMutation({ ...trpc.friends.accept.mutationOptions(), ...settled });
  const decline = useMutation({ ...trpc.friends.decline.mutationOptions(), ...settled });
  const cancel = useMutation({ ...trpc.friends.cancel.mutationOptions(), ...settled });
  const remove = useMutation({ ...trpc.friends.remove.mutationOptions(), ...settled });

  if (board.isPending) return <Loading />;
  if (board.isError) return <Failed onRetry={() => board.refetch()} />;

  const { friends, incoming, outgoing } = board.data;

  return (
    <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg }}>
      <View style={{ gap: space.sm }}>
        <Label>Waiting on you</Label>
        {incoming.length === 0 ? (
          <Empty>No requests.</Empty>
        ) : (
          incoming.map((person) => (
            <PersonRow key={person.id} name={person.name} avatarIcon={person.avatarIcon}>
              <Button
                label="Accept"
                busy={accept.isPending}
                onPress={() => accept.mutate({ userId: person.id })}
              />
              <Button
                label="No"
                variant="quiet"
                busy={decline.isPending}
                onPress={() => decline.mutate({ userId: person.id })}
              />
            </PersonRow>
          ))
        )}
      </View>

      {outgoing.length > 0 ? (
        <View style={{ gap: space.sm }}>
          <Label>Asked, not answered</Label>
          {outgoing.map((person) => (
            <PersonRow key={person.id} name={person.name} avatarIcon={person.avatarIcon}>
              <Button
                label="Cancel"
                variant="quiet"
                busy={cancel.isPending}
                onPress={() => cancel.mutate({ userId: person.id })}
              />
            </PersonRow>
          ))}
        </View>
      ) : null}

      <View style={{ gap: space.sm }}>
        <Label>Friends</Label>
        {friends.length === 0 ? (
          <Empty>Share a trip with somebody and they will turn up here.</Empty>
        ) : (
          friends.map((person) => (
            <Pressable
              key={person.id}
              accessibilityRole="button"
              accessibilityLabel={`Open ${person.name}'s profile`}
              onPress={() =>
                router.push({ pathname: "/person/[userId]", params: { userId: person.id } })
              }
            >
              <PersonRow name={person.name} avatarIcon={person.avatarIcon}>
                <Button
                  label="Remove"
                  variant="quiet"
                  busy={remove.isPending}
                  onPress={() => remove.mutate({ userId: person.id })}
                />
              </PersonRow>
            </Pressable>
          ))
        )}
      </View>

      <Body tone="ink-3">
        People you finish a trip with become friends on their own. There is no way to add
        somebody by their address.
      </Body>
    </ScrollView>
  );
}
