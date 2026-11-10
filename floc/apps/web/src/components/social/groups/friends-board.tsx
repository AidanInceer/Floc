"use client";

import { useState } from "react";

import { EmptyState } from "@/components/system/ui";
import type { Person } from "@/server/social/friends";
import type { Group, PastTrip } from "@/server/social/groups";

import { FriendRow } from "../friend-row";
import { FriendRowMenu } from "./friend-row-menu";
import { GroupDataProvider } from "./group-data";
import { GroupList } from "./group-list";
import { GroupSheet, type GroupSheetMode } from "./group-sheet";
import { PeopleTabs } from "./people-tabs";

export function FriendsBoard({ friends, groups, pastTrips }: {
  friends: { person: Person; metOn: string | null }[];
  groups: Group[];
  pastTrips: PastTrip[];
}) {
  const [tab, setTab] = useState<"friends" | "groups">("friends");
  const [sheet, setSheet] = useState<GroupSheetMode>();
  return (
    <GroupDataProvider friends={friends.map(({ person }) => person)} groups={groups} pastTrips={pastTrips}>
      <PeopleTabs value={tab} onChange={setTab} counts={{ friends: friends.length, groups: groups.length }} />
      {tab === "groups" ? (
        <GroupList onOpen={setSheet} />
      ) : friends.length === 0 ? (
        <EmptyState title="No friends yet" />
      ) : (
        <ul className="mt-3 border-t border-rule">
          {friends.map(({ person, metOn }) => (
            <FriendRow key={person.id} person={person} note={metOn ? `Met on ${metOn}` : null} linked>
              <FriendRowMenu person={person} onNew={() => setSheet({ kind: "new", ticked: [person.id] })} />
            </FriendRow>
          ))}
        </ul>
      )}
      {sheet ? <GroupSheet mode={sheet} onClose={() => setSheet(undefined)} /> : null}
    </GroupDataProvider>
  );
}
