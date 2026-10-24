import type { ReactNode } from "react";

import { Avatar, Badge } from "@/components/system/ui";
import type { TripMember } from "@/server/access";
import type { Guest } from "@/server/guests/guests";

export function WhoAnswered({
  members,
  marked,
  viewerId,
  nudgeFor,
  guests = [],
  removeGuestFor,
}: {
  members: TripMember[];
  /** People on the invite link who answered with a name (#442). Not members, so never nudged. */
  guests?: Guest[];
  removeGuestFor?: (guest: Guest) => ReactNode;
  /** userId → days marked free. */
  marked: Record<string, number>;
  viewerId: string;
  nudgeFor: (member: TripMember) => ReactNode;
}) {
  const answered = [...members.map((m) => m.userId), ...guests.map((g) => g.id)].filter((id) => (marked[id] ?? 0) > 0).length;

  return (
    <section className="p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-faint">
          Who has answered
        </h2>
        <span className="nums font-mono text-[11px] text-ink-faint">
          {answered} of {members.length + guests.length}
        </span>
      </div>
      <ul className="mt-2 divide-y divide-rule">
        {members.map((m) => {
          const days = marked[m.userId] ?? 0;
          const you = m.userId === viewerId;
          return (
            <li key={m.userId} className="flex items-center gap-2 py-2">
              <Avatar name={m.name} icon={m.avatarIcon} size={26} tone={m.tone} />
              <span className="min-w-0 flex-1 truncate text-sm">{you ? "You" : m.name}</span>
              {days > 0 ? (
                <span className="nums font-mono text-[11px] text-ink-faint">
                  {days} {days === 1 ? "day" : "days"}
                </span>
              ) : you ? (
                <span className="font-mono text-[11px] text-pastel-yellow-ink">Not yet</span>
              ) : (
                nudgeFor(m)
              )}
            </li>
          );
        })}
        {guests.map((g) => {
          const days = marked[g.id] ?? 0;
          return (
            <li key={g.id} className="flex items-center gap-2 py-2">
              <Avatar name={g.name} size={26} />
              <span className="flex min-w-0 flex-1 items-center gap-1.5 text-sm">
                <span className="truncate">{g.name}</span>
                <Badge>Guest</Badge>
              </span>
              <span className="nums font-mono text-[11px] text-ink-faint">
                {days > 0 ? `${days} ${days === 1 ? "day" : "days"}` : "No days"}
              </span>
              {removeGuestFor?.(g)}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
