"use client";

import { useState } from "react";
import { GROUP_CAP } from "@floc/core/people/group-ticks";

import { Button, EmptyState } from "@/components/system/ui";
import type { ReactNode } from "react";
import type { Person } from "@/server/social/friends";
import type { Group, PastTrip } from "@/server/social/groups";

import { FriendRow } from "../friend-row";
import { FriendRowMenu } from "./friend-row-menu";
import { GroupDataProvider } from "./group-data";
import { GroupList } from "./group-list";
import { GroupSheet, type GroupSheetMode } from "./group-sheet";

const headClass = "flex items-center gap-2 text-sm font-medium";
const countClass = "nums font-mono text-xs text-ink-faint";

/** Why: Friends and Groups draw one shape, full or empty — a head with its count and any action, then ruled rows or the empty card. */
function PeopleSection({ title, count, action, empty, children }: {
  title: string;
  count: number;
  action?: ReactNode;
  empty: string;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="flex min-h-[31px] items-center justify-between gap-2">
        <h2 className={headClass}>{title} <span className={countClass}>{count}</span></h2>
        {action}
      </div>
      <div className="mt-2">{count === 0 ? <EmptyState title={empty} /> : <ul className="border-t border-rule">{children}</ul>}</div>
    </section>
  );
}

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
        <PeopleSection
          title="Groups"
          count={groups.length}
          empty="No groups yet"
          action={
            <div className="flex flex-col items-end gap-1">
              <Button variant="primary" className="shrink-0" disabled={groupsFull} onClick={() => setSheet({ kind: "new", ticked: [] })}>
                New group
              </Button>
              {groupsFull ? <p className="text-xs text-ink-soft">You can keep {GROUP_CAP} groups at most.</p> : null}
            </div>
          }
        >
          <GroupList onOpen={setSheet} />
        </PeopleSection>
      ) : (
        <PeopleSection title="Friends" count={friends.length} empty="No friends yet">
          {friends.map(({ person, metOn }) => (
            <FriendRow key={person.id} person={person} note={metOn ? `Met on ${metOn}` : null} linked>
              <FriendRowMenu person={person} onNew={() => setSheet({ kind: "new", ticked: [person.id] })} />
            </FriendRow>
          ))}
        </PeopleSection>
      )}
      {sheet ? <GroupSheet mode={sheet} onClose={() => setSheet(undefined)} /> : null}
    </GroupDataProvider>
  );
}
