"use client";

import { useState } from "react";
import { GROUP_CAP } from "@floc/core/people/group-ticks";

import { Button, EmptyState } from "@/components/system/ui";
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
  const groupsFull = groups.length >= GROUP_CAP;
  return (
    <GroupDataProvider friends={friends.map(({ person }) => person)} groups={groups} pastTrips={pastTrips}>
      <div className="flex flex-wrap items-center gap-2">
        <PeopleTabs value={tab} onChange={setTab} counts={{ friends: friends.length, groups: groups.length }} />
        {tab === "groups" ? (
          <Button variant="primary" className="ml-auto shrink-0" disabled={groupsFull} onClick={() => setSheet({ kind: "new", ticked: [] })}>
            New group
          </Button>
        ) : null}
      </div>
      {tab === "groups" ? (
        <>
          {groupsFull ? <p className="mt-2 text-right text-xs text-ink-soft">You can keep {GROUP_CAP} groups at most.</p> : null}
          <GroupList onOpen={setSheet} />
        </>
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
