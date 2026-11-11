"use client";

import { useState, useTransition } from "react";
import { GROUP_CAP } from "@floc/core/people/group-ticks";

import { removeFriend, setGroupMemberAction } from "@/app/friends/actions";
import { ConfirmSubmit, Menu } from "@/components/system/client-ui";
import { CheckIcon } from "@/components/system/icons";
import { ErrorText, menuDangerItemClass, menuItemClass } from "@/components/system/ui";
import type { Person } from "@/server/social/friends";

import { useGroupData } from "./group-data";

export function FriendRowMenu({ person, onNew }: { person: Person; onNew: () => void }) {
  const { groups } = useGroupData();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  return (
    <Menu label={`More for ${person.name}`}>
      <div className="px-2.5 py-1 text-xs text-ink-soft">Add to group</div>
      <div className="scroll-thin max-h-52 overflow-y-auto">
        {groups.map((group) => {
          const checked = group.members.some(({ id }) => id === person.id);
          return (
            <button
                key={group.id}
                type="button"
                role="menuitemcheckbox"
                aria-checked={checked}
                disabled={pending}
                className={`${menuItemClass} focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-pen`}
                onClick={() => {
                  setError(undefined);
                  startTransition(async () => {
                    const result = await setGroupMemberAction(group.id, person.id, !checked);
                    setError(result.error);
                  });
                }}
            >
              <span className="flex items-center gap-2">
                <span aria-hidden="true" className="grid size-4 shrink-0 place-items-center rounded-sm border border-rule-strong text-pen-deep">
                  {checked ? <CheckIcon size={12} /> : null}
                </span>
                <span className="min-w-0 [overflow-wrap:anywhere]">{group.name}</span>
              </span>
            </button>
          );
        })}
      </div>
      <button type="button" className={menuItemClass} disabled={groups.length >= GROUP_CAP} onClick={onNew}>
        New group…
      </button>
      {groups.length >= GROUP_CAP ? (
        <p className="px-2.5 py-1 text-xs text-ink-soft">You can keep {GROUP_CAP} groups at most.</p>
      ) : null}
      <ErrorText>{error}</ErrorText>
      <form action={removeFriend} className="mt-1 border-t border-rule pt-1">
        <input type="hidden" name="otherId" value={person.id} />
        <ConfirmSubmit
          variant="ghost"
          message={`Remove ${person.name} as a friend?`}
          confirmLabel="Remove friend"
          className={menuDangerItemClass}
        >
          Remove friend
        </ConfirmSubmit>
      </form>
    </Menu>
  );
}
