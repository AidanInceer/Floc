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

const headClass = "flex items-center gap-2 text-sm font-medium";
const countClass = "nums font-mono text-xs text-ink-faint";

/** Friends and Groups are two pages on the account bar (#637); both open the same group sheet. */
export function FriendsBoard({ show, friends, groups, pastTrips }: {
  show: "friends" | "groups";
  friends: { person: Person; metOn: string | null }[];
  groups: Group[];
  pastTrips: PastTrip[];
}) {
  const [sheet, setSheet] = useState<GroupSheetMode>();
  const groupsFull = groups.length >= GROUP_CAP;
  return (
    <GroupDataProvider friends={friends.map(({ person }) => person)} groups={groups} pastTrips={pastTrips}>
      {show === "groups" ? (
        <>
          <div className="flex items-center justify-between gap-2">
            <h2 className={headClass}>Groups <span className={countClass}>{groups.length}</span></h2>
            <Button variant="primary" className="shrink-0" disabled={groupsFull} onClick={() => setSheet({ kind: "new", ticked: [] })}>
              New group
            </Button>
          </div>
          {groupsFull ? <p className="mt-2 text-right text-xs text-ink-soft">You can keep {GROUP_CAP} groups at most.</p> : null}
          <GroupList onOpen={setSheet} />
        </>
      ) : friends.length === 0 ? (
        <EmptyState title="No friends yet" />
      ) : (
        <>
        <h2 className={headClass}>Friends <span className={countClass}>{friends.length}</span></h2>
        <ul className="mt-1.5 border-t border-rule">
          {friends.map(({ person, metOn }) => (
            <FriendRow key={person.id} person={person} note={metOn ? `Met on ${metOn}` : null} linked>
              <FriendRowMenu person={person} onNew={() => setSheet({ kind: "new", ticked: [person.id] })} />
            </FriendRow>
          ))}
        </ul>
        </>
      )}
      {sheet ? <GroupSheet mode={sheet} onClose={() => setSheet(undefined)} /> : null}
    </GroupDataProvider>
  );
}
