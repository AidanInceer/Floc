import { GROUP_CAP, peopleCount } from "@floc/core/people/group-ticks";
import type { FriendGroup, FriendPerson } from "@floc/api/port";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { MoreGlyph } from "@/components/system/glyphs";
import { useTheme } from "@/components/system/theme";
import { Body, Button, Empty, Failed, Figure, IconButton, Loading } from "@/components/system/ui";
import { Face } from "@/components/system/face";
import { trpc } from "@/lib/api";
import { space } from "@/lib/theme";

import { GroupFaces } from "./group-people";
import { GroupSheet, type GroupMode } from "./group-sheet";
import { PeopleMenu, type MenuTarget } from "./people-menu";
import { PeopleTabs } from "./people-tabs";

export function FriendsBoard({ friends }: { friends: FriendPerson[] }) {
  const router = useRouter();
  const { c } = useTheme();
  const list = useQuery(trpc.groups.list.queryOptions());
  const groups = list.data ?? [];
  const [tab, setTab] = useState<"friends" | "groups">("friends");
  const [sheet, setSheet] = useState<GroupMode>();
  const [menu, setMenu] = useState<MenuTarget>();
  const openSheet = (mode: GroupMode) => {
    setMenu(undefined);
    setSheet(mode);
  };
  return (
    <View style={{ gap: space.sm }}>
      <PeopleTabs value={tab} onChange={setTab} counts={{ friends: friends.length, groups: groups.length }} />
      {tab === "groups" ? (
        <GroupsList list={list} openSheet={openSheet} openMenu={setMenu} />
      ) : friends.length === 0 ? (
        <Empty>No friends yet.</Empty>
      ) : friends.map((person) => (
        <View key={person.id} style={{
          flexDirection: "row", alignItems: "center", borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.rule,
        }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open ${person.name}'s profile`}
            onPress={() => router.push({ pathname: "/person/[userId]", params: { userId: person.id } })}
            style={{ flex: 1, minHeight: 48, flexDirection: "row", alignItems: "center", gap: space.sm }}
          >
            <Face name={person.name} size={32} />
            <View style={{ flex: 1 }}><Body bold>{person.name}</Body></View>
          </Pressable>
          <IconButton label={`More for ${person.name}`} onPress={() => setMenu({ kind: "friend", person })}>
            {(color) => <MoreGlyph color={color} />}
          </IconButton>
        </View>
      ))}
      {menu ? (
        <PeopleMenu target={menu} groups={groups} onClose={() => setMenu(undefined)} onOpen={openSheet} />
      ) : null}
      {sheet ? <GroupSheet mode={sheet} friends={friends} onClose={() => setSheet(undefined)} /> : null}
    </View>
  );
}

function GroupsList({ list, openSheet, openMenu }: {
  list: { data?: FriendGroup[]; isPending: boolean; isError: boolean; refetch: () => unknown };
  openSheet: (mode: GroupMode) => void;
  openMenu: (target: MenuTarget) => void;
}) {
  const { c } = useTheme();
  if (list.isPending) return <Loading />;
  if (list.isError) return <Failed onRetry={() => list.refetch()} />;
  const groups = list.data ?? [];
  const full = groups.length >= GROUP_CAP;
  return (
    <>
      <View style={{ alignItems: "flex-end", gap: space.xs }}>
        <Button label="New group" disabled={full} onPress={() => openSheet({ kind: "new", ticked: [] })} />
        {full ? <Body tone="ink-2">You can keep {GROUP_CAP} groups at most.</Body> : null}
      </View>
      {groups.length === 0 ? <Empty>No groups yet.</Empty> : null}
      {groups.map((group) => (
        <View key={group.id} style={{
          flexDirection: "row", alignItems: "center", borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.rule,
        }}>
          <Pressable
            accessibilityRole="button"
            onPress={() => openSheet({ kind: "edit", group })}
            style={{ flex: 1, minHeight: 52, flexDirection: "row", alignItems: "center", gap: space.sm }}
          >
            <View style={{ flex: 1 }}>
              <Body bold>{group.name}</Body>
              <Figure tone="ink-2">{peopleCount(group.members.length)}</Figure>
            </View>
            <GroupFaces people={group.members} />
          </Pressable>
          <IconButton label={`More for ${group.name}`} onPress={() => openMenu({ kind: "group", group })}>
            {(color) => <MoreGlyph color={color} />}
          </IconButton>
        </View>
      ))}
    </>
  );
}
