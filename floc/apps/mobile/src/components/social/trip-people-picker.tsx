import { firstNames, groupTick, peopleCount, TRIP_INVITE_CAP } from "@floc/core/people/group-ticks";
import type { FriendGroup } from "@floc/api/port";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { View } from "react-native";

import { Body, Empty, Failed, Figure, Loading } from "@/components/system/ui";
import { trpc } from "@/lib/api";
import { space } from "@/lib/theme";

import { GroupChoice, GroupFaces, GroupPeople } from "./group-people";
import { PeopleTabs } from "./people-tabs";

type Selection = {
  ticked: ReadonlySet<string>;
  onToggle: (ids: string[], groupId?: number) => void;
};

export function TripPeoplePicker({ ticked, onToggle }: Selection) {
  const [tab, setTab] = useState<"friends" | "groups">("friends");
  const friendList = useQuery(trpc.friends.list.queryOptions());
  const groupList = useQuery(trpc.groups.list.queryOptions());
  const friends = friendList.data?.friends ?? [];
  const groups = groupList.data ?? [];
  const friendsById = new Map(friends.map((person) => [person.id, person]));
  const known = new Map([...groups.flatMap(({ members }) => members), ...friends].map((person) => [person.id, person]));
  const asked = [...ticked].flatMap((id) => known.get(id) ?? []);
  const friendIds = new Set(friendsById.keys());
  const active = tab === "friends" ? friendList : groupList;
  return (
    <View style={{ gap: space.sm }}>
      <PeopleTabs value={tab} onChange={setTab} />
      {active.isPending ? <Loading /> : active.isError ? <Failed onRetry={() => active.refetch()} /> :
        tab === "friends" ? (
          <GroupPeople people={friends} ticked={ticked} friendIds={friendIds} cap={TRIP_INVITE_CAP}
            onToggle={(id) => onToggle([id])} />
        ) : groups.length === 0 ? <Empty>No groups yet.</Empty> : groups.map((group) => (
          <TripGroupChoice key={group.id} group={group} ticked={ticked} friendIds={friendIds} onToggle={onToggle} />
        ))}
      {asked.length > 0 ? <GroupFaces people={asked} count /> : null}
      {asked.length >= TRIP_INVITE_CAP ? <Body tone="ink-2">You can invite {TRIP_INVITE_CAP} people at most.</Body> : null}
    </View>
  );
}

function TripGroupChoice({ group, ticked, friendIds, onToggle }: Selection & {
  group: FriendGroup;
  friendIds: ReadonlySet<string>;
}) {
  const ids = group.members.map(({ id }) => id);
  const state = groupTick(ids, ticked);
  const count = ids.filter((id) => ticked.has(id)).length;
  const others = state === "none" ? [] : group.members.filter(({ id }) => !friendIds.has(id));
  return (
    <View style={{ gap: space.xs }}>
      <GroupChoice
        name={group.name}
        checked={state === "some" ? "mixed" : state === "all"}
        disabled={ids.length === 0 || (state !== "all" && ticked.size >= TRIP_INVITE_CAP)}
        onPress={() => onToggle(ids, group.id)}
        note={<>
          <Body tone="ink-2">{firstNames(group.members.map(({ name }) => name)) || peopleCount(0)}</Body>
          {state === "none" ? null : <Figure tone="ink-2">{state === "all" ? "All asked" : `${count} of ${ids.length}`}</Figure>}
        </>}
      />
      {others.length > 0 ? (
        <View style={{ marginLeft: space.lg }}>
          <GroupPeople people={others} ticked={ticked} friendIds={friendIds} cap={TRIP_INVITE_CAP}
            onToggle={(id) => onToggle([id])} />
        </View>
      ) : null}
    </View>
  );
}
