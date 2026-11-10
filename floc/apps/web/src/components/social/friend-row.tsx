import type { ReactNode } from "react";

import { Avatar } from "@/components/system/ui";
import type { Person } from "@/server/social/friends";

import { PersonLink } from "./person-link";

export function FriendRow({ person, note, linked, children }: {
  person: Person;
  note?: string | null;
  linked?: boolean;
  children: ReactNode;
}) {
  return (
    <li className="flex min-h-15 items-center gap-3 border-b border-rule px-1 py-2">
      {linked ? (
        <PersonLink userId={person.id} name={person.name} size={34} />
      ) : (
        <Avatar name={person.name} size={34} />
      )}
      <div className="flex min-w-0 flex-1 flex-col leading-snug">
        <span className="truncate text-sm font-medium">{person.name}</span>
        {note ? <span className="text-xs text-ink-soft">{note}</span> : null}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">{children}</div>
    </li>
  );
}
