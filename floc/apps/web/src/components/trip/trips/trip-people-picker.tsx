"use client";

import { useState } from "react";
import { firstNames, groupTick, TRIP_INVITE_CAP } from "@floc/core/people/group-ticks";

import { GroupPeoplePicker } from "@/components/social/groups/group-people-picker";
import { PeopleTabs } from "@/components/social/groups/people-tabs";
import { cx } from "@/components/system/ui";
import type { Person } from "@/server/social/friends";
import type { Group } from "@/server/social/groups";

type PickerProps = {
  friends: Person[];
  groups: Group[];
  ticked: ReadonlySet<string>;
  onPerson: (id: string) => void;
  onGroup: (ids: string[], groupId: number) => void;
};

export function TripPeoplePicker({ friends, groups, ticked, onPerson, onGroup }: PickerProps) {
  const [tab, setTab] = useState<"friends" | "groups">("friends");
  const friendIds = new Set(friends.map(({ id }) => id));
  const isFriend = (id: string) => friendIds.has(id);
  return (
    <div className="grid gap-3">
      <PeopleTabs value={tab} onChange={setTab} stretch />
      <div className="scroll-thin h-[min(17rem,38dvh)] overflow-y-auto">
        {tab === "friends" ? (
          <GroupPeoplePicker people={friends} ticked={ticked} onToggle={onPerson} isFriend={isFriend} tripPicker />
        ) : (
          <GroupChoices groups={groups} ticked={ticked} onPerson={onPerson} onGroup={onGroup} isFriend={isFriend} />
        )}
      </div>
    </div>
  );
}

function GroupChoices({ groups, ticked, onPerson, onGroup, isFriend }: Omit<PickerProps, "friends"> & {
  isFriend: (id: string) => boolean;
}) {
  if (groups.length === 0) return <p className="text-sm text-ink-soft">No groups yet.</p>;
  return (
    <ul className="divide-y divide-rule border-y border-rule">
      {groups.map((group) => {
        const ids = group.members.map(({ id }) => id);
        const state = groupTick(ids, ticked);
        const count = ids.filter((id) => ticked.has(id)).length;
        const others = state === "none" ? [] : group.members.filter(({ id }) => !isFriend(id));
        return (
          <li key={group.id} className="py-1">
            <button
              type="button"
              role="checkbox"
              aria-label={`Invite group ${group.name}`}
              aria-checked={state === "some" ? "mixed" : state === "all"}
              disabled={ids.length === 0 || (state !== "all" && ticked.size >= TRIP_INVITE_CAP)}
              onClick={() => onGroup(ids, group.id)}
              className={cx(
                "flex min-h-12 w-full items-center gap-3 rounded-sm px-2 py-1.5 text-left hover:bg-pen-soft hover:text-pen-deep",
                state !== "none" && "bg-pen-soft text-pen-deep",
              )}
            >
              <span className="min-w-0 flex-1">
                <span className="block break-words text-sm font-semibold">{group.name}</span>
                <span className="block break-words text-xs text-ink-soft">{firstNames(group.members.map(({ name }) => name)) || "No people"}</span>
                {state === "none" ? null : (
                  <span className="block font-mono text-xs">{state === "all" ? "All asked" : `${count} of ${ids.length}`}</span>
                )}
              </span>
              <span aria-hidden="true" className="grid size-5 shrink-0 place-items-center rounded-sm border border-rule-strong text-pen-deep">
                <svg viewBox="0 0 14 14" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={1.2}>
                  <path d={state === "all" ? "M3 7.5l2.5 2.5L11 4.5" : state === "some" ? "M3 7h8" : ""} />
                </svg>
              </span>
            </button>
            {others.length > 0 ? (
              <div className="px-2 pb-1 pt-2">
                <GroupPeoplePicker people={others} ticked={ticked} onToggle={onPerson} isFriend={isFriend} tripPicker />
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
