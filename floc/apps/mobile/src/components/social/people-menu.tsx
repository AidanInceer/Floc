import { GROUP_CAP } from "@floc/core/people/group-ticks";
import type { FriendGroup, FriendPerson } from "@floc/api/port";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, View } from "react-native";

import { Sheet } from "@/components/system/sheet";
import { Body, Button, SectionTitle } from "@/components/system/ui";
import { trpc } from "@/lib/api";
import { space } from "@/lib/theme";

import { GroupChoice } from "./group-people";
import type { GroupMode } from "./group-sheet";

export type MenuTarget = { kind: "friend"; person: FriendPerson } | { kind: "group"; group: FriendGroup };

export function PeopleMenu({ target, groups, onClose, onOpen }: {
  target: MenuTarget;
  groups: FriendGroup[];
  onClose: () => void;
  onOpen: (mode: GroupMode) => void;
}) {
  const queryClient = useQueryClient();
  const refreshGroups = () => queryClient.invalidateQueries({ queryKey: trpc.groups.list.queryKey() });
  const toggle = useMutation({ ...trpc.groups.setMember.mutationOptions(), onSuccess: refreshGroups });
  const remove = useMutation({
    ...trpc.friends.remove.mutationOptions(),
    onSuccess: async () => {
      await Promise.all([refreshGroups(), queryClient.invalidateQueries({ queryKey: trpc.friends.list.queryKey() })]);
      onClose();
    },
  });
  const drop = useMutation({
    ...trpc.groups.delete.mutationOptions(),
    onSuccess: async () => {
      await refreshGroups();
      onClose();
    },
  });
  const error = toggle.error ?? remove.error ?? drop.error;
  return (
    <Sheet open onClose={onClose}>
      <View style={{ padding: space.lg, gap: space.sm }}>
        {target.kind === "friend" ? (
          <>
            <SectionTitle>Add to group</SectionTitle>
            {groups.map((group) => {
              const checked = group.members.some(({ id }) => id === target.person.id);
              return (
                <GroupChoice key={group.id} name={group.name} checked={checked} disabled={toggle.isPending}
                  onPress={() => toggle.mutate({ groupId: group.id, userId: target.person.id, on: !checked })} />
              );
            })}
            <Button label="New group…" variant="quiet" disabled={groups.length >= GROUP_CAP}
              onPress={() => onOpen({ kind: "new", ticked: [target.person.id] })} />
            {groups.length >= GROUP_CAP ? <Body tone="ink-2">You can keep {GROUP_CAP} groups at most.</Body> : null}
            <Button label="Remove friend" variant="danger" busy={remove.isPending}
              onPress={() => confirm(`Remove ${target.person.name} as a friend?`, "Remove friend", () => remove.mutate({ userId: target.person.id }))} />
          </>
        ) : (
          <>
            <Button label="Edit group" variant="quiet" onPress={() => onOpen({ kind: "edit", group: target.group })} />
            <Button label="Delete group" variant="danger" busy={drop.isPending}
              onPress={() => confirm(`Delete ${target.group.name}?`, "Delete group", () => drop.mutate({ groupId: target.group.id }))} />
          </>
        )}
        {error ? <Body tone="red">{error.message}</Body> : null}
      </View>
    </Sheet>
  );
}

function confirm(title: string, label: string, action: () => void) {
  Alert.alert(title, undefined, [
    { text: "Cancel", style: "cancel" },
    { text: label, style: "destructive", onPress: action },
  ]);
}
