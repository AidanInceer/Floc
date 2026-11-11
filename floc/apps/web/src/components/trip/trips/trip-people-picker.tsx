"use client";

import { useId, useState } from "react";
import { groupTick, TRIP_INVITE_CAP } from "@floc/core/people/group-ticks";

import { GroupPeoplePicker } from "@/components/social/groups/group-people-picker";
import { PeopleTabs } from "@/components/social/groups/people-tabs";
import { ChevronIcon } from "@/components/system/icons";
import { AvatarRow, cx } from "@/components/system/ui";
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

type GroupControls = Omit<PickerProps, "friends" | "groups"> & {
  isFriend: (id: string) => boolean;
};

function GroupChoices({ groups, ...controls }: GroupControls & { groups: Group[] }) {
  if (groups.length === 0) return <p className="text-sm text-ink-soft">No groups yet.</p>;
  return (
    <ul className="divide-y divide-rule border-y border-rule">
      {groups.map((group) => <GroupChoice key={group.id} group={group} {...controls} />)}
    </ul>
  );
}

function GroupChoice({ group, ticked, onPerson, onGroup, isFriend }: GroupControls & { group: Group }) {
  const [expanded, setExpanded] = useState(false);
  const membersId = useId();
  const ids = group.members.map(({ id }) => id);
  const state = groupTick(ids, ticked);
  const count = ids.filter((id) => ticked.has(id)).length;
  const hasMembers = ids.length > 0;
  return (
    <li className="py-1">
      <div className="flex items-center gap-1">
        <button
          type="button"
          role="checkbox"
          aria-label={`Invite group ${group.name}`}
          aria-checked={state === "some" ? "mixed" : state === "all"}
          disabled={!hasMembers || (state !== "all" && ticked.size >= TRIP_INVITE_CAP)}
          onClick={() => onGroup(ids, group.id)}
          className={cx(
            "flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-sm px-2 py-1.5 text-left enabled:hover:bg-pen-soft enabled:hover:text-pen-deep focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-pen",
            state !== "none" && "bg-pen-soft text-pen-deep",
          )}
        >
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold [overflow-wrap:anywhere]">{group.name}</span>
            <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
              {hasMembers ? <AvatarRow people={group.members} size={22} spaced /> : (
                <span className="text-xs text-ink-soft">No people</span>
              )}
              {state === "none" ? null : (
                <span className="font-mono text-xs">{state === "all" ? "All asked" : `${count} of ${ids.length}`}</span>
              )}
            </span>
          </span>
          <span aria-hidden="true" className="grid size-5 shrink-0 place-items-center rounded-sm border border-rule-strong text-pen-deep">
            <svg viewBox="0 0 14 14" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={1.2}>
              <path d={state === "all" ? "M3 7.5l2.5 2.5L11 4.5" : state === "some" ? "M3 7h8" : ""} />
            </svg>
          </span>
        </button>
        {hasMembers ? (
          <button
            type="button"
            aria-label={`${expanded ? "Hide" : "Show"} members of ${group.name}`}
            aria-controls={membersId}
            aria-expanded={expanded}
            onClick={() => setExpanded((open) => !open)}
            className="grid size-11 shrink-0 place-items-center rounded-sm text-ink-soft hover:bg-pen-soft hover:text-pen-deep focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-pen"
          >
            <ChevronIcon direction={expanded ? "up" : "down"} />
          </button>
        ) : null}
      </div>
      <div id={membersId} hidden={!expanded} className="px-2 pb-1 pt-2">
        {expanded ? (
          <GroupPeoplePicker people={group.members} ticked={ticked} onToggle={onPerson} isFriend={isFriend} tripPicker />
        ) : null}
      </div>
    </li>
  );
}
