import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ScrollView, View } from "react-native";

import { FindFriend } from "@/components/social/find-friend";
import { FriendsBoard } from "@/components/social/friends-board";
import { PersonRow } from "@/components/trip/person-row";
import { Button, Empty, Failed, Loading, SectionTitle } from "@/components/system/ui";
import { trpc } from "@/lib/api";
import { space } from "@/lib/theme";

export default function Friends() {
  const queryClient = useQueryClient();
  const board = useQuery(trpc.friends.list.queryOptions());

  const settled = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.friends.list.queryKey() });
    },
  };
  const accept = useMutation({ ...trpc.friends.accept.mutationOptions(), ...settled });
  const decline = useMutation({ ...trpc.friends.decline.mutationOptions(), ...settled });
  const cancel = useMutation({ ...trpc.friends.cancel.mutationOptions(), ...settled });

  if (board.isPending) return <Loading />;
  if (board.isError) return <Failed onRetry={() => board.refetch()} />;

  const { friends, incoming, outgoing, code } = board.data;

  return (
    <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg }}>
      <View style={{ gap: space.sm }}>
        <SectionTitle>Waiting on you</SectionTitle>
        {incoming.length === 0 ? (
          <Empty>No requests.</Empty>
        ) : (
          incoming.map((person) => (
            <PersonRow key={person.id} name={person.name}>
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
          <SectionTitle>Asked, not answered</SectionTitle>
          {outgoing.map((person) => (
            <PersonRow key={person.id} name={person.name}>
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

      <FindFriend tag={code} />

      <FriendsBoard friends={friends} />
    </ScrollView>
  );
}
