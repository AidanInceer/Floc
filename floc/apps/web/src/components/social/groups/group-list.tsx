"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { peopleCount } from "@floc/core/people/group-ticks";

import { deleteGroupAction } from "@/app/friends/actions";
import { ConfirmSubmit, Menu } from "@/components/system/client-ui";
import { MatchIcon } from "@/components/system/icons";
import { AvatarRow, Button, ErrorText, menuDangerItemClass, menuItemClass } from "@/components/system/ui";
import type { Group } from "@/server/social/groups";

import { useGroupData } from "./group-data";
import type { GroupSheetMode } from "./group-sheet";

const GroupIdeasDialog = dynamic(() => import("./group-ideas-dialog"));

export function GroupList({ onOpen }: { onOpen: (mode: GroupSheetMode) => void }) {
  const { groups } = useGroupData();
  return groups.map((group) => <GroupRow key={group.id} group={group} onEdit={() => onOpen({ kind: "edit", group })} />);
}

function GroupRow({ group, onEdit }: { group: Group; onEdit: () => void }) {
  const [error, setError] = useState<string>();
  const [ideas, setIdeas] = useState(false);
  return (
    <li className="border-b border-rule">
      <div className="flex min-h-15 items-center gap-1.5 py-1">
        <button
          type="button"
          onClick={onEdit}
          className="flex min-w-0 flex-1 items-center gap-3 self-stretch rounded-sm px-1 text-left leading-snug hover:bg-pen-soft hover:text-pen-deep"
        >
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-sm font-medium [overflow-wrap:anywhere]">{group.name}</span>
            <span className="nums font-mono text-xs text-ink-soft">{peopleCount(group.members.length)}</span>
          </span>
          <AvatarRow people={group.members} size={24} max={5} />
        </button>
        <Button className="shrink-0 gap-1.5 max-sm:px-2" aria-label={`Trip ideas for ${group.name}`} onClick={() => setIdeas(true)}>
          <MatchIcon />
          <span className="max-sm:hidden">Trip ideas</span>
        </Button>
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
      {ideas ? <GroupIdeasDialog group={group} onClose={() => setIdeas(false)} /> : null}
    </li>
  );
}
