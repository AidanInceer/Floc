"use client";

import { useState } from "react";
import { peopleCount } from "@floc/core/people/group-ticks";

import { deleteGroupAction } from "@/app/friends/actions";
import { ConfirmSubmit, Menu } from "@/components/system/client-ui";
import { AvatarRow, EmptyState, ErrorText, menuDangerItemClass, menuItemClass } from "@/components/system/ui";
import type { Group } from "@/server/social/groups";

import { useGroupData } from "./group-data";
import type { GroupSheetMode } from "./group-sheet";

export function GroupList({ onOpen }: { onOpen: (mode: GroupSheetMode) => void }) {
  const { groups } = useGroupData();
  return (
    <div className="mt-3">
      {groups.length === 0 ? <EmptyState title="No groups yet" /> : (
        <ul className="border-t border-rule">
          {groups.map((group) => (
            <GroupRow key={group.id} group={group} onEdit={() => onOpen({ kind: "edit", group })} />
          ))}
        </ul>
      )}
    </div>
  );
}

function GroupRow({ group, onEdit }: { group: Group; onEdit: () => void }) {
  const [error, setError] = useState<string>();
  return (
    <li className="border-b border-rule">
      <div className="flex items-center gap-1.5 py-1">
        <button
          type="button"
          onClick={onEdit}
          className="flex min-h-13 min-w-0 flex-1 items-center gap-3 rounded-sm px-2 py-1.5 text-left hover:bg-pen-soft hover:text-pen-deep"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold [overflow-wrap:anywhere]">{group.name}</span>
            <span className="nums font-mono text-xs text-ink-soft">{peopleCount(group.members.length)}</span>
          </span>
          <AvatarRow people={group.members} size={24} max={5} />
        </button>
        <Menu label={`More for ${group.name}`}>
          <button type="button" className={menuItemClass} onClick={onEdit}>Edit group</button>
          <form action={async () => setError((await deleteGroupAction(group.id)).error)}>
            <ConfirmSubmit
              variant="ghost"
              message={`Delete ${group.name}?`}
              confirmLabel="Delete group"
              className={menuDangerItemClass}
            >
              Delete group
            </ConfirmSubmit>
          </form>
        </Menu>
      </div>
      <ErrorText>{error}</ErrorText>
    </li>
  );
}
