import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatMonth, monthOf } from "@floc/core/dates/availability";
import { GROUP_CAP, GROUP_NAME_CAP, peopleCount, toggleGroup } from "@floc/core/people/group-ticks";
import type { FriendGroup, FriendPerson, PastTripPeople } from "@floc/api/port";
import { useState } from "react";
import { Pressable, View } from "react-native";

import { Sheet } from "@/components/system/sheet";
import { Body, Button, Empty, Failed, Field, Figure, Heading, Loading, Segmented } from "@/components/system/ui";
import { useTheme } from "@/components/system/theme";
import { trpc } from "@/lib/api";
import { radius, space } from "@/lib/theme";

import { GroupFaces, GroupPeople } from "./group-people";

export type GroupMode = { kind: "new"; ticked: string[] } | { kind: "edit"; group: FriendGroup };

const SOURCES = [{ value: "friends", label: "Pick friends" }, { value: "trips", label: "From a past trip" }] as const;

type GroupSheetProps = {
  mode: GroupMode;
  friends: FriendPerson[];
  onClose: () => void;
};

function useGroupEditor({ mode, friends, onClose }: GroupSheetProps) {
  const queryClient = useQueryClient();
  const past = useQuery(trpc.groups.pastTrips.queryOptions());
  const editing = mode.kind === "edit";
  const [name, setName] = useState(editing ? mode.group.name : "");
  const [ticked, setTicked] = useState(() => new Set(editing ? mode.group.members.map(({ id }) => id) : mode.ticked));
  const [step, setStep] = useState(1);
  const [source, setSource] = useState<"friends" | "trips">("friends");
  const trips = (past.data ?? []).filter(({ people }) => people.length > 0);
  const friendsById = new Map(friends.map((person) => [person.id, person]));
  const known = new Map([...trips.flatMap(({ people }) => people), ...(editing ? mode.group.members : []), ...friends].map((person) => [person.id, person]));
  const selected = [...ticked].flatMap((id) => known.get(id) ?? []);
  const people = [...friends, ...selected.filter(({ id }) => !friendsById.has(id))];
  const saved = async () => {
    await queryClient.invalidateQueries({ queryKey: trpc.groups.list.queryKey() });
    onClose();
  };
  const create = useMutation({ ...trpc.groups.create.mutationOptions(), onSuccess: saved });
  const save = useMutation({ ...trpc.groups.save.mutationOptions(), onSuccess: saved });
  const pending = create.isPending || save.isPending;
  const error = create.error ?? save.error;
  const naming = editing || step === 2;
  const submit = () => {
    const input = { name: name.trim(), memberIds: [...ticked] };
    if (editing) save.mutate({ ...input, groupId: mode.group.id });
    else create.mutate(input);
  };
  const pickTrip = (trip: PastTripPeople) => {
    setTicked((previous) => new Set([...previous, ...trip.people.map(({ id }) => id)].slice(0, GROUP_CAP)));
    setSource("friends");
    if (!editing) setStep(2);
  };
  return {
    editing, name, setName, ticked, setTicked, step, setStep, source, setSource,
    selected, people, friendsById, pending, error, naming, submit, pickTrip, past,
  };
}

export function GroupSheet(props: GroupSheetProps) {
  const {
    editing, name, setName, ticked, setTicked, step, setStep, source, setSource,
    selected, people, friendsById, pending, error, naming, submit, pickTrip, past,
  } = useGroupEditor(props);
  return (
    <Sheet open onClose={props.onClose} stableHeight={step === 1} footer={
      <View style={{ padding: space.lg, flexDirection: "row", alignItems: "center", gap: space.sm }}>
        <View style={{ flex: 1 }}><Figure tone="ink-2">{ticked.size} of {GROUP_CAP}</Figure></View>
        {!editing && step === 2 ? <Button label="Back" variant="quiet" onPress={() => setStep(1)} /> : null}
        {naming ? (
          <Button label={editing ? "Save group" : "Create group"} busy={pending} disabled={!name.trim() || ticked.size === 0} onPress={submit} />
        ) : (
          <Button label="Next" disabled={ticked.size === 0} onPress={() => setStep(2)} />
        )}
      </View>
    }>
      <View style={{ padding: space.lg, gap: space.md }}>
        <Heading>{editing ? "Edit group" : "New group"}</Heading>
        {!editing ? <Figure tone="ink-2">{step === 1 ? "1 of 2 · Who is in it" : "2 of 2 · Name it"}</Figure> : null}
        {naming ? <Field label="Name" value={name} onChangeText={setName} maxLength={GROUP_NAME_CAP} /> : null}
        {editing || step === 1 ? (
          <>
            <Segmented options={SOURCES} value={source} onChange={setSource} soft />
            {ticked.size >= GROUP_CAP ? <Body tone="ink-2">A group holds {GROUP_CAP} people at most.</Body> : null}
            {source === "friends" ? (
              <GroupPeople people={people} ticked={ticked} friendIds={new Set(friendsById.keys())} cap={GROUP_CAP}
                onToggle={(id) => setTicked((now) => toggleGroup(now, [id], GROUP_CAP))} />
            ) : <PastTripList query={past} onPick={pickTrip} />}
          </>
        ) : <GroupFaces people={selected} names count />}
        {error ? <Body tone="red">{error.message}</Body> : null}
      </View>
    </Sheet>
  );
}

function PastTripList({ query, onPick }: {
  query: { data: PastTripPeople[] | undefined; isPending: boolean; isError: boolean; refetch: () => unknown };
  onPick: (trip: PastTripPeople) => void;
}) {
  const { c } = useTheme();
  if (query.isPending) return <Loading />;
  if (query.isError) return <Failed onRetry={() => query.refetch()} />;
  const trips = (query.data ?? []).filter(({ people }) => people.length > 0);
  if (trips.length === 0) return <Empty>No past trips with people to add.</Empty>;
  return trips.map((trip) => (
    <Pressable
      key={trip.id}
      accessibilityRole="button"
      onPress={() => onPick(trip)}
      style={({ pressed }) => ({
        borderRadius: radius.sm, padding: space.sm, gap: space.xs, backgroundColor: pressed ? c["pen-2"] : c.sheet,
      })}
    >
      <Body bold>{trip.name}</Body>
      <Figure tone="ink-2">{formatMonth(monthOf(trip.endDate))} · {peopleCount(trip.people.length)}</Figure>
      <GroupFaces people={trip.people} />
    </Pressable>
  ));
}
